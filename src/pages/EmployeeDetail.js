import React from 'react';
import { useVacationCalc } from '../hooks/useVacationCalc';
import LogoEmpresa from '../assets/logoAAFapp.jpg'; // Mantendo a consistência da marca

const EmployeeDetail = ({ employee, vacations }) => {
  const { calculateWorkDays, isPastVacation } = useVacationCalc();

  // Cálculos de saldo em tempo real
  const usedDays = vacations
    .filter(v => isPastVacation(v.endDate))
    .reduce((acc, v) => acc + v.workDays, 0);

  const pendingDays = vacations
    .filter(v => !isPastVacation(v.endDate))
    .reduce((acc, v) => acc + v.workDays, 0);

  const availableDays = employee.totalAnnualDays - (usedDays + pendingDays);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header com Logo e Info Básica */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div 
            className="w-4 h-12 rounded-full" 
            style={{ backgroundColor: employee.colorCode }}
          ></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{employee.name}</h1>
            <p className="text-gray-500">Gestão de Perfil e Férias</p>
          </div>
        </div>
        <img src={LogoEmpresa} alt="Logo" className="h-10 w-auto" />
      </div>

      {/* Grid de Estatísticas (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Anual" value={employee.totalAnnualDays} color="text-gray-600" />
        <StatCard title="Dias Usados" value={usedDays} color="text-red-600" />
        <StatCard title="Marcadas (Futuras)" value={pendingDays} color="text-blue-600" />
        <StatCard title="Disponível" value={availableDays} color="text-green-600" highlight />
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Histórico de Marcações</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4">Período</th>
              <th className="p-4">Dias Úteis</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vacations.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium">
                  {v.startDate} até {v.endDate}
                </td>
                <td className="p-4">{v.workDays} dias</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isPastVacation(v.endDate) ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {isPastVacation(v.endDate) ? 'Concluído' : 'Agendado'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-red-500 hover:underline text-sm">Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sub-componente para os Cards de Estatística
const StatCard = ({ title, value, color, highlight }) => (
  <div className={`p-6 rounded-xl bg-white shadow-sm border ${highlight ? 'border-green-500' : 'border-gray-100'}`}>
    <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
    <p className={`text-3xl font-bold ${color}`}>{value} dias</p>
  </div>
);

export default EmployeeDetail;