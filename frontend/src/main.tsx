/**
 * Archivo principal de React (Punto de entrada o Entry Point).
 * Aquí es donde la aplicación web comienza a ejecutarse.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

/**
 * Busca dentro del archivo index.html un elemento (div) con el id "root".
 * Luego, inyecta toda nuestra aplicación (App) dentro de ese div.
 * 
 * Usamos StrictMode para que React nos advierta de posibles errores durante el desarrollo.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
