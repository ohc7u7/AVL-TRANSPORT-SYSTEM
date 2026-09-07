import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import './App.css';
import { buildDemoRoutes, getCompliance, haversineM, PLAYBACK_TICK_MS, PLAYBACK_RATE } from './demoRoute';

// Reparar las rutas de los iconos predeterminados de la librería Leaflet (Mapa)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Icono personalizado para el bus (Usando emojí)
const busIcon = L.divIcon({
  className: 'bus-marker',
  html: '🚌',
  iconSize: [36, 36],
  iconAnchor: [18, 18], // Centralizar el ícono en el mapa exacto
});

// URL del backend definida en las variables de entorno, o apuntamos por defecto al puerto 3000
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Determina la fase de demostración actual según el estado de cumplimiento real.
 */
function getDemoPhase(c: { status: string } | null): { label: string; color: string } {
  if (!c) return { label: 'Sin datos', color: '#6b7280' };
  if (c.status === 'EN_RUTA') return { label: '✅ En Ruta', color: '#22c55e' };
  if (c.status === 'DESVIACION') return { label: '⚠️ Desviación', color: '#eab308' };
  return { label: '🚨 Fuera de Ruta', color: '#ef4444' };
}

/**
 * Controlador de Pantalla del Mapa:
 * Ajusta inicialmente el nivel de 'zoom' (fit bounds) y también hace que la cámara
 * del mapa siga al vehículo a medida que se mueve (si shouldFollow está activo).
 */
function MapController({
  routePoints,
  vehiclePos,
  shouldFollow,
}: {
  routePoints: [number, number][];
  vehiclePos: [number, number] | null;
  shouldFollow: boolean;
}) {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (routePoints.length > 1 && !hasFit.current) {
      map.fitBounds(
        routePoints.map((p) => [p[0], p[1]] as [number, number]),
        { padding: [50, 50] },
      );
      hasFit.current = true;
    }
  }, [routePoints, map]);

  useEffect(() => {
    if (vehiclePos && shouldFollow) {
      const innerBounds = map.getBounds().pad(-0.3);
      if (!innerBounds.contains(L.latLng(vehiclePos[0], vehiclePos[1]))) {
        map.panTo(vehiclePos, { animate: true, duration: 0.5 });
      }
    }
  }, [vehiclePos, shouldFollow, map]);

  return null;
}

/**
 * Obtiene el color correspondiente a cada tipo de estado del vehículo 
 * (Verde seguro, amarillo alerta, rojo infractor).
 */
function complianceColor(s: string) {
  if (s === 'EN_RUTA') return '#22c55e';
  if (s === 'DESVIACION') return '#eab308';
  if (s === 'FUERA_DE_RUTA') return '#ef4444';
  return '#6b7280';
}

/**
 * Traduce el estatus crudo enviado por backend en una etiqueta amigable
 * para la interfaz visual.
 */
function complianceLabel(s: string) {
  if (s === 'EN_RUTA') return 'En Ruta';
  if (s === 'DESVIACION') return 'Desviación';
  if (s === 'FUERA_DE_RUTA') return 'Fuera de Ruta';
  return 'Sin datos';
}

/**
 * Aplicación de Monitoreo Central (Frontend).
 * Renderiza el motor web GIS (Leaflet) para visualizar la ubicación
 * y emitir estadísticas de trazabilidad (Speed, Compliance, Timeline).
 * Opera usando Socket.io como oyente de datos en real-time y genera
 * las exportaciones en JSON obligatorias.
 */
