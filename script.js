// ==========================================
// PROGRES GLOBAL (timp, corectitudine, memorie scurtă/lungă)
// ==========================================
let memoryShort = 0;     // memorie pe termen scurt (0-100)
let memoryLong = 0;      // memorie pe termen lung (0-100)
let globalProgress = 0;   // progres global agregat (0-100)

let startTime = performance.now(); // momentul ultimei întrebări
let recentAnswers = [];            // ultimele răspunsuri corecte/greșite (true/false)
let conceptMemory = {};            // memorie pe termen lung per conceptId

// ==========================================
// VARIABILE GLOBALE JOC
// ==========================================
let soundEnabled = true;
let mathScore = 0;
let readingScore = 0;
let colorsScore = 0;
let writingScore = 0;

const maxQuestions = 5; // pentru reading, colors, writing

let currentMathAnswer, currentMathNum1, currentMathNum2;
let currentWord, currentColor, currentLetter;
let mathInputMode = "buttons"; // 'buttons' | 'input'

// Culori (fără repetiție)
let remainingColors = [];

// Voice TTS
let selectedVoice = null;

// Speech recognition pentru culori
let recognition;
let isListening = false;

// Canvas & scris
let canvas, ctx, templateCanvas, templateCtx;
let isDrawing = false;
let drawingPoints = [];
let templatePoints = [];
let canvasInitialized = false;
let availableLetters = [];

// ==========================================
// HELPER FUNCTIONS GENERALE
// ==========================================
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function normalizeText(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function startTimer() {
    startTime = performance.now();
}

// ==========================================
// NAVIGARE
// ==========================================
function showSection(sectionId) {
    document.querySelectorAll(".game-section, #menu")
        .forEach(sec => sec.classList.add("hidden"));

    document.getElementById(sectionId).classList.remove("hidden");

    if (sectionId === "menu") {
        speak("Meniu principal");
        resetScores();
    }
}

function startModule(moduleId) {
    showSection(moduleId);
    resetScores();

    switch (moduleId) {
        case "math":
            speak("Hai să facem matematică!");
            generateMathQuestion();
            break;
        case "reading":
            speak("Hai să citim cuvinte!");
            generateWordQuestion();
            break;
        case "colors":
            speak("Hai să învățăm culori!");
            generateColorQuestion();
            break;
        case "writing":
            speak("Hai să învățăm să scriem litere!");
            if (!canvasInitialized) initializeWritingCanvas();
            generateWritingExercise();
            break;
    }
}

function resetScores() {
    mathScore = 0;
    readingScore = 0;
    colorsScore = 0;
    writingScore = 0;

    updateProgress("math", 0);
    updateProgress("reading", 0);
    updateProgress("colors", 0);
    updateProgress("writing", 0);

    updateStars("math", 0);
    updateStars("reading", 0);
    updateStars("colors", 0);
    updateStars("writing", 0);

    remainingColors = shuffle([...colors]);
    availableLetters = [...letters];
}

// ==========================================
// TEXT-TO-SPEECH (Alesia - voce îmbunătățită)
// ==========================================
const preferredVoices = [
    "Microsoft Andrei",
    "Microsoft Irina",
    "Google ro-RO",
    "Google Romanian",
];

function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;

    for (const name of preferredVoices) {
        const v = voices.find(vc => vc.name.toLowerCase().includes(name.toLowerCase()));
        if (v) {
            selectedVoice = v;
            break;
        }
    }

    if (!selectedVoice) {
        selectedVoice =
            voices.find(v => v.lang === "ro-RO") ||
            voices.find(v => v.lang && v.lang.startsWith("ro"));
    }
}

window.speechSynthesis.onvoiceschanged = loadVoices;

function speak(text) {
    if (!soundEnabled) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ro-RO";
    u.rate = 0.85;
    u.pitch = 1.0;

    if (selectedVoice) {
        u.voice = selectedVoice;
    }

    window.speechSynthesis.speak(u);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById("tts-toggle").innerText =
        soundEnabled ? "🔊 Sunet: ON" : "🔇 Sunet: OFF";
}

