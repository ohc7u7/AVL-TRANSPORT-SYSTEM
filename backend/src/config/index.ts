/**
 * Importamos dotenv para leer variables de entorno desde un archivo .env.
 * Esto es muy útil para no guardar contraseñas o rutas directamente en el código.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

/**
 * Objeto de configuración principal (config).
 * Aquí se almacenan variables importantes que todo nuestro programa (backend) usará.
 * Al usar process.env leemos variables de entorno, y si no existen usamos un valor por defecto (como '3000').
 */
export const config = {
    /** Puerto donde correrá nuestro servidor */
    port: parseInt(process.env.PORT || '3000', 10),

    /** Configuración para la conexión a la base de datos SQL Server */
    db: {
        server: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'AVLTransport',
        options: {
            encrypt: false,
            trustServerCertificate: true,
        },
    },

    /** Configuración de CORS para permitir peticiones desde nuestro frontend (React) */
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
};
