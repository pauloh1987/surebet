export const toNumber = (v) => {
  if (typeof v === 'number') return v;
  if (v == null) return 0;
  const n = Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export const money = (v, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(v || 0));

export const pct = (v) => `${(Number(v || 0) * 100).toFixed(2)}%`;

export const isoNow = () => new Date().toISOString();

export const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(d);
  } catch {
    return iso;
  }
};