// ==========================================
// MATEMATICĂ (nelimitat + input / butoane)
// ==========================================
function toggleMathMode() {
    mathInputMode = mathInputMode === "buttons" ? "input" : "buttons";
    document.getElementById("math-mode-toggle").innerText =
        mathInputMode === "buttons"
            ? " Scrie răspunsul"
            : "Alege dintre variante";
    generateMathQuestion();
}

function generateMathQuestion() {
    const feedback = document.getElementById("math-feedback");
    feedback.innerText = "";
    feedback.className = "feedback";

    document.getElementById("math-next").classList.add("hidden");

    currentMathNum1 = Math.floor(Math.random() * 10) + 1;
    currentMathNum2 = Math.floor(Math.random() * 10) + 1;
    currentMathAnswer = currentMathNum1 + currentMathNum2;

    document.getElementById("math-question").innerText =
        `${currentMathNum1} + ${currentMathNum2} = ?`;

    speak(`Cât face ${currentMathNum1} plus ${currentMathNum2}?`);

    const container = document.getElementById("math-options");
    startTimer(); // pornește cronometrul pentru această întrebare

    if (mathInputMode === "input") {
        container.innerHTML = `
            <div style="display:flex;gap:10px;justify-content:center">
                <input id="math-input" type="number" placeholder="Scrie"
                    style="font-size:2rem;padding:15px;width:150px;text-align:center;border:3px solid #4CAF50;border-radius:10px;">
                <button onclick="checkMathInput()" style="font-size:2rem;padding:15px 30px;">✓</button>
            </div>
        `;

        setTimeout(() => {
            const input = document.getElementById("math-input");
            input?.focus();
            input?.addEventListener("keypress", e => {
                if (e.key === "Enter") checkMathInput();
            });
        }, 100);
    } else {
        const wrongs = new Set();
        const offsets = [-3, -2, -1, 1, 2, 3];

        for (const off of offsets) {
            if (wrongs.size >= 2) break;
            const w = currentMathAnswer + off;
            if (w > 0 && w !== currentMathAnswer) wrongs.add(w);
        }

        while (wrongs.size < 2) {
            const w = Math.floor(Math.random() * 20) + 1;
            if (w !== currentMathAnswer) wrongs.add(w);
        }

        const options = shuffle([currentMathAnswer, ...wrongs]);

        container.innerHTML = options.map(o =>
            `<button onclick="checkMath(${o})">${o}</button>`
        ).join("");
    }
}

function checkMathInput() {
    const val = parseInt(document.getElementById("math-input").value);
    if (isNaN(val)) {
        speak("Te rog introdu un număr!");
        return;
    }
    checkMath(val);
}

function checkMath(answer) {
    const feedback = document.getElementById("math-feedback");
    const correct = answer === currentMathAnswer;

    // actualizăm progresul global (memorie, timp, corectitudine)
    updateGlobalProgress(
        correct,
        `MATH:${currentMathNum1}+${currentMathNum2}`
    );

    feedback.className = `feedback ${correct ? "success" : "error"}`;

    if (correct) {
        feedback.innerText = "🎉 Bravo! Corect!";
        speak("Bravo! Răspuns corect!");
        mathScore++;
        updateProgress("math", mathScore);
        updateStars("math", mathScore);
        showCelebration("🌟");
        document.getElementById("math-next").classList.remove("hidden");
        document.getElementById("math-options").innerHTML = "";
    } else {
        feedback.innerText = `💪 Mai încearcă! (${answer})`;
        speak("Mai încearcă încă o dată!");
        const inp = document.getElementById("math-input");
        if (inp) {
            inp.value = "";
            inp.focus();
        }
    }
}

// ==========================================
// CUVINTE (reading)
// ==========================================
const words = [
    { word: "CASĂ", image: "🏠", sound: "casă" },
    { word: "PISICĂ", image: "🐱", sound: "pisică" },
    { word: "FLOARE", image: "🌸", sound: "floare" },
    { word: "SOARE", image: "☀️", sound: "soare" },
    { word: "MAȘINĂ", image: "🚗", sound: "mașină" },
    { word: "CARTE", image: "📖", sound: "carte" },
    { word: "MERE", image: "🍎", sound: "mere" },
    { word: "COPAC", image: "🌳", sound: "copac" }
];

