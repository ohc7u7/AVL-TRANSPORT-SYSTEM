import { getCompliance, haversineM, PLAYBACK_RATE, PLAYBACK_TICK_MS } from './demoRoute';
import type { Coordinate } from './demoRoute';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
const round = (n: number) => Math.round(n * 100) / 100;
const labels = { EN_RUTA: 'En ruta', DESVIACION: 'Desviación', FUERA_DE_RUTA: 'Fuera de ruta' };
const position = ([lat, lng]: Coordinate) => ({ lat, lng });

/** Resumen del recorrido simulado hasta el punto seleccionado, no un registro GPS real. */
export function buildTripReport(path: Coordinate[], route: Coordinate[], index: number, startedAt: number, exportedAt: number) {
  if (!Number.isInteger(index) || index < 0 || index >= path.length || route.length === 0) {
    throw new Error('Punto de reporte inválido');
  }
  const stepSeconds = PLAYBACK_TICK_MS / 1000 * PLAYBACK_RATE;
  const timestamp = (i: number) => startedAt + i * stepSeconds * 1000;
  const groups: Array<{ start: number; end: number; status: keyof typeof labels; maxDistance: number }> = [];
  const totals = { EN_RUTA: 0, DESVIACION: 0, FUERA_DE_RUTA: 0 };
  let distance = 0;
  for (let i = 0; i <= index; i++) {
    const compliance = getCompliance(path[i], route);
    const previous = groups.at(-1);
    if (!previous || previous.status !== compliance.status) {
      if (previous) previous.end = i;
      groups.push({ start: i, end: i, status: compliance.status, maxDistance: compliance.distanceMeters });
    } else {
      previous.end = i;
      previous.maxDistance = Math.max(previous.maxDistance, compliance.distanceMeters);
    }
    if (i < index) totals[compliance.status] += stepSeconds;
    if (i > 0) distance += haversineM(path[i - 1], path[i]);
  }
  const duration = index * stepSeconds;
  return {
    fecha_exportacion: dateFormatter.format(exportedAt),
    zona_horaria: 'America/Santiago',
    simulacion: {
      fuente: 'Trayectoria de demostración; no corresponde a mediciones GPS reales',
      reproduccion: `${PLAYBACK_RATE}×`,
      criterio_temporal: 'Tiempo simulado desde el inicio. Pausar no suma tiempo; mover la barra reconstruye el recorrido hasta el punto elegido.',
      precision_temporal_segundos: stepSeconds,
      criterio_estados: 'Distancia a la línea: ≤30 m En ruta; >30 y ≤100 m Desviación; >100 m Fuera de ruta. Cambios detectados por muestra; sin interpolar el instante de cruce.',
    },
    resumen_viaje: {
      estado: index === path.length - 1 ? 'Finalizado' : 'Parcial',
      inicio: dateFormatter.format(startedAt),
      hasta: dateFormatter.format(timestamp(index)),
      duracion_simulada_segundos: round(duration),
      distancia_recorrida_metros: round(distance),
      velocidad_media_kmh: duration > 0 ? round(distance / duration * 3.6) : 0,
      tiempo_por_estado: Object.entries(totals).map(([state, seconds]) => ({
        estado: labels[state as keyof typeof labels],
        segundos: round(seconds),
        porcentaje: duration > 0 ? round(seconds / duration * 100) : 0,
      })),
      salidas_de_ruta: groups.filter((g, i) => i > 0 && groups[i - 1].status === 'EN_RUTA' && g.status !== 'EN_RUTA').length,
      reincorporaciones: groups.filter((g, i) => i > 0 && g.status === 'EN_RUTA').length,
      alejamiento_maximo_metros: Math.max(...groups.map(g => g.maxDistance)),
    },
    cronologia: groups.map((g, i) => ({
      evento: i === 0 ? 'Inicio del recorrido' : g.status === 'EN_RUTA' ? 'Reincorporación a la ruta'
        : g.status === 'DESVIACION' && groups[i - 1].status === 'FUERA_DE_RUTA' ? 'Acercamiento a la ruta'
          : g.status === 'DESVIACION' ? 'Inicio de desviación' : 'Supera 100 m de separación',
      estado: labels[g.status],
      desde: dateFormatter.format(timestamp(g.start)),
      hasta: dateFormatter.format(timestamp(g.end)),
      desde_iso: new Date(timestamp(g.start)).toISOString(),
      hasta_iso: new Date(timestamp(g.end)).toISOString(),
      duracion_segundos: round((g.end - g.start) * stepSeconds),
      posicion_inicio: position(path[g.start]),
      distancia_inicial_a_ruta_metros: getCompliance(path[g.start], route).distanceMeters,
      alejamiento_maximo_metros: g.maxDistance,
    })),
  };
}
