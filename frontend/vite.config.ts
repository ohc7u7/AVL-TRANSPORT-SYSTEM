/**
 * Archivo de configuración de Vite.
 * Vite es la herramienta que compila nuestro código React para que el navegador lo entienda.
 * Es mucho más rápido que herramientas antiguas como Webpack.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * https://vite.dev/config/
 * Exportamos la configuración por defecto, agregando el plugin oficial de React.
 * Esto habilita características como la "recarga rápida" (Fast Refresh).
 */
export default defineConfig({
  plugins: [react()],
})
