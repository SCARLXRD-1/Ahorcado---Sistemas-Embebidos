import { insforge } from './insforge.js';

// ══════════════════════════════════════════════
//  BANCO DE PALABRAS (mínimo 4 para una partida)
// ══════════════════════════════════════════════
const BANCO_PALABRAS = [
    { palabra: "IOT", pista: "Conecta dispositivos a internet" },
    { palabra: "DOMOTICA", pista: "Sistemas en casas inteligentes" },
    { palabra: "AUTOMATIZACION", pista: "Uso en fábricas automatizadas" },
    { palabra: "SENSORES", pista: "Dispositivos que capturan datos" },
    { palabra: "ACTUADORES", pista: "Dispositivos que ejecutan acciones" },
    { palabra: "DETERMINISMO", pista: "Respuesta garantizada en tiempo definido" },
    { palabra: "ENERGIA", pista: "Uso eficiente de energía en dispositivos" },
    { palabra: "RECURSOS", pista: "Memoria y capacidad limitadas" },
    { palabra: "RTOS", pista: "Sistema operativo en tiempo real" },
    { palabra: "INTEROPERABILIDAD", pista: "Comunicación entre dispositivos" },
    { palabra: "IEEE1451", pista: "Estándar para sensores inteligentes" },
    { palabra: "NCAP", pista: "Interfaz de red del sistema" },
    { palabra: "TII", pista: "Interfaz independiente de transductores" },
    { palabra: "STIM", pista: "Módulo con sensores físicos" },
    { palabra: "TEDS", pista: "Datos electrónicos del sensor" },
    { palabra: "I2C", pista: "Comunicación simple con resistencias pull-up" },
    { palabra: "I3C", pista: "Evolución moderna de I2C" },
    { palabra: "CAN", pista: "Bus confiable en automóviles" },
    { palabra: "LIN", pista: "Red de bajo costo maestro-esclavo" },
    { palabra: "MQTT", pista: "Protocolo IoT basado en TCP" },
    { palabra: "COAP", pista: "Protocolo IoT basado en UDP" },
    { palabra: "PERCEPCION", pista: "Capa donde se encuentran sensores y actuadores" },
    { palabra: "RED", pista: "Capa de procesamiento y red de datos" },
    { palabra: "APLICACION", pista: "Capa de aplicaciones y gestión" },
    { palabra: "LPWAN", pista: "Redes de largo alcance y bajo consumo" },
    { palabra: "LORAWAN", pista: "Tecnología de comunicación IoT de largo alcance" }
];

// ══════════════════════════════════════════════
//  CONFIGURACIÓN DEL JUEGO
// ══════════════════════════════════════════════
const TOTAL_RONDAS       = 6;
const TIEMPO_POR_RONDA   = 30;       // segundos
const INTENTOS_MAXIMOS   = 6;        // partes del ahorcado
const PUNTOS_BASE        = 100;      // puntos que vale cada palabra al empezar
const PUNTOS_LETRA_MAL   = 15;       // se restan por cada letra incorrecta
const PUNTOS_TIEMPO_BONUS = 2;       // bonus por cada segundo restante al ganar

// ══════════════════════════════════════════════
//  ESTADO GLOBAL
// ══════════════════════════════════════════════
let nickname = "";
let rondaActual = 0;           // 0-indexed, va de 0 a TOTAL_RONDAS-1
let palabrasPartida = [];      // las 4 palabras elegidas para esta partida
let palabraActual = null;
let progreso = [];
let intentosFallidos = 0;
let tiempoRestante = TIEMPO_POR_RONDA;
let timerInterval = null;
let puntosRondaActual = 0;     // puntos ganados en la ronda actual
let puntosAcumulados = 0;      // puntos totales de toda la partida
let historialRondas = [];      // [{palabra, ganada, puntos}]
let rondaTerminada = false;    // flag para evitar doble disparo

