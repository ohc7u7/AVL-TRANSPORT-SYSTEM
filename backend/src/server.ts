import express from 'express';
import http from 'http';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import { config } from './config';
import { setupSocketHandlers } from './realtime/socketHandler';
import vehiclesRouter from './routes/vehicles';
import routesRouter from './routes/routes';
import gpsRouter from './routes/gps';

/**
 * Kernel de Comunicaciones Centrales (Backend).
 * Levanta el API HTTP (Express) para peticiones web y
 * orquesta el servidor WebSocket en tiempo real (Socket.io).
 * Maneja las reglas oficiales del MTT procesando la telemetría.
 */
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// REST API Routes
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/routes', routesRouter);
app.use('/api/gps', gpsRouter);

// Health check
/**
 * Endpoint de vitalidad (Health Check).
 * Utilizado por sistemas de balanceo de carga para comprobar la 
 * estabilidad del servidor de transporte.
 */
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Endpoint Exportador de Estadísticas (Transaccional).
 * Recibe un payload JSON con la telemetría consolidada de un viaje (ej. al presionar
 * Exportar a JSON en la interfaz del controlador) y la persiste localmente
 * simulando un volcado a base de datos reguladora o de auditoría interna de la flota.
 */
app.post('/api/stats/export', (req, res) => {
    try {
        const stats = req.body;
        // Define the stats directory at the root of the repo
        const statsDir = path.join(__dirname, '../../stats');
        if (!fs.existsSync(statsDir)) {
            fs.mkdirSync(statsDir, { recursive: true });
        }
        const filename = `estadisticas_${Date.now()}.json`;
        const filePath = path.join(statsDir, filename);

        fs.writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');
        console.log(`[API] Estadísticas guardadas en ${filePath}`);

        res.json({ success: true, file: filename });
    } catch (err) {
        console.error('[API] Error saving stats:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

/**
 * Servidor WebSockets.
 * Abre el túnel bidireccional permitiendo la conexión constante
 * de las interfaces visuales (Frontends) y los GPS de los vehículos (Simuladores).
 */
const io = new SocketServer(server, {
    cors: { origin: config.cors.origin, methods: ['GET', 'POST'] },
});

setupSocketHandlers(io);

// Start
server.listen(config.port, () => {
    console.log(`\n🚌 AVL Backend listening on http://localhost:${config.port}`);
    console.log(`   Socket.io ready for connections\n`);
});