function generateWordQuestion() {
    if (readingScore >= maxQuestions) return showCompletion("reading");

    const fb = document.getElementById("reading-feedback");
    fb.innerText = "";
    fb.className = "feedback";

    document.getElementById("reading-next").classList.add("hidden");

    currentWord = words[Math.floor(Math.random() * words.length)];

    document.getElementById("word-display").innerText = currentWord.word;
    speak(`Citește cuvântul: ${currentWord.sound}`);

    const options = [currentWord];
    const others = words.filter(w => w.word !== currentWord.word);

    while (options.length < 3) {
        const r = others[Math.floor(Math.random() * others.length)];
        if (!options.includes(r)) options.push(r);
    }

    startTimer(); // pornește cronometrul pentru această întrebare

    document.getElementById("word-options").innerHTML =
        shuffle(options).map(o =>
            `<button onclick="checkWord('${o.word}')">${o.image}</button>`
        ).join("");
}

function checkWord(selected) {
    const fb = document.getElementById("reading-feedback");
    const isCorrect = (selected === currentWord.word);

    updateGlobalProgress(isCorrect, `WORD:${currentWord.word}`);

    if (isCorrect) {
        fb.className = "feedback success";
        fb.innerText = `🎉 Este ${currentWord.sound}!`;
        speak(`Bravo! Este ${currentWord.sound}!`);
        readingScore++;
        updateProgress("reading", readingScore);
        updateStars("reading", readingScore);
        showCelebration("📚");
        document.getElementById("reading-next").classList.remove("hidden");
        document.getElementById("word-options").innerHTML = "";
    } else {
        fb.className = "feedback error";
        fb.innerText = "💪 Mai încearcă!";
        speak("Mai încearcă încă o dată!");
    }
}

// ==========================================
// CULORI (Alesia + voce + fără repetiții)
// ==========================================
const colors = [
    { name: "ROȘU", hex: "#FF0000", sound: "roșu" },
    { name: "ALBASTRU", hex: "#0000FF", sound: "albastru" },
    { name: "VERDE", hex: "#00FF00", sound: "verde" },
    { name: "GALBEN", hex: "#FFFF00", sound: "galben" },
    { name: "PORTOCALIU", hex: "#FF8800", sound: "portocaliu" },
    { name: "ROZ", hex: "#FF69B4", sound: "roz" },
    { name: "VIOLET", hex: "#9370DB", sound: "violet" },
    { name: "NEGRU", hex: "#000000", sound: "negru" },
    { name: "ALB", hex: "#FFFFFF", sound: "alb" },
    { name: "GRI", hex: "#808080", sound: "gri" },
    { name: "MARO", hex: "#8B4513", sound: "maro" }
];

remainingColors = shuffle([...colors]);

function generateColorQuestion() {
    if (colorsScore >= maxQuestions) return showCompletion("colors");

    const fb = document.getElementById("colors-feedback");
    fb.innerText = "";
    fb.className = "feedback";

    document.getElementById("colors-next").classList.add("hidden");

    if (!remainingColors.length) {
        remainingColors = shuffle([...colors]);
    }

    currentColor = remainingColors.shift();

    document.getElementById("color-box").style.backgroundColor = currentColor.hex;
    speak("Ce culoare este aceasta?");

    const options = [currentColor];
    const others = colors.filter(c => c !== currentColor);

    while (options.length < 3) {
        const r = others[Math.floor(Math.random() * others.length)];
        if (!options.includes(r)) options.push(r);
    }

    startTimer(); // pornește cronometrul pentru această întrebare

    document.getElementById("color-options").innerHTML =
        shuffle(options).map(o =>
            `<button onclick="checkColor('${o.name}')">${o.name}</button>`
        ).join("");
}

function checkColor(selected) {
    validateColorAnswer(selected);
}

