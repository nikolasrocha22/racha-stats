import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Custom hook to mimic Dexie's useLiveQuery for Supabase fetches
export function useLiveQuery(queryFn, deps = []) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    queryFn().then(res => {
      if (active) setData(res);
    });
    return () => { active = false; };
  }, deps);

  return data;
}

// ── Column Mapping Helpers to maintain camelCase on frontend ──
const mapMatch = (m) => {
  if (!m) return null;
  return {
    ...m,
    id: Number(m.id),
    teamAName: m.team_a_name,
    teamAColor: m.team_a_color,
    teamBName: m.team_b_name,
    teamBColor: m.team_b_color,
    scoreA: Number(m.score_a),
    scoreB: Number(m.score_b),
    aiSummary: m.ai_summary
  };
};

const mapLineup = (l) => {
  if (!l) return null;
  return {
    ...l,
    id: Number(l.id),
    matchId: Number(l.match_id),
    playerId: Number(l.player_id)
  };
};

const mapGoal = (g) => {
  if (!g) return null;
  return {
    ...g,
    id: Number(g.id),
    matchId: Number(g.match_id),
    scorerId: Number(g.scorer_id),
    assistId: g.assist_id ? Number(g.assist_id) : null
  };
};

const mapRestriction = (r) => {
  if (!r) return null;
  return {
    ...r,
    id: Number(r.id),
    playerAId: Number(r.player_a_id),
    playerBId: Number(r.player_b_id)
  };
};

// ── Fluent DB Interface to map existing Dexie queries to Supabase ──
export const db = {
  players: {
    toArray: async () => {
      const { data } = await supabase.from('players').select('*').order('name');
      return (data || []).map(p => ({ ...p, id: Number(p.id), photo: p.photo_url, initialOvr: Number(p.initial_ovr || 60) }));
    },
    get: async (id) => {
      const { data } = await supabase.from('players').select('*').eq('id', id).maybeSingle();
      return data ? { ...data, id: Number(data.id), photo: data.photo_url, initialOvr: Number(data.initial_ovr || 60) } : null;
    },
    orderBy: (field) => ({
      toArray: async () => {
        const { data } = await supabase.from('players').select('*').order(field);
        return (data || []).map(p => ({ ...p, id: Number(p.id), photo: p.photo_url, initialOvr: Number(p.initial_ovr || 60) }));
      }
    })
  },
  matches: {
    toArray: async () => {
      const { data } = await supabase.from('matches').select('*').order('date', { ascending: false });
      return (data || []).map(mapMatch);
    },
    update: async (id, changes) => {
      const mapped = {};
      if ('aiSummary' in changes) mapped.ai_summary = changes.aiSummary;
      if ('scoreA' in changes) mapped.score_a = changes.scoreA;
      if ('scoreB' in changes) mapped.score_b = changes.scoreB;
      const { error } = await supabase.from('matches').update(mapped).eq('id', id);
      if (error) throw error;
    },
    orderBy: (field) => ({
      reverse: () => ({
        limit: (n) => ({
          toArray: async () => {
            const { data } = await supabase.from('matches').select('*').order(field, { ascending: false }).limit(n);
            return (data || []).map(mapMatch);
          }
        }),
        toArray: async () => {
          const { data } = await supabase.from('matches').select('*').order(field, { ascending: false });
          return (data || []).map(mapMatch);
        }
      })
    })
  },
  lineups: {
    toArray: async () => {
      const { data } = await supabase.from('lineups').select('*');
      return (data || []).map(mapLineup);
    }
  },
  goals: {
    toArray: async () => {
      const { data } = await supabase.from('goals').select('*');
      return (data || []).map(mapGoal);
    }
  },
  restrictions: {
    toArray: async () => {
      const { data } = await supabase.from('restrictions').select('*');
      return (data || []).map(mapRestriction);
    }
  }
};

// ── CRUD Helpers ──

export async function addPlayer({ name, nickname, photo, position, user_id = null, initialOvr = 60 }) {
  const { data, error } = await supabase
    .from('players')
    .insert([{
      name,
      nickname: nickname || '',
      photo_url: photo || '',
      position: position || '',
      user_id,
      initial_ovr: initialOvr
    }])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function updatePlayer(id, changes) {
  const mapped = { ...changes };
  if ('photo' in changes) {
    mapped.photo_url = changes.photo;
    delete mapped.photo;
  }
  if ('initialOvr' in changes) {
    mapped.initial_ovr = changes.initialOvr;
    delete mapped.initialOvr;
  }
  const { error } = await supabase.from('players').update(mapped).eq('id', id);
  if (error) throw error;
}

export async function deletePlayer(id) {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}

export async function addMatch({
  date, location,
  teamAName, teamAColor, teamBName, teamBColor,
  scoreA, scoreB,
  lineupA, lineupB,
  goals,
  aiSummary
}) {
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .insert([{
      date, location: location || '',
      team_a_name: teamAName, team_a_color: teamAColor,
      team_b_name: teamBName, team_b_color: teamBColor,
      score_a: scoreA ?? 0, score_b: scoreB ?? 0,
      ai_summary: aiSummary || ''
    }])
    .select()
    .single();

  if (matchErr) throw matchErr;
  const matchId = match.id;

  if (lineupA?.length || lineupB?.length) {
    const lData = [];
    if (lineupA?.length) lineupA.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'A' }));
    if (lineupB?.length) lineupB.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'B' }));

    const { error: lErr } = await supabase.from('lineups').insert(lData);
    if (lErr) throw lErr;
  }

  if (goals?.length) {
    const gData = goals.map(g => ({
      match_id: matchId,
      scorer_id: g.scorerId,
      assist_id: g.assistId || null,
      team: g.team
    }));
    const { error: gErr } = await supabase.from('goals').insert(gData);
    if (gErr) throw gErr;
  }

  return matchId;
}

