'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { socket } from '../../socket';

// Interface para sabermos o formato da entrega vindo do Back-end
interface Delivery {
  id: string;
  description: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  status: string;
  driverId?: string;
  vehicleId?: string;
}

const defaultDestination = '-22.8646,-43.3219';

function getNavigationUrl(delivery: Delivery) {
  const destination = delivery.deliveryAddress && delivery.deliveryAddress !== 'Destino nao informado'
    ? encodeURIComponent(delivery.deliveryAddress)
    : defaultDestination;

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export default function DriverMobileApp() {
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [currentDelivery, setCurrentDelivery] = useState<Delivery | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  // 1. BUSCA A ENTREGA REAL DO BANCO DE DADOS
  useEffect(() => {
    async function fetchDelivery() {
      try {
        const response = await axios.get('http://localhost:3333/deliveries');
        const deliveries = response.data;
        
        // Procura a primeira entrega que NÃO esteja concluída
        const activeDelivery = deliveries.find((d: Delivery) => d.status !== 'DELIVERED');
        
        if (activeDelivery) {
          setCurrentDelivery(activeDelivery);
        }
      } catch (error) {
        console.error('Erro ao buscar entrega:', error);
      } finally {
        setIsFetching(false);
      }
    }
    fetchDelivery();
  }, []);

  useEffect(() => {
    if (!currentDelivery || currentDelivery.status === 'DELIVERED') {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setIsSharingLocation(true);
        socket.emit('driver:location', {
          deliveryId: currentDelivery.id,
          driverId: currentDelivery.driverId,
          vehicleId: currentDelivery.vehicleId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Erro ao compartilhar localizacao:', error);
        setIsSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentDelivery]);

  // 2. ATUALIZA O STATUS NO BANCO DE DADOS (DISPARA O WEBSOCKET)
  const handleUpdateStatus = async (newStatus: string) => {
    if (!currentDelivery) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('logiflow_token');

      await axios.patch(
        `http://localhost:3333/deliveries/${currentDelivery.id}/status`,
        { status: newStatus },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      setCurrentDelivery({ ...currentDelivery, status: newStatus });
      // Opcional: Tocar um som ou vibrar o celular aqui
      
    } catch (error) {
      console.error('Erro ao atualizar', error);
      alert('Erro ao confirmar a entrega. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const isLocationActive = currentDelivery?.status !== 'DELIVERED' && isSharingLocation;

  // Tela de Carregamento inicial
  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#0C447C] flex flex-col items-center justify-center text-white">
        <i className="ti ti-loader-3 text-4xl animate-spin mb-4"></i>
        <p className="font-medium">Buscando sua rota...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      <header className="bg-[#0C447C] text-white p-5 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <i className="ti ti-steering-wheel text-2xl"></i>
          <span className="font-semibold text-lg">LogiFlow App</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <i className="ti ti-user text-xl"></i>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full mt-2">
        
        {/* SE NÃO TIVER ENTREGAS PENDENTES */}
        {!currentDelivery ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-10 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <i className="ti ti-mug text-4xl text-green-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Tudo limpo por aqui!</h2>
            <p className="text-gray-500 mt-2">Você não tem nenhuma entrega pendente. Pode descansar.</p>
          </div>
        ) : (
          
          /* SE TIVER ENTREGA PENDENTE, MOSTRA O CARD */
          <>
            <h2 className="text-xl font-bold text-gray-800 ml-1">Sua rota atual</h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4 relative overflow-hidden">
              
              <div className={`absolute top-0 left-0 w-full h-2 ${
                currentDelivery.status === 'DELIVERED' ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>

              <div className="mt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Pacote #{currentDelivery.id.substring(0, 6)}
                </span>
                <h3 className="text-xl font-bold text-gray-900 leading-tight mt-1">
                  {currentDelivery.description}
                </h3>
              </div>

              <div className="flex items-start gap-3 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <i className="ti ti-map-pin text-red-500 text-xl mt-0.5"></i>
                <p className="text-sm text-gray-600 font-medium">
                  {currentDelivery.deliveryAddress || 'Destino nao informado'}
                </p>
              </div>

              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                isLocationActive
                  ? 'border-blue-100 bg-blue-50 text-blue-700'
                  : 'border-yellow-100 bg-yellow-50 text-yellow-700'
              }`}>
                <i className={`ti ${isLocationActive ? 'ti-current-location' : 'ti-location-off'} text-base`}></i>
                {isLocationActive ? 'Localizacao em tempo real ativa' : 'Aguardando permissao do GPS'}
              </div>

              <hr className="border-gray-100 my-1" />

              <div className="flex flex-col gap-3">
                {currentDelivery.status !== 'DELIVERED' ? (
                  <button 
                    onClick={() => handleUpdateStatus('DELIVERED')}
                    disabled={loading}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-green-600/20"
                  >
                    {loading ? (
                      <i className="ti ti-loader-3 text-2xl animate-spin"></i>
                    ) : (
                      <i className="ti ti-check text-2xl"></i>
                    )}
                    {loading ? 'Confirmando...' : 'Confirmar Entrega'}
                  </button>
                ) : (
                  <div className="w-full h-14 bg-green-50 text-green-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2 border border-green-200">
                    <i className="ti ti-circle-check-filled text-2xl"></i>
                    Entrega Finalizada
                  </div>
                )}
                
                <a
                  href={getNavigationUrl(currentDelivery)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-12 bg-white text-[#185FA5] border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <i className="ti ti-navigation text-lg"></i>
                  Abrir no Waze / Maps
                </a>
              </div>
            </div>
          </>
        )}
      </main>

      <nav className="bg-white border-t border-gray-200 flex justify-around p-3 pb-6">
        <button className="flex flex-col items-center gap-1 text-[#185FA5]">
          <i className="ti ti-route text-2xl"></i>
          <span className="text-[10px] font-bold">Rota</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <i className="ti ti-history text-2xl"></i>
          <span className="text-[10px] font-medium">Histórico</span>
        </button>
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500">
          <i className="ti ti-logout text-2xl"></i>
          <span className="text-[10px] font-medium">Sair</span>
        </Link>
      </nav>
    </div>
  );
}
