// ── AI Module — calls server-side proxy at /api/ai ──
// The NVIDIA API key lives on the server (Vercel env var),
// so all users share the same key without exposing it.
import { localBalancedDraw, shuffleArray } from './utils/teamBalance.js';

async function generate(systemPrompt, userPrompt) {
  console.log("Calling /api/ai with prompts:", { systemPrompt, userPrompt });
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt })
  });

  const data = await response.json();
  console.log("API response data:", data);

  if (!response.ok) {
    throw new Error(data.error || `Erro na IA (${response.status})`);
  }

  return data.content;
}

/**
 * AI is always configured — the key is server-side.
 * If the server doesn't have a key, the error will come from the API call.
 */
export function isAIConfigured() {
  return true;
}

export async function generateMatchSummary(matchData) {
  const system = `Você é um narrador esportivo brasileiro extremamente empolgado e dramático, no estilo Galvão Bueno e Luis Roberto. 
Gere um resumo de 3-5 parágrafos curtos da partida descrita abaixo, em tom de crônica esportiva brasileira.
Destaque artilheiros, viradas de placar, goleadas, defesas heroicas, e adicione drama e emoção à narrativa.
Use expressões típicas como "É GOOOOL!", "QUE JOGO, MEUS AMIGOS!", "NÃO ACREDITO NO QUE ESTOU VENDO!".
Mencione os jogadores pelo nome ou apelido.
Mantenha curto e divertido — é pra ser lido rapidamente no celular depois da pelada.`;

  const user = `Dados da partida:\n${JSON.stringify(matchData, null, 2)}`;
  return generate(system, user);
}

function extractJSON(text) {
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonStr = text.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonStr);
  }
  throw new Error("JSON não encontrado na resposta.");
}

function validateAndFixTeams(teamA, teamB, playersList) {
  const allPlayerIds = playersList.map(p => p.id);
  const setAll = new Set(allPlayerIds);
  
  // Create a map of lowercase names/nicknames to IDs for matching
  const nameMap = new Map();
  for (const p of playersList) {
    const nameLower = (p.name || '').toLowerCase().trim();
    const nicknameLower = (p.nickname || '').toLowerCase().trim();
    if (nameLower) nameMap.set(nameLower, p.id);
    if (nicknameLower) nameMap.set(nicknameLower, p.id);
    
    // Also try matching first name
    const firstName = nameLower.split(' ')[0];
    if (firstName && !nameMap.has(firstName)) {
      nameMap.set(firstName, p.id);
    }
  }

  const resolveToId = (item) => {
    if (item === null || item === undefined) return null;
    
    // If it's already a number in our set, return it
    const num = Number(item);
    if (!isNaN(num) && setAll.has(num)) {
      return num;
    }
    
    // If it's a string, try matching by name
    if (typeof item === 'string') {
      const cleanItem = item.toLowerCase().trim();
      if (nameMap.has(cleanItem)) {
        return nameMap.get(cleanItem);
      }
      
      // Try to find if any player name contains this string
      for (const p of playersList) {
        const name = (p.name || '').toLowerCase();
        const nickname = (p.nickname || '').toLowerCase();
        if (name.includes(cleanItem) || nickname.includes(cleanItem)) {
          return p.id;
        }
      }
    }
    return null;
  };

  // 1. Resolve and remove duplicates and invalid items
  const seen = new Set();
  let cleanA = [];
  let cleanB = [];
  
  for (const item of (teamA || [])) {
    const resolvedId = resolveToId(item);
    if (resolvedId && !seen.has(resolvedId)) {
      cleanA.push(resolvedId);
      seen.add(resolvedId);
    }
  }
  
  for (const item of (teamB || [])) {
    const resolvedId = resolveToId(item);
    if (resolvedId && !seen.has(resolvedId)) {
      cleanB.push(resolvedId);
      seen.add(resolvedId);
    }
  }
  
  // 2. Find missing players
  const missing = allPlayerIds.filter(id => !seen.has(id));
  
  // Shuffle missing to avoid bias
  const shuffledMissing = shuffleArray(missing);
  
  // Distribute missing players to keep teams as even as possible
  for (const id of shuffledMissing) {
    if (cleanA.length <= cleanB.length) {
      cleanA.push(id);
    } else {
      cleanB.push(id);
    }
  }
  
  // 3. Balance sizes if they are still uneven
  const totalPlayers = allPlayerIds.length;
  const idealSize = Math.floor(totalPlayers / 2);
  
  // If cleanA is too small, move from B to A
  while (cleanA.length < idealSize) {
    const moved = cleanB.pop();
    if (moved !== undefined) cleanA.push(moved);
  }
  
  // If cleanB is too small, move from A to B
  while (cleanB.length < idealSize) {
    const moved = cleanA.pop();
    if (moved !== undefined) cleanB.push(moved);
  }
  
  return { teamA: cleanA, teamB: cleanB };
}

