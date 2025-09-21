import React, { useMemo, useState } from "react";
import { money, toNumber } from "../utils/format";

/**
 * Dashboard inicial da conta.
 * - Mostra: Banca inicial, Banca atual, Evolução %, Lucro total.
 * - Input para definir/alterar a banca inicial (ou banca atual).
 * - Resumo diário de lucros (tabela).
 *
 * Observação:
 *  - currentBankroll = initialBankroll + soma(lucros realizados)
 *  - evolution% = (current / initial - 1)
 */
export default function Dashboard({ userData, setUserData, operations }) {
  const [editing, setEditing] = useState(false);
  const [tempBankroll, setTempBankroll] = useState(
    String(userData?.initialBankroll ?? "")
  );

  const profits = useMemo(
    () => operations.reduce((acc, o) => acc + toNumber(o.realizedProfit ?? 0), 0),
    [operations]
  );

  const initial = toNumber(userData?.initialBankroll ?? 0);
  const current = initial + profits;
  const evolution = initial > 0 ? current / initial - 1 : 0;

  // Lucro por dia (yyyy-mm-dd)
  const daily = useMemo(() => {
    const map = new Map(); // dateKey -> sum
    for (const op of operations) {
      if (!op.createdAt) continue;
      const d = new Date(op.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const prev = map.get(key) || 0;
      map.set(key, prev + toNumber(op.realizedProfit ?? 0));
    }
    // Ordena por data desc
    return Array.from(map.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [operations]);

  const saveBankroll = () => {
    setUserData({
      ...(userData || {}),
      initialBankroll: tempBankroll,
      currency: userData?.currency || "BRL",
      name: userData?.name || "Usuário",
      schemaVersion: userData?.schemaVersion || 1,
    });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho simples */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-semibold">Resumo da Banca</h2>
          {!editing ? (
            <button
              className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
              onClick={() => setEditing(true)}
            >
              Definir / Alterar Banca
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                className="rounded-lg border p-2 w-40"
                inputMode="decimal"
                value={tempBankroll}
                onChange={(e) => setTempBankroll(e.target.value)}
                placeholder="Ex: 1000"
              />
              <button
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={saveBankroll}
              >
                Salvar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
                onClick={() => {
                  setTempBankroll(String(userData?.initialBankroll ?? ""));
                  setEditing(false);
                }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-4 gap-4 mt-4">
          <div className="rounded-2xl bg-white shadow-sm p-5">
            <div className="text-sm text-slate-500">Banca inicial</div>
            <div className="text-2xl font-semibold">{money(initial)}</div>
          </div>
          <div className="rounded-2xl bg-white shadow-sm p-5">
            <div className="text-sm text-slate-500">Banca atual</div>
            <div className="text-2xl font-semibold">{money(current)}</div>
          </div>
          <div className="rounded-2xl bg-white shadow-sm p-5">
            <div className="text-sm text-slate-500">Evolução</div>
            <div className={`text-2xl font-semibold ${evolution >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {(evolution * 100).toFixed(2)}%
            </div>
          </div>
          <div className="rounded-2xl bg-white shadow-sm p-5">
            <div className="text-sm text-slate-500">Lucro realizado</div>
            <div className={`text-2xl font-semibold ${profits >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {money(profits)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de lucros por dia */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-3">Lucro por dia</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Lucro do dia</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {daily.length === 0 && (
                <tr>
                  <td className="py-3 pr-4 text-slate-500" colSpan={2}>
                    Sem dados ainda. Salve operações concluídas com lucro/prejuízo para aparecer aqui.
                  </td>
                </tr>
              )}
              {daily.map((row) => (
                <tr key={row.date}>
                  <td className="py-2 pr-4">
                    {row.date.split("-").reverse().join("/")}
                  </td>
                  <td className={`py-2 pr-4 ${row.value >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {money(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
