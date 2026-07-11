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

// ── Fluent DB Interface to map existing Dexie queries to Supabase ──
export const db = {
  players: {
    toArray: async () => {
      const { data } = await supabase.from('players').select('*').order('name');
      return (data || []).map(p => ({ ...p, photo: p.photo_url }));
    },
    get: async (id) => {
      const { data } = await supabase.from('players').select('*').eq('id', id).maybeSingle();
      return data ? { ...data, photo: data.photo_url } : null;
    },
    orderBy: (field) => ({
      toArray: async () => {
        const { data } = await supabase.from('players').select('*').order(field);
        return (data || []).map(p => ({ ...p, photo: p.photo_url }));
      }
    })
  },
  matches: {
    orderBy: (field) => ({
      reverse: () => ({
        limit: (n) => ({
          toArray: async () => {
            const { data } = await supabase.from('matches').select('*').order(field, { ascending: false }).limit(n);
            return data || [];
          }
        }),
        toArray: async () => {
          const { data } = await supabase.from('matches').select('*').order(field, { ascending: false });
          return data || [];
        }
      })
    })
  },
  lineups: {
    toArray: async () => {
      const { data } = await supabase.from('lineups').select('*');
      return data || [];
    }
  },
  goals: {
    toArray: async () => {
      const { data } = await supabase.from('goals').select('*');
      return data || [];
    }
  },
  restrictions: {
    toArray: async () => {
      const { data } = await supabase.from('restrictions').select('*');
      return data || [];
    }
  }
};

// ── CRUD Helpers ──

export async function addPlayer({ name, nickname, photo, position, user_id = null }) {
  const { data, error } = await supabase
    .from('players')
    .insert([{
      name,
      nickname: nickname || '',
      photo_url: photo || '', // photo contains base64 string
      position: position || '',
      user_id
    }])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function updatePlayer(id, changes) {
  // If editing photo, we map photo -> photo_url
  const mapped = { ...changes };
  if ('photo' in changes) {
    mapped.photo_url = changes.photo;
    delete mapped.photo;
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
  // Insert Match
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

  // Insert Lineups
  if (lineupA?.length || lineupB?.length) {
    const lData = [];
    if (lineupA?.length) lineupA.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'A' }));
    if (lineupB?.length) lineupB.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'B' }));

    const { error: lErr } = await supabase.from('lineups').insert(lData);
    if (lErr) throw lErr;
  }

  // Insert Goals
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
  // Update Match
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

  // Clean old lineups/goals (ON DELETE CASCADE will clean, but let's do manually to be safe)
  await supabase.from('lineups').delete().eq('match_id', matchId);
  await supabase.from('goals').delete().eq('match_id', matchId);

  // Insert new Lineups
  if (lineupA?.length || lineupB?.length) {
    const lData = [];
    if (lineupA?.length) lineupA.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'A' }));
    if (lineupB?.length) lineupB.forEach(pid => lData.push({ match_id: matchId, player_id: pid, team: 'B' }));

    const { error: lErr } = await supabase.from('lineups').insert(lData);
    if (lErr) throw lErr;
  }

  // Insert new Goals
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

  const playerMap = Object.fromEntries((allPlayers || []).map(p => [p.id, { ...p, photo: p.photo_url }]));

  return {
    id: match.id,
    date: match.date,
    location: match.location,
    teamAName: match.team_a_name,
    teamAColor: match.team_a_color,
    teamBName: match.team_b_name,
    teamBColor: match.team_b_color,
    scoreA: match.score_a,
    scoreB: match.score_b,
    aiSummary: match.ai_summary,
    lineupA: (lineups || []).filter(l => l.team === 'A').map(l => playerMap[l.player_id]).filter(Boolean),
    lineupB: (lineups || []).filter(l => l.team === 'B').map(l => playerMap[l.player_id]).filter(Boolean),
    goals: (goals || []).map(g => ({
      id: g.id,
      scorerId: g.scorer_id,
      scorer: playerMap[g.scorer_id],
      assistId: g.assist_id,
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
  // Clear all
  await Promise.all([
    supabase.from('lineups').delete().neq('id', 0),
    supabase.from('goals').delete().neq('id', 0),
    supabase.from('restrictions').delete().neq('id', 0)
  ]);
  await supabase.from('players').delete().neq('id', 0);
  await supabase.from('matches').delete().neq('id', 0);

  // Bulk inserts
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
