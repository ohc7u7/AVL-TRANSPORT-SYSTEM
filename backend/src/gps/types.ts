/**
 * Representa la estructura de un mensaje GPS enviado (generalmente a través de WebSockets).
 */
export interface GpsMessage {
    vehicleId: number; // Identificador del vehículo
    timestamp: string; // Hora exacta del registro
    latitude: number;  // Coordenada latitud
    longitude: number; // Coordenada longitud
    speed: number;     // Velocidad del vehículo en ese instante
}

/**
 * Representa la información básica de un Vehículo.
 */
export interface Vehicle {
    id: number;       // Identificador único
    patente: string;  // Número de placa / patente del vehículo
    servicio: string; // Tipo de servicio (Ruta) asignado
}

/**
 * Define un punto específico en una ruta predefinida que el vehículo debe seguir.
 */
export interface RoutePoint {
    id: number;       // Identificador del punto en la ruta
    servicio: string; // Nombre de la ruta a la que pertenece
    orden: number;    // El orden numérico de este punto (por ejemplo, punto 1, luego 2, etc.)
    latitud: number;
    longitud: number;
}

/**
 * Representa un registro de la posición GPS almacenado directamente. 
 * Muy similar a GpsMessage, pero estructurado para bases de datos o lógica interna (con Fechas de TypeScript).
 */
export interface GpsRecord {
    id: number;
    vehiculoId: number;
    fechaHora: Date; // Usamos un objeto Date de TypeScript para la hora
    latitud: number;
    longitud: number;
    velocidad: number;
}

/**
 * Tipos de estados que indican si el vehículo está siguiendo correctamente su ruta programada.
 * 'EN_RUTA' (todo bien), 'DESVIACION' (fuera por pocos metros), 'FUERA_DE_RUTA' (completamente fuera).
 */
export type RouteComplianceStatus = 'EN_RUTA' | 'DESVIACION' | 'FUERA_DE_RUTA';

/**
 * Estructura con el resultado de cumplimiento (qué tanto el GPS actual corresponde a la ruta real).
 */
export interface RouteComplianceResult {
    distanceMeters: number;         // Distancia respecto a la ruta oficial (en metros)
    status: RouteComplianceStatus;  // Estado (En ruta, desviado, etc)
    nearestRoutePointOrder: number; // Orden del trayecto más cercano a donde se encuentra
}

/**
 * Estructura para el resultado del cumplimiento temporal (si el vehículo va según el horario oficial).
 */
export interface TemporalComplianceResult {
    plannedMinutes: number;         // Minutos planeados según el horario
    realMinutes: number;            // Minutos tomados realmente
    differenceMinutes: number;      // Diferencia (adelanto/atraso) de tiempo
    status: 'ADELANTADO' | 'A_TIEMPO' | 'ATRASADO'; // Estado final con respecto al cronograma
}
