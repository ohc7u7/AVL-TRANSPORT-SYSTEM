/**
 * Conexión a Base de Datos - Repositorio.
 * Contiene todas las consultas SQL (Queries) hacia la base de datos para recuperar y guardar información.
 */
import { getPool, sql } from '../database/connection';
import { Vehicle, RoutePoint, GpsRecord } from '../gps/types';

// ── Vehicles (Vehículos) ──────────────────────────────────────────────

/**
 * Consulta la base de datos y obtiene una lista con todos los vehículos registrados en el sistema.
 * 
 * @returns {Promise<Vehicle[]>} Arreglo de vehículos.
 */
export async function getAllVehicles(): Promise<Vehicle[]> {
    const pool = await getPool();
    const result = await pool.request().query('SELECT Id as id, Patente as patente, Servicio as servicio FROM Vehiculo');
    return result.recordset;
}

/**
 * Busca un único vehículo por su ID numérico (Llave Primaria).
 * 
 * @param {number} id El identificador único del vehículo.
 * @returns {Promise<Vehicle | null>} El vehículo si existe, o 'null' de no existir.
 */
export async function getVehicleById(id: number): Promise<Vehicle | null> {
    const pool = await getPool();
    const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query('SELECT Id as id, Patente as patente, Servicio as servicio FROM Vehiculo WHERE Id = @id');
    return result.recordset[0] || null;
}

// ── Routes (Rutas) ────────────────────────────────────────────────

/**
 * Obtiene todos los puntos secuenciales que componen el trayecto de un servicio.
 * Los agrupa en un arreglo ordenado numéricamente gracias al "ORDER BY Orden".
 * 
 * @param {string} servicio El nombre o código del servicio de transporte (ej: 'Servicio de acercamiento FACIL').
 * @returns {Promise<RoutePoint[]>} La ruta a seguir representada en una lista de puntos.
 */
export async function getRouteByService(servicio: string): Promise<RoutePoint[]> {
    const pool = await getPool();
    const result = await pool
        .request()
        .input('servicio', sql.VarChar, servicio)
        .query(
            'SELECT Id as id, Servicio as servicio, Orden as orden, Latitud as latitud, Longitud as longitud FROM Ruta WHERE Servicio = @servicio ORDER BY Orden',
        );
    return result.recordset;
}

// ── GPS Positions (Posiciones GPS) ─────────────────────────────────────────

/**
 * Inserta un nuevo registro telemétrico GPS enviado por un móvil de transporte a la base de datos.
 * Evita la inyección SQL usando variables y tipos (@vehiculoId, @fechaHora, etc).
 * 
 * @param {number} vehiculoId 
 * @param {string} fechaHora El momento del registro GPS (formato String a convertir a Date).
 * @param {number} latitud 
 * @param {number} longitud 
 * @param {number} velocidad Velocidad dada en Km/h por el sensor del dispositivo.
 */
export async function insertGpsPosition(
    vehiculoId: number,
    fechaHora: string,
    latitud: number,
    longitud: number,
    velocidad: number,
): Promise<void> {
    const pool = await getPool();
    await pool
        .request()
        .input('vehiculoId', sql.Int, vehiculoId)
        .input('fechaHora', sql.DateTime2, new Date(fechaHora))
        .input('latitud', sql.Float, latitud)
        .input('longitud', sql.Float, longitud)
        .input('velocidad', sql.Float, velocidad)
        .query(
            'INSERT INTO GPS_Posicion (VehiculoId, FechaHora, Latitud, Longitud, Velocidad) VALUES (@vehiculoId, @fechaHora, @latitud, @longitud, @velocidad)',
        );
}

/**
 * Retorna el historial de los últimos movimientos o señales de GPS del vehículo especificado.
 * Ideal para trazar su recorrido reciente (una cola (tail) de las posiciones previas).
 * 
 * @param {number} vehiculoId El ID del vehículo.
 * @param {number} limit El número máximo de registros a traer (por defecto 100) para no saturar memoria.
 * @returns {Promise<GpsRecord[]>} Arreglo con los reportes GPS más recientes.
 */
export async function getGpsHistory(vehiculoId: number, limit = 100): Promise<GpsRecord[]> {
    const pool = await getPool();
    const result = await pool
        .request()
        .input('vehiculoId', sql.Int, vehiculoId)
        .input('limit', sql.Int, limit)
        .query(
            'SELECT TOP (@limit) Id as id, VehiculoId as vehiculoId, FechaHora as fechaHora, Latitud as latitud, Longitud as longitud, Velocidad as velocidad FROM GPS_Posicion WHERE VehiculoId = @vehiculoId ORDER BY FechaHora DESC',
        );
    return result.recordset;
}
