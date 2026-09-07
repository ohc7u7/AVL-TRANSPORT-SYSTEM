# 🚌 Sistema AVL (Automatic Vehicle Location) para Transporte Público

Documentación integral del proyecto de simulación y monitoreo de flota en tiempo real. 

---

## 🏛️ 1. Contexto del Negocio: ¿Para qué sirve este sistema?

Nuestra empresa se dedica a desarrollar **soluciones tecnológicas integrales para el transporte colectivo regional**. Unimos hardware telemático (GPS en los microbuses) con software de control en tiempo real.

### ¿Por qué hacer una Plataforma AVL?
En Chile, el **MTT (Ministerio de Transportes y Telecomunicaciones)** establece normativas estrictas para los operadores de transporte público, agrupadas en "Perímetros de Exclusión" y "Condiciones de Operación". Estos sistemas no son solo un mapa bonito, son herramientas **financieras y operativas obligatorias**.

1. **Subsidios del Estado:** El gobierno paga a las líneas de buses basándose en el cumplimiento de despachos, trazados y frecuencias. Si la empresa no puede probar tecnológicamente por dónde andaba el bus, no se le paga el subsidio.
2. **Fiscalización:** Se deben generar reportes exactos de puntualidad, regularidad (distancia/tiempo entre máquinas) y trazabilidad. 
3. **Gestión de Flota:** Los operadores necesitan saber al instante si un conductor se salió de la ruta (Desviación), si va muy lento, o si está adelantando a otro (acelerando desgaste y compitiendo por pasajeros).

### ¿Cómo usamos estos datos a nuestro favor?
La empresa dueña de la flota utiliza nuestro sistema para **garantizar la mayor recaudación posible de subsidios** logrando un 100% de cumplimiento. Además, con la data histórica en la base de datos, pueden optimizar horarios (mandar buses cuando la demanda es alta) e identificar conductores que incumplen los trazados.

---

## ⚙️ 2. Arquitectura de Tecnologías

Para lograr el monitoreo exacto, la latencia debe ser mínima (milisegundos) y a la vez el sistema debe guardar un trillón de datos históricos impecablemente ordenados.

### 🔌 Socket.io (Tiempo Real)
**¿Para qué sirve en este contexto?**
Los GPS vehiculares transmiten sus coordenadas constantemente (ej. cada 2 o 5 segundos). Una API tradicional (REST / HTTP) no soporta millones de peticiones individuales eficientemente debido al *overhead* de conexión HTTP.
* **Socket.io** crea un *túnel bidireccional continuo* (WebSockets).
* Permite que el panel de control del despachador en la pantalla (nuestro Frontend) reciba el movimiento del bus **de forma inmediata**, sin tener que refrescar la página.

### 🗄️ SQL Server (Persistencia e Histórico)
**¿Para qué sirve SQL Server aquí?**
Toda la maravilla del tiempo real es efímera. Cuando el MTT viene a auditar el mes pasado para pagar subsidios, Socket.io no tiene memoria, solo maneja el "ahora". 
* **SQL Server** actúa como el pilar de almacenamiento histórico (`GPS_Posicion`).
* Está estructurado con bases de datos relacionales porque las reglas de negocio son estrictas (`Vehiculo` tiene muchas `GPS_Posicion`). 
* Permite ejecutar cruces masivos (Ej: *Muéstrame todos los puntos GPS del bus SIM-001 de ayer que estuvieron a más de 100 metros de la Ruta 503*).

---

## 📂 3. Documentación del Repositorio (Estructura)

El sistema está construido como un **Monorepo** con NodeJS (`npm workspaces`). 

```text
AVL-Transport-System/
│
├── 📁 backend/                # Servidor central (Express)
│   ├── src/
│   │   ├── config/          # Variables de entorno y llaves.
│   │   ├── routes/          # API REST: Endpoints como /api/stats/export (Guarda JSON).
│   │   ├── business/        # REGLAS DEL NEGOCIO (Compliance/Desviaciones).
│   │   ├── server.ts        # Entry point del servidor, levanta HTTP y WebSockets.
│   │   └── realtime/        # Hilos WebSockets: Recibe GPS y lo inserta a SQL.
│   └── package.json
│
├── 📁 frontend/               # Panel de Fiscalización (React + Leaflet)
│   ├── src/
│   │   ├── App.tsx          # Corazón visual: Motor de mapa, reproductor OSRM, sockets.
│   │   └── App.css          # Estilos de UI (Barra transporte, botones, mapa oscuro).
│   └── package.json
│
├── 📁 simulator/              # Emulador IoT de Bus AVL.
│   ├── src/
│   │   └── index.ts         # Motor del bus virtual: Recorre puntos e inyecta sockets al backend.
│   └── package.json
│
├── 📁 database/               # Esquemas relacionales SQL Server
│   ├── 001_create_tables.sql
│   └── 002_seed_data.sql
│
└── 📁 stats/                  # Apartado de Repositorio para JSON Exportables
    └── (Aquí se guardan las exportaciones manuales del frontend)
```

---

## 🚀 4. Guía Rápida de Ejecución

1. **Configurar DB:** Correr los scripts de `database/` en SQL Server.
2. **Back-end:** Entrar a `backend/` y correr `npm start` (abre Socket.io en puerto 3000).
3. **Simulador:** Entrar a `simulator/` y correr `npm start` (simula la placa de GPS física de un bus inyectando data por Socket.io).
4. **Front-end:** Entrar a `frontend/` y correr `npm run dev` (visitar http://localhost:5173).

---

## 💾 5. Gestión del JSON (Estadísticas Guardadas)

El Frontend posee un botón de **Exportación**. Cuando el despachador necesita congelar las estadísticas (porcentaje completado del viaje, última lat/lng, cumplimiento), la interfaz se comunica con el servidor Node.js que procesa un archivo `.json` y lo salva físicamente en la carpeta `/stats` del repositorio.

Este proceso representa cómo la empresa exportaría métricas offline o aislaría episodios de la ruta (Ej. "Guardar snapshot de infracción") para revisión del regulador.
