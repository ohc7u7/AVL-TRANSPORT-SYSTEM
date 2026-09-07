/**
 * Importamos las herramientas de Express y el controlador (repositorio).
 */
import { Router, Request, Response } from 'express';
import { getGpsHistory } from '../vehicles/repository';

const router = Router();

/**
 * RUTA GET HTTP: /gps/:vehiculoId
 * Esta ruta devuelve todo el historial de puntos GPS almacenados recientemente para un vehículo en particular.
 * 
 * @param {Request} req Usa los 'params' para extraer el ID del vehículo que se solicita ver en el mapa.
 * @param {Response} res Responde con el arreglo de todo su trayecto histórico.
 */
router.get('/:vehiculoId', async (req: Request, res: Response) => {
    // Ejecuta una petición hacia la base de datos mandando el ID transformado a número
    const history = await getGpsHistory(Number(req.params.vehiculoId));

    // Le retorna el historial al que hizo la llamada
    res.json(history);
});

export default router;