let currentRecordId = null;    // Para actualizar el mismo registro al volver a jugar
let numeroDePartida = 1;       // Limitar el número de veces que puede jugar

// ══════════════════════════════════════════════
//  ELEMENTOS DEL DOM
// ══════════════════════════════════════════════
const screenStart     = document.getElementById("start-screen");
const screenGame      = document.getElementById("game-screen");
const screenRoundOver = document.getElementById("round-over-screen");
const screenEnd       = document.getElementById("end-screen");

const inputNickname   = document.getElementById("nickname");
const btnStart        = document.getElementById("btn-start");
const displayNickname = document.getElementById("display-nickname");
const displayScore    = document.getElementById("display-score");
const displayRound    = document.getElementById("display-round");
const displayTotal    = document.getElementById("display-total-rounds");

const btnEndGame      = document.getElementById("btn-end-game");

const timerBar        = document.getElementById("timer-bar");
const countdownRing   = document.getElementById("countdown-ring");
const countdownNumber = document.getElementById("countdown-number");
const CIRCUMFERENCE   = 2 * Math.PI * 44; // ~276.46 to match stroke-dasharray
const pistaText       = document.getElementById("pista");
const palabraContainer = document.getElementById("palabra");
const letrasContainer  = document.getElementById("letras");

const hangmanParts = document.querySelectorAll(".hangman-svg .part");

// Pantalla Round Over
const roundOverIcon    = document.getElementById("round-over-icon");
const roundOverTitle   = document.getElementById("round-over-title");
const roundOverMessage = document.getElementById("round-over-message");
const roundOverAnswer  = document.getElementById("round-over-answer");
const roundScoreSpan   = document.getElementById("round-score");
const roundTotalSpan   = document.getElementById("round-total");
const btnNextRound     = document.getElementById("btn-next-round");

// Pantalla Fin
const endTitle         = document.getElementById("end-title");
const endMessage       = document.getElementById("end-message");
const roundSummary     = document.getElementById("round-summary");
const finalScoreDisplay = document.getElementById("final-score");
const btnRestart       = document.getElementById("btn-restart");
const leaderboardList  = document.getElementById("leaderboard-list");

// ══════════════════════════════════════════════
//  EVENTOS
// ══════════════════════════════════════════════
btnStart.addEventListener("click", () => {
    const name = inputNickname.value.trim();
    if (name.length < 2) {
        inputNickname.classList.add("shake");
        setTimeout(() => inputNickname.classList.remove("shake"), 400);
        return;
    }
    nickname = name;
    displayNickname.innerText = nickname;
    displayTotal.innerText = TOTAL_RONDAS;
    iniciarPartida();
});

inputNickname.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnStart.click();
});

btnNextRound.addEventListener("click", () => {
    rondaActual++;
    if (rondaActual >= TOTAL_RONDAS) {
        terminarPartida();
    } else {
        iniciarRonda();
    }
});

btnRestart.addEventListener("click", () => {
    numeroDePartida++;
    iniciarPartida();
});

btnEndGame.addEventListener("click", () => {
    location.reload();
});

// ══════════════════════════════════════════════
//  FLUJO DE PANTALLAS
// ══════════════════════════════════════════════
function changeScreen(screen) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
}

// ══════════════════════════════════════════════
//  INICIO DE PARTIDA (4 rondas)
// ══════════════════════════════════════════════
function iniciarPartida() {
    puntosAcumulados = 0;
    rondaActual = 0;
    historialRondas = [];
    displayScore.innerText = 0;

    // Elegir 4 palabras aleatorias sin repetir
    const shuffled = [...BANCO_PALABRAS].sort(() => Math.random() - 0.5);
    palabrasPartida = shuffled.slice(0, TOTAL_RONDAS);

    iniciarRonda();
}

