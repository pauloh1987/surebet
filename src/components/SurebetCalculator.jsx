import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { toNumber, money, pct, isoNow } from '../utils/format';

/**
 * Calculadora de arbitragem (2 apostas)
 * - Entrada: odd1, odd2, stakeTotal
 * - Saída: stakes ótimas, lucro garantido (se existir), ROI
 */
export default function SurebetCalculator({ onSave }) {
  const [odd1, setOdd1] = useState('2.00');
  const [odd2, setOdd2] = useState('2.10');
  const [stake, setStake] = useState('100');
  const [book1, setBook1] = useState('Casa A');
  const [book2, setBook2] = useState('Casa B');
  const [market, setMarket] = useState('1x2');
  const [eventName, setEventName] = useState('Jogo X');

  const calc = useMemo(() => {
    const o1 = toNumber(odd1);
    const o2 = toNumber(odd2);
    const S = toNumber(stake);

    const inv = 1 / o1 + 1 / o2;
    const hasArb = inv < 1;

    // proporções
    const p1 = (1 / o1) / inv; // fração da stake para aposta 1
    const p2 = 1 - p1;

    const s1 = S * p1;
    const s2 = S * p2;

    const ret1 = s1 * o1 - S; // retorno líquido se 1 vence
    const ret2 = s2 * o2 - S; // retorno líquido se 2 vence

    const minProfit = Math.min(ret1, ret2);
    const roi = S > 0 ? minProfit / S : 0;

    return { o1, o2, S, inv, hasArb, s1, s2, ret1, ret2, minProfit, roi };
  }, [odd1, odd2, stake]);

  const handleSave = () => {
    if (!onSave) return;
    const now = isoNow();
    const op = {
      id: crypto.randomUUID(),
      createdAt: now,
      market,
      eventName,
      bets: [
        {
          id: crypto.randomUUID(),
          book: book1,
          odd: toNumber(odd1),
          stake: calc.s1,
          potentialReturn: calc.s1 * calc.o1
        },
        {
          id: crypto.randomUUID(),
          book: book2,
          odd: toNumber(odd2),
          stake: calc.s2,
          potentialReturn: calc.s2 * calc.o2
        }
      ],
      totalStake: calc.S,
      surebet: calc.inv < 1,
      expectedProfit: calc.minProfit,
      status: 'open' // usuário pode marcar como completed depois
    };
    onSave(op);
    toast.success('Operação criada a partir da surebet!');
  };

  return (
    <div className="card p-5 md:p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Calculadora de Surebet (2 apostas)</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Odd 1</label>
          <input className="w-full rounded-xl border p-2" inputMode="decimal" value={odd1} onChange={e=>setOdd1(e.target.value)} />
          <label className="text-sm text-slate-600">Casa 1</label>
          <input className="w-full rounded-xl border p-2" value={book1} onChange={e=>setBook1(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Odd 2</label>
          <input className="w-full rounded-xl border p-2" inputMode="decimal" value={odd2} onChange={e=>setOdd2(e.target.value)} />
          <label className="text-sm text-slate-600">Casa 2</label>
          <input className="w-full rounded-xl border p-2" value={book2} onChange={e=>setBook2(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Stake total</label>
          <input className="w-full rounded-xl border p-2" inputMode="decimal" value={stake} onChange={e=>setStake(e.target.value)} />
          <label className="text-sm text-slate-600">Mercado / Evento</label>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border p-2" value={market} onChange={e=>setMarket(e.target.value)} />
            <input className="rounded-xl border p-2" value={eventName} onChange={e=>setEventName(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50">
          <div className="text-sm text-slate-500">Stake 1</div>
          <div className="text-lg font-semibold">{money(calc.s1)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-50">
          <div className="text-sm text-slate-500">Stake 2</div>
          <div className="text-lg font-semibold">{money(calc.s2)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-50">
          <div className="text-sm text-slate-500">ROI mínimo</div>
          <div className={`text-lg font-semibold ${calc.hasArb ? 'text-emerald-600' : 'text-rose-600'}`}>{pct(calc.roi)}</div>
        </div>
      </div>

      <div className="mt-2 text-sm text-slate-600">
        {calc.hasArb ? (
          <span>Lucro garantido estimado: <strong>{money(calc.minProfit)}</strong></span>
        ) : (
          <span>Sem arbitragem (1/o1 + 1/o2 = {(calc.inv).toFixed(4)}). Ajuste as odds.</span>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700">Salvar operação</button>
      </div>
    </div>
  );
}
