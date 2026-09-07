/**
 * Configuración de un "Router" de Express para manejar peticiones de rutas.
 */
import { Router, Request, Response } from 'express';
import { getRouteByService } from '../vehicles/repository';

/** Instanciamos un nuevo Enrutador */
const router = Router();

/**
 * RUTA GET HTTP: /routes/:servicio
 * Obtiene los detalles de una ruta específica utilizando su nombre de servicio (ej "A1").
 * 
 * @param {Request} req - Objeto con la información de la petición.
 * @param {Response} res - Objeto usado para enviar la respuesta.
 */
router.get('/:servicio', async (req: Request, res: Response) => {
    // Busca los datos de esta ruta en la base de datos usando un repositorio intermedio
    const route = await getRouteByService(req.params.servicio as string);

    // Regresamos la ruta decodificada en formato JSON listo para el frontend
    res.json(route);
});

export default router;
