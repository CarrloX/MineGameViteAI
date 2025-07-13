// src/main.ts
import { App } from './core/App';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
    console.error("No se encontró el elemento canvas con ID 'gameCanvas'.");
    throw new Error("Canvas element not found.");
}

const app = new App();

// Inicializar la aplicación con el canvas
app.initialize(canvas)
    .then(() => {
        console.log("Aplicación inicializada y bucle de juego comenzado.");
    })
    .catch((error) => {
        console.error("Error al inicializar la aplicación:", error);
    });

// Opcional: Manejar la limpieza al cerrar la página
window.addEventListener('beforeunload', () => {
    app.dispose();
});