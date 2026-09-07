import geometry from './demo-route.json';

export type Coordinate = [number, number];
export const PLAYBACK_TICK_MS = 120;
export const DEMO_SPEED_KMH = 30;
// Tres segundos de recorrido por cada segundo de reproducción.
export const PLAYBACK_RATE = 3;

export function haversineM(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180;
  const s = Math.sin((b[0] - a[0]) * rad / 2) ** 2
    + Math.cos(a[0] * rad) * Math.cos(b[0] * rad)
    * Math.sin((b[1] - a[1]) * rad / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, s)));
}

/** Distancia al segmento finito, incluidos sus extremos, en un plano métrico local. */
export function getCompliance(pos: Coordinate, route: Coordinate[]) {
  let minDist = Infinity;
  let nearest = 0;
  const scale = Math.PI / 180 * 6_371_000;
  const longitudeScale = scale * Math.cos(pos[0] * Math.PI / 180);
  for (let i = 0; i < route.length; i++) {
    const a = route[i];
    const b = route[Math.min(i + 1, route.length - 1)];
    const ax = (a[1] - pos[1]) * longitudeScale;
    const ay = (a[0] - pos[0]) * scale;
    const dx = (b[1] - a[1]) * longitudeScale;
    const dy = (b[0] - a[0]) * scale;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared));
    const distance = Math.hypot(ax + t * dx, ay + t * dy);
    if (distance < minDist) {
      minDist = distance;
      nearest = t <= 0.5 ? i + 1 : Math.min(i + 2, route.length);
    }
  }
  const status: 'EN_RUTA' | 'DESVIACION' | 'FUERA_DE_RUTA' = minDist <= 30 ? 'EN_RUTA' : minDist <= 100 ? 'DESVIACION' : 'FUERA_DE_RUTA';
  return { distanceMeters: Math.round(minDist * 10) / 10, status, nearest };
}

/** Conserva todos los vértices de las calles; nunca interpola atravesando una esquina. */
export function interpolatePath(path: Coordinate[]): Coordinate[] {
  if (path.length === 0) return [];
  const result: Coordinate[] = [path[0]];
  const stepMeters = DEMO_SPEED_KMH / 3.6 * PLAYBACK_TICK_MS / 1000 * PLAYBACK_RATE;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const steps = Math.ceil(haversineM(a, b) / stepMeters);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return result;
}

export function buildDemoRoutes() {
  // GeoJSON [longitud, latitud] → Leaflet [latitud, longitud].
  // Geometría guardada para reproducir las mismas calles incluso sin acceso a OSRM.
  const avenue: Coordinate[] = geometry.avenue.map(([lng, lat]) => [lat, lng]);
  const detour: Coordinate[] = geometry.detour.map(([lng, lat]) => [lat, lng]);
  const indexOf = (point: Coordinate) => {
    const index = avenue.findIndex(([lat, lng]) => lat === point[0] && lng === point[1]);
    if (index < 0) throw new Error('El empalme no pertenece a la avenida de demostración');
    return index;
  };
  const exit = indexOf(detour[0]);
  const rejoin = indexOf(detour[detour.length - 1]);
  const end = indexOf([-38.740284, -72.602014]);
  if (!(exit < rejoin && rejoin < end && end < avenue.length - 1)) {
    throw new Error('Orden inválido de los tramos de demostración');
  }
  return {
    routePoints: avenue.slice(0, end + 1),
    vehiclePath: interpolatePath([
      ...avenue.slice(0, exit), ...detour, ...avenue.slice(rejoin + 1),
    ]),
  };
}
