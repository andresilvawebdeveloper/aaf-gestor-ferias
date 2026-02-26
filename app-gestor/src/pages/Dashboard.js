import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { employeeProvider, vacationProvider, absenceProvider } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import VacationModal from '../components/VacationModal';
import AddEmployeeModal from '../components/AddEmployeeModal';
import LogoEmpresa from '../assets/logoAAF.jpg'; 

// 1. Definição Global dos Feriados Portugal 2026
const FERIADOS_2026 = [
  '2026-01-01', '2026-04-03', '2026-04-05', '2026-04-25',
  '2026-05-01', '2026-06-04', '2026-06-10', '2026-08-15',
  '2026-10-05', '2026-11-01', '2026-12-01', '2026-12-08', '2026-12-25'
];

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef();
  
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);

  // Carregar dados da Base de Dados
  const fetchData = async () => {
    try {
      const [empRes, vacRes, absRes] = await Promise.all([
        employeeProvider.getAll(),
        vacationProvider.getAll(),
        absenceProvider.getAll()
      ]);
      setEmployees(empRes.data || []);
      setVacations(vacRes.data || []);
      setAbsences(absRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Função para registar falta com bloqueio de feriados
  const handleAddAbsence = async (emp) => {
    const dataFalta = prompt(`Data da falta para ${emp.name} (AAAA-MM-DD):`, new Date().toISOString().split('T')[0]);
    if (!dataFalta) return;

    if (FERIADOS_2026.includes(dataFalta)) {
      alert(`Impossível registar falta: O dia ${dataFalta} é feriado nacional!`);
      return;
    }

    const motivo = prompt("Motivo da falta (Aviso Prévio, Doença, Sem Aviso):", "Aviso Prévio");
    if (!motivo) return;
    
    try {
      await absenceProvider.create({
        employee_id: emp.id,
        employee_name: emp.name,
        absence_date: dataFalta,
        reason: motivo
      });
      fetchData();
    } catch (error) {
      alert("Erro ao registar falta.");
    }
  };

  const exportToPDF = async () => {
    const element = dashboardRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`Mapa_AAF_${new Date().getFullYear()}.pdf`);
  };

  const handleEventClick = async (clickInfo) => {
    if (clickInfo.event.title === 'FERIADO') return;

    if (window.confirm(`Deseja cancelar as férias de: ${clickInfo.event.title}?`)) {
      try {
        await vacationProvider.delete(parseInt(clickInfo.event.id));
        fetchData();
      } catch (error) {
        alert("Erro ao remover férias.");
      }
    }
  };

  // Esta função agora é usada no return, eliminando o erro do Vercel
  const activeAlerts = () => {
    const today = new Date().toISOString().split('T')[0];
    return vacations
      .filter(v => v.start_date >= today)
      .map(v => ({ 
        ...v, 
        role: employees.find(e => e.id === v.employee_id)?.role || 'Colaborador' 
      }))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 5);
  };

  const calendarEvents = [
    ...vacations.map(v => ({
      id: v.id.toString(),
      title: v.employee_name,
      start: v.start_date,
      end: v.end_date,
      backgroundColor: v.employee_color,
      borderColor: v.employee_color,
      allDay: true
    })),
    ...FERIADOS_2026.map(data => ({
      title: 'FERIADO',
      start: data,
      allDay: true,
      display: 'background',
      backgroundColor: '#ffcccc' 
    }))
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 font-black text-blue-600 uppercase tracking-widest text-sm">
      A ligar à Nuvem AAF...
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden" ref={dashboardRef}>
      <aside className="w-85 bg-white shadow-2xl flex flex-col z-10 border-r border-gray-200">
        <div className="p-8 border-b flex justify-center bg-white">
          <img src={LogoEmpresa} alt="Logo AAF" className="h-16 w-auto object-contain" />
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Colaborador</h3>
            <button onClick={() => setIsAddEmpModalOpen(true)} className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-md">+ NOVO</button>
          </div>

          <div className="space-y-4">
            {employees.map(emp => {
              const total = emp.totaldays || 22;
              const usado = emp.used || 0;
              const restante = total - usado;
              const numFaltas = absences.filter(a => a.employee_id === emp.id).length;

              return (
                <div key={emp.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white transition-all group relative">
                  <button onClick={async () => { if(window.confirm(`Apagar ${emp.name}?`)) { await employeeProvider.delete(emp.id); fetchData(); } }} className="absolute top-2 right-2 text-[8px] bg-red-50 text-red-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 font-bold transition-all">REMOVER</button>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emp.color }}></span>
                    <p className="font-bold text-gray-800 text-sm">{emp.name}</p>
                  </div>
                  <p className="text-[9px] text-blue-600 font-black uppercase ml-5 mb-3 tracking-widest">{emp.role}</p>
                  <div className="w-[calc(100%-20px)] bg-gray-200 rounded-full h-1.5 ml-5 overflow-hidden">
                    <div className="h-1.5" style={{ width: `${Math.min((usado/total)*100, 100)}%`, backgroundColor: emp.color }}></div>
                  </div>
                  <div className="flex justify-between items-end ml-5 mt-3">
                    <div className="flex flex-col"><span className="text-sm font-black text-gray-900">{restante}</span><span className="text-[7px] text-gray-400 font-bold uppercase">Restantes</span></div>
                    <span className="text-[9px] text-gray-500 font-bold italic">Total: {total}</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center ml-5">
                    <span className={`text-[10px] font-black uppercase ${numFaltas > 3 ? 'text-red-600' : 'text-orange-600'}`}>{numFaltas} Faltas</span>
                    <button onClick={() => handleAddAbsence(emp)} className="text-[8px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-black hover:bg-orange-600 hover:text-white">+ REGISTAR</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECÇÃO DE ALERTAS - ISTO RESOLVE O ERRO DO VERCEL */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Próximas Saídas
            </h3>
            <div className="space-y-2">
              {activeAlerts().length > 0 ? activeAlerts().map((alert, idx) => (
                <div key={idx} className="flex justify-between items-center bg-red-50 p-3 rounded-xl border border-red-100 text-[10px]">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-700">{new Date(alert.start_date).toLocaleDateString('pt-PT')}</span>
                    <span className="font-black text-gray-900">{alert.employee_name}</span>
                  </div>
                  <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">{alert.role}</span>
                </div>
              )) : <p className="text-[10px] text-gray-400 italic">Sem saídas programadas.</p>}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 min-h-full">
          <header className="mb-10 flex justify-between items-center text-gray-900">
            <div><h1 className="text-4xl font-black tracking-tighter">Mapa de Férias</h1><p className="text-gray-400 text-xs mt-1">Gestão de Assiduidade • AAF v2.2</p></div>
            <div className="flex gap-4">
              <button onClick={exportToPDF} className="bg-white border-2 border-gray-900 px-6 py-4 rounded-2xl font-bold hover:bg-gray-100">Exportar PDF</button>
              <button onClick={() => setIsVacationModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100">Marcar Férias</button>
            </div>
          </header>
          <div className="calendar-container border border-gray-100 rounded-3xl p-4 shadow-inner bg-gray-50/30">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="pt"
              events={calendarEvents}
              height="65vh"
              eventClick={handleEventClick}
              dayMaxEvents={true}
              eventClassNames="font-bold text-[11px] rounded-lg border-none px-2 py-1"
            />
          </div>
        </div>
      </main>

      <VacationModal isOpen={isVacationModalOpen} onClose={() => setIsVacationModalOpen(false)} employees={employees} vacations={vacations} onSave={fetchData} />
      <AddEmployeeModal isOpen={isAddEmpModalOpen} onClose={() => setIsAddEmpModalOpen(false)} onSave={fetchData} />
    </div>
  );
};

export default Dashboard;