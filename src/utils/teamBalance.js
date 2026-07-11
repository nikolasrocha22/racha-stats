/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Random team draw — just shuffle and split
 */
export function randomDraw(playerIds) {
  const shuffled = shuffleArray(playerIds);
  const mid = Math.ceil(shuffled.length / 2);
  return {
    teamA: shuffled.slice(0, mid),
    teamB: shuffled.slice(mid)
  };
}

/**
 * Simple balanced draw (local, no AI) — tries to balance by stat score
 */
export function localBalancedDraw(playerIds, statsMap, restrictions = []) {
  // Score each player
  const scored = playerIds.map(id => {
    const s = statsMap[id] || { winRate: 50, goals: 0, games: 0 };
    const score = s.winRate * 0.5 + (s.goals / Math.max(s.games, 1)) * 30 + Math.min(s.games, 20);
    return { id, score };
  }).sort((a, b) => b.score - a.score);

  // Greedy split
  const teamA = [];
  const teamB = [];
  let sumA = 0, sumB = 0;

  for (const p of scored) {
    // Check restrictions
    const blockedA = restrictions.some(r =>
      (r.playerAId === p.id && teamA.includes(r.playerBId)) ||
      (r.playerBId === p.id && teamA.includes(r.playerAId))
    );
    const blockedB = restrictions.some(r =>
      (r.playerAId === p.id && teamB.includes(r.playerBId)) ||
      (r.playerBId === p.id && teamB.includes(r.playerAId))
    );

    if (blockedA && blockedB) {
      // Impossible constraint — add to smaller team anyway
      if (sumA <= sumB) { teamA.push(p.id); sumA += p.score; }
      else { teamB.push(p.id); sumB += p.score; }
    } else if (blockedA) {
      teamB.push(p.id); sumB += p.score;
    } else if (blockedB) {
      teamA.push(p.id); sumA += p.score;
    } else if (sumA <= sumB) {
      teamA.push(p.id); sumA += p.score;
    } else {
      teamB.push(p.id); sumB += p.score;
    }
  }

  return { teamA, teamB };
}
