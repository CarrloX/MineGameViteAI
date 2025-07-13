# MineGameViteAI

Este proyecto es un juego voxel desarrollado con Vite y TypeScript.
Puedes probar el juego directamente desde aqui [Clickeame](https://mine-game-vite-ai.vercel.app/)

## Estructura del proyecto

- `index.html`: Archivo principal de la aplicación. Debe estar en la raíz del proyecto.
- `src/`: Código fuente TypeScript.
  - `main.ts`: Punto de entrada de la aplicación.
  - `core/`, `rendering/`, `utils/`, `world/`: Módulos organizados por funcionalidad.
- `public/`: Carpeta para archivos estáticos (imágenes, fuentes, etc.).
- `vite.config.ts`: Configuración de Vite.

## Cómo ejecutar

1. Instala las dependencias:
   ```sh
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```sh
   npx vite
   ```
3. Abre tu navegador en `http://localhost:5173` (o el puerto que indique Vite).

## Notas
- El archivo `index.html` debe estar en la raíz del proyecto para que Vite lo detecte correctamente.
- Usa la carpeta `public/` solo para recursos estáticos.

---

¡Diviértete desarrollando tu juego voxel!
