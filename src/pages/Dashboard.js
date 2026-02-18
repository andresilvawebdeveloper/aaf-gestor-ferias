import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { employeeProvider, vacationProvider } from '../services/api';
import { useVacationCalc } from '../hooks/useVacationCalc';

// Importação do novo Modal e do seu Logo
import VacationModal from '../components/VacationModal';
import LogoEmpresa from '../assets/logoAAFapp.jpg'; 

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar a visibilidade do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para carregar ou atualizar os dados (Refresh)
  const fetchData = async () => {
    try {
      const [empRes, vacRes] = await Promise.all([
        employeeProvider.getAll(),
        vacationProvider.getAll()
      ]);
      setEmployees(empRes.data);
      setVacations(vacRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Formatação de eventos para o calendário
  const calendarEvents = vacations.map(v => ({
    id: v.id,
    title: v.employee_name,
    start: v.start_date,
    end: v.end_date,
    backgroundColor: v.employee_color,
    borderColor: v.employee_color,
    allDay: true
  }));

  if (loading) return <div className="flex h-screen items-center justify-center font-semibold text-gray-500">A carregar sistema...</div>;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar lateral */}
      <aside className="w-72 bg-white shadow-xl flex flex-col">
        <div className="p-8 border-b flex justify-center bg-white">
          <img src={LogoEmpresa} alt="Logo AAF" className="h-14 w-auto object-contain" />
        </div>
        
        <div className="p-6 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Equipa & Saldos</h3>
          <div className="space-y-4">
            {employees.map(emp => (
              <div key={emp.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: emp.color }}></span>
                  <p className="font-semibold text-gray-800">{emp.name}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ width: `${(emp.used / emp.totalDays) * 100}%`, backgroundColor: emp.color }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-right font-bold">
                  {emp.totalDays - emp.used} DIAS DISPONÍVEIS
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 min-h-full">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mapa de Férias</h1>
              <p className="text-gray-500 text-sm">Controlo de ausências e disponibilidade da equipa.</p>
            </div>
            {/* Botão que ativa o Modal */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-xl">+</span> Marcar Férias
            </button>
          </header>

          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="pt"
              events={calendarEvents}
              height="65vh"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridYear'
              }}
            />
          </div>
        </div>
      </main>

      {/* Inclusão do Componente Modal */}
      <VacationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        employees={employees}
        onSave={fetchData} // Atualiza o calendário após salvar com sucesso
      />
    </div>
  );
};

export default Dashboard;