function validateColorAnswer(answerRaw) {
    const fb = document.getElementById("colors-feedback");

    const a = normalizeText(answerRaw);
    const c = normalizeText(currentColor.name);
    const isCorrect = (a === c);

    updateGlobalProgress(isCorrect, `COLOR:${currentColor.name}`);

    if (isCorrect) {
        fb.className = "feedback success";
        fb.innerText = `🎉 Minunat! Este ${currentColor.sound}!`;
        speak(`Bravo! Este ${currentColor.sound}!`);
        colorsScore++;
        updateProgress("colors", colorsScore);
        updateStars("colors", colorsScore);
        showCelebration("🎨");
        document.getElementById("colors-next").classList.remove("hidden");
        document.getElementById("color-options").innerHTML = "";
    } else {
        fb.className = "feedback error";
        fb.innerText = "💪 Mai gândește-te!";
        speak("Mai încearcă!");
    }
}

// ==========================================
// SPEECH RECOGNITION - Culori
// ==========================================
function setupSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    recognition = new SR();
    recognition.lang = "ro-RO";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = e => {
        const txt = e.results[0][0].transcript;
        validateColorAnswer(txt);
    };

    recognition.onerror = () => {
        speak("Nu am înțeles. Repetă sau folosește butoanele.");
        isListening = false;
        updateVoiceButton();
    };

    recognition.onend = () => {
        isListening = false;
        updateVoiceButton();
    };
}

function startColorVoiceInput() {
    if (!recognition) {
        alert("Browserul nu suportă recunoaștere vocală.");
        return;
    }

    if (!isListening) {
        isListening = true;
        updateVoiceButton();
        speak("Spune numele culorii.");
        recognition.start();
    } else {
        recognition.stop();
        isListening = false;
        updateVoiceButton();
    }
}

function updateVoiceButton() {
    const btn = document.getElementById("voice-btn");
    if (!btn) return;
    btn.innerText = isListening ? "⏹ Oprește microfonul" : "🎤 Spune culoarea";
}

// ==========================================
// MODUL SCRIS (writing) – CIPRIAN
// ==========================================
const letters = [
    { char: 'A', sound: 'A' }, { char: 'Ă', sound: 'Ă' },
    { char: 'Â', sound: 'Â din a' }, { char: 'B', sound: 'B' },
    { char: 'C', sound: 'C' }, { char: 'D', sound: 'D' },
    { char: 'E', sound: 'E' }, { char: 'F', sound: 'F' },
    { char: 'G', sound: 'G' }, { char: 'H', sound: 'H' },
    { char: 'I', sound: 'I' }, { char: 'Î', sound: 'Î din i' },
    { char: 'J', sound: 'J' }, { char: 'K', sound: 'K' },
    { char: 'L', sound: 'L' }, { char: 'M', sound: 'M' },
    { char: 'N', sound: 'N' }, { char: 'O', sound: 'O' },
    { char: 'P', sound: 'P' }, { char: 'Q', sound: 'Q' },
    { char: 'R', sound: 'R' }, { char: 'S', sound: 'S' },
    { char: 'Ș', sound: 'Ș' }, { char: 'T', sound: 'T' },
    { char: 'Ț', sound: 'Ț' }, { char: 'U', sound: 'U' },
    { char: 'V', sound: 'V' }, { char: 'W', sound: 'W' },
    { char: 'X', sound: 'X' }, { char: 'Y', sound: 'Y' },
    { char: 'Z', sound: 'Z' }
];

function initializeWritingCanvas() {
    canvas = document.getElementById("writing-canvas");
    templateCanvas = document.getElementById("template-canvas");

    if (!canvas || !templateCanvas) return;

    ctx = canvas.getContext("2d");
    templateCtx = templateCanvas.getContext("2d");

    const container = document.querySelector(".canvas-container");
    const size = Math.min(container.offsetWidth, container.offsetHeight);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    templateCanvas.style.width = size + "px";
    templateCanvas.style.height = size + "px";

    canvas.width = size;
    canvas.height = size;
    templateCanvas.width = size;
    templateCanvas.height = size;

    // Mouse events
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    // Touch events
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    document.getElementById("clear-btn").onclick = clearCanvas;
    document.getElementById("hint-btn").onclick = showHint;
    document.getElementById("check-writing-btn").onclick = checkWriting;

    canvasInitialized = true;
}

