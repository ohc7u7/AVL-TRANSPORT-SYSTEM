# AVL Transport System

**Demostración técnica de seguimiento vehicular, evaluación de adherencia a ruta y trazabilidad de recorridos.**

El proyecto representa el desplazamiento de una micro sobre calles de Temuco y permite observar cómo cambia su estado al abandonar y retomar un trazado de referencia. Combina visualización cartográfica, procesamiento de coordenadas, comunicación mediante Socket.IO y una capa de persistencia en SQL Server.

## Objetivo de la actividad

Implementar un escenario reproducible que permita evaluar el movimiento de un vehículo, su distancia al recorrido asignado y la secuencia temporal de sus desviaciones. El resultado reúne una demostración visual y componentes de backend para recepción e historial de posiciones GPS.

## Funcionalidades

- **Recorrido sobre calles:** avance por avenida Caupolicán, desvío por Diego Portales y Lynch, reincorporación por Manuel Montt y continuación hasta superar el término del trazado.
- **Movimiento interpolado:** conservación de las esquinas y reproducción a 3× para revisar el recorrido completo en aproximadamente 74 segundos.
- **Clasificación de posición:** estados «En ruta», «Desviación» y «Fuera de ruta», con distancia al trazado expresada en metros.
- **Control de reproducción:** pausa, selección de un punto del recorrido y reinicio manual después de la detención final.
- **Reporte JSON:** resumen del viaje, cronología de cambios de estado, duración por condición, salidas, reincorporaciones y alejamiento máximo.
- **Servicios de datos:** API de vehículos, rutas e historial GPS, además de recepción y retransmisión de posiciones mediante Socket.IO.

## Stack tecnológico

| Capa | Tecnologías | Aplicación |
| --- | --- | --- |
| Interfaz | React, TypeScript, Vite | Panel de seguimiento y controles de reproducción |
| Cartografía | Leaflet, React Leaflet, OpenStreetMap | Mapa, trazado de referencia y trayectoria del vehículo |
| Geometría | Coordenadas obtenidas de OSRM y almacenadas en JSON | Recorrido reproducible sin consultar el motor de rutas en cada ejecución |
| Backend | Node.js, TypeScript, Express | API HTTP, validación y procesamiento de posiciones |
| Comunicación | Socket.IO | Conexión de clientes y eventos de telemetría |
| Persistencia | SQL Server, mssql | Vehículos, puntos de ruta y registros GPS con fecha y hora |
| Organización | npm workspaces, Git Flow, Conventional Commits | Gestión del monorepo e historial de cambios |

## Arquitectura y alcance actual

El repositorio contiene dos flujos de ejecución:

| Flujo | Funcionamiento |
| --- | --- |
| Demostración visual | El navegador reproduce la trayectoria local, calcula la distancia a sus segmentos y genera el reporte. El backend recibe la exportación y guarda el archivo JSON. |
| Telemetría de prueba | El simulador Node.js envía eventos `gps:position`. El backend valida los datos, intenta persistirlos en SQL Server, evalúa la ruta y emite `gps:update`. |

Actualmente, el vehículo del mapa se mueve mediante la reproducción local; no consume los eventos `gps:update`. El simulador independiente utiliza su propio recorrido de prueba. El indicador «Conectado» confirma la conexión Socket.IO con el backend, no el estado de SQL Server ni la recepción de un GPS físico.

### Criterio de adherencia

| Distancia al trazado | Estado |
| --- | --- |
| Hasta 30 m | En ruta |
| Más de 30 m y hasta 100 m | Desviación |
| Más de 100 m | Fuera de ruta |

En la demostración, la distancia se calcula contra los segmentos finitos de la ruta, incluidos sus extremos. Esto evita falsas desviaciones entre vértices y permite detectar el avance más allá del término del recorrido. La evaluación del backend compara la posición con los puntos de ruta almacenados en SQL Server.

Los umbrales y el servicio 503 corresponden al escenario de prueba; no acreditan un trazado autorizado ni cumplimiento normativo del MTT.

### Reportes y referencia temporal