export default function App() {
  // Datos de la ruta oficial
  const [{ routePoints, vehiclePath }] = useState(buildDemoRoutes);

  // Estados de Reproducción Simulada

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playRequested, setIsPlaying] = useState(true);
  const isPlaying = playRequested && currentIndex < vehiclePath.length - 1;
  const isDraggingRef = useRef(false);

  // Connection
  const [connected, setConnected] = useState(false);

  // Speed (simulated)
  const speed = !isPlaying || currentIndex >= vehiclePath.length - 1 ? 0
    : Math.round(haversineM(vehiclePath[currentIndex], vehiclePath[currentIndex + 1])
      / (PLAYBACK_TICK_MS / 1000 * PLAYBACK_RATE) * 3.6 * 10) / 10;

  // ── Socket.io connection (status indicator) ─────────────
  useEffect(() => {
    const socket = io(BACKEND_URL);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => { socket.disconnect(); };
  }, []);

  // Reproducción acelerada: conserva las esquinas y se detiene al finalizar.
  useEffect(() => {
    if (!isPlaying || vehiclePath.length === 0) return;
    const timer = setInterval(() => {
      if (!isDraggingRef.current) {
        setCurrentIndex(prev => Math.min(prev + 1, vehiclePath.length - 1));
      }
    }, PLAYBACK_TICK_MS);
    return () => clearInterval(timer);
  }, [isPlaying, vehiclePath.length, currentIndex]);

  // ── Derived state ───────────────────────────────────────
  const vehiclePos: [number, number] | null = vehiclePath[currentIndex] || null;
  const progress = vehiclePath.length > 1 ? (currentIndex / (vehiclePath.length - 1)) * 100 : 0;
  const compliance = vehiclePos && routePoints.length > 0 ? getCompliance(vehiclePos, routePoints) : null;
  const demoPhase = getDemoPhase(compliance);

  // Pre-computar cumplimiento para todos los puntos y agrupar en segmentos coloreados
  const allCompliance = useMemo(() => {
    if (vehiclePath.length === 0 || routePoints.length === 0) return [];
    return vehiclePath.map(p => getCompliance(p, routePoints));
  }, [vehiclePath, routePoints]);

  const traveledSegments = useMemo(() => {
    const segs: Array<{ points: [number, number][]; status: string }> = [];
    let cur: { points: [number, number][]; status: string } | null = null;
    for (let i = 0; i <= currentIndex && i < vehiclePath.length; i++) {
      const st = allCompliance[i]?.status || 'EN_RUTA';
      if (!cur || cur.status !== st) {
        if (cur) cur.points.push(vehiclePath[i]); // punto puente
        cur = { points: [vehiclePath[i]], status: st };
        segs.push(cur);
      } else {
        cur.points.push(vehiclePath[i]);
      }
    }
    return segs;
  }, [vehiclePath, allCompliance, currentIndex]);

  const [savingStats, setSavingStats] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const exportStats = async () => {
    if (!vehiclePos) return;
    setSavingStats(true);
    setSaveSuccess(null);
    try {
      const statsObj = {
        patente: 'SIM-001',
        servicio: '503',
        ultima_posicion: { lat: vehiclePos[0], lng: vehiclePos[1] },
        velocidad_kmh: speed,
        puntos_rutas_totales: routePoints.length,
        puntos_recorridos: currentIndex + 1,
        progreso_porcentaje: Math.round(progress * 100) / 100,
        cumplimiento: compliance,
        fecha: new Date().toISOString(),
      };

      const res = await fetch(`${BACKEND_URL}/api/stats/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statsObj)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(`Guardado en stats/${data.file}`);
      } else {
        setSaveSuccess('Error al guardar');
      }
    } catch (e) {
      setSaveSuccess('Error de conexión');
    }
    setSavingStats(false);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // ── Handlers ────────────────────────────────────────────
  const togglePlay = () => {
    if (!isPlaying && currentIndex === vehiclePath.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    setCurrentIndex(idx);
  };

  const handlePointerDown = () => { isDraggingRef.current = true; };
  const handlePointerUp = () => { isDraggingRef.current = false; };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <span className="logo">🚌</span>
          <h1>AVL Transport System</h1>
        </div>
        <div className="header-right">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">{connected ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="main-content">
        {/* Map panel + controls */}
        <div className="map-panel">
          <div className="map-wrapper">
            <MapContainer
              center={[-38.7400, -72.5970]}
              zoom={15}
              className="leaflet-map"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController
                routePoints={vehiclePath}
                vehiclePos={vehiclePos}
                shouldFollow={isPlaying}
              />

              {/* ═══ Ruta oficial — línea azul prominente con resplandor ═══ */}
              {routePoints.length > 1 && (
                <>
                  <Polyline positions={routePoints} pathOptions={{ color: '#3b82f6', weight: 14, opacity: 0.12 }} />
                  <Polyline positions={routePoints} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8, dashArray: '12,6' }} />
                </>
              )}

              {/* Preview sutil del recorrido completo del vehículo */}
              {vehiclePath.length > 1 && (
                <Polyline positions={vehiclePath} pathOptions={{ color: '#94a3b8', weight: 2, dashArray: '4,6', opacity: 0.2 }} />
              )}

              {/* Trayectoria recorrida — cada segmento coloreado según su cumplimiento */}
              {traveledSegments.map((seg, idx) =>
                seg.points.length > 1 ? (
                  <Polyline
                    key={`seg-${idx}`}
                    positions={seg.points}
                    pathOptions={{ color: complianceColor(seg.status), weight: 5, opacity: 0.9 }}
                  />
                ) : null
              )}

              {/* Vehicle marker */}
              {vehiclePos && (
                <Marker position={vehiclePos} icon={busIcon}>
                  <Popup>
                    <strong>Micro SIM-001</strong>
                    <br />
                    Servicio 503
                    <br />
                    Velocidad: {speed} km/h
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* ── Transport controls bar (YouTube-style) ── */}
          <div className={`transport-controls ${!isPlaying ? 'paused' : ''}`}>
            <button
              className="play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pausar recorrido' : 'Iniciar recorrido'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>

            <div className="scrubber-wrapper">
              <div className="scrubber-track-bg" />
              <div className="scrubber-track-fill" style={{ width: `${progress}%` }} />
              <input
                type="range"
                className="scrubber-input"
                min={0}
                max={Math.max(vehiclePath.length - 1, 0)}
                value={currentIndex}
                onChange={handleSliderChange}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchEnd={handlePointerUp}
              />
            </div>

            <span className="point-counter" title={`Simulación a ${PLAYBACK_RATE}×`}>
              {currentIndex + 1} / {vehiclePath.length}
            </span>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="card">
            <h2>📡 Información del Vehículo</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Patente</span>
                <span className="value">SIM-001</span>
              </div>
              <div className="info-item">
                <span className="label">Servicio</span>
                <span className="value">503</span>
              </div>
              <div className="info-item">
                <span className="label">Velocidad</span>
                <span className="value">{speed} km/h</span>
              </div>
              <div className="info-item">
                <span className="label">Latitud</span>
                <span className="value">{vehiclePos?.[0]?.toFixed(5) ?? '—'}</span>
              </div>
              <div className="info-item">
                <span className="label">Longitud</span>
                <span className="value">{vehiclePos?.[1]?.toFixed(5) ?? '—'}</span>
              </div>
              <div className="info-item">
                <span className="label">Estado</span>
                <span className="value">{isPlaying ? '▶ En marcha' : '⏸ Detenido'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>🛣️ Cumplimiento de Ruta</h2>
            {compliance && (
              <>
                <div
                  className="compliance-badge"
                  style={{ backgroundColor: complianceColor(compliance.status) }}
                >
                  {complianceLabel(compliance.status)}
                </div>
                <div className="info-grid" style={{ marginTop: '0.75rem' }}>
                  <div className="info-item">
                    <span className="label">Distancia a ruta</span>
                    <span className="value">{compliance.distanceMeters} m</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Punto más cercano</span>
                    <span className="value">#{compliance.nearest}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <h2>🎬 Fase de Demostración</h2>
            <div className="demo-phase-indicator" style={{ borderLeftColor: demoPhase.color }}>
              <span className="demo-phase-label" style={{ color: demoPhase.color }}>{demoPhase.label}</span>
            </div>
            <div className="demo-legend">
              <div className="demo-legend-item">
                <span className="demo-dot" style={{ background: '#22c55e' }} />
                <span>En Ruta: sobre la avenida (≤30 m)</span>
              </div>
              <div className="demo-legend-item">
                <span className="demo-dot" style={{ background: '#eab308' }} />
                <span>Desviación: alejamiento de 30 a 100 m</span>
              </div>
              <div className="demo-legend-item">
                <span className="demo-dot" style={{ background: '#ef4444' }} />
                <span>Fuera de Ruta: más de 100 m</span>
              </div>
            </div>
            <div className="demo-legend-item" style={{ marginTop: '0.5rem', opacity: 0.7 }}>
              <span className="demo-dot" style={{ background: '#3b82f6' }} />
              <span>Línea azul = Ruta oficial</span>
            </div>
          </div>

          <div className="card">
            <h2>📊 Estadísticas</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Puntos de ruta</span>
                <span className="value">{routePoints.length}</span>
              </div>
              <div className="info-item">
                <span className="label">Progreso</span>
                <span className="value">{Math.round(progress)}%</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={exportStats}
                disabled={savingStats}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                {savingStats ? 'Guardando...' : '💾 Exportar a JSON'}
              </button>
              {saveSuccess && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: saveSuccess.includes('Error') ? '#ef4444' : '#22c55e', textAlign: 'center' }}>
                  {saveSuccess}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
