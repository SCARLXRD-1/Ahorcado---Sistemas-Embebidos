import { supabase } from './insforge.js';

// Datos del juego
const palabras = [
    { palabra: "IOT", pista: "Conecta dispositivos a internet" },
    { palabra: "RTOS", pista: "Sistema operativo en tiempo real" },
    { palabra: "CAN", pista: "Bus usado en automóviles" },
    { palabra: "LIN", pista: "Bus de bajo costo" },
    { palabra: "MQTT", pista: "Protocolo basado en TCP para telemetría" },
    { palabra: "COAP", pista: "Protocolo basado en UDP" },
    { palabra: "I2C", pista: "Comunicación simple con pull-up" },
    { palabra: "I3C", pista: "Versión moderna de I2C" },
    { palabra: "TEDS", pista: "Datos del sensor para autoconfiguración" },
    { palabra: "ARDUINO", pista: "Plataforma de prototipado popular" }
];

// Variables de estado
let nickname = "";
let palabraSeleccionada = null;
let progreso = [];
let intentosMaximos = 6;
let intentosFallidos = 0;
let tiempoRestante = 30;
let score = 0;
let timerInterval = null;

// Elementos del DOM
const screenStart = document.getElementById("start-screen");
const screenGame = document.getElementById("game-screen");
const screenEnd = document.getElementById("end-screen");

const inputNickname = document.getElementById("nickname");
const btnStart = document.getElementById("btn-start");
const displayNickname = document.getElementById("display-nickname");
const displayScore = document.getElementById("display-score");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const pistaText = document.getElementById("pista");
const palabraContainer = document.getElementById("palabra");
const letrasContainer = document.getElementById("letras");

const hangmanParts = [
    document.querySelector(".head"),
    document.querySelector(".body"),
    document.querySelector(".left-arm"),
    document.querySelector(".right-arm"),
    document.querySelector(".left-leg"),
    document.querySelector(".right-leg")
];

const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");
const finalScoreDisplay = document.getElementById("final-score");
const btnRestart = document.getElementById("btn-restart");
const leaderboardList = document.getElementById("leaderboard-list");

// --- INICIO Y FLUJO DE PANTALLAS ---

btnStart.addEventListener("click", () => {
    const name = inputNickname.value.trim();
    if (name.length < 3) {
        alert("Por favor ingresa un Nickname de al menos 3 caracteres.");
        return;
    }
    nickname = name;
    displayNickname.innerText = nickname;
    iniciarJuego();
});

btnRestart.addEventListener("click", () => {
    iniciarJuego();
});

function changeScreen(screen) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
}

function iniciarJuego() {
    score = 0;
    intentosFallidos = 0;
    displayScore.innerText = score;
    hangmanParts.forEach(part => part.classList.add("hidden"));
    
    // Elegir palabra aleatoria
    palabraSeleccionada = palabras[Math.floor(Math.random() * palabras.length)];
    progreso = Array(palabraSeleccionada.palabra.length).fill("_");
    
    pistaText.innerText = palabraSeleccionada.pista;
    
    crearTeclado();
    mostrarPalabra();
    changeScreen(screenGame);
    reiniciarTemporizador();
}

// --- LOGICA DE JUEGO ---

function mostrarPalabra() {
    palabraContainer.innerText = progreso.join(" ");
}

function crearTeclado() {
    letrasContainer.innerHTML = "";
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
    letras.split("").forEach(letra => {
        const btn = document.createElement("button");
        btn.innerText = letra;
        btn.onclick = () => procesarIntento(letra, btn);
        letrasContainer.appendChild(btn);
    });
}

function procesarIntento(letra, btn) {
    if(btn) btn.disabled = true;
    
    let acierto = false;
    for (let i = 0; i < palabraSeleccionada.palabra.length; i++) {
        if (palabraSeleccionada.palabra[i] === letra) {
            progreso[i] = letra;
            acierto = true;
        }
    }

    if (acierto) {
        if(btn) btn.classList.add("correct");
        score += 10;
        displayScore.innerText = score;
        
        // Reiniciar tiempo al acertar una letra? Opcional. 
        // Lo mantendremos corriendo o lo reiniciamos para dar más chance.
        reiniciarTemporizador(); 
    } else {
        if(btn) btn.classList.add("wrong");
        registrarFallo();
    }

    mostrarPalabra();
    verificarEstado();
}