export async function updateMatch(matchId, {
  date, location,
  teamAName, teamAColor, teamBName, teamBColor,
  scoreA, scoreB,
  lineupA, lineupB,
  goals,
  aiSummary
}) {
  const { error: matchErr } = await supabase
    .from('matches')
    .update({
      date, location: location || '',
      team_a_name: teamAName, team_a_color: teamAColor,
      team_b_name: teamBName, team_b_color: teamBColor,
      score_a: scoreA ?? 0, score_b: scoreB ?? 0,
      ai_summary: aiSummary || ''
    })
    .eq('id', matchId);

  if (matchErr) throw matchErr;

  await supabase.from('lineups').delete().eq('match_id', matchId);
  await supabase.from('goals').delete().eq('match_id', matchId);

  if (lineupA?.length || lineupB?.length) {
    const lData = [];
    if (lineupA?.length) lineupA.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'A' }));
    if (lineupB?.length) lineupB.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'B' }));

    const { error: lErr } = await supabase.from('lineups').insert(lData);
    if (lErr) throw lErr;
  }

  if (goals?.length) {
    const gData = goals.map(g => ({
      match_id: matchId,
      scorer_id: g.scorerId,
      assist_id: g.assistId || null,
      team: g.team
    }));
    const { error: gErr } = await supabase.from('goals').insert(gData);
    if (gErr) throw gErr;
  }
}

export async function deleteMatch(matchId) {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) throw error;
}

export async function getMatchDetails(matchId) {
  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match) return null;

  const { data: lineups } = await supabase.from('lineups').select('*').eq('match_id', matchId);
  const { data: goals } = await supabase.from('goals').select('*').eq('match_id', matchId);
  const { data: allPlayers } = await supabase.from('players').select('*');

  const playerMap = Object.fromEntries((allPlayers || []).map(p => [p.id, { ...p, id: Number(p.id), photo: p.photo_url }]));

  return {
    id: match.id,
    date: match.date,
    location: match.location,
    teamAName: match.team_a_name,
    teamAColor: match.team_a_color,
    teamBName: match.team_b_name,
    teamBColor: match.team_b_color,
    scoreA: Number(match.score_a),
    scoreB: Number(match.score_b),
    aiSummary: match.ai_summary,
    lineupA: (lineups || []).filter(l => l.team === 'A').map(l => playerMap[l.player_id]).filter(Boolean),
    lineupB: (lineups || []).filter(l => l.team === 'B').map(l => playerMap[l.player_id]).filter(Boolean),
    goals: (goals || []).map(g => ({
      id: Number(g.id),
      scorerId: Number(g.scorer_id),
      scorer: playerMap[g.scorer_id],
      assistId: g.assist_id ? Number(g.assist_id) : null,
      assistant: g.assist_id ? playerMap[g.assist_id] : null,
      team: g.team
    }))
  };
}

export async function addRestriction(playerAId, playerBId, description = '') {
  const { error } = await supabase
    .from('restrictions')
    .insert([{ player_a_id: playerAId, player_b_id: playerBId, description }]);
  if (error) throw error;
}

export async function deleteRestriction(id) {
  const { error } = await supabase.from('restrictions').delete().eq('id', id);
  if (error) throw error;
}

export async function exportAllData() {
  const [players, matches, lineups, goals, restrictions] = await Promise.all([
    supabase.from('players').select('*').then(r => r.data || []),
    supabase.from('matches').select('*').then(r => r.data || []),
    supabase.from('lineups').select('*').then(r => r.data || []),
    supabase.from('goals').select('*').then(r => r.data || []),
    supabase.from('restrictions').select('*').then(r => r.data || [])
  ]);

  return { players, matches, lineups, goals, restrictions, exportedAt: new Date().toISOString() };
}

export async function importAllData(data) {
  await Promise.all([
    supabase.from('lineups').delete().neq('id', 0),
    supabase.from('goals').delete().neq('id', 0),
    supabase.from('restrictions').delete().neq('id', 0)
  ]);
  await supabase.from('players').delete().neq('id', 0);
  await supabase.from('matches').delete().neq('id', 0);

  if (data.players?.length) await supabase.from('players').insert(data.players);
  if (data.matches?.length) await supabase.from('matches').insert(data.matches);
  if (data.lineups?.length) await supabase.from('lineups').insert(data.lineups);
  if (data.goals?.length) await supabase.from('goals').insert(data.goals);
  if (data.restrictions?.length) await supabase.from('restrictions').insert(data.restrictions);
}

// Helper to get system config (e.g. Gemini key)
export async function getSystemConfig(key) {
  const { data } = await supabase.from('config').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}

export async function setSystemConfig(key, value) {
  const { error } = await supabase.from('config').upsert({ key, value });
  if (error) throw error;
}