La exportación agrupa la información por cambios de estado, en lugar de incluir cada punto de animación. Presenta fecha y hora en `America/Santiago` y conserva referencias ISO para su procesamiento.

Las duraciones corresponden al tiempo simulado: la reproducción acelerada comprime su visualización, las pausas no agregan tiempo y mover la barra reconstruye el recorrido hasta el punto seleccionado. La hora de exportación corresponde al momento real del guardado. Los eventos se detectan por muestra, con una resolución temporal simulada de 0,36 segundos.

## Estructura del repositorio

```text
backend/src/
  business/       Evaluación de ruta y diferencia de horario
  config/         Configuración de entorno
  database/       Conexión a SQL Server
  geospatial/     Distancias e interpolación
  gps/            Contratos y validación de posiciones
  realtime/       Eventos Socket.IO
  routes/         Endpoints HTTP
  vehicles/       Repositorios de datos
  server.ts       Inicio del servidor y exportación JSON
frontend/src/
  App.tsx         Panel cartográfico y reproducción
  demo-route.json Geometría del escenario
  demoRoute.ts    Interpolación y clasificación de posición
  tripReport.ts   Resumen y cronología del viaje
simulator/src/    Emisor independiente de telemetría
database/        Scripts de esquema y datos iniciales
```

## Ejecución local

Entorno utilizado para la demostración: Node.js 24 y npm. SQL Server se requiere para probar la persistencia y las consultas de telemetría. La carga del mapa base requiere acceso a Internet.

### 1. Instalar dependencias

Desde la raíz del repositorio:

```bash
npm ci
```

### 2. Configurar el entorno

Copiar `.env.example` a `.env` y completar las credenciales locales de SQL Server. El backend utiliza `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

Por defecto, el frontend y el backend utilizan `http://localhost:5173` y `http://localhost:3000`. Si se accede al frontend desde otra dirección, establecer `CORS_ORIGIN` en el entorno del backend con ese origen exacto. Para cambiar el destino del frontend, definir `VITE_API_BASE_URL` en `frontend/.env`.

Los archivos de entorno y las exportaciones generadas están excluidos del control de versiones.

### 3. Iniciar la demostración

Ejecutar cada comando en una terminal independiente:

```bash
npm run start:backend
npm run start:frontend
```

Abrir [http://localhost:5173](http://localhost:5173). El panel inicia el recorrido automáticamente. Al finalizar, el vehículo permanece detenido fuera de ruta; el botón de reproducción permite comenzar otro viaje.

El botón **Exportar a JSON** guarda el estado del recorrido y su cronología mediante el backend. Con el comando de desarrollo indicado, los archivos se escriben en `backend/stats/`.

### 4. Probar la telemetría con SQL Server

Ejecutar en orden:

1. `database/001_create_tables.sql`: creación de base de datos y tablas.
2. `database/002_seed_data.sql`: vehículo y ruta de prueba. Este script reemplaza los puntos existentes del servicio 503.

Con el backend activo, iniciar el emisor:

```bash
npm run start:simulator
```

La tabla `GPS_Posicion` registra vehículo, fecha y hora, latitud, longitud y velocidad. La disponibilidad del backend puede consultarse en [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Verificación técnica

```bash
npm run build --prefix backend
npm run build --prefix frontend
npx --no-install tsc --project simulator/tsconfig.json --noEmit
npm run lint --prefix frontend
```

Estas comprobaciones revisan compilación, tipos y análisis estático. La persistencia debe verificarse con una instancia SQL Server configurada. Los scripts `test` del backend y del simulador son marcadores y todavía no ejecutan una suite automatizada.

## Flujo de trabajo

- `develop`: integración del desarrollo.
- `master`: versión de entrega.
- `feature/*`: funcionalidades desarrolladas desde `develop`.
- `release/*`: preparación de entregas e integración en `master` y `develop`.
- `hotfix/*`: correcciones sobre `master`, integradas también en `develop`.

Los cambios se organizan por responsabilidad mediante Conventional Commits, con alcances como `backend`, `frontend`, `database`, `simulator` y `reports`.
