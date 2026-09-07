/**
 * Importamos la librería 'mssql' para conectarnos a bases de datos SQL Server.
 */
import sql from 'mssql';
import { config } from '../config';

/** Variable para guardar el "pool" (grupo de conexiones) activo. Al iniciar es nulo. */
let pool: sql.ConnectionPool | null = null;

/**
 * Función para obtener la conexión a la base de datos.
 * Si ya existe una (en la variable pool), la devuelve. Si no, crea una nueva conexión.
 * El concepto de asincronía (async/await) permite esperar a que se conecte sin bloquear el resto del programa.
 * 
 * @returns {Promise<sql.ConnectionPool>} La conexión lista para usarse.
 */
export async function getPool(): Promise<sql.ConnectionPool> {
    if (!pool) {
        pool = await sql.connect({
            server: config.db.server,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
            options: config.db.options,
        });
        console.log('[DB] Conectado a SQL Server');
    }
    return pool;
}

/**
 * Función para cerrar la conexión con la base de datos.
 * Es importante hacer esto cuando el servidor se apaga para liberar recursos.
 */
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('[DB] Conexión cerrada');
    }
}

/** Exportamos el objeto 'sql' original por si algún otro archivo lo necesita usar directamente */
export { sql };
