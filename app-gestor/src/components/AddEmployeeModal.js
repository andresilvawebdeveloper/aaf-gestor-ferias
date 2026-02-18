// src/components/AddEmployeeModal.js
import React, { useState } from 'react';
import { employeeProvider } from '../services/api';

const AddEmployeeModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    totalDays: 22,
    used: 0,
    color: '#3b82f6'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) return alert("Selecione a categoria.");

    setIsSubmitting(true);
    try {
      await employeeProvider.create(formData);
      onSave();
      setFormData({ name: '', role: '', totalDays: 22, used: 0, color: '#3b82f6' });
      onClose();
    } catch (error) {
      alert("Erro ao gravar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      {/* Caixa do Modal com Borda e Sombra Pesada para contraste */}
      <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-gray-200 relative">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">Novo Colaborador</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-3xl font-light">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Nome Completo</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold text-gray-800"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Categoria / Cargo</label>
            <select 
              required
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold text-gray-800"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="">Selecione a função...</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Condutor">Condutor</option>
              <option value="Armazém">Armazém</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Direito (Dias)</label>
              <input 
                type="number" 
                required
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-gray-800"
                value={formData.totalDays}
                onChange={(e) => setFormData({...formData, totalDays: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Cor Identidade</label>
              <input 
                type="color" 
                className="w-full h-[60px] p-2 bg-gray-50 border-2 border-gray-100 rounded-2xl cursor-pointer"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 text-gray-400 font-bold hover:text-gray-600">Cancelar</button>
            <button 
              type="submit"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Adicionar à Equipa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;