export async function generateBalancedTeams(players, restrictions, naturalLanguageRules, currentUserName = null) {
  // Shuffle players list to ensure randomness and avoid repeating identical team draws
  const shuffledPlayers = shuffleArray(players);
  const playerIds = players.map(p => p.id);

  // Map restrictions to include both names and IDs for absolute clarity to the AI
  const playerMap = Object.fromEntries(players.map(p => [p.id, p.name]));
  const formattedRestrictions = (restrictions || []).map(r => ({
    playerA: `${playerMap[r.playerAId] || `Jogador ${r.playerAId}`} (ID: ${r.playerAId})`,
    playerB: `${playerMap[r.playerBId] || `Jogador ${r.playerBId}`} (ID: ${r.playerBId})`,
    description: r.description || ''
  }));

  const totalCount = shuffledPlayers.length;
  const targetSizeA = Math.ceil(totalCount / 2);
  const targetSizeB = totalCount - targetSizeA;

  let system = `Você é um assistente encarregado de sortear os times de uma pelada de futebol.
Sua principal tarefa é dividir os jogadores fornecidos em 2 times ("teamA" e "teamB") respeitando as restrições de duplas e regras adicionais em linguagem natural fornecidas pelo usuário.
`;

  if (currentUserName) {
    system += `\nO usuário logado que está realizando o sorteio e digitando as regras se chama "${currentUserName}". Se as regras do usuário contiverem pronomes como "eu", "mim", "meu", "comigo", "minha dupla", etc., você DEVE associar esses pronomes ao jogador "${currentUserName}" (ou seja, quando ele diz "eu no time A", significa colocar o jogador "${currentUserName}" no Time A).\n`;
  }

  system += `\nREGRAS CRÍTICAS:
1. REGRAS EM LINGUAGEM NATURAL: Priorize totalmente e de forma estrita as regras em linguagem natural inseridas pelo usuário (ex: "fulano e ciclano no mesmo time", "goleiros separados", "João no time A", etc.). 
   Se o usuário digitar regras de agrupamento ou separação, você DEVE cumpri-las.
2. MAPEAMENTO DE NOMES: Se a regra em linguagem de usuário mencionar um nome parcial ou apelido (ex: "Beto"), mapeie de forma inteligente para o jogador correspondente (ex: "Carlos Roberto (Beto)").
3. RESTRIÇÕES DE DUPLAS: Respeite a lista de restrições (jogadores que não podem ficar no mesmo time).
4. EQUILÍBRIO TÉCNICO: Divida os times de forma equilibrada! O somatório do OVR (Overall) e a média da taxa de vitórias (winRate) de cada time devem ser os mais próximos possíveis para garantir competitividade.
5. DISTRIBUIÇÃO TOTAL: Todos os IDs de jogadores fornecidos na lista de disponíveis devem ser distribuídos. Nenhum jogador pode ficar de fora.
6. EQUILÍBRIO DE QUANTIDADE: Distribua os jogadores de modo que o Time A (teamA) e o Time B (teamB) tenham exatamente os tamanhos definidos na instrução do usuário.
7. ALEATORIEDADE: Faça um sorteio real com base nas regras. Mude as composições dos times a cada chamada se os mesmos jogadores forem passados, mantendo apenas as regras fixas respeitadas.

RESPOSTA: Retorne APENAS um JSON válido com esta estrutura exata (sem markdown, sem backticks \`\`\`json):
{
  "teamA": [lista de IDs dos jogadores],
  "teamB": [lista de IDs dos jogadores],
  "announcement": "Texto divertido e empolgante anunciando os times, como um narrador profissional de TV",
  "analysis": "Breve análise das características ou equilíbrio dos times formados",
  "impossible": null ou "explicação se alguma restrição ou regra não pôde ser cumprida"
}`;

  const user = `Jogadores disponíveis (com OVR e winRate para equilíbrio):
${JSON.stringify(shuffledPlayers.map(p => ({ id: p.id, name: p.name, position: p.position, ovr: p.ovr || 60, winRate: p.winRate || 50 })), null, 2)}

DISTRIBUIÇÃO OBRIGATÓRIA DE QUANTIDADE:
- O Time A (teamA) DEVE conter exatamente ${targetSizeA} jogadores.
- O Time B (teamB) DEVE conter exatamente ${targetSizeB} jogadores.
Você deve distribuir todos os jogadores de forma que nenhum fique de fora e os tamanhos dos times sejam exatamente os listados acima.

Restrições (não podem ficar no mesmo time):
${JSON.stringify(formattedRestrictions, null, 2)}

Regras adicionais em linguagem natural:
${naturalLanguageRules || 'Nenhuma'}`;

  let teamA = [];
  let teamB = [];
  let announcement = '';
  let analysis = '';
  let impossible = null;

  // Helper to do a safe local fallback draw
  function doLocalFallback(reason) {
    console.warn("Falling back to local draw:", reason);
    try {
      const statsMap = {};
      for (const p of players) {
        statsMap[p.id] = {
          winRate: p.winRate || 50,
          goals: p.goals || 0,
          games: p.games || 0
        };
      }
      const localDraw = localBalancedDraw(playerIds, statsMap, restrictions || []);
      teamA = localDraw.teamA;
      teamB = localDraw.teamB;
    } catch (fallbackErr) {
      // Ultimate fallback: simple random split
      console.error("Local balanced draw also failed, using pure random split:", fallbackErr);
      const shuffled = shuffleArray([...playerIds]);
      const mid = Math.ceil(shuffled.length / 2);
      teamA = shuffled.slice(0, mid);
      teamB = shuffled.slice(mid);
    }

    // Build friendly announcement
    const nameMap = {};
    for (const p of players) {
      nameMap[p.id] = p.name || `Jogador ${p.id}`;
    }
    const teamANames = teamA.map(id => nameMap[id] || `Jogador ${id}`);
    const teamBNames = teamB.map(id => nameMap[id] || `Jogador ${id}`);

    announcement = `⚠️ IA indisponível no momento. Times sorteados localmente com equilíbrio!\n🟢 Time A: ${teamANames.join(', ')}\n🔴 Time B: ${teamBNames.join(', ')}`;
    analysis = 'Sorteio realizado usando algoritmo local de equilíbrio.';
  }

  try {
    const result = await generate(system, user);
    const parsed = extractJSON(result);

    const rawA = parsed.teamA || [];
    const rawB = parsed.teamB || [];
    announcement = parsed.announcement || '';
    analysis = parsed.analysis || '';
    impossible = parsed.impossible || null;

    // Apply strict validation & fixing on the AI output to prevent bugs, missing players, or uneven splits
    const fixed = validateAndFixTeams(rawA, rawB, shuffledPlayers);
    teamA = fixed.teamA;
    teamB = fixed.teamB;

  } catch (err) {
    console.error("AI team generation failed:", err);
    doLocalFallback(err.message);
  }

  return { teamA, teamB, announcement, analysis, impossible };
}


