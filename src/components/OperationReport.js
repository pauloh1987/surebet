import React, { useMemo, useState } from 'react';
import { money, formatDateTime, toNumber } from '../utils/format';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#eab308"]; 

export default function OperationReport({ userData, operations, onUpdateOperation, onDeleteOperation }) {
  const [filter, setFilter] = useState('all'); // all | open | completed

  const filtered = useMemo(() => {
    if (!operations) return [];
    if (filter === 'all') return operations;
    return operations.filter(o => o.status === filter);
  }, [operations, filter]);

  const bankrollEvolution = useMemo(() => {
    const init = userData?.initialBankroll ? toNumber(userData.initialBankroll) : 0;
    let current = init;
    const points = [{ label: 'Inicial', value: current }];
    const completed = operations.filter(o => o.status === 'completed').sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    completed.forEach(op => {
      const profit = toNumber(op.realizedProfit ?? op.expectedProfit ?? 0);
      current += profit;
      points.push({ label: new Date(op.createdAt).toLocaleDateString('pt-BR'), value: current });
    });
    return points;
  }, [operations, userData]);

  const byBook = useMemo(() => {
    const map = new Map();
    operations.forEach(op => {
      op.bets?.forEach(b => {
        const prev = map.get(b.book) || 0;
        map.set(b.book, prev + toNumber(b.stake));
      });
    });
    return Array.from(map.entries()).map(([name, stake]) => ({ name, stake }));
  }, [operations]);

  const totalProfit = useMemo(() => operations.reduce((acc, o) => acc + toNumber(o.realizedProfit ?? 0), 0), [operations]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500">Banca Inicial</div>
          <div className="text-2xl font-semibold">{money(userData?.initialBankroll || 0)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Lucro Realizado</div>
          <div className="text-2xl font-semibold text-emerald-600">{money(totalProfit)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Operações</div>
          <div className="text-2xl font-semibold">{operations.length}</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Evolução da banca</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bankrollEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="value" name="Banca" type="monotone" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-lg font-semibold mb-3">Stake por casa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBook}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stake" name="Stake">
                  {byBook.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-lg font-semibold mb-3">Status das operações</h3>
          <div className="flex gap-2 mb-3">
            <button onClick={()=>setFilter('all')} className={`px-3 py-1 rounded-lg ${filter==='all'?'bg-sky-600 text-white':'bg-slate-100'}`}>Todas</button>
            <button onClick={()=>setFilter('open')} className={`px-3 py-1 rounded-lg ${filter==='open'?'bg-sky-600 text-white':'bg-slate-100'}`}>Abertas</button>
            <button onClick={()=>setFilter('completed')} className={`px-3 py-1 rounded-lg ${filter==='completed'?'bg-sky-600 text-white':'bg-slate-100'}`}>Concluídas</button>
          </div>
          <ul className="divide-y">
            {filtered.map(op => (
              <li key={op.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{op.eventName || 'Operação'}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(op.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Stake: <strong>{money(op.totalStake)}</strong></div>
                    <div className={`text-sm ${toNumber(op.realizedProfit)>=0?'text-emerald-600':'text-rose-600'}`}>Lucro: {money(op.realizedProfit ?? 0)}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <select value={op.status} onChange={(e)=>onUpdateOperation(op.id,{ status: e.target.value })} className="rounded-lg border p-1">
                    <option value="open">Aberta</option>
                    <option value="completed">Concluída</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                  <input className="rounded-lg border p-1" inputMode="decimal" placeholder="Lucro realizado" value={op.realizedProfit ?? ''} onChange={(e)=>onUpdateOperation(op.id,{ realizedProfit: e.target.value })} />
                  <button onClick={()=>onDeleteOperation(op.id)} className="px-3 py-1 rounded-lg bg-rose-600 text-white">Excluir</button>
                </div>
                {op.bets?.length ? (
                  <div className="mt-2 grid md:grid-cols-2 gap-2">
                    {op.bets.map(b => (
                      <div key={b.id} className="rounded-lg bg-slate-50 p-3">
                        <div className="text-sm"><strong>{b.book}</strong></div>
                        <div className="text-xs text-slate-600">Odd: {b.odd} · Stake: {money(b.stake)} · Retorno: {money(b.potentialReturn)}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
