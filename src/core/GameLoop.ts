// src/core/GameLoop.ts
export class GameLoop {
    private lastFrameTime = 0;
    private animationFrameId: number | null = null;
    private updateCallback: (deltaTime: number) => void;
    private renderCallback: () => void;

    constructor(updateCallback: (deltaTime: number) => void, renderCallback: () => void) {
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;
    }

    private loop = (currentTime: DOMHighResTimeStamp) => {
        // Calcular el tiempo transcurrido desde el último frame en segundos
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convertir ms a segundos
        this.lastFrameTime = currentTime;

        // Llamar a la función de actualización del juego
        this.updateCallback(deltaTime);

        // Llamar a la función de renderizado
        this.renderCallback();

        // Solicitar el siguiente frame de animación
        this.animationFrameId = requestAnimationFrame(this.loop);
    };

    public start(): void {
        if (this.animationFrameId === null) {
            this.lastFrameTime = performance.now(); // Inicializar para el primer delta
            this.animationFrameId = requestAnimationFrame(this.loop);
            console.log("GameLoop started.");
        }
    }

    public stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log("GameLoop stopped.");
        }
    }
}