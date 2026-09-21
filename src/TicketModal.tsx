import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketToEdit?: any | null;
}

export default function TicketModal({ isOpen, onClose, ticketToEdit }: TicketModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo_evento: '',
    data_ora: '',
    risorsa: '',
    edificio: '',
    postazione: '',
    descrizione: '',
    note: '',
    titolo: '',
    priorita: 'Bassa'
  });

  useEffect(() => {
    if (ticketToEdit && isOpen) {
      setFormData({
        tipo_evento: ticketToEdit.tipo_evento || '',
        data_ora: ticketToEdit.data_ora || '',
        risorsa: ticketToEdit.risorsa || '',
        edificio: ticketToEdit.edificio || '',
        postazione: ticketToEdit.postazione || '',
        descrizione: ticketToEdit.descrizione || '',
        note: ticketToEdit.note || '',
        titolo: ticketToEdit.titolo || '',
        priorita: ticketToEdit.priorita || 'Bassa'
      });
    } else if (isOpen) {
      setFormData({
        tipo_evento: '',
        data_ora: '',
        risorsa: '',
        edificio: '',
        postazione: '',
        descrizione: '',
        note: '',
        titolo: '',
        priorita: 'Bassa'
      });
    }
  }, [ticketToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (ticketToEdit) {
        const { error } = await supabase
          .from('tickets')
          .update(formData)
          .eq('id', ticketToEdit.id);
        if (error) throw error;
        toast.success('Ticket aggiornato!');
      } else {
        const { error } = await supabase
          .from('tickets')
          .insert({ ...formData, user_id: user.id });
        if (error) throw error;
        toast.success('Ticket aggiunto con successo!');
      }
      onClose();
    } catch (error: any) {
      toast.error('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{ticketToEdit ? 'Modifica Registro' : 'Nuovo Registro Giornaliero'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Titolo</label>
              <input
                name="titolo"
                value={formData.titolo}
                onChange={handleChange}
                className="h-10 border border-gray-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Priorità</label>
              <select
                name="priorita"
                value={formData.priorita}
                onChange={handleChange}
                className="h-10 border border-gray-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent bg-white"
              >
                <option value="Bassa">Bassa</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 relative">
              <label className="text-xs font-semibold text-gray-600">Tipo Evento</label>
              <div className="flex items-center gap-2">
                <input
                  name="tipo_evento"
                  value={formData.tipo_evento}
                  onChange={handleChange}
                  className="flex-1 h-10 border border-gray-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Data e Ora</label>
              <input
                type="datetime-local"
                name="data_ora"
                value={formData.data_ora}
                onChange={handleChange}
                className="h-10 border border-gray-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Risorsa</label>
              <input
                name="risorsa"
                value={formData.risorsa}
                onChange={handleChange}
                className="h-10 border border-gray-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Edificio</label>
              <input
                name="edificio"
                value={formData.edificio}
                onChange={handleChange}
                className="h-10 border border-gray-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Postazione</label>
              <input
                name="postazione"
                value={formData.postazione}
                onChange={handleChange}
                className="h-10 border border-gray-300 rounded px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Descrizione Evento *</label>
              <textarea
                required
                name="descrizione"
                value={formData.descrizione}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent resize-y"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b4781] focus:border-transparent resize-y"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 mt-6 pt-4 pb-2 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-[#3b4781] hover:bg-gray-50 rounded transition-colors"
            >
              CHIUDI
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#3b4781] hover:bg-[#2d325a] rounded shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {ticketToEdit ? 'SALVA MODIFICHE' : 'INSERISCI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
