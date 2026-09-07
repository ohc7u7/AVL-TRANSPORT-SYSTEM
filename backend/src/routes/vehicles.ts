/**
 * Configuración de las rutas web (API) de los vehículos de nuestro sistema AVL.
 */
import { Router, Request, Response } from 'express';
import { getAllVehicles, getVehicleById } from '../vehicles/repository';

const router = Router();

/**
 * RUTA GET HTTP: /vehicles/
 * Obtiene toda la lista con todos los vehículos de la base de datos.
 */
router.get('/', async (_req: Request, res: Response) => {
    const vehicles = await getAllVehicles();
    res.json(vehicles); // Envia la lista al usuario en formato JSON
});

/**
 * RUTA GET HTTP: /vehicles/:id
 * Busca un único vehículo dentro de la base de datos.
 */
router.get('/:id', async (req: Request, res: Response) => {
    const vehicle = await getVehicleById(Number(req.params.id));

    // Si no se encontró un vehículo con ese ID en la base de datos...
    if (!vehicle) {
        // ... devuelve un código de error de internet (404 no encontrado)
        res.status(404).json({ error: 'Vehículo no encontrado' });
        return;
    }

    res.json(vehicle);
});

export default router;
