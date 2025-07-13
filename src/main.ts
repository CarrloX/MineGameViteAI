// src/main.ts
import { App } from './core/App';

// Asegúrate de que el ID aquí coincide con el del index.html
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
    console.error("No se encontró el elemento canvas con ID 'gameCanvas'.");
    throw new Error("Canvas element not found."); // Detener la ejecución si no se encuentra
}

const app = new App();

app.initialize(canvas) // Asegúrate de que 'canvas' se pasa aquí
    .then(() => {
        console.log("Aplicación inicializada y bucle de juego comenzado.");
    })
    .catch((error) => {
        console.error("Error al inicializar la aplicación:", error);
    });

window.addEventListener('beforeunload', () => {
    app.dispose();
});