function generateWritingExercise() {
    if (writingScore >= maxQuestions) return showCompletion("writing");

    if (availableLetters.length === 0)
        availableLetters = [...letters];

    const index = Math.floor(Math.random() * availableLetters.length);
    currentLetter = availableLetters.splice(index, 1)[0];

    clearCanvas();
    document.getElementById("writing-feedback").innerText = "";
    document.getElementById("writing-feedback").className = "feedback";
    document.getElementById("writing-next").classList.add("hidden");
    document.getElementById("accuracy-display").classList.add("hidden");

    document.getElementById("current-letter").innerText =
        `Scrie litera: ${currentLetter.char}`;
    speak(`Hai să scriem litera ${currentLetter.sound}`);

    drawLetterTemplate(currentLetter.char);
    startTimer(); // pornește cronometrul pentru această literă
}

function drawLetterTemplate(letter) {
    templateCtx.clearRect(0, 0, templateCanvas.width, templateCanvas.height);
    templatePoints = [];

    const fontSize = Math.floor(templateCanvas.width * 0.7);
    templateCtx.font = `bold ${fontSize}px Arial`;
    templateCtx.fillStyle = "rgba(100,100,255,0.15)";
    templateCtx.textAlign = "center";
    templateCtx.textBaseline = "middle";

    const cx = templateCanvas.width / 2;
    const cy = templateCanvas.height / 2;

    templateCtx.fillText(letter, cx, cy);
    templateCtx.strokeStyle = "#4CAF50";
    templateCtx.lineWidth = 8;
    templateCtx.strokeText(letter, cx, cy);

    const img = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);

    for (let y = 0; y < img.height; y += 5) {
        for (let x = 0; x < img.width; x += 5) {
            const idx = (y * img.width + x) * 4;
            if (img.data[idx + 3] > 128) {
                templatePoints.push({ x, y });
            }
        }
    }
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingPoints.push({ x, y });
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.strokeStyle = "#2196F3";
    ctx.lineWidth = 15;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.lineTo(x, y);
    ctx.stroke();
    drawingPoints.push({ x, y });
}

function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e.touches[0]);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e.touches[0]);
}

function stopDrawing() {
    isDrawing = false;
}

function clearCanvas() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingPoints = [];
    document.getElementById("accuracy-display").classList.add("hidden");

    // regenerăm template-ul pentru litera curentă
    if (currentLetter) {
        drawLetterTemplate(currentLetter.char);
    }

    // resetăm feedback-ul
    const fb = document.getElementById("writing-feedback");
    fb.innerText = "";
    fb.className = "feedback";
}

function showHint() {
    speak("Începe de sus și urmărește conturul literei");

    let flashes = 0;
    const flashInterval = setInterval(() => {
        templateCanvas.style.opacity = (flashes % 2 === 0) ? "0.3" : "1";
        flashes++;
        if (flashes > 5) {
            clearInterval(flashInterval);
            templateCanvas.style.opacity = "1";
        }
    }, 300);
}

// ==========================================
// ALGORITMI PENTRU ACURATEȚE SCRIS
// ==========================================
function euclideanDistance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function resamplePoints(points, count) {
    if (points.length < 2) return points;
    let total = 0;
    const dists = [0];

    for (let i = 1; i < points.length; i++) {
        total += euclideanDistance(points[i], points[i - 1]);
        dists.push(total);
    }

    const step = total / (count - 1);
    const newPoints = [points[0]];
    let target = step;

    for (let i = 1; i < points.length; i++) {
        while (target <= dists[i]) {
            const ratio = (target - dists[i - 1]) / (dists[i] - dists[i - 1]);
            newPoints.push({
                x: points[i - 1].x + ratio * (points[i].x - points[i - 1].x),
                y: points[i - 1].y + ratio * (points[i].y - points[i - 1].y),
            });
            target += step;
        }
    }

    return newPoints;
}

