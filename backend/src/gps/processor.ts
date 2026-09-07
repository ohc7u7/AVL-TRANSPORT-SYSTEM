import { GpsMessage } from './types';

/**
 * Valida que los datos recibidos mediante GPS tengan el formato correcto.
 * Es crucial para evitar que información corrupta (por ejemplo, coordenadas inválidas) cause errores.
 * 
 * @param {unknown} data - Los datos entrantes (usualmente desde un WebSocket o API).
 * @returns {GpsMessage | null} Retorna el mensaje formateado si es válido, o 'null' si hubo algún error.
 */
export function validateGpsMessage(data: unknown): GpsMessage | null {
    // Si no hay datos o no es un objeto JSON, rechazamos el mensaje.
    if (!data || typeof data !== 'object') return null;

    const msg = data as Record<string, unknown>;

    // Convertimos de forma segura los atributos a números
    const vehicleId = Number(msg.vehicleId);
    const latitude = Number(msg.latitude);
    const longitude = Number(msg.longitude);
    const speed = Number(msg.speed);

    // Si no enviaron hora, asumimos que es el momento actual
    const timestamp = String(msg.timestamp || new Date().toISOString());

    // Verificamos que los valores sean lógicos.
    // La latitud en el mundo va de -90 a 90, la longitud de -180 a 180.
    if (
        isNaN(vehicleId) ||
        isNaN(latitude) ||
        isNaN(longitude) ||
        isNaN(speed) ||
        latitude < -90 ||           // Fuera del límite inferior
        latitude > 90 ||            // Fuera del límite superior
        longitude < -180 ||         // Fuera del límite oeste
        longitude > 180 ||          // Fuera del límite este
        speed < 0                   // La velocidad no puede ser negativa
    ) {
        // En caso de incongruencia, no lo aceptamos
        return null;
    }

    // Regresamos el objeto tipo GpsMessage válido para usarlo en el resto de la aplicación
    return { vehicleId, timestamp, latitude, longitude, speed };
}
