'use client';

import { FormEventHandler, useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '../../../socket';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
}

const driverStatusOptions = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'BUSY', label: 'Ocupado' },
  { value: 'OFFLINE', label: 'Offline' },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // ==========================================
  // ESTADOS DO MODAL DE EDIÇÃO
  // ==========================================
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  async function loadDrivers() {
    try {
      const response = await axios.get('http://localhost:3333/drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error('Erro ao buscar motociclistas:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadDrivers);
    socket.on('dashboard:update', loadDrivers);

    return () => {
      socket.off('dashboard:update', loadDrivers);
    };
  }, []);

  // ==========================================
  // FUNÇÕES DO MODAL
  // ==========================================
  const openEditModal = () => {
    if (!selectedDriverId) return;
    
    const driverToEdit = drivers.find(d => d.id === selectedDriverId);
    if (driverToEdit) {
      setEditName(driverToEdit.name);
      setEditEmail(driverToEdit.email);
      setIsEditModalOpen(true);
    }
  };

  const openCreateModal = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditName('');
    setEditEmail('');
  };

  const handleCreateDriver: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await axios.post('http://localhost:3333/drivers', {
        name: newName,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        status: 'AVAILABLE',
      });

      setDrivers((prev) => [...prev, response.data]);
      setIsCreateModalOpen(false);
      alert('Motociclista criado com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao criar motociclista:', error);
      alert('Erro ao cadastrar motociclista. Verifique os dados e tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;

    setIsSaving(true);

    try {
      // Bate na rota PUT ou PATCH do back-end
      await axios.put(`http://localhost:3333/drivers/${selectedDriverId}`, {
        name: editName,
        email: editEmail,
      });

      setDrivers(drivers.map(driver => 
        driver.id === selectedDriverId 
          ? { ...driver, name: editName, email: editEmail } 
          : driver
      ));
      
      closeEditModal();
      alert('Motociclista atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar motociclista:', error);
      alert('Erro ao salvar as alterações no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // FUNÇÃO DE DELETAR
  // ==========================================
  const handleDelete = async () => {
    if (!selectedDriverId) return;

    const driverToDelete = drivers.find(d => d.id === selectedDriverId);
    if (!driverToDelete) return;

    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o motociclista ${driverToDelete.name}?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3333/drivers/${selectedDriverId}`);
      setDrivers(drivers.filter(driver => driver.id !== selectedDriverId));
      setSelectedDriverId(null); 
      alert('Motociclista removido com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar motociclista:', error);
      alert('Erro ao excluir. O Back-end pode não estar configurado ou o motorista está em uma entrega.');
    }
  };

  const handleUpdateStatus = async (driverId: string, status: string) => {
    const previousDrivers = drivers;
    setDrivers((currentDrivers) =>
      currentDrivers.map((driver) =>
        driver.id === driverId ? { ...driver, status } : driver
      )
    );

    try {
      const response = await axios.patch(`http://localhost:3333/drivers/${driverId}/status`, { status });
      setDrivers((currentDrivers) =>
        currentDrivers.map((driver) =>
          driver.id === driverId ? response.data : driver
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status do motociclista:', error);
      setDrivers(previousDrivers);
      alert('Erro ao atualizar status do motociclista.');
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedDriverId === id) {
      setSelectedDriverId(null);
    } else {
      setSelectedDriverId(id);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 relative">
      
      {/* 1. CAIXA SUPERIOR (FERRAMENTAS) */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Equipe de Motociclismo</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Gerencie os fatores que impulsionam sua operação.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <button 
            onClick={handleDelete}
            disabled={!selectedDriverId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedDriverId 
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-trash"></i>
            Excluir
          </button>

          <button 
            onClick={openEditModal}
            disabled={!selectedDriverId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedDriverId 
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600'}`}
          >
            <i className="ti ti-edit"></i>
            Editar
          </button>

          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none h-[40px] px-4 bg-[#185FA5] hover:bg-[#0C447C] text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <i className="ti ti-plus"></i>
            Novo motorista
          </button>
        </div>
      </div>

      {/* 2. CAIXA INFERIOR (TABELA) */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-secondary)] dark:border-gray-700">
                <th className="w-12 px-6 py-4"></th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Nome</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">E-mail / Contato</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)] dark:divide-gray-700">
              {loading && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">Carregando equipe...</td></tr>}
              {!loading && drivers.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">Nenhum motociclista cadastrado.</td></tr>}
              {!loading && drivers.map((driver) => (
                <tr 
                  key={driver.id} 
                  onClick={() => toggleSelection(driver.id)}
                  className={`cursor-pointer transition-colors ${selectedDriverId === driver.id ? 'bg-blue-50/60 hover:bg-blue-50/80 dark:bg-blue-900/30 dark:hover:bg-blue-900/50' : 'hover:bg-[var(--color-background-secondary)]/50 dark:hover:bg-gray-700/50'}`}
                >
                  <td className="px-6 py-4">
                    <input type="radio" readOnly checked={selectedDriverId === driver.id} className="w-4 h-4 text-[#185FA5] border-gray-300 focus:ring-[#185FA5] cursor-pointer"/>
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-[var(--color-text-primary)]">{driver.name}</td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)]">{driver.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={driver.status || 'AVAILABLE'}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => handleUpdateStatus(driver.id, event.target.value)}
                      className="h-[34px] min-w-[130px] rounded-md border border-[var(--color-border-secondary)] bg-white px-2 text-xs font-medium text-[var(--color-text-primary)] outline-none transition-colors dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {driverStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL DE EDIÇÃO */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[var(--color-border-secondary)] dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Novo Motociclista</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">E-mail</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="h-[40px] px-4 rounded-md border border-[var(--color-border-secondary)] text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-[40px] px-6 bg-[#185FA5] hover:bg-[#0C447C] text-white text-[14px] font-medium rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                >
                  {isCreating ? 'Criando...' : 'Criar Motociclista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[var(--color-border-secondary)] dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Editar Motociclista</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">E-mail</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="h-[40px] px-4 rounded-md border border-[var(--color-border-secondary)] text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-[40px] px-6 bg-[#185FA5] hover:bg-[#0C447C] text-white text-[14px] font-medium rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