function calculateAccuracy() {
    if (drawingPoints.length < 10) return 0;

    const tolerance = 40; // toleranță moderată

    // 1. COVERAGE (60%)
    let hitCount = 0;
    for (let t of templatePoints) {
        for (let p of drawingPoints) {
            if (euclideanDistance(t, p) < tolerance) {
                hitCount++;
                break;
            }
        }
    }
    let coverageScore = (hitCount / templatePoints.length) * 100;
    coverageScore = Math.min(100, coverageScore);

    // 2. MEAN DISTANCE (40%)
    let totalDist = 0;
    let count = 0;

    for (let p of drawingPoints) {
        let minD = Infinity;
        for (let t of templatePoints) {
            const d = euclideanDistance(p, t);
            if (d < minD) minD = d;
        }
        totalDist += Math.min(minD, tolerance * 2);
        count++;
    }

    let avgDist = totalDist / count;
    let distanceScore = Math.max(0, 100 - (avgDist / (tolerance * 2)) * 100);

    // SCOR FINAL
    let finalScore = coverageScore * 0.6 + distanceScore * 0.4;

    return Math.round(Math.min(100, Math.max(0, finalScore)));
}

function checkWriting() {
    const feedback = document.getElementById("writing-feedback");

    if (drawingPoints.length < 10) {
        feedback.className = "feedback error";
        feedback.innerText = "✏️ Desenează litera pe canvas!";
        speak("Trebuie să desenezi litera.");
        return;
    }

    const acc = calculateAccuracy();
    const isCorrect = (acc >= 70);

    // Actualizăm progresul global (scris = concept litera curentă)
    if (currentLetter) {
        updateGlobalProgress(isCorrect, `WRITE:${currentLetter.char}`);
    }

    displayAccuracy(acc);

    if (isCorrect) {
        feedback.className = "feedback success";
        feedback.innerText = "🎉 Excelent!";
        speak("Bravo! Ai scris foarte frumos!");
        writingScore++;
        updateProgress("writing", writingScore);
        updateStars("writing", writingScore);
        showCelebration("✏️");
        document.getElementById("writing-next").classList.remove("hidden");
    } else if (acc >= 50) {
        feedback.className = "feedback success";
        feedback.innerText = "👍 Bine! Mai încearcă!";
        speak("Bine! Mai încearcă puțin!");
    } else {
        feedback.className = "feedback error";
        feedback.innerText = "💪 Mai încearcă! Urmărește conturul!";
        speak("Mai încearcă!");
    }
}

function displayAccuracy(acc) {
    const box = document.getElementById("accuracy-display");
    const circ = document.getElementById("accuracy-circle");
    const pct = document.getElementById("accuracy-percentage");
    const msg = document.getElementById("accuracy-message");

    box.classList.remove("hidden");
    pct.innerText = Math.round(acc) + "%";

    circ.className = "";
    circ.classList.add(
        acc >= 85 ? "excellent" :
        acc >= 70 ? "good" :
        acc >= 50 ? "fair" :
                    "poor"
    );

    msg.innerText =
        acc >= 85 ? "🌟 Extraordinar!" :
        acc >= 70 ? "👍 Foarte bine!" :
        acc >= 50 ? "💪 Mai exersează!" :
                    "🎯 Mai încearcă!";
}

// ==========================================
// PROGRES LOCAL (pe module) + CELEBRARE
// ==========================================
function updateProgress(module, score) {
    const el = document.getElementById(`${module}-progress`);
    if (!el) return;

    if (module === "math") {
        el.style.width = "100%";
        el.innerText = score > 0 ? `Întrebarea #${score}` : "Start!";
    } else {
        const pct = (score / maxQuestions) * 100;
        el.style.width = pct + "%";
        el.innerText = `${score}/${maxQuestions}`;
    }
}

function updateStars(module, score) {
    const el = document.getElementById(`${module}-stars`);
    if (!el) return;
    el.innerHTML = "⭐".repeat(score);
}

