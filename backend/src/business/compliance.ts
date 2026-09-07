/**
 * Funciones de Negocio: Evaluación de Cumplimiento.
 * Aquí calculamos matemáticamente si un vehículo está obedeciendo sus parámetros o no.
 */
import { LatLng, haversineDistance } from '../geospatial';
import { RouteComplianceResult, RouteComplianceStatus, RoutePoint, TemporalComplianceResult } from '../gps/types';

/**
 * Determina el cumplimiento de la ruta comparando la posición actual de un 
 * vehículo con el punto más cercano de su ruta teórica asignada.
 *
 * Reglas de desvío oficial:
 *   0 a 30 metros   → EN_RUTA (Perfecto)
 *   30 a 100 metros → DESVIACION (Se alejó levemente)
 *   >100 metros     → FUERA_DE_RUTA (Posible fuga o desviación grave)
 * 
 * @param {LatLng} position La ubicación actual del bus.
 * @param {RoutePoint[]} routePoints Arreglo con toda la ruta oficial.
 * @returns {RouteComplianceResult} Un objeto indicando estado, distancia y punto más cercano.
 */
export function evaluateRouteCompliance(
    position: LatLng,
    routePoints: RoutePoint[],
): RouteComplianceResult {
    let minDist = Infinity;
    let nearestOrder = 0;

    for (const rp of routePoints) {
        const d = haversineDistance(position, { latitude: rp.latitud, longitude: rp.longitud });
        if (d < minDist) {
            minDist = d;
            nearestOrder = rp.orden;
        }
    }

    let status: RouteComplianceStatus;
    if (minDist <= 30) {
        status = 'EN_RUTA';
    } else if (minDist <= 100) {
        status = 'DESVIACION';
    } else {
        status = 'FUERA_DE_RUTA';
    }

    return { distanceMeters: Math.round(minDist * 100) / 100, status, nearestRoutePointOrder: nearestOrder };
}

/**
 * Compara el tiempo planificado versus el tiempo real transcurrido para 
 * determinar si el vehículo cumple con el itinerario (horarios).
 * 
 * @param {number} plannedMinutes Los minutos que debería haberse demorado teóricamente.
 * @param {number} realMinutes Los minutos que realmente se demoró en la vida real.
 * @returns {TemporalComplianceResult} ADELANTADO (llegó antes), ATRASADO (llegó tarde) o A_TIEMPO (dentro de lo esperado +- 1 minuto).
 */
export function evaluateTemporalCompliance(
    plannedMinutes: number,
    realMinutes: number,
): TemporalComplianceResult {
    const diff = realMinutes - plannedMinutes;
    let status: TemporalComplianceResult['status'];

    if (diff < -1) {
        status = 'ADELANTADO';
    } else if (diff > 1) {
        status = 'ATRASADO';
    } else {
        status = 'A_TIEMPO';
    }

    return {
        plannedMinutes,
        realMinutes,
        differenceMinutes: Math.round(diff * 100) / 100,
        status,
    };
}
