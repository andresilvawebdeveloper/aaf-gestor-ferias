import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { employeeProvider, vacationProvider } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import VacationModal from '../components/VacationModal';
import AddEmployeeModal from '../components/AddEmployeeModal';
import LogoEmpresa from '../assets/logoAAFapp.jpg'; 

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef(); // Referência para capturar a imagem
  
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);

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

  // --- Função para Gerar PDF ---
  const exportToPDF = async () => {
    const element = dashboardRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' para landscape (horizontal)
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Mapa_Ferias_AAF_${new Date().getFullYear()}.pdf`);
  };

  const handleEventClick = async (clickInfo) => {
    const vacationId = parseInt(clickInfo.event.id);
    if (window.confirm(`Deseja cancelar as férias de: ${clickInfo.event.title}?`)) {
      await vacationProvider.delete(vacationId);
      fetchData();
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (window.confirm(`Apagar ${name}?`)) {
      await employeeProvider.delete(id);
      fetchData();
    }
  };

  const calendarEvents = vacations.map(v => ({
    id: v.id,
    title: v.employee_name,
    start: v.start_date,
    end: v.end_date,
    backgroundColor: v.employee_color,
    borderColor: v.employee_color,
    allDay: true
  }));

  if (loading) return <div className="p-10 text-center font-bold">A carregar...</div>;

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden" ref={dashboardRef}>
      {/* Sidebar Lateral */}
      <aside className="w-80 bg-white shadow-2xl flex flex-col z-10">
        <div className="p-8 border-b flex justify-center">
          <img src={LogoEmpresa} alt="Logo AAF" className="h-16 w-auto object-contain" />
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Equipa</h3>
            <button 
              onClick={() => setIsAddEmpModalOpen(true)}
              className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700"
            >
              + NOVO
            </button>
          </div>

          <div className="space-y-4">
            {employees.map(emp => (
              <div key={emp.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 group relative">
                <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="absolute top-2 right-2 text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 font-bold transition-opacity">APAGAR</button>
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emp.color }}></span>
                  <p className="font-bold text-gray-800 text-sm">{emp.name}</p>
                </div>
                <p className="text-[9px] text-blue-600 font-black uppercase ml-5">{emp.role}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-full">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mapa de Férias</h1>
              <p className="text-gray-400 font-medium text-sm italic">Gestão operacional AAF</p>
            </div>
            
            <div className="flex gap-4">
              {/* NOVO BOTÃO PDF */}
              <button 
                onClick={exportToPDF}
                className="bg-white border-2 border-gray-900 text-gray-900 px-6 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95"
              >
                Exportar PDF
              </button>
              
              <button 
                onClick={() => setIsVacationModalOpen(true)}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-600 shadow-xl transition-all active:scale-95"
              >
                Marcar Férias
              </button>
            </div>
          </header>

          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pt"
            events={calendarEvents}
            height="65vh"
            eventClick={handleEventClick}
            eventClassNames="font-bold text-[11px] rounded-lg shadow-sm border-none px-2 cursor-pointer"
          />
        </div>
      </main>

      <VacationModal 
        isOpen={isVacationModalOpen} 
        onClose={() => setIsVacationModalOpen(false)} 
        employees={employees}
        vacations={vacations}
        onSave={fetchData}
      />

      <AddEmployeeModal 
        isOpen={isAddEmpModalOpen} 
        onClose={() => setIsAddEmpModalOpen(false)} 
        onSave={fetchData}
      />
    </div>
  );
};

export default Dashboard;