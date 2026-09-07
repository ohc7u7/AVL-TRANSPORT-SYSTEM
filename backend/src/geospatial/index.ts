/**
 * Interfaz que define un punto en el mapa (Latitud y Longitud).
 * Facilita que siempre le enviemos los datos correctos a nuestras funciones.
 */
export interface LatLng {
    latitude: number;
    longitude: number;
}

/**
 * Calcula la distancia (en metros) entre dos coordenadas geográficas
 * usando la fórmula de Haversine (que toma en cuenta la curvatura de la Tierra).
 * 
 * @param {LatLng} a - El punto de inicio.
 * @param {LatLng} b - El punto de destino.
 * @returns {number} La distancia calculada en metros.
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
    const R = 6_371_000; // Radio de la Tierra en metros
    // Función auxiliar para convertir grados a radianes
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);

    const aVal =
        sinDLat * sinDLat +
        Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;

    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c; // Resultado final de la distancia
}

/**
 * Interpola (crea) N puntos separados por igual distancia entre dos coordenadas.
 * Útil para calcular rutas más suaves o para simular el movimiento de un vehículo.
 * 
 * @param {LatLng} start - El punto donde se empieza.
 * @param {LatLng} end - El punto de llegada.
 * @param {number} steps - La cantidad de puntos intermedios a generar.
 * @returns {LatLng[]} Arreglo (lista) con todos los puntos generados.
 */
export function interpolatePoints(start: LatLng, end: LatLng, steps: number): LatLng[] {
    const points: LatLng[] = [];
    for (let i = 1; i <= steps; i++) {
        const t = i / (steps + 1); // Calcula la proporción para cada paso
        points.push({
            latitude: start.latitude + (end.latitude - start.latitude) * t,
            longitude: start.longitude + (end.longitude - start.longitude) * t,
        });
    }
    return points;
}