function registrarFallo() {
    if (intentosFallidos < intentosMaximos) {
        hangmanParts[intentosFallidos].classList.remove("hidden");
        // Shake animation on board
        screenGame.classList.remove("shake");
        void screenGame.offsetWidth; // trigger reflow
        screenGame.classList.add("shake");
        intentosFallidos++;
    }
    // Restar puntos por fallo
    score = Math.max(0, score - 5);
    displayScore.innerText = score;
    
    // Al fallar se reinicia el contador
    reiniciarTemporizador();
}

function verificarEstado() {
    // Si ya no quedan "_" en progreso, el jugador ganó
    if (!progreso.includes("_")) {
        terminarJuego(true);
    } 
    // Si alcanzo el máximo de fallos
    else if (intentosFallidos >= intentosMaximos) {
        terminarJuego(false);
    }
}

// --- TEMPORIZADOR ---

function reiniciarTemporizador() {
    clearInterval(timerInterval);
    tiempoRestante = 30;
    actualizarVistaTimer();
    
    timerInterval = setInterval(() => {
        tiempoRestante--;
        actualizarVistaTimer();
        
        if (tiempoRestante <= 0) {
            // El tiempo expiró, cuenta como un fallo
            registrarFallo();
            verificarEstado();
        }
    }, 1000);
}

function actualizarVistaTimer() {
    timerText.innerText = tiempoRestante + "s";
    const porcentaje = (tiempoRestante / 30) * 100;
    timerBar.style.width = porcentaje + "%";
    
    if (tiempoRestante <= 10) {
        timerBar.style.backgroundColor = "var(--error)";
        timerText.style.color = "var(--error)";
    } else if (tiempoRestante <= 20) {
        timerBar.style.backgroundColor = "var(--warning)";
        timerText.style.color = "var(--warning)";
    } else {
        timerBar.style.backgroundColor = "var(--success)";
        timerText.style.color = "var(--text-muted)";
    }
}

// --- FIN DEL JUEGO ---

async function terminarJuego(victoria) {
    clearInterval(timerInterval);
    
    if (victoria) {
        // Bonus por intentos restantes y tiempo
        const intentosRestantes = intentosMaximos - intentosFallidos;
        score += (intentosRestantes * 20);
        score += (tiempoRestante * 2);
        
        endTitle.innerText = "🎉 ¡Ganaste!";
        endMessage.innerText = `¡Descubriste la palabra: ${palabraSeleccionada.palabra}!`;
        endTitle.style.color = "var(--success)";
    } else {
        endTitle.innerText = "💀 Perdiste";
        endMessage.innerText = `La palabra era: ${palabraSeleccionada.palabra}`;
        endTitle.style.color = "var(--error)";
    }

    finalScoreDisplay.innerText = score;
    changeScreen(screenEnd);

    // Guardar puntuación en base de datos
    await guardarPuntuacion(nickname, score);
}

// --- INTEGRACIÓN CON INSFORGE (SUPABASE) ---

async function guardarPuntuacion(player, puntos) {
    if (!supabase) return;
    try {
        const { error } = await supabase
            .from('leaderboard')
            .insert([{ player_name: player, score: puntos }]);
            
        if (error) throw error;
        // Refrescar leaderboard inmediatamente
        fetchLeaderboard();
    } catch (err) {
        console.error("Error guardando puntuación:", err);
    }
}

async function fetchLeaderboard() {
    if (!supabase) return;
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('player_name, score')
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        renderLeaderboard(data);
    } catch (err) {
        console.error("Error obteniendo leaderboard:", err);
        leaderboardList.innerHTML = `<li class="loading">Error al cargar leaderboard</li>`;
    }
}

function renderLeaderboard(data) {
    leaderboardList.innerHTML = "";
    if (data.length === 0) {
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

// Configurar suscripción en tiempo real para el Leaderboard
function setupRealtimeSubscription() {
    if (!supabase) return;
    supabase
        .channel('public:leaderboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, payload => {
            console.log("Cambio en leaderboard detectado!", payload);
            fetchLeaderboard();
        })
        .subscribe();
}

// Inicializar la tabla al cargar la página
window.addEventListener("DOMContentLoaded", () => {
    fetchLeaderboard();
    setupRealtimeSubscription();
});
