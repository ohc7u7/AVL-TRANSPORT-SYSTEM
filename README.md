# AVL Transport System

Plataforma integral de supervisión de flotas y transporte colectivo (Automatic Vehicle Location) diseñada para cumplir con las normativas del Ministerio de Transportes y Telecomunicaciones de Chile (MTT). La solución une el control telemático procesado desde dispositivos de hardware (GPS/AVL) y la presentación en herramientas de gestión, tanto para operadores de plataforma web (ICECOR) como para los conductores en ruta a través de la App de Cabina (CYM Monitor).

## Arquitectura del Proyecto

El sistema se estructura en un modelo monorepo segmentado modularmente, orientado a microservicios y alta concurrencia geoespacial.

```
AVL-Transport-System/
├── backend/    - API Node.js con procesamiento de GPS en RT, MQTT y Sockets.
├── frontend/   - Panel de control React GIS orientado a la supervisión MTT.
├── simulator/  - Motor para simulación de flotas bajo escenarios controlados.
├── database/   - Esquemas, migraciones y conectores de SQL Server.
├── shared/     - Tipos, utilidades y dto compartidos entre módulos del sistema.
├── docs/       - Documentación sobre API y arquitectura del sistema.
└── tests/      - Pruebas end-to-end, de performance e integración de la plataforma.
```

## Stack Tecnológico

*   **Backend:** Node.js, TypeScript, Express, Socket.io, MQTT, SQL Server (mssql).
*   **Frontend:** React, TypeScript, Vite, Leaflet/Mapbox, Socket.io Client.
*   **Base de Datos:** SQL Server con soporte avanzado de procedimientos.
*   **Simulador:** Script en Node.js + TypeScript con generación pseudoaleatoria de telemetría geoespacial.

## Requisitos del Entorno

Asegúrese de contar con lo siguiente, que ha sido validado durante el inicializador:

*   **Node.js**: >= 18.x (versión LTS instalada y probada).
*   **npm**: Manejador oficial de paquetes para las dependencias.
*   **Git**: Para el control de versiones.
*   **SQL Server & SQLCMD**: Herramientas provistas para la ingesta y manipulación de DB (mssql).

## Instrucciones para Servir y Desarrollar

*La lógica de los módulos aún no esta desarrollada, se deja instruido para futuras implementaciones.*

1. **Instalar Dependencias** \
   Ejecutar desde la raíz del sistema para instalar dependencias de los módulos (backend, frontend, simulator) interconectados:
   ```bash
   npm install
   ```

2. **Levantar el Backend** \
   ```bash
   npm run start:backend
   ```

3. **Levantar el Frontend** \
   ```bash
   npm run start:frontend
   ```

4. **Levantar la Simulación** \
   ```bash
   npm run start:simulator
   ```
