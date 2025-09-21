import React, { useMemo, useState } from "react";
import { toNumber, money, isoNow } from "../utils/format";

/**
 * Entrada Rápida (mobile-first)
 * - Dois lados (arbitragem ou dutching simples)
 * - Preenchimento rápido: data/hora (auto), confronto, mercado, casas, odds e stakes
 * - Botões:
 *    - Salvar aberta
 *    - Concluir agora (escolhendo qual lado venceu)
 */
export default function QuickEntry({ onSave }) {
  // campos básicos
  const [eventName, setEventName] = useState("");
  const [market, setMarket] = useState("1x2");

  // lado 1
  const [book1, setBook1] = useState("");
  const [odd1, setOdd1] = useState("");
  const [stake1, setStake1] = useState("");

  // lado 2
  const [book2, setBook2] = useState("");
  const [odd2, setOdd2] = useState("");
  const [stake2, setStake2] = useState("");

  // quem venceu (para concluir agora)
  const [winner, setWinner] = useState("1"); // "1" | "2"

  const calc = useMemo(() => {
    const o1 = toNumber(odd1);
    const o2 = toNumber(odd2);
    const s1 = toNumber(stake1);
    const s2 = toNumber(stake2);
    const total = s1 + s2;

    const ret1 = s1 * o1;
    const ret2 = s2 * o2;

    const inv = (o1 && o2) ? (1 / o1 + 1 / o2) : 999;
    const hasArb = inv < 1;
    const minProfit = Math.min(ret1 - total, ret2 - total);

    return { o1, o2, s1, s2, total, ret1, ret2, hasArb, minProfit };
  }, [odd1, odd2, stake1, stake2]);

  const canSave =
    eventName.trim().length > 0 &&
    toNumber(odd1) > 1 &&
    toNumber(stake1) > 0 &&
    toNumber(odd2) > 1 &&
    toNumber(stake2) >= 0; // lado 2 pode ser zero se for simples

  const buildOperation = (status, realizedProfit = 0) => {
    const now = isoNow();
    return {
      id: crypto.randomUUID(),
      createdAt: now,
      market,
      eventName,
      bets: [
        {
          id: crypto.randomUUID(),
          book: book1 || "Casa 1",
          odd: toNumber(odd1),
          stake: toNumber(stake1),
          potentialReturn: toNumber(stake1) * toNumber(odd1),
        },
        {
          id: crypto.randomUUID(),
          book: book2 || "Casa 2",
          odd: toNumber(odd2),
          stake: toNumber(stake2),
          potentialReturn: toNumber(stake2) * toNumber(odd2),
        },
      ],
      totalStake: calc.total,
      surebet: calc.hasArb,
      expectedProfit: calc.minProfit, // útil quando salvar aberta
      realizedProfit,
      status,
    };
  };

  const handleSaveOpen = () => {
    if (!onSave || !canSave) return;
    onSave(buildOperation("open", 0));
    // reset leve (mantém confronto para agilizar várias entradas)
    setOdd1(""); setStake1(""); setOdd2(""); setStake2("");
  };

  const handleConcludeNow = () => {
    if (!onSave || !canSave) return;
    const winReturn = winner === "1" ? calc.ret1 : calc.ret2;
    const realized = winReturn - calc.total;
    onSave(buildOperation("completed", realized));
    // reset mais completo
    setEventName(""); setMarket("1x2");
    setBook1(""); setOdd1(""); setStake1("");
    setBook2(""); setOdd2(""); setStake2("");
  };

  return (
    <div className="card p-5 md:p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Entrada rápida</h2>

      {/* linha 1: confronto/mercado (mobile: empilha) */}
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-slate-600">Confronto</label>
          <input
            className="w-full rounded-xl border p-2"
            placeholder="Ex: Atlético San Luis x Tijuana"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Mercado</label>
          <input
            className="w-full rounded-xl border p-2"
            placeholder="Ex: Over/Under 2.5"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          />
        </div>
        <div className="hidden md:block" />
      </div>

      {/* lado 1 / lado 2 */}
      <div className="grid md:grid-cols-2 gap-4 mt-3">
        <div className="rounded-xl bg-slate-50 p-3 space-y-2">
          <div className="text-sm font-medium">Lado 1</div>
          <input
            className="w-full rounded-xl border p-2"
            placeholder="Casa 1 (ex: Betesporte)"
            value={book1}
            onChange={(e) => setBook1(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded-xl border p-2"
              inputMode="decimal"
              placeholder="Odd (ex: 3.10)"
              value={odd1}
              onChange={(e) => setOdd1(e.target.value)}
            />
            <input
              className="rounded-xl border p-2"
              inputMode="decimal"
              placeholder="Stake (R$)"
              value={stake1}
              onChange={(e) => setStake1(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-600">
            Retorno: <strong>{money(calc.ret1)}</strong>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 space-y-2">
          <div className="text-sm font-medium">Lado 2</div>
          <input
            className="w-full rounded-xl border p-2"
            placeholder="Casa 2 (ex: BolsaDeApostas)"
            value={book2}
            onChange={(e) => setBook2(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded-xl border p-2"
              inputMode="decimal"
              placeholder="Odd (ex: 1.59)"
              value={odd2}
              onChange={(e) => setOdd2(e.target.value)}
            />
            <input
              className="rounded-xl border p-2"
              inputMode="decimal"
              placeholder="Stake (R$)"
              value={stake2}
              onChange={(e) => setStake2(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-600">
            Retorno: <strong>{money(calc.ret2)}</strong>
          </div>
        </div>
      </div>

      {/* totais + arb feedback */}
      <div className="mt-3 grid md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white border">
          <div className="text-sm text-slate-500">Stake total</div>
          <div className="text-lg font-semibold">{money(calc.total)}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border">
          <div className="text-sm text-slate-500">Surebet?</div>
          <div className={`text-lg font-semibold ${calc.hasArb ? "text-emerald-600" : "text-rose-600"}`}>
            {calc.hasArb ? "Sim" : "Não"}
          </div>
          {calc.hasArb && (
            <div className="text-xs text-slate-500">
              Lucro mínimo estimado: <strong>{money(calc.minProfit)}</strong>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-white border">
          <div className="text-sm text-slate-500 mb-1">Se concluir agora, quem venceu?</div>
          <div className="flex gap-2">
            <label className={`px-3 py-1 rounded-lg border cursor-pointer ${winner === "1" ? "bg-sky-600 text-white" : ""}`}>
              <input
                type="radio"
                name="winner"
                className="hidden"
                checked={winner === "1"}
                onChange={() => setWinner("1")}
              />
              Lado 1
            </label>
            <label className={`px-3 py-1 rounded-lg border cursor-pointer ${winner === "2" ? "bg-sky-600 text-white" : ""}`}>
              <input
                type="radio"
                name="winner"
                className="hidden"
                checked={winner === "2"}
                onChange={() => setWinner("2")}
              />
              Lado 2
            </label>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          disabled={!canSave}
          onClick={handleSaveOpen}
          className={`px-4 py-2 rounded-xl ${canSave ? "bg-slate-200 hover:bg-slate-300" : "bg-slate-100 cursor-not-allowed"}`}
        >
          Salvar ABERTA
        </button>
        <button
          disabled={!canSave}
          onClick={handleConcludeNow}
          className={`px-4 py-2 rounded-xl ${canSave ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-emerald-200 text-white/70 cursor-not-allowed"}`}
        >
          Concluir AGORA
        </button>
      </div>
    </div>
  );
}
