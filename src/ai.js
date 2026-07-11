import { GoogleGenAI } from '@google/genai';
import { getSystemConfig } from './db';

async function getApiKey() {
  try {
    const key = await getSystemConfig('api_key');
    if (key) return key.trim();
  } catch (e) {
    console.error('Erro ao ler chave da nuvem:', e);
  }
  const stored = localStorage.getItem('racha_stats_api_key');
  if (stored) return stored.trim();
  return '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';
}

function isNvidiaKey(key) {
  return key.startsWith('nvapi-');
}

async function generateNvidia(systemPrompt, userPrompt, key) {
  const url = '/nvidia-api/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 2048
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro na API Nvidia: ${response.status} - ${errText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function generate(systemPrompt, userPrompt) {
  const key = await getApiKey();
  if (!key) throw new Error('API key não configurada. Vá em Configurações para inserir sua chave.');

  if (isNvidiaKey(key)) {
    return generateNvidia(systemPrompt, userPrompt, key);
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.9,
    }
  });
  return response.text;
}

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

export async function generateBalancedTeams(players, stats, restrictions, naturalLanguageRules) {
  const system = `Você é o apresentador carismático de um programa de auditório fazendo um MEGA SORTEIO DE TIMES para a pelada!
Sua tarefa é dividir os jogadores em 2 times equilibrados com base nas estatísticas fornecidas.

REGRAS:
1. Respeite TODAS as restrições (duplas que não podem ficar no mesmo time)
2. Tente equilibrar por: taxa de vitória, gols por jogo, e experiência (número de jogos)
3. Se alguma restrição for impossível de cumprir, explique por quê
4. Se houver número ímpar de jogadores, o time com menos fica com um a menos

RESPOSTA: Retorne um JSON válido com esta estrutura EXATA (sem markdown, sem backticks):
{
  "teamA": [lista de IDs dos jogadores],
  "teamB": [lista de IDs dos jogadores],
  "announcement": "Texto divertido e empolgante anunciando os times, mencionando os jogadores por nome/apelido, como um apresentador de TV",
  "impossible": null ou "explicação se alguma regra não pôde ser cumprida"
}`;

  const user = `Jogadores disponíveis:\n${JSON.stringify(players, null, 2)}

Estatísticas:\n${JSON.stringify(stats, null, 2)}

Restrições (não podem ficar no mesmo time):\n${JSON.stringify(restrictions, null, 2)}

Regras adicionais em linguagem natural:\n${naturalLanguageRules || 'Nenhuma'}`;

  const result = await generate(system, user);
  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { teamA: [], teamB: [], announcement: result, impossible: null };
  }
}

export async function answerStatsQuestion(question, allStats) {
  const system = `Você é o comentarista oficial das peladas! Responde perguntas sobre estatísticas de futebol amador.
Use APENAS os dados fornecidos abaixo. NUNCA invente dados.
Responda de forma direta, divertida e em português brasileiro.
Se não tiver dados suficientes para responder, diga honestamente.
Use emojis moderadamente. Seja conciso — 1-3 parágrafos no máximo.`;

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
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}