export async function answerStatsQuestion(question, allStats) {
  const system = `Você é o comentarista oficial das peladas! Responde perguntas sobre estatísticas de futebol amador.
Use APENAS os dados fornecidos abaixo. NUNCA invente dados.
Responda de forma direta, divertida e em português brasileiro.
Se não tiver dados suficientes para responder, diga honestamente.
Use emojis moderadamente. Seja conciso — 1-3 parágrafos no máximo.
Use **negrito** para destacar nomes e números importantes.
Use lists com - quando fizer rankings.`;

  const user = `DADOS DO SISTEMA:\n${JSON.stringify(allStats, null, 2)}\n\nPERGUNTA DO USUÁRIO: ${question}`;
  return generate(system, user);
}

export async function generatePlayerTitles(playerStats) {
  const system = `Você é um comentarista de futebol brasileiro criativo e engraçado.
Para cada jogador, gere um título/apelido divertido baseado nas estatísticas.
Exemplos: "Artilheiro Implacável", "Muralha da Defesa", "Fantasma do Gol", "Rei da Assistência", "Eterno Reserva".

RESPOSTA: Retorne um JSON válido (sem markdown, sem backticks) como objeto { "id_do_jogador": "título" }`;

  const user = `Estatísticas dos jogadores:\n${JSON.stringify(playerStats, null, 2)}`;
  const result = await generate(system, user);
  try {
    return extractJSON(result);
  } catch {
    return {};
  }
}

export async function comparePlayersAI(player1, player2, stats1, stats2) {
  const system = `Você é um comentarista esportivo brasileiro fazendo a análise de dois jogadores de pelada.
Compare os dois jogadores com base nas estatísticas e dê sua opinião de forma divertida e embasada.
Use **negrito** para nomes e números.
Seja breve — 2-3 parágrafos.`;

  const user = `JOGADOR 1: ${player1.nickname || player1.name}
Stats: ${JSON.stringify(stats1, null, 2)}

JOGADOR 2: ${player2.nickname || player2.name}
Stats: ${JSON.stringify(stats2, null, 2)}

Quem é melhor e por quê?`;

  return generate(system, user);
}
