import { db } from '../db';

/**
 * Compute full stats for a single player
 */
export async function getPlayerStats(playerId, playerObj = null) {
  const allLineups = await db.lineups.toArray();
  const lineups = allLineups.filter(l => l.playerId === playerId);
  const allGoals = await db.goals.toArray();
  const allMatches = await db.matches.toArray();
  const matchMap = Object.fromEntries(allMatches.map(m => [m.id, m]));

  const player = playerObj || (await db.players.get(playerId));
  const initialOvr = player?.initialOvr ?? 60;

  let games = 0, wins = 0, draws = 0, losses = 0, goals = 0, assists = 0;

  for (const lineup of lineups) {
    const match = matchMap[lineup.matchId];
    if (!match) continue;
    games++;

    const myTeam = lineup.team;
    const myScore = myTeam === 'A' ? match.scoreA : match.scoreB;
    const theirScore = myTeam === 'A' ? match.scoreB : match.scoreA;

    if (myScore > theirScore) wins++;
    else if (myScore === theirScore) draws++;
    else losses++;
  }

  goals = allGoals.filter(g => g.scorerId === playerId).length;
  assists = allGoals.filter(g => g.assistId === playerId).length;

  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;

  // Calculate current dynamic OVR
  const currentOvr = Math.max(40, Math.min(99, Math.round(initialOvr + (wins * 1.5) - (losses * 1.5) + (goals * 0.5) + (assists * 0.3))));

  return { playerId, games, wins, draws, losses, goals, assists, winRate, initialOvr, currentOvr };
}

/**
 * Get stats for ALL players
 */
export async function getAllPlayerStats() {
  const players = await db.players.toArray();
  const stats = [];
  for (const p of players) {
    const s = await getPlayerStats(p.id, p);
    stats.push({ ...s, player: p });
  }
  return stats;
}

/**
 * Get a comprehensive stats summary for AI context
 */
export async function getStatsSummaryForAI() {
  const players = await db.players.toArray();
  const matches = await db.matches.toArray();
  const allStats = await getAllPlayerStats();

  return {
    totalMatches: matches.length,
    totalPlayers: players.length,
    players: allStats.map(s => ({
      id: s.playerId,
      name: s.player.name,
      nickname: s.player.nickname,
      games: s.games,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goals: s.goals,
      assists: s.assists,
      winRate: s.winRate
    })),
    recentMatches: matches.slice(0, 10).map(m => ({
      date: m.date,
      teams: `${m.teamAName} ${m.scoreA} x ${m.scoreB} ${m.teamBName}`,
      location: m.location
    })),
    topScorer: allStats.sort((a, b) => b.goals - a.goals)[0]?.player?.name || 'N/A',
    topAssists: allStats.sort((a, b) => b.assists - a.assists)[0]?.player?.name || 'N/A',
    topWinRate: allStats.filter(s => s.games >= 3).sort((a, b) => b.winRate - a.winRate)[0]?.player?.name || 'N/A',
  };
}

/**
 * Get rankings by category
 */
export async function getRankings(category = 'goals', period = null) {
  let allStats = await getAllPlayerStats();

  // Filter by period
  if (period) {
    const cutoff = new Date();
    if (period === '3months') cutoff.setMonth(cutoff.getMonth() - 3);
    else if (period === 'year') cutoff.setFullYear(cutoff.getFullYear(), 0, 1);

    const matches = await db.matches.toArray();
    const validMatchIds = new Set(
      matches.filter(m => new Date(m.date) >= cutoff).map(m => m.id)
    );

    const players = await db.players.toArray();
    const lineups = await db.lineups.toArray();
    const goals = await db.goals.toArray();

    allStats = [];
    for (const player of players) {
      const playerLineups = lineups.filter(l => l.playerId === player.id && validMatchIds.has(l.matchId));
      let wins = 0, draws = 0, losses = 0;
      const matchMap = Object.fromEntries(matches.map(m => [m.id, m]));

      for (const l of playerLineups) {
        const m = matchMap[l.matchId];
        if (!m) continue;
        const myScore = l.team === 'A' ? m.scoreA : m.scoreB;
        const theirScore = l.team === 'A' ? m.scoreB : m.scoreA;
        if (myScore > theirScore) wins++;
        else if (myScore === theirScore) draws++;
        else losses++;
      }

      const playerGoals = goals.filter(g => g.scorerId === player.id && validMatchIds.has(g.matchId)).length;
      const playerAssists = goals.filter(g => g.assistId === player.id && validMatchIds.has(g.matchId)).length;
      const games = playerLineups.length;
      const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;

      allStats.push({ playerId: player.id, player, games, wins, draws, losses, goals: playerGoals, assists: playerAssists, winRate });
    }
  }

  // Sort by category
  switch (category) {
    case 'goals': return allStats.sort((a, b) => b.goals - a.goals);
    case 'assists': return allStats.sort((a, b) => b.assists - a.assists);
    case 'winRate': return allStats.filter(s => s.games >= 3).sort((a, b) => b.winRate - a.winRate);
    case 'games': return allStats.sort((a, b) => b.games - a.games);
    default: return allStats;
  }
}

/**
 * Get the "craque da rodada" (best player from last match)
 */
export async function getCraqueDaRodada() {
  const allMatches = await db.matches.toArray();
  const lastMatch = allMatches[0] || null;
  if (!lastMatch) return null;

  const allGoals = await db.goals.toArray();
  const goals = allGoals.filter(g => g.matchId === lastMatch.id);
  if (!goals.length) return null;

  // Count goals per player
  const goalCount = {};
  for (const g of goals) {
    goalCount[g.scorerId] = (goalCount[g.scorerId] || 0) + 1;
  }

  const topScorerId = Object.entries(goalCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topScorerId) return null;

  const player = await db.players.get(Number(topScorerId));
  return player ? { player, goals: goalCount[topScorerId], match: lastMatch } : null;
}
