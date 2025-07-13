// src/player/CameraController.ts

import * as THREE from 'three';
import { CHUNK_SIZE } from '../utils/constants'; // Asegúrate de importar CHUNK_SIZE si lo usas para la posición inicial

/**
 * Clase para controlar la cámara en un entorno 3D,
 * permitiendo movimiento con teclado (WASD) y rotación con ratón.
 */
export class CameraController {
    private camera: THREE.PerspectiveCamera; // La cámara que controlaremos
    private domElement: HTMLElement; // El elemento HTML para capturar eventos de entrada

    private moveForward = false;
    private moveBackward = false;
    private moveLeft = false;
    private moveRight = false;
    private moveUp = false; // Para volar hacia arriba
    private moveDown = false; // Para volar hacia abajo

    private movementSpeed = 5; // <-- ¡AUMENTADO! Velocidad de movimiento de la cámara (unidades por segundo)
    private lookSensitivity = 0.002; // Sensibilidad de rotación del ratón

    private pitch = 0; // Rotación vertical (arriba/abajo)
    private yaw = 0;   // Rotación horizontal (izquierda/derecha)

    private isPointerLocked = false; // Estado del bloqueo del puntero

    /**
     * @param camera La instancia de THREE.PerspectiveCamera a controlar.
     * @param domElement El elemento DOM donde se adjuntarán los listeners de eventos.
     */
    constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Inicializar la rotación de la cámara a partir de su orientación actual
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.yaw = euler.y;
        this.pitch = euler.x;

        this.addEventListeners();
        this.setupPointerLock();

        // Asegurarse de que la cámara esté en un estado inicial visible
        // La posición inicial de la cámara se establece aquí.
        // Puedes ajustarla para que esté fuera del cubo y mirando hacia él.
        this.camera.position.set(CHUNK_SIZE * 1.5, CHUNK_SIZE * 1.5, CHUNK_SIZE * 1.5);
        this.updateCameraRotation(); // Aplicar la rotación inicial
    }

    /**
     * Añade los event listeners para teclado y ratón.
     */
    private addEventListeners(): void {
        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onKeyUp.bind(this), false);
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    }

    /**
     * Configura la API de bloqueo del puntero para una experiencia de primera persona.
     */
    private setupPointerLock(): void {
        // Asegurarse de que los métodos existan en el elemento DOM o en el documento
        this.domElement.requestPointerLock = this.domElement.requestPointerLock ||
                                            (this.domElement as any).mozRequestPointerLock ||
                                            (this.domElement as any).webkitRequestPointerLock;

        document.exitPointerLock = document.exitPointerLock ||
                                  (document as any).mozExitPointerLock ||
                                  (document as any).webkitExitPointerLock;

        this.domElement.onclick = () => {
            this.domElement.requestPointerLock();
        };

        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
        document.addEventListener('mozpointerlockchange', this.onPointerLockChange.bind(this), false);
        document.addEventListener('webkitpointerlockchange', this.onPointerLockChange.bind(this), false);
    }

    /**
     * Maneja los cambios en el estado de bloqueo del puntero.
     */
    private onPointerLockChange(): void {
        if (document.pointerLockElement === this.domElement ||
            (document as any).mozPointerLockElement === this.domElement ||
            (document as any).webkitPointerLockElement === this.domElement) {
            this.isPointerLocked = true;
            console.log('Pointer Locked');
        } else {
            this.isPointerLocked = false;
            console.log('Pointer Unlocked');
        }
    }

    /**
     * Maneja el evento keydown para el movimiento.
     * @param event El evento de teclado.
     */
    private onKeyDown(event: KeyboardEvent): void {
        if (!this.isPointerLocked) return; // Solo procesar si el puntero está bloqueado
        switch (event.code) {
            case 'KeyW': // Adelante
                this.moveForward = true;
                break;
            case 'KeyS': // Atrás
                this.moveBackward = true;
                break;
            case 'KeyA': // Izquierda (strafe)
                this.moveLeft = true;
                break;
            case 'KeyD': // Derecha (strafe)
                this.moveRight = true;
                break;
            case 'Space': // Arriba (saltar/volar)
                this.moveUp = true;
                break;
            case 'ShiftLeft': // Abajo (agacharse/volar)
                this.moveDown = true;
                break;
        }
    }

    /**
     * Maneja el evento keyup para detener el movimiento.
     * @param event El evento de teclado.
     */
    private onKeyUp(event: KeyboardEvent): void {
        if (!this.isPointerLocked) return; // Solo procesar si el puntero está bloqueado
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'Space':
                this.moveUp = false;
                break;
            case 'ShiftLeft':
                this.moveDown = false;
                break;
        }
    }

    /**
     * Maneja el evento mousemove para la rotación de la cámara.
     * @param event El evento del ratón.
     */
    private onMouseMove(event: MouseEvent): void {
        if (!this.isPointerLocked) return; // Solo rotar si el puntero está bloqueado

        // Obtener el movimiento del ratón
        const movementX = event.movementX || (event as any).mozMovementX || (event as any).webkitMovementX || 0;
        const movementY = event.movementY || (event as any).mozMovementY || (event as any).webkitMovementY || 0;

        // Actualizar yaw (rotación horizontal) y pitch (rotación vertical)
        this.yaw -= movementX * this.lookSensitivity;
        this.pitch -= movementY * this.lookSensitivity;

        // Limitar la rotación vertical (pitch) para evitar voltear la cámara
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        this.updateCameraRotation();
    }

    /**
     * Aplica la rotación calculada (pitch y yaw) a la cámara.
     */
    private updateCameraRotation(): void {
        // Usar Euler para aplicar las rotaciones en el orden correcto (YXZ es común para FPS)
        this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    }

    /**
     * Actualiza la posición de la cámara basada en el estado de movimiento.
     * Debe ser llamada en cada frame del bucle de juego.
     * @param deltaTime El tiempo transcurrido desde el último frame en segundos.
     */
    public update(deltaTime: number): void {
        if (!this.isPointerLocked) return; // Solo mover si el puntero está bloqueado

        // Calcular la velocidad de movimiento real basada en deltaTime
        const actualMoveSpeed = this.movementSpeed * deltaTime;

        // Crear un vector de dirección para el movimiento
        const direction = new THREE.Vector3();

        // Obtener la dirección frontal de la cámara (donde está mirando)
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward); // Obtiene la dirección global de la cámara

        // Obtener la dirección lateral (strafe)
        const right = new THREE.Vector3();
        right.crossVectors(forward, this.camera.up); // Producto cruz para obtener el vector "derecha"
        right.normalize(); // Normalizar para evitar velocidad diagonal extra

        if (this.moveForward) direction.add(forward);
        if (this.moveBackward) direction.sub(forward); // Restar para ir hacia atrás
        if (this.moveRight) direction.add(right);
        if (this.moveLeft) direction.sub(right); // Restar para ir hacia la izquierda

        // Normalizar la dirección para que el movimiento diagonal no sea más rápido
        if (direction.lengthSq() > 0) { // Solo normalizar si hay movimiento
            direction.normalize();
        }

        // Aplicar movimiento horizontal
        this.camera.position.addScaledVector(direction, actualMoveSpeed);

        // Aplicar movimiento vertical (volar)
        if (this.moveUp) {
            this.camera.position.y += actualMoveSpeed;
        }
        if (this.moveDown) {
            this.camera.position.y -= actualMoveSpeed;
        }
    }
}
