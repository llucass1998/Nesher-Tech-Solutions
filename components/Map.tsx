'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { socket } from '../socket';

type RoutePoint = [number, number];

type MapPoint = {
  lat: number;
  lng: number;
  label: string;
};

type DriverLocationPayload = {
  deliveryId?: string;
  driverId?: string;
  vehicleId?: string;
  lat: number;
  lng: number;
  updatedAt: string;
};

type MapProps = {
  selectedDeliveryId?: string | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  driverName?: string | null;
};

const distributionCenter: MapPoint = {
  lat: -22.8550541,
  lng: -43.331377,
  label: 'Base LogiFlow - Rua do Terço, 340 - Vaz Lobo',
};

const defaultDestination: MapPoint = {
  lat: -22.8646,
  lng: -43.3219,
  label: 'Destino da entrega',
};

const markerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const driverIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:9999px;background:#185FA5;border:3px solid white;box-shadow:0 6px 18px rgba(0,0,0,.35);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function getLocationKey(location: DriverLocationPayload) {
  return location.deliveryId || location.driverId || `${location.lat}:${location.lng}`;
}

function isAddressUsable(address?: string | null) {
  const normalized = address?.trim().toLowerCase();
  return Boolean(
    normalized &&
      normalized !== 'origem nao informada' &&
      normalized !== 'destino nao informado'
  );
}

async function geocodeAddress(address: string, fallback: MapPoint, signal: AbortSignal): Promise<MapPoint> {
  const params = new URLSearchParams({ address });
  const response = await fetch(`http://localhost:3333/maps/geocode?${params.toString()}`, { signal });

  if (!response.ok) return fallback;

  const point = (await response.json()) as Partial<MapPoint>;

  if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
    return fallback;
  }

  return {
    lat: point.lat,
    lng: point.lng,
    label: point.label || fallback.label,
  };
}

async function fetchRoute(from: MapPoint, to: MapPoint, signal: AbortSignal): Promise<RoutePoint[]> {
  const params = new URLSearchParams({
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toLat: String(to.lat),
    toLng: String(to.lng),
  });

  const response = await fetch(`http://localhost:3333/maps/route?${params.toString()}`, { signal });

  if (!response.ok) {
    return [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ];
  }

  const data = (await response.json()) as { coordinates?: RoutePoint[] };

  return data.coordinates?.length
    ? data.coordinates
    : [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ];
}

function FitMapBounds({ points }: { points: RoutePoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;

    map.fitBounds(points as LatLngBoundsExpression, {
      padding: [32, 32],
      maxZoom: 15,
    });
  }, [map, points]);

  return null;
}

export default function Map({
  selectedDeliveryId,
  pickupAddress,
  deliveryAddress,
  driverName,
}: MapProps) {
  const [driverLocations, setDriverLocations] = useState<DriverLocationPayload[]>([]);
  const [pickupPoint, setPickupPoint] = useState<MapPoint>(distributionCenter);
  const [destinationPoint, setDestinationPoint] = useState<MapPoint>(defaultDestination);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeSource] = useState<'driver' | 'pickup'>('pickup');
  const fixedOriginAddress = pickupAddress || distributionCenter.label;

  useEffect(() => {
    const handleInitialLocations = (locations: DriverLocationPayload[]) => {
      setDriverLocations(locations);
    };

    const handleDriverLocation = (location: DriverLocationPayload) => {
      if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return;

      setDriverLocations((previous) => {
        const key = getLocationKey(location);
        return [location, ...previous.filter((item) => getLocationKey(item) !== key)];
      });
    };

    socket.on('driver:locations:init', handleInitialLocations);
    socket.on('driver:location', handleDriverLocation);

    return () => {
      socket.off('driver:locations:init', handleInitialLocations);
      socket.off('driver:location', handleDriverLocation);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function resolveAddresses() {
      try {
        const [resolvedPickup, resolvedDestination] = await Promise.all([
          Promise.resolve(distributionCenter),
          isAddressUsable(deliveryAddress)
            ? geocodeAddress(deliveryAddress as string, defaultDestination, controller.signal)
            : Promise.resolve(defaultDestination),
        ]);

        setPickupPoint(resolvedPickup);
        setDestinationPoint(resolvedDestination);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setPickupPoint(distributionCenter);
          setDestinationPoint(defaultDestination);
        }
      }
    }

    resolveAddresses();

    return () => controller.abort();
  }, [fixedOriginAddress, deliveryAddress]);

  const activeLocation = useMemo(() => {
    const candidates = selectedDeliveryId
      ? driverLocations.filter((location) => location.deliveryId === selectedDeliveryId)
      : driverLocations;

    return candidates
      .slice()
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] || null;
  }, [driverLocations, selectedDeliveryId]);

  const routeStart = useMemo<MapPoint>(() => {
    if (!activeLocation) return pickupPoint;

    return {
      lat: activeLocation.lat,
      lng: activeLocation.lng,
      label: driverName ? `Motorista: ${driverName}` : 'Motorista em tempo real',
    };
  }, [activeLocation, driverName, pickupPoint]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoute() {
      try {
        const route = await fetchRoute(routeStart, destinationPoint, controller.signal);
        setRoutePoints(route);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setRoutePoints([
            [routeStart.lat, routeStart.lng],
            [destinationPoint.lat, destinationPoint.lng],
          ]);
        }
      }
    }

    loadRoute();

    return () => controller.abort();
  }, [activeLocation, routeStart, destinationPoint]);

  const boundsPoints = routePoints.length > 1
    ? routePoints
    : [
        [routeStart.lat, routeStart.lng],
        [destinationPoint.lat, destinationPoint.lng],
      ] as RoutePoint[];

  const lastUpdated = activeLocation
    ? new Date(activeLocation.updatedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div
      className="relative w-full h-full min-h-[300px] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900"
      style={{ isolation: 'isolate' }}
    >
      <MapContainer
        center={[distributionCenter.lat, distributionCenter.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapBounds points={boundsPoints} />

        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#185FA5', weight: 5, opacity: 0.85 }}
          />
        )}

        <Marker position={[pickupPoint.lat, pickupPoint.lng]} icon={markerIcon}>
          <Popup>{pickupPoint.label}</Popup>
        </Marker>

        <Marker position={[destinationPoint.lat, destinationPoint.lng]} icon={markerIcon}>
          <Popup>{destinationPoint.label}</Popup>
        </Marker>

        {activeLocation && (
          <Marker position={[activeLocation.lat, activeLocation.lng]} icon={driverIcon}>
            <Popup>
              {driverName || 'Motorista'}
              <br />
              Atualizado: {lastUpdated}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-md border border-white/70 bg-white/90 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200">
        {routeSource === 'driver' ? 'Rota ao vivo' : 'Rota planejada'}
        {lastUpdated && <span className="ml-2 text-gray-500 dark:text-gray-400">{lastUpdated}</span>}
      </div>
    </div>
  );
}