// ══════════════════════════════════════════════
//  INICIO DE RONDA
// ══════════════════════════════════════════════
function iniciarRonda() {
    rondaTerminada = false;
    intentosFallidos = 0;
    puntosRondaActual = PUNTOS_BASE;

    // Resetear ahorcado
    hangmanParts.forEach(part => part.classList.add("hidden"));

    // Palabra de esta ronda
    palabraActual = palabrasPartida[rondaActual];
    progreso = Array(palabraActual.palabra.length).fill("_");

    // Actualizar UI
    displayRound.innerText = rondaActual + 1;
    pistaText.innerText = palabraActual.pista;
    mostrarPalabra();
    crearTeclado();

    changeScreen(screenGame);
    reiniciarTemporizador();
}

// ══════════════════════════════════════════════
//  MOSTRAR PALABRA
// ══════════════════════════════════════════════
function mostrarPalabra() {
    palabraContainer.innerHTML = progreso
        .map(c => `<span class="letter-box ${c !== '_' ? 'revealed' : ''}">${c}</span>`)
        .join("");
}

// ══════════════════════════════════════════════
//  CREAR TECLADO (Fichas desordenadas)
// ══════════════════════════════════════════════
function crearTeclado() {
    letrasContainer.innerHTML = "";
    
    // Obtener las letras de la palabra
    let pool = palabraActual.palabra.split("");
    
    // Añadir letras señuelo (falsas)
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numDecoys = Math.max(4, Math.floor(palabraActual.palabra.length / 2)); 
    for(let i=0; i < numDecoys; i++){
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        pool.push(randomLetter);
    }

    // Mezclar el array de fichas
    pool.sort(() => Math.random() - 0.5);

    // Crear un botón para cada ficha
    pool.forEach(letra => {
        const btn = document.createElement("button");
        btn.innerText = letra;
        btn.onclick = () => procesarIntento(letra, btn);
        letrasContainer.appendChild(btn);
    });
}

// ══════════════════════════════════════════════
//  LÓGICA DE INTENTO
// ══════════════════════════════════════════════
function procesarIntento(letra, btn) {
    if (rondaTerminada) return;
    if (btn) btn.disabled = true;

    let indexToReveal = -1;
    // Buscar la primera aparición de la letra que aún no haya sido revelada
    for (let i = 0; i < palabraActual.palabra.length; i++) {
        if (palabraActual.palabra[i] === letra && progreso[i] === "_") {
            indexToReveal = i;
            break;
        }
    }

    if (indexToReveal !== -1) {
        // Se encontró una instancia de la letra para revelar
        progreso[indexToReveal] = letra;
        if (btn) btn.classList.add("correct");
    } else {
        // La letra no está en la palabra o ya se usaron todas sus instancias
        if (btn) btn.classList.add("wrong");
        
        // Restar puntos por letra incorrecta
        puntosRondaActual = Math.max(0, puntosRondaActual - PUNTOS_LETRA_MAL);
        
        // Mostrar parte del ahorcado
        if (intentosFallidos < INTENTOS_MAXIMOS) {
            hangmanParts[intentosFallidos].classList.remove("hidden");
            intentosFallidos++;
        }
        
        // Animación de error
        screenGame.classList.remove("shake");
        void screenGame.offsetWidth;
        screenGame.classList.add("shake");
    }

    mostrarPalabra();
    verificarEstado();
}

// ══════════════════════════════════════════════
//  VERIFICAR ESTADO DE LA RONDA
// ══════════════════════════════════════════════
function verificarEstado() {
    if (rondaTerminada) return;

    // Ganó la palabra
    if (!progreso.includes("_")) {
        finalizarRonda(true);
    }
    // Perdió por intentos
    else if (intentosFallidos >= INTENTOS_MAXIMOS) {
        finalizarRonda(false);
    }
}

// ══════════════════════════════════════════════
//  TEMPORIZADOR
// ══════════════════════════════════════════════
function reiniciarTemporizador() {
    clearInterval(timerInterval);
    tiempoRestante = TIEMPO_POR_RONDA;
    actualizarVistaTimer();

    timerInterval = setInterval(() => {
        tiempoRestante--;
        actualizarVistaTimer();

        if (tiempoRestante <= 0) {
            // Tiempo agotado → pierde esta ronda
            finalizarRonda(false, true);
        }
    }, 1000);
}

