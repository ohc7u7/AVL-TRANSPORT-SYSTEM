import { io, Socket } from 'socket.io-client';

// ── Configuración Inicial ─────────────────────────────────────────
// Se toma la URL desde el entorno o por defecto en localhost:3000
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
// Frecuencia en la que enviaremos la posición (Tick rate)
const TICK_MS = parseInt(process.env.SIMULATOR_TICK_RATE_MS || '2000', 10);

// ── Vehículo Virtual ───────────────────────────────────────
// Usado para simular un micro real en ruta
const vehicle = {
    vehicleId: 1,
    patente: 'SIM-001',
    servicio: '503',
};

// ── Ruta: 12 puntos clave en la ciudad de Temuco, Chile ──────────────
const routePoints = [
    { latitude: -38.7350, longitude: -72.5900 },
    { latitude: -38.7355, longitude: -72.5920 },
    { latitude: -38.7365, longitude: -72.5935 },
    { latitude: -38.7375, longitude: -72.5950 },
    { latitude: -38.7385, longitude: -72.5960 },
    { latitude: -38.7395, longitude: -72.5975 },
    { latitude: -38.7405, longitude: -72.5985 },
    { latitude: -38.7415, longitude: -72.6000 },
    { latitude: -38.7425, longitude: -72.6015 },
    { latitude: -38.7435, longitude: -72.6025 },
    { latitude: -38.7445, longitude: -72.6040 },
    { latitude: -38.7455, longitude: -72.6055 },
];

// ── Interpolation helper ──────────────────────────────────
/**
 * Interpola puntos geográficos de manera lineal.
 * Calcula las coordenadas intermedias entre un punto A y un punto B.
 * Útil para suavizar el movimiento GPS y no dar "saltos" largos.
 * 
 * @param a - Punto geográfico de inicio { latitude, longitude }
 * @param b - Punto geográfico final { latitude, longitude }
 * @param steps - Cantidad de subdivisiones requeridas
 * @returns {Array} Array de puntos interpolados
 */
function interpolate(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
    steps: number,
): { latitude: number; longitude: number }[] {
    const pts: { latitude: number; longitude: number }[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push({
            latitude: a.latitude + (b.latitude - a.latitude) * t,
            longitude: a.longitude + (b.longitude - a.longitude) * t,
        });
    }
    return pts;
}

/**
 * Construye una ruta densa uniendo todos los puntos (waypoints) y aplicando la interpolación.
 * Esto asegura que el simulador tenga suficientes puntos para emitir telemetría de forma seguida en cada 'tick'.
 * 
 * @param waypoints - Los puntos originales o maestros de la ruta.
 * @param subSteps - Cantidad de pasos a agregar entre cada par de puntos maestros.
 * @returns {Array} Ruta final con alta resolución de puntos.
 */
function buildDensePath(waypoints: { latitude: number; longitude: number }[], subSteps: number) {
    const dense: { latitude: number; longitude: number }[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const segment = interpolate(waypoints[i], waypoints[i + 1], subSteps);
        // evita duplicar el punto de unión
        dense.push(...(i === 0 ? segment : segment.slice(1)));
    }
    return dense;
}

const densePath = buildDensePath(routePoints, 4); // Cerca de 44 puntos en total (resolución aumentada)
let currentIndex = 0;
let loopDirection = 1; // 1 = adelante (forward), -1 = atrás (backward)

// ── Conexión a Socket.io ──────────────────────────────────
const socket: Socket = io(BACKEND_URL, { autoConnect: false });

socket.on('connect', () => {
    console.log(`\n🚌 Simulator connected (socket ${socket.id})`);
    console.log(`   Vehicle: ${vehicle.patente} | Service: ${vehicle.servicio}`);
    console.log(`   Route has ${densePath.length} interpolated points`);
    console.log(`   Tick interval: ${TICK_MS}ms\n`);
    startSimulation();
});

socket.on('connect_error', (err) => {
    console.error(`[Simulator] Connection error: ${err.message}`);
});

socket.on('disconnect', () => {
    console.log('[Simulator] Disconnected');
});

/**
 * Bucle infinito del simulador AVL.
 * Extrae el punto geográfico actual, le suma ruido aleatorio para simular fallas
 * de precisión natural del GPS (multipath) y lo emite vía Socket.io al servidor.
 * Recrea el comportamiento de las Condiciones de Operación MTT.
 */
function startSimulation() {
    setInterval(() => {
        const point = densePath[currentIndex];
        const speed = 20 + Math.random() * 30; // 20-50 km/h

        const gpsMessage = {
            vehicleId: vehicle.vehicleId,
            timestamp: new Date().toISOString(),
            latitude: point.latitude + (Math.random() - 0.5) * 0.0001, // tiny GPS noise
            longitude: point.longitude + (Math.random() - 0.5) * 0.0001,
            speed: Math.round(speed * 10) / 10,
        };

        socket.emit('gps:position', gpsMessage);

        console.log(
            `[GPS] Punto ${currentIndex + 1}/${densePath.length} → ` +
            `(${gpsMessage.latitude.toFixed(5)}, ${gpsMessage.longitude.toFixed(5)}) ` +
            `a ${gpsMessage.speed} km/h`,
        );

        // Avanzar al siguiente punto y rebotar (ir en reversa) en los bordes de la ruta
        currentIndex += loopDirection;
        if (currentIndex >= densePath.length) {
            currentIndex = densePath.length - 2;
            loopDirection = -1;
        } else if (currentIndex < 0) {
            currentIndex = 1;
            loopDirection = 1;
        }
    }, TICK_MS);
}

// ── Iniciar Aplicación ─────────────────────────────────────────────────
console.log('🚌 Iniciando Simulador de Vehículo AVL...');
console.log(`   Conectando al backend en: ${BACKEND_URL}`);
socket.connect();
