/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unalm: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#006837', // Verde Institucional Molinero
          700: '#00522b',
          800: '#004d28', // Verde Oscuro Secundario
          900: '#00381d',
          950: '#002211',
        },
        status: {
          nuevo: '#3b82f6',        // Azul
          asignado: '#6366f1',     // Indigo
          enproceso: '#0284c7',    // Celeste Sky
          pendiente: '#d97706',    // Ambar / Naranja
          resuelto: '#059669',     // Esmeralda / Verde
          cerrado: '#475569',      // Gris Slate
          reabierto: '#dc2626',    // Rojo
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