function actualizarVistaTimer() {
    // Update number
    countdownNumber.innerText = tiempoRestante;

    // Update bar width
    const porcentaje = (tiempoRestante / TIEMPO_POR_RONDA) * 100;
    timerBar.style.width = porcentaje + "%";

    // Update circular ring offset
    const offset = CIRCUMFERENCE * (1 - tiempoRestante / TIEMPO_POR_RONDA);
    countdownRing.style.strokeDashoffset = offset;

    // Color changes based on remaining time
    if (tiempoRestante <= 10) {
        timerBar.style.backgroundColor = "var(--error)";
        countdownRing.style.stroke = "var(--error)";
        countdownNumber.style.color = "var(--error)";
    } else if (tiempoRestante <= 20) {
        timerBar.style.backgroundColor = "var(--warning)";
        countdownRing.style.stroke = "var(--warning)";
        countdownNumber.style.color = "var(--warning)";
    } else {
        timerBar.style.backgroundColor = "var(--success)";
        countdownRing.style.stroke = "var(--success)";
        countdownNumber.style.color = "var(--text-main)";
    }
}

// ══════════════════════════════════════════════
//  FINALIZAR RONDA
// ══════════════════════════════════════════════
function finalizarRonda(ganada, tiempoAgotado = false) {
    if (rondaTerminada) return;
    rondaTerminada = true;
    clearInterval(timerInterval);

    // Desactivar teclado
    document.querySelectorAll(".keyboard button").forEach(btn => btn.disabled = true);

    let puntosFinales = 0;

    if (ganada) {
        // Bonus por tiempo restante
        puntosFinales = puntosRondaActual + (tiempoRestante * PUNTOS_TIEMPO_BONUS);
        roundOverIcon.innerText = "🎉";
        roundOverTitle.innerText = "¡Correcto!";
        roundOverTitle.style.color = "var(--success)";
        roundOverMessage.innerText = `¡Descubriste la palabra!`;
    } else if (tiempoAgotado) {
        puntosFinales = 0;
        roundOverIcon.innerText = "⏰";
        roundOverTitle.innerText = "¡Tiempo Agotado!";
        roundOverTitle.style.color = "var(--warning)";
        roundOverMessage.innerText = "Lo siento, tu tiempo terminó. ¡Vayamos a la siguiente pregunta!";
    } else {
        puntosFinales = 0;
        roundOverIcon.innerText = "💀";
        roundOverTitle.innerText = "¡Ahorcado!";
        roundOverTitle.style.color = "var(--error)";
        roundOverMessage.innerText = "Usaste todos tus intentos.";
    }

    // Guardar historial
    puntosAcumulados += puntosFinales;
    historialRondas.push({
        palabra: palabraActual.palabra,
        ganada: ganada,
        puntos: puntosFinales
    });

    // Actualizar UI
    displayScore.innerText = puntosAcumulados;
    roundOverAnswer.innerText = `La palabra era: ${palabraActual.palabra}`;
    roundScoreSpan.innerText = puntosFinales;
    roundTotalSpan.innerText = puntosAcumulados;

    // Texto del botón
    if (rondaActual + 1 >= TOTAL_RONDAS) {
        btnNextRound.innerText = "Ver Resultados Finales 🏁";
    } else {
        btnNextRound.innerText = `Siguiente Pregunta → (${rondaActual + 2}/${TOTAL_RONDAS})`;
    }

    changeScreen(screenRoundOver);
}

