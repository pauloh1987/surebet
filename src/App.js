import React from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import ArbEntry from './components/ArbEntry';
import SurebetCalculator from './components/SurebetCalculator';
import OperationReport from './components/OperationReport';
import { useLocalStorage } from './hooks/useLocalStorage';

const SCHEMA_VERSION = 1;

export default function App() {
  // dados do usuário/banca
  const [userData, setUserData] = useLocalStorage('surebetUserData', {
    schemaVersion: SCHEMA_VERSION,
    name: 'Usuário',
    currency: 'BRL',
    initialBankroll: '' // definido pelo usuário na tela
  });

  // operações (apostas)
  const [operations, setOperations] = useLocalStorage('surebetOperations', []);

  // salvar operação (usado por ArbEntry e Calculadora)
  const onSaveOperation = (op) => setOperations(prev => [op, ...prev]);

  // atualizar/excluir operação (usado no relatório)
  const onUpdateOperation = (id, patch) => {
    setOperations(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  };
  const onDeleteOperation = (id) => {
    setOperations(prev => prev.filter(o => o.id !== id));
  };

  // exportar/importar dados (pode migrar para Firebase depois)
  const exportAll = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      userData,
      operations
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'surebet-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.userData) setUserData(data.userData);
        if (data.operations) setOperations(data.operations);
      } catch (e) {
        console.error(e);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      <header className="bg-white border-b">
        <div className="container flex items-center justify-between">
          <h1 className="py-4 text-xl font-semibold">Surebet Tracker</h1>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-slate-500">Banca atual:</span>
              <input
                className="rounded-lg border p-1 w-28"
                inputMode="decimal"
                value={userData.initialBankroll}
                onChange={(e) => setUserData({ ...userData, initialBankroll: e.target.value })}
              />
            </div>
            <button onClick={exportAll} className="px-3 py-2 rounded-lg bg-slate-100">
              Exportar
            </button>
            <label className="px-3 py-2 rounded-lg bg-slate-100 cursor-pointer">
              Importar
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && importAll(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 1) Dashboard com KPIs da banca */}
        <Dashboard
          userData={userData}
          setUserData={setUserData}
          operations={operations}
        />

        {/* 2) Entrada de arbitragem com N lados */}
        <ArbEntry onSave={onSaveOperation} />

        {/* 3) Calculadora de surebet tradicional */}
        <SurebetCalculator onSave={onSaveOperation} />

        {/* 4) Relatórios e gestão das operações */}
        <OperationReport
          userData={userData}
          operations={operations}
          onUpdateOperation={onUpdateOperation}
          onDeleteOperation={onDeleteOperation}
        />
      </main>
    </div>
  );
}
