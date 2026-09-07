/**
 * Controlador para la funcionalidad de Tiempo Real mediante Socket.io.
 * Recibe y retransmite localizaciones automáticamente.
 */
import { Server as SocketServer, Socket } from 'socket.io';
import { validateGpsMessage } from '../gps/processor';
import { insertGpsPosition, getRouteByService, getVehicleById } from '../vehicles/repository';
import { evaluateRouteCompliance } from '../business/compliance';

/**
 * Configura los "eventos" principales del servidor WebSocket.
 * 
 * @param {SocketServer} io Objeto gestor de conexiones con los clientes (frontend y simulador).
 */
export function setupSocketHandlers(io: SocketServer): void {
    io.on('connection', (socket: Socket) => {
        // Evento lanzado cuando un nuevo simulador o frontend se conecta.
        console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

        /**
         * Evento principal "gps:position": 
         * Se emite desde el simulador vehicular constantemente mandando datos de movimiento.
         */
        socket.on('gps:position', async (data: unknown) => {
            const msg = validateGpsMessage(data);
            if (!msg) {
                socket.emit('gps:error', { error: 'Invalid GPS data' });
                return;
            }

            console.log(
                `[GPS] Vehículo ${msg.vehicleId} → (${msg.latitude}, ${msg.longitude}) a ${msg.speed} km/h`,
            );

            // Persiste en una base SQL Server (se intenta no colapsar el sistema si la BD falla)
            try {
                await insertGpsPosition(
                    msg.vehicleId,
                    msg.timestamp,
                    msg.latitude,
                    msg.longitude,
                    msg.speed,
                );
            } catch (err) {
                console.warn('[DB] Falló la escritura del GPS:', (err as Error).message);
            }

            // Evaluar el cumplimiento de la ruta (si de desvía matemáticamente)
            let compliance = null;
            try {
                const vehicle = await getVehicleById(msg.vehicleId);
                if (vehicle) {
                    const routePoints = await getRouteByService(vehicle.servicio);
                    if (routePoints.length > 0) {
                        compliance = evaluateRouteCompliance(
                            { latitude: msg.latitude, longitude: msg.longitude },
                            routePoints,
                        );
                    }
                }
            } catch {
                // non-critical
            }

            // Broadcast: enviamos este nuevo punto GPS a TODOS los clientes web conectados
            // así, un navegador ve exactamente cómo el bus avanza en el mapa de Leaflet
            io.emit('gps:update', {
                ...msg,
                compliance,
            });
        });

        // Evento lanzado si se pierde la conexión de Socket.io.
        socket.on('disconnect', () => {
            console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
        });
    });
}