// ══════════════════════════════════════════════
//  FINALIZAR PARTIDA COMPLETA
// ══════════════════════════════════════════════
async function terminarPartida() {
    const rondasGanadas = historialRondas.filter(r => r.ganada).length;

    endTitle.innerText = rondasGanadas === TOTAL_RONDAS
        ? "🏆 ¡Partida Perfecta!"
        : rondasGanadas > 0
            ? "🎮 ¡Buen Juego!"
            : "😅 ¡Mejor suerte la próxima!";

    endMessage.innerText = `Acertaste ${rondasGanadas} de ${TOTAL_RONDAS} palabras.`;

    // Crear resumen de rondas
    roundSummary.innerHTML = historialRondas.map((r, i) => `
        <div class="summary-row ${r.ganada ? 'won' : 'lost'}">
            <span class="summary-round">Pregunta ${i + 1}</span>
            <span class="summary-word">${r.palabra}</span>
            <span class="summary-result">${r.ganada ? '✅' : '❌'}</span>
            <span class="summary-pts">${r.puntos} pts</span>
        </div>
    `).join("");

    finalScoreDisplay.innerText = puntosAcumulados;
    
    // Solo permitir jugar una vez más (máximo 2 partidas en total)
    if (numeroDePartida >= 2) {
        btnRestart.style.display = 'none';
    } else {
        btnRestart.style.display = 'inline-block';
    }
    
    changeScreen(screenEnd);

    // Guardar en base de datos
    await guardarPuntuacion(nickname, puntosAcumulados);
}

// ══════════════════════════════════════════════
//  INTEGRACIÓN CON INSFORGE
// ══════════════════════════════════════════════
async function guardarPuntuacion(player, puntos) {
    if (!insforge) {
        alert("Error de conexión: Cliente InsForge no inicializado");
        return;
    }
    try {
        if (currentRecordId) {
            // Actualizar registro existente
            const { error } = await insforge.database
                .from('leaderboard')
                .update({ score: puntos })
                .eq('id', currentRecordId);
            
            if (error) throw error;
        } else {
            // Insertar nuevo registro y recuperar su ID
            const { data, error } = await insforge.database
                .from('leaderboard')
                .insert([{ player_name: player, score: puntos }])
                .select();
                
            if (error) throw error;
            if (data && data.length > 0) {
                currentRecordId = data[0].id;
            }
        }
        
        fetchLeaderboard();
    } catch (err) {
        console.error("Error guardando puntuación:", err);
        // Si falla por falta de permisos en select, mostrar un aviso más amigable
        alert("Error guardando en BD: " + (err.message || "Error desconocido"));
    }
}

async function fetchLeaderboard() {
    if (!insforge) return;
    try {
        const { data, error } = await insforge.database
            .from('leaderboard')
            .select('player_name, score')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;
        renderLeaderboard(data);
    } catch (err) {
        console.error("Error obteniendo leaderboard:", err);
        leaderboardList.innerHTML = `<li class="loading">Error de BD: ${err.message || 'Error'}</li>`;
    }
}

function renderLeaderboard(data) {
    leaderboardList.innerHTML = "";
    if (!data || data.length === 0) {
        leaderboardList.innerHTML = `<li class="loading">Sin jugadores aún</li>`;
        return;
    }

    data.forEach((entry, index) => {
        let rankIcon = `#${index + 1}`;
        if (index === 0) rankIcon = "🥇";
        if (index === 1) rankIcon = "🥈";
        if (index === 2) rankIcon = "🥉";

        const li = document.createElement("li");
        li.innerHTML = `
            <div class="rank-wrapper">
                <span class="rank">${rankIcon}</span>
                <span class="player-name">${entry.player_name}</span>
            </div>
            <div class="score-badge">${entry.score} pts</div>
        `;
        leaderboardList.appendChild(li);
    });
}

function setupRealtimeSubscription() {
    if (!insforge) return;
    insforge
        .channel('public:leaderboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
            fetchLeaderboard();
        })
        .subscribe();
}

// ══════════════════════════════════════════════
//  INICIALIZAR AL CARGAR
// ══════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", () => {
    fetchLeaderboard();
    setupRealtimeSubscription();
});
