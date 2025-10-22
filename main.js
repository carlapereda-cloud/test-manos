// PASO 1: Importar las herramientas que necesitamos de la librería de MediaPipe
// HandLandmarker = El detector de manos
// FilesetResolver = Una herramienta para cargar los "modelos" (archivos de IA)
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

// PASO 2: Encontrar los elementos HTML que creamos
const video = document.getElementById("webcam"); // El video
const canvas = document.getElementById("lienzo"); // El lienzo de dibujo
const ctx = canvas.getContext("2d"); // El "pincel" para dibujar en el lienzo

let handLandmarker; // Aquí guardaremos el detector de IA cuando esté listo

// PASO 3: Crear y configurar el detector de manos
async function crearDetectorManos() {
    // Resolver la ubicación de los archivos de IA (esto es necesario)
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    // Crear el detector
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            // Le decimos dónde está el "cerebro" (el archivo .task)
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/latest/hand_landmarker.task`,
            delegate: "GPU", // Usar la tarjeta gráfica (es más rápido)
        },
        runningMode: "VIDEO", // Le decimos que analizaremos un video
        numHands: 2, // Queremos detectar hasta 2 manos
    });

    // Una vez listo, activamos la cámara
    activarCamara();
}

// PASO 4: Pedir permiso y activar la cámara web
function activarCamara() {
    // Pedir permiso al usuario para usar la cámara
    // ¡¡ESTO SOLO FUNCIONA EN HTTPS o localhost!!
    navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
    })
    .then(stream => {
        // Si el usuario da permiso, ponemos el video de la cámara en nuestro <video>
        video.srcObject = stream;
        // Cuando el video empiece a reproducirse, iniciamos el bucle de detección
        video.addEventListener("loadeddata", iniciarDeteccion);
    })
    .catch(err => {
        // Si el usuario bloquea el permiso o algo falla
        console.error("¡ERROR! No se pudo acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara. Asegúrate de estar en un sitio seguro (https) y de dar permiso.");
    });
}

// PASO 5: El bucle de detección (el corazón del programa)
function iniciarDeteccion() {
    // Limpiamos el lienzo (borramos los dibujos del fotograma anterior)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Usamos el detector de IA para "ver" el fotograma actual del video
    const results = handLandmarker.detectForVideo(video, performance.now());

    // Si encontró manos, dibujamos los resultados
    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            // 'landmarks' es un array de 21 puntos (nudillos, puntas de los dedos, etc.)
            dibujarPuntosMano(landmarks);
        }
    }

    // Volvemos a llamar a esta función en el próximo fotograma (es un bucle infinito)
    requestAnimationFrame(iniciarDeteccion);
}

// Función auxiliar para dibujar los 21 puntos de la mano
function dibujarPuntosMano(landmarks) {
    // Dibujamos cada punto como un pequeño círculo rojo
    ctx.fillStyle = "#FF0000"; // Color rojo
    for (const point of landmarks) {
        // Reflejamos la coordenada X para que coincida con el video-espejo
        const x = canvas.width - (point.x * canvas.width);
        const y = point.y * canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI); // Círculo de 5px
        ctx.fill();
    }
}

// ¡¡Empezar todo!!
crearDetectorManos();