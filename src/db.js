import Dexie from 'dexie';

export const db = new Dexie('RachaStatsDB');

db.version(1).stores({
  players: '++id, name, nickname, position',
  matches: '++id, date, location',
  lineups: '++id, matchId, playerId, team, [matchId+playerId]',
  goals: '++id, matchId, scorerId, assistId, team',
  restrictions: '++id, playerAId, playerBId'
});

// ── Helper functions ──

export async function addPlayer({ name, nickname, photo, position }) {
  return db.players.add({ name, nickname: nickname || '', photo: photo || '', position: position || '' });
}

export async function updatePlayer(id, changes) {
  return db.players.update(id, changes);
}

export async function deletePlayer(id) {
  await db.lineups.where('playerId').equals(id).delete();
  await db.goals.where('scorerId').equals(id).delete();
  await db.goals.where('assistId').equals(id).modify({ assistId: null });
  return db.players.delete(id);
}

export async function addMatch({
  date, location,
  teamAName, teamAColor, teamBName, teamBColor,
  scoreA, scoreB,
  lineupA, lineupB,
  goals,
  aiSummary
}) {
  return db.transaction('rw', db.matches, db.lineups, db.goals, async () => {
    const matchId = await db.matches.add({
      date, location: location || '',
      teamAName, teamAColor,
      teamBName, teamBColor,
      scoreA: scoreA ?? 0,
      scoreB: scoreB ?? 0,
      aiSummary: aiSummary || ''
    });

    if (lineupA?.length) {
      await db.lineups.bulkAdd(lineupA.map(playerId => ({ matchId, playerId, team: 'A' })));
    }
    if (lineupB?.length) {
      await db.lineups.bulkAdd(lineupB.map(playerId => ({ matchId, playerId, team: 'B' })));
    }
    if (goals?.length) {
      await db.goals.bulkAdd(goals.map(g => ({
        matchId,
        scorerId: g.scorerId,
        assistId: g.assistId || null,
        team: g.team
      })));
    }

    return matchId;
  });
}

export async function updateMatch(matchId, {
  date, location,
  teamAName, teamAColor, teamBName, teamBColor,
  scoreA, scoreB,
  lineupA, lineupB,
  goals,
  aiSummary
}) {
  return db.transaction('rw', db.matches, db.lineups, db.goals, async () => {
    await db.matches.update(matchId, {
      date, location: location || '',
      teamAName, teamAColor,
      teamBName, teamBColor,
      scoreA: scoreA ?? 0,
      scoreB: scoreB ?? 0,
      aiSummary: aiSummary || ''
    });

    await db.lineups.where('matchId').equals(matchId).delete();
    await db.goals.where('matchId').equals(matchId).delete();

    if (lineupA?.length) {
      await db.lineups.bulkAdd(lineupA.map(playerId => ({ matchId, playerId, team: 'A' })));
    }
    if (lineupB?.length) {
      await db.lineups.bulkAdd(lineupB.map(playerId => ({ matchId, playerId, team: 'B' })));
    }
    if (goals?.length) {
      await db.goals.bulkAdd(goals.map(g => ({
        matchId,
        scorerId: g.scorerId,
        assistId: g.assistId || null,
        team: g.team
      })));
    }
  });
}

export async function deleteMatch(matchId) {
  return db.transaction('rw', db.matches, db.lineups, db.goals, async () => {
    await db.lineups.where('matchId').equals(matchId).delete();
    await db.goals.where('matchId').equals(matchId).delete();
    await db.matches.delete(matchId);
  });
}

export async function getMatchDetails(matchId) {
  const match = await db.matches.get(matchId);
  if (!match) return null;

  const lineups = await db.lineups.where('matchId').equals(matchId).toArray();
  const goals = await db.goals.where('matchId').equals(matchId).toArray();
  const allPlayers = await db.players.toArray();
  const playerMap = Object.fromEntries(allPlayers.map(p => [p.id, p]));

  return {
    ...match,
    lineupA: lineups.filter(l => l.team === 'A').map(l => playerMap[l.playerId]).filter(Boolean),
    lineupB: lineups.filter(l => l.team === 'B').map(l => playerMap[l.playerId]).filter(Boolean),
    goals: goals.map(g => ({
      ...g,
      scorer: playerMap[g.scorerId],
      assistant: g.assistId ? playerMap[g.assistId] : null
    }))
  };
}

export async function addRestriction(playerAId, playerBId, description = '') {
  return db.restrictions.add({ playerAId, playerBId, description });
}

export async function deleteRestriction(id) {
  return db.restrictions.delete(id);
}

export async function exportAllData() {
  const [players, matches, lineups, goals, restrictions] = await Promise.all([
    db.players.toArray(),
    db.matches.toArray(),
    db.lineups.toArray(),
    db.goals.toArray(),
    db.restrictions.toArray()
  ]);
  return { players, matches, lineups, goals, restrictions, exportedAt: new Date().toISOString() };
}

export async function importAllData(data) {
  return db.transaction('rw', db.players, db.matches, db.lineups, db.goals, db.restrictions, async () => {
    await db.players.clear();
    await db.matches.clear();
    await db.lineups.clear();
    await db.goals.clear();
    await db.restrictions.clear();

    if (data.players?.length) await db.players.bulkAdd(data.players);
    if (data.matches?.length) await db.matches.bulkAdd(data.matches);
    if (data.lineups?.length) await db.lineups.bulkAdd(data.lineups);
    if (data.goals?.length) await db.goals.bulkAdd(data.goals);
    if (data.restrictions?.length) await db.restrictions.bulkAdd(data.restrictions);
  });
}
