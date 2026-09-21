import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, signUpWithEmail } from './supabase';
import { toast } from 'react-hot-toast';

export default function RoleManager({ onClose }: { onClose: () => void }) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<{ user_id: string; role: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [newEmail, setNewEmail] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('viewer');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchRoles();
  }, [isAdmin]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw error;
      setUsers(data as any[]);
    } catch (error: any) {
      toast.error('Errore caricamento ruoli: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newEmail.trim()) return;
    try {
      const { error } = await supabase.from('roles').upsert({
        user_id: newUserId.trim(),
        role: newRole,
        email: newEmail.trim(),
        updated_at: Date.now()
      });
      if (error) throw error;
      fetchRoles();
      setNewUserId('');
      setNewEmail('');
      toast.success('Ruolo assegnato con successo!');
    } catch (error: any) {
      toast.error('Errore: ' + error.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword.trim()) return;
    if (createPassword.length < 6) {
      toast.error('La password deve contenere almeno 6 caratteri.');
      return;
    }
    setCreatingUser(true);
    try {
      const data = await signUpWithEmail(createEmail.trim(), createCreatePassword());
      if (!data?.user) {
        toast.error('Errore durante la creazione dell\'utente.');
        return;
      }
      const newUid = data.user.id;

      const { error: roleError } = await supabase.from('roles').upsert({
        user_id: newUid,
        role: createRole,
        email: createEmail.trim(),
        updated_at: Date.now()
      });
      if (roleError) throw roleError;

      fetchRoles();
      setCreateEmail('');
      setCreatePassword('');
      toast.success('Utente creato e ruolo assegnato con successo!');
    } catch (error: any) {
      toast.error('Errore durante la creazione: ' + error.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const createCreatePassword = () => createPassword;

  const handleRemoveRole = async (userId: string) => {
    try {
      const { error } = await supabase.from('roles').delete().eq('user_id', userId);
      if (error) throw error;
      setUsers(users.filter(u => u.user_id !== userId));
      toast.success('Ruolo rimosso con successo!');
    } catch (error: any) {
      toast.error('Errore: ' + error.message);
    }
  };

  const handleEditClick = (userToEdit: { user_id: string; email: string; role: string }) => {
    setNewUserId(userToEdit.user_id);
    setNewEmail(userToEdit.email);
    setNewRole(userToEdit.role);
    toast('Puoi ora modificare il ruolo nel modulo in alto.', { icon: '✍️' });
  };

  if (!isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Gestione Utenti (Admin)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-xl">&times;</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Crea Nuovo Utente</h3>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Email"
                required
                value={createEmail}
                onChange={e => setCreateEmail(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              />
              <input
                type="password"
                placeholder="Password (min. 6 caratt.)"
                required
                minLength={6}
                value={createPassword}
                onChange={e => setCreatePassword(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              />
              <select
                value={createRole}
                onChange={e => setCreateRole(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm bg-white"
              >
                <option value="viewer">Viewer (Solo Lettura)</option>
                <option value="writer">Writer (Lettura + Scrittura)</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={creatingUser}
                className="bg-[#4caf50] text-white px-4 py-1.5 rounded text-sm hover:bg-[#388e3c] disabled:opacity-50 mt-1"
              >
                {creatingUser ? 'Creazione in corso...' : 'Crea e Assegna Ruolo'}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Assegna Ruolo a Utente Esistente</h3>
            <form onSubmit={handleSetRole} className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="User UID"
                required
                value={newUserId}
                onChange={e => setNewUserId(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              />
              <input
                type="email"
                placeholder="Email Utente"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm"
              />
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="border rounded px-3 py-1.5 text-sm bg-white"
              >
                <option value="viewer">Viewer (Solo Lettura)</option>
                <option value="writer">Writer (Lettura + Scrittura)</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="bg-[#3b4781] text-white px-4 py-1.5 rounded text-sm hover:bg-[#2d325a] mt-1">
                Assegna
              </button>
            </form>
          </div>
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">UID</th>
                <th className="px-4 py-2 border-b">Ruolo</th>
                <th className="px-4 py-2 border-b w-20">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Caricamento...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nessun ruolo assegnato.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.user_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 text-xs text-gray-400 font-mono">{u.user_id}</td>
                    <td className="px-4 py-2 font-medium uppercase text-xs">{u.role}</td>
                    <td className="px-4 py-2 flex gap-3">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="text-[#3b4781] hover:text-[#2d325a] text-xs font-semibold"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleRemoveRole(u.user_id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        Rimuovi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
