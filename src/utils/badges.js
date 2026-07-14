import { db } from '../db';

/**
 * All available badges and their computation logic.
 * Each badge has: id, name, emoji, description, check(playerStats, allStats, playerMatches)
 */
const BADGE_DEFINITIONS = [
  {
    id: 'artilheiro',
    name: 'Artilheiro',
    emoji: '👟',
    description: 'Maior goleador geral',
    check: (stats, allStats) => {
      if (stats.goals === 0) return false;
      const maxGoals = Math.max(...allStats.map(s => s.goals));
      return stats.goals === maxGoals;
    }
  },
  {
    id: 'garcom',
    name: 'Garçom',
    emoji: '🤝',
    description: 'Mais assistências',
    check: (stats, allStats) => {
      if (stats.assists === 0) return false;
      const maxAssists = Math.max(...allStats.map(s => s.assists));
      return stats.assists === maxAssists;
    }
  },
  {
    id: 'muralha',
    name: 'Muralha',
    emoji: '🧱',
    description: 'Melhor aproveitamento (mín. 5 jogos)',
    check: (stats, allStats) => {
      if (stats.games < 5) return false;
      const eligible = allStats.filter(s => s.games >= 5);
      if (eligible.length === 0) return false;
      const maxWR = Math.max(...eligible.map(s => s.winRate));
      return stats.winRate === maxWR;
    }
  },
  {
    id: 'veterano',
    name: 'Veterano',
    emoji: '👴',
    description: '10+ partidas jogadas',
    check: (stats) => stats.games >= 10
  },
  {
    id: 'estreante',
    name: 'Calouro',
    emoji: '🌱',
    description: 'Primeira pelada jogada',
    check: (stats) => stats.games >= 1 && stats.games <= 2
  },
  {
    id: 'goleador',
    name: 'Goleador',
    emoji: '🔥',
    description: '10+ gols marcados',
    check: (stats) => stats.goals >= 10
  },
  {
    id: 'imbativel',
    name: 'Imbatível',
    emoji: '🏆',
    description: '70%+ de aproveitamento (mín. 5 jogos)',
    check: (stats) => stats.games >= 5 && stats.winRate >= 70
  },
  {
    id: 'dedicado',
    name: 'Dedicado',
    emoji: '💎',
    description: '20+ partidas jogadas',
    check: (stats) => stats.games >= 20
  }
];

/**
 * Check for hat-trick badges (3+ goals in a single match)
 */
async function checkHatTrick(playerId) {
  const goals = await db.goals.toArray();
  const matches = await db.matches.toArray();
  const matchIds = [...new Set(matches.map(m => m.id))];

  for (const matchId of matchIds) {
    const matchGoals = goals.filter(g => g.matchId === matchId && g.scorerId === playerId);
    if (matchGoals.length >= 3) return true;
  }
  return false;
}

/**
 * Check for consecutive wins streak
 */
async function checkWinStreak(playerId, minStreak = 3) {
  const lineups = (await db.lineups.toArray()).filter(l => l.playerId === playerId);
  const matches = await db.matches.toArray();
  const matchMap = Object.fromEntries(matches.map(m => [m.id, m]));

  const sorted = lineups
    .map(l => ({ ...l, match: matchMap[l.matchId] }))
    .filter(l => l.match)
    .sort((a, b) => (a.match.date || '').localeCompare(b.match.date || ''));

  let streak = 0;
  let maxStreak = 0;
  for (const l of sorted) {
    const m = l.match;
    const myScore = l.team === 'A' ? m.scoreA : m.scoreB;
    const theirScore = l.team === 'A' ? m.scoreB : m.scoreA;
    if (myScore > theirScore) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  return maxStreak >= minStreak;
}

/**
 * Get all badges for a player
 */
export async function getPlayerBadges(playerStats, allStats) {
  const badges = [];

  for (const def of BADGE_DEFINITIONS) {
    if (def.check(playerStats, allStats)) {
      badges.push({ ...def });
    }
  }

  // Async badges
  if (await checkHatTrick(playerStats.playerId)) {
    badges.push({
      id: 'hattrick',
      name: 'Hat-trick',
      emoji: '🎩',
      description: '3+ gols em uma partida'
    });
  }

  if (await checkWinStreak(playerStats.playerId, 3)) {
    badges.push({
      id: 'invicto',
      name: 'Invicto',
      emoji: '🔥',
      description: '3+ vitórias consecutivas'
    });
  }

  if (await checkWinStreak(playerStats.playerId, 5)) {
    badges.push({
      id: 'invicto5',
      name: 'Imbatível',
      emoji: '⚡',
      description: '5+ vitórias consecutivas'
    });
  }

  return badges;
}

/**
 * Get all badge definitions for reference
 */
export function getAllBadgeDefinitions() {
  return BADGE_DEFINITIONS;
}
