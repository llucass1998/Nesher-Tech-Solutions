'use client';

import dynamic from 'next/dynamic';
import { FormEventHandler, useEffect, useState } from 'react';
import { socket } from '../../../socket';
import axios from 'axios';

const Map = dynamic(() => import('../../../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 dark:text-gray-400">Carregando Mapa...</div>
});

interface Delivery {
  id: string;
  description: string;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  price?: number | string | null;
  status: string;
  driverId?: string | null;
  vehicleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  driver?: { name: string }; 
  vehicle?: { model: string; plate: string }; 
}

interface Driver { id: string; name: string; }
interface Vehicle { id: string; model: string; plate: string; }

function isToday(dateValue?: string) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatDateTime(dateValue?: string) {
  if (!dateValue) return '-';

  return new Date(dateValue).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDeliveryPrice(delivery: Delivery) {
  const value = Number(delivery.price ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function logRequestWarning(context: string, error: unknown) {
  const message = axios.isAxiosError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Erro desconhecido';

  console.warn(`${context}: ${message}`);
}

const STORE_ADDRESS = 'Rua do Terço, 340 - Vaz Lobo, Rio de Janeiro - RJ, 21361-190';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editDescription, setEditDescription] = useState('');
  const [editPickupAddress, setEditPickupAddress] = useState('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDriverId, setEditDriverId] = useState('');
  const [editVehicleId, setEditVehicleId] = useState('');

  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newPickupAddress, setNewPickupAddress] = useState('');
  const [newDeliveryAddress, setNewDeliveryAddress] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const response = await axios.get('http://localhost:3333/deliveries');
        setDeliveries(response.data);
      } catch (error) {
        logRequestWarning('Erro ao buscar entregas', error);
      } finally {
        setLoading(false);
      }
    }
    loadDeliveries();
  }, []);

  useEffect(() => {
    const handleDeliveryStatusUpdate = (updatedDelivery: Delivery) => {
      setDeliveries((prevDeliveries) =>
        prevDeliveries.map((delivery) =>
          delivery.id === updatedDelivery.id ? { ...delivery, ...updatedDelivery } : delivery
        )
      );

      if (updatedDelivery.status === 'DELIVERED') {
        setSelectedDeliveryId((currentId) => currentId === updatedDelivery.id ? null : currentId);
      }
    };

    socket.on('deliveryStatusUpdate', handleDeliveryStatusUpdate);

    return () => {
      socket.off('deliveryStatusUpdate', handleDeliveryStatusUpdate);
    };
  }, []);

  const openEditModal = async () => {
    if (!selectedDeliveryId) return;
    
    const deliveryToEdit = deliveries.find(d => d.id === selectedDeliveryId);
    if (deliveryToEdit) {
      setEditDescription(deliveryToEdit.description);
      setEditPickupAddress(
        deliveryToEdit.pickupAddress && deliveryToEdit.pickupAddress !== 'Origem nao informada'
          ? deliveryToEdit.pickupAddress
          : STORE_ADDRESS
      );
      setEditDeliveryAddress(deliveryToEdit.deliveryAddress || '');
      setEditStatus(deliveryToEdit.status);
      setEditDriverId(deliveryToEdit.driverId || '');
      setEditVehicleId(deliveryToEdit.vehicleId || '');
      
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          axios.get('http://localhost:3333/drivers'),
          axios.get('http://localhost:3333/vehicles')
        ]);
        setDriversList(driversRes.data);
        setVehiclesList(vehiclesRes.data);
      } catch (error) {
        logRequestWarning('Erro ao carregar selects do modal', error);
      }

      setIsEditModalOpen(true);
    }
  };

  const openCreateModal = async () => {
    setNewDescription('');
    setNewPickupAddress(STORE_ADDRESS);
    setNewDeliveryAddress('');
    setNewDriverId('');
    setNewVehicleId('');

    try {
      if (driversList.length === 0 || vehiclesList.length === 0) {
        const [driversRes, vehiclesRes] = await Promise.all([
          axios.get('http://localhost:3333/drivers'),
          axios.get('http://localhost:3333/vehicles')
        ]);
        setDriversList(driversRes.data);
        setVehiclesList(vehiclesRes.data);
      }
    } catch (error) {
      logRequestWarning('Erro ao carregar selects do modal de criacao', error);
    }

    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);
  const closeEditModal = () => setIsEditModalOpen(false);

  const handleCreateDelivery: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    if (!newDriverId || !newVehicleId) {
      alert('Selecione um motorista e um veículo para criar a entrega.');
      setIsCreating(false);
      return;
    }

    if (!newDeliveryAddress.trim()) {
      alert('Informe a localizacao da entrega.');
      setIsCreating(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3333/deliveries', {
        description: newDescription || 'Nova entrega',
        pickupAddress: STORE_ADDRESS,
        deliveryAddress: newDeliveryAddress,
        driverId: newDriverId,
        vehicleId: newVehicleId,
      });

      setDeliveries((prev) => [...prev, response.data]);
      setIsCreateModalOpen(false);
      alert('Entrega criada com sucesso!');
    } catch (error: unknown) {
      logRequestWarning('Erro ao criar entrega', error);
      alert('Erro ao cadastrar entrega. Verifique se motoristas e veículos estão corretos.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryId) return;

    setIsSaving(true);

    if (!editDeliveryAddress.trim()) {
      alert('Informe a localizacao da entrega.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await axios.put(`http://localhost:3333/deliveries/${selectedDeliveryId}`, {
        description: editDescription,
        pickupAddress: STORE_ADDRESS,
        deliveryAddress: editDeliveryAddress,
        status: editStatus,
        driverId: editDriverId || null,
        vehicleId: editVehicleId || null,
      });

      const updatedDriver = driversList.find(d => d.id === editDriverId);
      const updatedVehicle = vehiclesList.find(v => v.id === editVehicleId);
      const updatedDelivery = response.data as Delivery;

      setDeliveries(deliveries.map(del => 
        del.id === selectedDeliveryId 
          ? { 
              ...del,
              ...updatedDelivery,
              description: editDescription, 
              pickupAddress: STORE_ADDRESS,
              deliveryAddress: editDeliveryAddress,
              status: editStatus,
              driverId: editDriverId,
              vehicleId: editVehicleId,
              driver: updatedDriver ? { name: updatedDriver.name } : undefined,
              vehicle: updatedVehicle ? { model: updatedVehicle.model, plate: updatedVehicle.plate } : undefined
            } 
          : del
      ));

      if (editStatus === 'DELIVERED') {
        setSelectedDeliveryId(null);
      }
      
      closeEditModal();
      alert('Entrega atualizada com sucesso!');
    } catch (error) {
      logRequestWarning('Erro ao atualizar entrega', error);
      alert('Erro ao salvar as alterações. Verifique a API.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeliveryId) return;

    const deliveryToDelete = deliveries.find(d => d.id === selectedDeliveryId);
    if (!deliveryToDelete) return;

    const confirmDelete = window.confirm(`Tem certeza que deseja excluir a entrega "${deliveryToDelete.description}"?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3333/deliveries/${selectedDeliveryId}`);
      setDeliveries(deliveries.filter(delivery => delivery.id !== selectedDeliveryId));
      setSelectedDeliveryId(null);
      alert('Entrega removida com sucesso!');
    } catch (error) {
      logRequestWarning('Erro ao deletar entrega', error);
      alert('Erro ao excluir a entrega.');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedDeliveryId(selectedDeliveryId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 rounded-full text-xs font-medium whitespace-nowrap">Pendente</span>;
      case 'IN_TRANSIT': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 rounded-full text-xs font-medium whitespace-nowrap">Em Trânsito</span>;
      case 'DELIVERED': return <span className="px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 rounded-full text-xs font-medium whitespace-nowrap">Entregue</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium whitespace-nowrap">{status}</span>;
    }
  };

  const inputClass = "w-full h-[40px] px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#185FA5] dark:focus:ring-blue-500 focus:border-transparent transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const activeDeliveries = deliveries.filter((delivery) => delivery.status !== 'DELIVERED');
  const completedTodayDeliveries = deliveries
    .filter((delivery) => delivery.status === 'DELIVERED' && isToday(delivery.updatedAt))
    .sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));
  const dailyRevenue = completedTodayDeliveries.reduce((total, delivery) => total + getDeliveryPrice(delivery), 0);
  const selectedMapDelivery = selectedDeliveryId
    ? activeDeliveries.find((delivery) => delivery.id === selectedDeliveryId)
    : activeDeliveries.find((delivery) => delivery.status === 'IN_TRANSIT') || activeDeliveries[0];

  return (
    <div className="w-full flex flex-col gap-6 relative">
      
      {/* 1. CAIXA SUPERIOR */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] dark:text-white">Gestão de Entregas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400 mt-1">Acompanhe as rotas em tempo real via WebSockets e Mapa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.35fr)] gap-6 items-start">
      {/* 2. ÁREA DO MAPA */}
      <div className="order-1 xl:order-2 rounded-lg shadow-sm w-full h-[420px] sm:h-[500px] xl:h-[calc(100vh-250px)] xl:min-h-[540px] overflow-hidden border border-[var(--color-border-secondary)] dark:border-gray-700 xl:sticky xl:top-6">
        <Map
          selectedDeliveryId={selectedMapDelivery?.id || null}
          pickupAddress={STORE_ADDRESS}
          deliveryAddress={selectedMapDelivery?.deliveryAddress || null}
          driverName={selectedMapDelivery?.driver?.name || null}
        />
      </div>

      {/* 3. CAIXA INFERIOR (TABELA) */}
      <div className="order-2 xl:order-1 bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm overflow-hidden w-full min-w-0">
        <div className="px-4 py-3 border-b border-[var(--color-border-secondary)] dark:border-gray-700">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] dark:text-white">Gerenciamento</h2>
          <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400 mt-1">Selecione uma entrega para acompanhar no mapa.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <button 
              onClick={handleDelete}
              disabled={!selectedDeliveryId}
              className={`h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
                ${selectedDeliveryId 
                  ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 cursor-pointer' 
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600'}`}
            >
              <i className="ti ti-trash"></i> Excluir
            </button>

            <button 
              onClick={openEditModal}
              disabled={!selectedDeliveryId}
              className={`h-[40px] px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border
                ${selectedDeliveryId 
                  ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer' 
                  : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600'}`}
            >
              <i className="ti ti-edit"></i> Editar
            </button>

            <button
              onClick={openCreateModal}
              className="h-[40px] px-4 bg-[#185FA5] hover:bg-[#0C447C] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <i className="ti ti-plus"></i> Nova entrega
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full xl:max-h-[360px] xl:overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead className="xl:sticky xl:top-0 xl:z-10">
              <tr className="bg-[var(--color-background-secondary)] dark:bg-gray-900 border-b border-[var(--color-border-secondary)] dark:border-gray-700">
                <th className="w-12 px-6 py-4"></th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">ID / Descrição</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">Motociclista</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">Veículo</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)] dark:divide-gray-700">
              {loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">Carregando entregas...</td></tr>}
              {!loading && activeDeliveries.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">Nenhuma entrega em aberto no sistema.</td></tr>}
              {!loading && activeDeliveries.map((delivery) => (
                <tr 
                  key={delivery.id} 
                  onClick={() => toggleSelection(delivery.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedDeliveryId === delivery.id 
                      ? 'bg-blue-50/60 hover:bg-blue-50/80 dark:bg-blue-900/30 dark:hover:bg-blue-900/50' 
                      : 'hover:bg-[var(--color-background-secondary)]/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <input type="radio" readOnly checked={selectedDeliveryId === delivery.id} className="w-4 h-4 cursor-pointer accent-[#185FA5]"/>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[14px] font-medium text-[var(--color-text-primary)] dark:text-gray-200 whitespace-nowrap">{delivery.description}</div>
                    {delivery.deliveryAddress && (
                      <div className="max-w-[260px] truncate text-[12px] text-[var(--color-text-tertiary)] dark:text-gray-500">
                        {delivery.deliveryAddress}
                      </div>
                    )}
                    <div className="text-[12px] text-[var(--color-text-tertiary)] dark:text-gray-500">#{delivery.id.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">
                    {delivery.driver?.name || 'Não atribuído'}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">
                    {delivery.vehicle ? `${delivery.vehicle.model} (${delivery.vehicle.plate})` : 'Não atribuído'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(delivery.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--color-border-secondary)] dark:border-gray-700">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] dark:text-white">Entregas finalizadas hoje</h2>
              <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400 mt-1">
                {completedTodayDeliveries.length} entrega{completedTodayDeliveries.length === 1 ? '' : 's'} concluida{completedTodayDeliveries.length === 1 ? '' : 's'} no dia.
              </p>
            </div>
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:border-green-900/50 dark:bg-green-900/25 dark:text-green-300">
              {dailyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>

          <div className="overflow-x-auto w-full xl:max-h-[280px] xl:overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="xl:sticky xl:top-0 xl:z-10">
                <tr className="bg-green-50 dark:bg-green-900/20 border-y border-[var(--color-border-secondary)] dark:border-gray-700">
                  <th className="px-6 py-4 text-[13px] font-semibold text-green-800 dark:text-green-300 whitespace-nowrap">ID / Descricao</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-green-800 dark:text-green-300 whitespace-nowrap">Motociclista</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-green-800 dark:text-green-300 whitespace-nowrap">Veiculo</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-green-800 dark:text-green-300 whitespace-nowrap">Finalizada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-secondary)] dark:divide-gray-700">
                {loading && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">Carregando finalizadas...</td></tr>}
                {!loading && completedTodayDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Nenhuma entrega finalizada hoje.
                    </td>
                  </tr>
                )}
                {!loading && completedTodayDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-green-50/60 dark:hover:bg-green-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-medium text-[var(--color-text-primary)] dark:text-gray-200 whitespace-nowrap">{delivery.description}</div>
                      {delivery.deliveryAddress && (
                        <div className="max-w-[260px] truncate text-[12px] text-[var(--color-text-tertiary)] dark:text-gray-500">
                          {delivery.deliveryAddress}
                        </div>
                      )}
                      <div className="text-[12px] text-[var(--color-text-tertiary)] dark:text-gray-500">#{delivery.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">
                      {delivery.driver?.name || 'Nao atribuido'}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">
                      {delivery.vehicle ? `${delivery.vehicle.model} (${delivery.vehicle.plate})` : 'Nao atribuido'}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[var(--color-text-secondary)] dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(delivery.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
      
      {/* 4. MODAL DE EDIÇÃO */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Editar Entrega</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className={labelClass}>Descrição</label>
                  <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Loja / origem fixa</label>
                  <input type="text" value={editPickupAddress} className={`${inputClass} cursor-not-allowed opacity-80`} disabled readOnly />
                </div>
                <div>
                  <label className={labelClass}>Rota / localizacao da entrega</label>
                  <textarea value={editDeliveryAddress} onChange={(e) => setEditDeliveryAddress(e.target.value)} className={`${inputClass} min-h-[78px] py-2 resize-none`} placeholder="Ex: Rua, numero, bairro, cidade e ponto de referencia" required />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputClass}>
                    <option value="PENDING">Pendente</option>
                    <option value="IN_TRANSIT">Em Trânsito</option>
                    <option value="DELIVERED">Entregue</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Motociclista</label>
                  <select value={editDriverId} onChange={(e) => setEditDriverId(e.target.value)} className={inputClass} required>
                    <option value="">Selecione um motociclista</option>
                    {driversList.map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Veículo</label>
                  <select value={editVehicleId} onChange={(e) => setEditVehicleId(e.target.value)} className={inputClass} required>
                    <option value="">Selecione um veículo</option>
                    {vehiclesList.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicle.model} ({vehicle.plate})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={closeEditModal} className="h-[38px] px-4 text-sm border rounded-md">Cancelar</button>
                <button type="submit" disabled={isSaving} className="h-[38px] px-5 text-sm bg-[#185FA5] text-white rounded-md">{isSaving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DE CRIAÇÃO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Nova Entrega</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateDelivery}>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className={labelClass}>Descrição</label>
                  <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Loja / origem fixa</label>
                  <input type="text" value={newPickupAddress} className={`${inputClass} cursor-not-allowed opacity-80`} disabled readOnly />
                </div>
                <div>
                  <label className={labelClass}>Rota / localizacao da entrega</label>
                  <textarea value={newDeliveryAddress} onChange={(e) => setNewDeliveryAddress(e.target.value)} className={`${inputClass} min-h-[78px] py-2 resize-none`} placeholder="Ex: Rua, numero, bairro, cidade e ponto de referencia" required />
                </div>
                <div>
                  <label className={labelClass}>Motociclista</label>
                  <select value={newDriverId} onChange={(e) => setNewDriverId(e.target.value)} className={inputClass} required>
                    <option value="">Selecione um motociclista</option>
                    {driversList.map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Veículo</label>
                  <select value={newVehicleId} onChange={(e) => setNewVehicleId(e.target.value)} className={inputClass} required>
                    <option value="">Selecione um veículo</option>
                    {vehiclesList.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicle.model} ({vehicle.plate})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={closeCreateModal} className="h-[38px] px-4 text-sm border rounded-md">Cancelar</button>
                <button type="submit" disabled={isCreating} className="h-[38px] px-5 text-sm bg-[#185FA5] text-white rounded-md disabled:opacity-60">{isCreating ? 'Criando...' : 'Criar'}</button>
              </div>
            </form>
           </div>
        </div>
      )}
    </div>
  );
}