function showCelebration(emoji) {
    const div = document.createElement("div");
    div.className = "celebration";
    div.innerText = emoji;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

function showCompletion(module) {
    const msgs = {
        math: "Felicitări! Ești un campion! 🏆",
        reading: "Grozav! Citești minunat! 🏆",
        colors: "Fantastic! Cunoști culorile! 🏆",
        writing: "Excelent! Scrii foarte frumos! 🏆"
    };

    const fb = document.getElementById(`${module}-feedback`);
    if (fb) {
        fb.className = "feedback success";
        fb.innerHTML = `<div style="font-size:3rem">🏆</div>${msgs[module]}`;
    }

    speak(msgs[module]);
    showCelebration("🏆");

    setTimeout(() => {
        if (confirm("Vrei să joci din nou?")) {
            startModule(module);
        } else {
            showSection("menu");
        }
    }, 3000);
}

// ==========================================
// LOGICĂ MEMORIE (scurtă / lungă) + PROGRES GLOBAL
// ==========================================
function updateShortTermMemory(isCorrect, responseTime) {
    let delta = 0;

    // timp
    if (responseTime < 3) delta += 12;
    else if (responseTime < 7) delta += 6;
    else if (responseTime < 12) delta += 1;
    else delta -= 6;

    // corectitudine
    delta += isCorrect ? 8 : -6;

    // stabilitate (pattern în ultimele răspunsuri)
    recentAnswers.push(isCorrect);
    if (recentAnswers.length > 5) recentAnswers.shift();

    // ultimele 5 sunt corecte → boost
    if (recentAnswers.length === 5 && recentAnswers.every(a => a)) delta += 12;

    // ultimele 3 sunt greșite → penalizare
    if (recentAnswers.length >= 3 && recentAnswers.slice(-3).every(a => !a)) delta -= 12;

    memoryShort = Math.max(0, Math.min(100, memoryShort + delta));
}

function updateLongTermMemory(isCorrect, conceptId) {
    if (!conceptMemory[conceptId]) {
        conceptMemory[conceptId] = { seen: 0, correct: 0 };
    }

    conceptMemory[conceptId].seen++;

    let delta = 0;

    if (isCorrect) {
        conceptMemory[conceptId].correct++;
        // învățare nouă
        if (conceptMemory[conceptId].correct === 1) delta += 12;
        // consolidare
        else delta += 6;
    } else {
        delta -= 6;
    }

    memoryLong = Math.max(0, Math.min(100, memoryLong + delta));
}

function updateGlobalProgress(isCorrect, conceptId) {
    const endTime = performance.now();
    const responseTime = (endTime - startTime) / 1000; // secunde

    updateShortTermMemory(isCorrect, responseTime);
    updateLongTermMemory(isCorrect, conceptId);

    const speedScore = Math.max(0, 100 - responseTime * 7); // mai repede = mai bine

    globalProgress = Math.round(
        0.30 * memoryShort +
        0.30 * memoryLong +
        0.20 * (isCorrect ? 100 : 0) +
        0.10 * speedScore
    );

    globalProgress = Math.max(0, Math.min(100, globalProgress));

    const fill = document.getElementById("global-progress-fill");
    if (fill) {
        fill.style.width = globalProgress + "%";
        document.getElementById("global-progress-text").textContent = globalProgress + "%";
    }
}

// ==========================================
// INIT APP (BUTONALE + EVENIMENTE + MICROFON)
// ==========================================
window.addEventListener("load", () => {
    // Buton HOME
    document.getElementById("home-btn").addEventListener("click", () => {
        showSection("menu");
    });

    // Buton SUNET
    document.getElementById("tts-toggle").addEventListener("click", toggleSound);

    // Cardurile din meniu
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => {
            const module = card.dataset.module;
            startModule(module);
        });
    });

    // Butoane NEXT din toate modulele
    document.getElementById("math-next").addEventListener("click", generateMathQuestion);
    document.getElementById("reading-next").addEventListener("click", generateWordQuestion);
    document.getElementById("colors-next").addEventListener("click", generateColorQuestion);
    document.getElementById("writing-next").addEventListener("click", generateWritingExercise);

    // Microfon culori
    setupSpeechRecognition();

    // Inițializăm starea barei globale (dacă există în HTML)
    const fill = document.getElementById("global-progress-fill");
    fill.style.width = "0%";
    fill.textContent = "0%";
});