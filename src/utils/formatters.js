export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatPercent(value) {
  return `${value}%`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function getResultLabel(scoreA, scoreB, team) {
  const my = team === 'A' ? scoreA : scoreB;
  const their = team === 'A' ? scoreB : scoreA;
  if (my > their) return 'V';
  if (my < their) return 'D';
  return 'E';
}

export function getResultClass(scoreA, scoreB, team) {
  const label = getResultLabel(scoreA, scoreB, team);
  return label === 'V' ? 'result-win' : label === 'D' ? 'result-loss' : 'result-draw';
}

export const POSITIONS = [
  { value: '', label: 'Não definida' },
  { value: 'GOL', label: 'Goleiro' },
  { value: 'ZAG', label: 'Zagueiro' },
  { value: 'LAT', label: 'Lateral' },
  { value: 'VOL', label: 'Volante' },
  { value: 'MEI', label: 'Meia' },
  { value: 'ATA', label: 'Atacante' },
  { value: 'PE', label: 'Ponta Esquerda' },
  { value: 'PD', label: 'Ponta Direita' },
];

export const TEAM_COLORS = [
  '#2ecc40', '#ff4444', '#4488ff', '#ffd700',
  '#ff8800', '#aa44ff', '#00cccc', '#ff44aa',
  '#ffffff', '#888888'
];
