'use client';

import { FormEventHandler, useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '../../../socket';

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  status: string;
}

const vehicleStatusOptions = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'IN_ROUTE', label: 'Em rota' },
  { value: 'MAINTENANCE', label: 'Manutenção' },
  { value: 'INACTIVE', label: 'Inativo' },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModel, setEditModel] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newCapacity, setNewCapacity] = useState('500');
  const [isCreating, setIsCreating] = useState(false);

  async function loadVehicles() {
    try {
      const response = await axios.get('http://localhost:3333/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadVehicles);
    socket.on('dashboard:update', loadVehicles);

    return () => {
      socket.off('dashboard:update', loadVehicles);
    };
  }, []);

  const openEditModal = () => {
    if (!selectedVehicleId) {
      alert('Selecione um veículo antes de editar.');
      return;
    }

    const vehicleToEdit = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicleToEdit) {
      alert('Veículo não encontrado. Atualize a página e tente novamente.');
      return;
    }

    setEditModel(vehicleToEdit.model);
    setEditPlate(vehicleToEdit.plate);
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    setNewModel('');
    setNewPlate('');
    setNewCapacity('500');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateVehicle: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await axios.post('http://localhost:3333/vehicles', {
        model: newModel,
        plate: newPlate,
        capacity: Number(newCapacity),
      });

      setVehicles((prev) => [...prev, response.data]);
      setIsCreateModalOpen(false);
      alert('Veículo criado com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao cadastrar veículo:', error);
      alert('Erro ao cadastrar veículo. Verifique os dados e tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) return;

    setIsSaving(true);

    try {
      await axios.put(`http://localhost:3333/vehicles/${selectedVehicleId}`, {
        model: editModel,
        plate: editPlate,
      });

      setVehicles(vehicles.map(vehicle =>
        vehicle.id === selectedVehicleId
          ? { ...vehicle, model: editModel, plate: editPlate }
          : vehicle
      ));

      setIsEditModalOpen(false);
      alert('Veículo atualizado com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao atualizar veículo:', error);
      const msg = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      alert(msg || 'Erro ao salvar as alterações no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicleId) return;

    const vehicleToDelete = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicleToDelete) return;

    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o veículo ${vehicleToDelete.model}?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3333/vehicles/${selectedVehicleId}`);
      setVehicles(vehicles.filter(vehicle => vehicle.id !== selectedVehicleId));
      setSelectedVehicleId(null); 
      alert('Veículo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      alert('Erro ao excluir o veículo. Ele pode estar vinculado a uma entrega.');
    }
  };

  const handleUpdateStatus = async (vehicleId: string, status: string) => {
    const previousVehicles = vehicles;
    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, status } : vehicle
      )
    );

    try {
      const response = await axios.patch(`http://localhost:3333/vehicles/${vehicleId}/status`, { status });
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === vehicleId ? response.data : vehicle
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status do veículo:', error);
      setVehicles(previousVehicles);
      alert('Erro ao atualizar status do veículo.');
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedVehicleId === id) {
      setSelectedVehicleId(null);
    } else {
      setSelectedVehicleId(id);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* 1. CAIXA SUPERIOR (FERRAMENTAS) */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Frota de Veículos</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Gerencie os carros e as rotas disponíveis para você.</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <button 
            onClick={handleDelete}
            disabled={!selectedVehicleId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedVehicleId 
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer' 
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'}`}
          >
            <i className="ti ti-trash"></i>
            Excluir
          </button>

          <button 
            onClick={openEditModal}
            disabled={!selectedVehicleId}
            className={`flex-1 sm:flex-none h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
              ${selectedVehicleId 
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
            Veículo novo
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
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Modelo</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Placa</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)] dark:divide-gray-700">
              
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">Carregando frota...</td>
                </tr>
              )}

              {!loading && vehicles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">Nenhum veículo cadastrado.</td>
                </tr>
              )}

              {!loading && vehicles.map((vehicle) => (
                <tr 
                  key={vehicle.id} 
                  onClick={() => toggleSelection(vehicle.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedVehicleId === vehicle.id 
                      ? 'bg-blue-50/60 hover:bg-blue-50/80 dark:bg-blue-900/30 dark:hover:bg-blue-900/50' 
                      : 'hover:bg-[var(--color-background-secondary)]/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="radio" 
                      readOnly 
                      checked={selectedVehicleId === vehicle.id} 
                      className="w-4 h-4 text-[#185FA5] border-gray-300 focus:ring-[#185FA5] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 text-[14px] font-medium text-[var(--color-text-primary)]">{vehicle.model}</td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] uppercase">{vehicle.plate}</td>
                  <td className="px-6 py-4">
                    <select
                      value={vehicle.status || 'AVAILABLE'}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => handleUpdateStatus(vehicle.id, event.target.value)}
                      className="h-[34px] min-w-[130px] rounded-md border border-[var(--color-border-secondary)] bg-white px-2 text-xs font-medium text-[var(--color-text-primary)] outline-none transition-colors dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
                    >
                      {vehicleStatusOptions.map((option) => (
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[var(--color-border-secondary)] dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Novo Veículo</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Modelo</label>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Placa</label>
                  <input
                    type="text"
                    required
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Capacidade (kg)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
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
                  {isCreating ? 'Criando...' : 'Criar Veículo'}
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
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Editar Veículo</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="ti ti-x text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Modelo do Veículo</label>
                  <input
                    type="text"
                    required
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Placa</label>
                  <input
                    type="text"
                    required
                    value={editPlate}
                    onChange={(e) => setEditPlate(e.target.value)}
                    className="w-full h-[40px] px-3 border border-[var(--color-border-secondary)] rounded-md text-[14px] bg-white dark:bg-gray-700 text-[var(--color-text-primary)] outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] uppercase"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
