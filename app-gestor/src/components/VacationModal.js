import React, { useState, useEffect } from 'react';
import { useVacationCalc } from '../hooks/useVacationCalc';
import { vacationProvider } from '../services/api';

const VacationModal = ({ isOpen, onClose, employees, vacations, onSave }) => {
  const { calculateWorkDays } = useVacationCalc();
  const [formData, setFormData] = useState({ employeeId: '', startDate: '', endDate: '' });
  const [error, setError] = useState('');
  const [calcDays, setCalcDays] = useState(0);

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.employeeId) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        setError('A data de início não pode ser depois da data de fim.');
        return;
      }

      const days = calculateWorkDays(start, end);
      setCalcDays(days);

      const currentEmp = employees.find(e => e.id === parseInt(formData.employeeId));
      
      const conflict = vacations.some(v => {
        const otherEmp = employees.find(e => e.id === v.employee_id);
        if (otherEmp?.role === currentEmp?.role && otherEmp?.id !== currentEmp?.id) {
          const vStart = new Date(v.start_date);
          const vEnd = new Date(v.end_date);
          return start <= vEnd && vStart <= end;
        }
        return false;
      });

      if (conflict) {
        setError(`Impossível: Já existe um ${currentEmp.role} de férias neste período.`);
      } else {
        setError('');
      }
    }
  }, [formData, employees, vacations, calculateWorkDays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error || !formData.employeeId) return;

    // CORREÇÃO PARA O CALENDÁRIO: 
    // Para o FullCalendar exibir até ao dia 21, o 'end' visual deve ser o dia seguinte.
    const visualEndDate = new Date(formData.endDate);
    visualEndDate.setDate(visualEndDate.getDate() + 1);
    const formattedVisualEnd = visualEndDate.toISOString().split('T')[0];

    await vacationProvider.create({
      employee_id: parseInt(formData.employeeId),
      employee_name: employees.find(e => e.id === parseInt(formData.employeeId)).name,
      employee_color: employees.find(e => e.id === parseInt(formData.employeeId)).color,
      start_date: formData.startDate, // Data real para cálculos
      end_date: formattedVisualEnd,   // Data ajustada para o calendário ocupar todos os dias
      display_end_date: formData.endDate, // Guardamos a data real de fim para referência
      work_days: calcDays
    });
    
    onSave();
    onClose();
    setFormData({ employeeId: '', startDate: '', endDate: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      {/* Design de Alto Contraste: Sombra profunda e bordas nítidas */}
      <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-gray-200 relative">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Marcar Férias</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-3xl font-light">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Colaborador</label>
            <select 
              required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold text-gray-800"
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
            >
              <option value="">Selecione quem vai sair...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Início</label>
              <input 
                type="date" 
                required 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-gray-800"
                value={formData.startDate} 
                onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Fim</label>
              <input 
                type="date" 
                required 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-gray-800"
                value={formData.endDate} 
                onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
              />
            </div>
          </div>

          {calcDays > 0 && !error && (
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-blue-700 text-center font-bold text-sm">
                Total: {calcDays} dias úteis a descontar.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-xs font-black rounded-2xl border border-red-100 animate-pulse">
              {error}
            </div>
          )}
          
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 text-gray-400 font-bold hover:text-gray-600 transition-all">Cancelar</button>
            <button 
              type="submit" 
              disabled={!!error || !formData.employeeId} 
              className={`flex-[2] px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                error || !formData.employeeId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              Confirmar Férias
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacationModal;