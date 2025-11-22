// ==========================================
// VARIABILE GLOBALE
// ==========================================
let soundEnabled = true;
let mathScore = 0;
let readingScore = 0;
let colorsScore = 0;
let writingScore = 0;

const maxQuestions = 5; // pentru reading, colors, writing
const maxReadingQuestions = 10;

let currentMathAnswer, currentWord, currentColor, currentLetter;
let mathInputMode = "buttons"; // 'buttons' | 'input'

// Culori (fără repetiție)
let remainingColors = [];
let remainingWords = [];

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
remainingWords = shuffle([...words]);   // 🔹 le amestecăm și le folosim fără repetiție

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
// MATEMATICĂ (varianta Adrianei - nelimitat + input)
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

    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    currentMathAnswer = num1 + num2;

    document.getElementById("math-question").innerText =
        `${num1} + ${num2} = ?`;

    speak(`Cât face ${num1} plus ${num2}?`);

    const container = document.getElementById("math-options");

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
    { word: "CÂINE", image: "🐶", sound: "câine" },
    { word: "MERE", image: "🍎", sound: "mere" },
    { word: "PARĂ", image: "🍐", sound: "pară" },
    { word: "BANANĂ", image: "🍌", sound: "banană" },
    { word: "CARTE", image: "📖", sound: "carte" },
    { word: "SOARE", image: "☀️", sound: "soare" },
    { word: "LUNĂ", image: "🌙", sound: "lună" },
    { word: "STELE", image: "⭐", sound: "stele" },
    { word: "COPAC", image: "🌳", sound: "copac" },
    { word: "FLOARE", image: "🌸", sound: "floare" },
    { word: "FRUNZĂ", image: "🍃", sound: "frunză" },
    { word: "ZĂPADĂ", image: "❄️", sound: "zăpadă" },
    { word: "PLAJĂ", image: "🏖️", sound: "plajă" },
    { word: "MUNTE", image: "⛰️", sound: "munte" },
    { word: "MAȘINĂ", image: "🚗", sound: "mașină" },
    { word: "AUTOBUZ", image: "🚌", sound: "autobuz" },
    { word: "TREN", image: "🚆", sound: "tren" },
    { word: "AVION", image: "✈️", sound: "avion" },
    { word: "BARCĂ", image: "⛵", sound: "barcă" },

    { word: "OU", image: "🥚", sound: "ou" },
    { word: "LAPTE", image: "🥛", sound: "lapte" },
    { word: "PÂINE", image: "🍞", sound: "pâine" },
    { word: "BRÂNZĂ", image: "🧀", sound: "brânză" },
    { word: "PEȘTE", image: "🐟", sound: "pește" },
    { word: "APA", image: "💧", sound: "apă" },

    { word: "BEBELUȘ", image: "👶", sound: "bebeluş" },
    { word: "FATĂ", image: "👧", sound: "fată" },
    { word: "BĂIAT", image: "👦", sound: "băiat" },
    { word: "FEMEIE", image: "👩", sound: "femeie" },
    { word: "BARBAT", image: "👨", sound: "barbat" },

    { word: "MINGE", image: "⚽", sound: "minge" },
    { word: "PAPUC", image: "👟", sound: "papuc" },
    { word: "PĂLĂRIE", image: "👒", sound: "pălărie" },
    { word: "ROCHIE", image: "👗", sound: "rochie" },
    { word: "CEAS", image: "⌚", sound: "ceas" },

    { word: "CHEIE", image: "🔑", sound: "cheie" },
    { word: "UȘĂ", image: "🚪", sound: "ușă" },
    { word: "PAT", image: "🛏️", sound: "pat" },
    { word: "SCAUN", image: "🪑", sound: "scaun" },

    { word: "TELEFON", image: "📱", sound: "telefon" },
    { word: "TELEVIZOR", image: "📺", sound: "televizor" },
    { word: "COMPUTER", image: "💻", sound: "computer" },

    { word: "CIOCOLATĂ", image: "🍫", sound: "ciocolată" },
    { word: "PRĂJITURĂ", image: "🧁", sound: "prăjitură" }
];

function generateWordQuestion() {
    // dacă am ajuns la 10 răspunsuri corecte → tură terminată
    if (readingScore >= maxReadingQuestions) {
        return showCompletion("reading");
    }

    // dacă nu mai avem cuvinte rămase → terminăm tura
    if (!remainingWords.length) {
        return showCompletion("reading");
    }

    const fb = document.getElementById("reading-feedback");
    fb.innerText = "";
    fb.className = "feedback";

    document.getElementById("reading-next").classList.add("hidden");

    // luăm următorul cuvânt din lista amestecată (fără repetiție)
    currentWord = remainingWords.shift();

    document.getElementById("word-display").innerText = currentWord.word;
    speak(`Citește cuvântul: ${currentWord.sound}`);

    const options = [currentWord];
    const others = words.filter(w => w.word !== currentWord.word);

    while (options.length < 3) {
        const r = others[Math.floor(Math.random() * others.length)];
        if (!options.includes(r)) options.push(r);
    }

    document.getElementById("word-options").innerHTML =
        shuffle(options).map(o =>
            `<button onclick="checkWord('${o.word}')">${o.image}</button>`
        ).join("");
}

function checkWord(selected) {
    const fb = document.getElementById("reading-feedback");
    const optionsContainer = document.getElementById("word-options");

    // golim variantele de răspuns după alegere
    if (optionsContainer) {
        optionsContainer.innerHTML = "";
    }

    // găsim obiectul cuvântului ales
    const chosenWord = words.find(w => w.word === selected) || null;

    if (selected === currentWord.word) {
        // ✅ RĂSPUNS CORECT
        fb.className = "feedback success";
        fb.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px;align-items:center">
                <div>🎉 Corect! Cuvântul este:</div>
                <div style="font-size:3rem">${currentWord.image}</div>
                <div style="font-weight:bold">${currentWord.sound}</div>
            </div>
        `;
        speak(`Bravo! Este ${currentWord.sound}!`);

        readingScore++;
        updateProgress("reading", readingScore);
        updateStars("reading", readingScore);
        showCelebration("📚");
        document.getElementById("reading-next").classList.remove("hidden");
    } else {
        // ❌ RĂSPUNS GREȘIT – arătăm ce a ales și care era corect
        fb.className = "feedback error";

        const chosenLabel = chosenWord
            ? `${chosenWord.sound}`
            : selected;

        fb.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px;align-items:center">
                <div>❌ Ai ales:</div>
                ${
                    chosenWord
                        ? `<div style="font-size:3rem">${chosenWord.image}</div>
                           <div style="font-weight:bold">${chosenWord.sound}</div>`
                        : `<div style="font-weight:bold">${chosenLabel}</div>`
                }
                <div style="margin-top:8px">✅ Cuvântul corect este:</div>
                <div style="font-size:3rem">${currentWord.image}</div>
                <div style="font-weight:bold">${currentWord.sound}</div>
            </div>
        `;

        speak(`Nu e corect. Ai ales ${chosenLabel}, dar cuvântul corect este ${currentWord.sound}.`);

        document.getElementById("reading-next").classList.remove("hidden");
    }
}

// ==========================================
// CULORI (varianta Alesia + voce + fără repetiții)
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
    // ✅ dacă nu mai sunt culori rămase → modul complet
    if (!remainingColors.length) {
        return showCompletion("colors");
    }

    const fb = document.getElementById("colors-feedback");
    fb.innerText = "";
    fb.className = "feedback";

    document.getElementById("colors-next").classList.add("hidden");

    const voiceBtn = document.getElementById("voice-btn");
    if (voiceBtn) {
        voiceBtn.style.display = "inline-block"; // sau "block", cum vrei
    }

    // ❗ NU mai re-umplem remainingColors aici
    // if (!remainingColors.length) { ... } — asta se scoate

    // luăm următoarea culoare din lista fără repetiție
    currentColor = remainingColors.shift();

    document.getElementById("color-box").style.backgroundColor = currentColor.hex;
    speak("Ce culoare este aceasta?");

    const options = [currentColor];
    const others = colors.filter(c => c !== currentColor);

    while (options.length < 3) {
        const r = others[Math.floor(Math.random() * others.length)];
        if (!options.includes(r)) options.push(r);
    }

    document.getElementById("color-options").innerHTML =
        shuffle(options).map(o =>
            `<button onclick="checkColor('${o.name}')">${o.name}</button>`
        ).join("");
}

function checkColor(selectedName) {
    // găsim obiectul culorii alese
    const chosenColor = colors.find(c => c.name === selectedName) || null;
    validateColorAnswer(selectedName, chosenColor);
}

function validateColorAnswer(answerRaw, chosenColor = null) {
    const fb = document.getElementById("colors-feedback");
    const optionsContainer = document.getElementById("color-options");
    const voiceBtn = document.getElementById("voice-btn");

    const a = normalizeText(answerRaw);
    const c = normalizeText(currentColor.name);

    // după orice răspuns: ascundem opțiunile + butonul de voce
    if (optionsContainer) {
        optionsContainer.innerHTML = "";
    }
    if (voiceBtn) {
        voiceBtn.style.display = "none";
    }

    if (a === c) {
        // ✅ RĂSPUNS CORECT
        fb.className = "feedback success";
        fb.innerText = `🎉 Minunat! Este ${currentColor.sound}!`;
        speak(`Bravo! Este ${currentColor.sound}!`);
        colorsScore++;
        updateProgress("colors", colorsScore);
        updateStars("colors", colorsScore);
        showCelebration("🎨");
        document.getElementById("colors-next").classList.remove("hidden");
    } else {
        // ❌ RĂSPUNS GREȘIT – arătăm ce a ales și care era corect
        fb.className = "feedback error";

        const chosenNameText = chosenColor
            ? chosenColor.sound
            : answerRaw;

        fb.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:10px;align-items:center">
                <div>❌ Ai ales: <strong>${chosenNameText}</strong></div>
                ${
                    chosenColor
                        ? `<div style="
                            width:70px;
                            height:35px;
                            border-radius:10px;
                            border:2px solid #ccc;
                            background:${chosenColor.hex};
                          "></div>`
                        : ""
                }
                <div>✅ Culoarea corectă este: <strong>${currentColor.sound}</strong></div>
                <div style="
                    width:70px;
                    height:35px;
                    border-radius:10px;
                    border:2px solid #4CAF50;
                    background:${currentColor.hex};
                "></div>
            </div>
        `;

        speak(`Nu e corect. Ai ales ${chosenNameText}, dar culoarea corectă este ${currentColor.sound}.`);

        document.getElementById("colors-next").classList.remove("hidden");
    }
}

// ==========================================
// SPEECH RECOGNITION - Alesia (culori)
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
    const size = Math.min(container.clientWidth, container.clientHeight, 600);

    canvas.width = templateCanvas.width = size;
    canvas.height = templateCanvas.height = size;

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingPoints = [];
    document.getElementById("accuracy-display").classList.add("hidden");
    
    // 🔥 important: regenerăm template-ul pentru litera curentă
    drawLetterTemplate(currentLetter.char);

    // 🔥 resetăm feedback-ul
    document.getElementById("writing-feedback").innerText = "";
    document.getElementById("writing-feedback").className = "feedback";
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
// *** ALGORITMI PENTRU ACURATEȚE ***
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

    // Toleranță moderată
    const tolerance = 40;

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

    // 2. MEAN DISTANCE TO TEMPLATE (40%)
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
    displayAccuracy(acc);

    if (acc >= 70) {
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
// UTILITĂȚI FINALE
// ==========================================
function updateProgress(module, score) {
    const el = document.getElementById(`${module}-progress`);
    if (!el) return;

if (module === "math") {
    el.style.width = "100%";
    el.innerText = score > 0 ? `Întrebarea #${score}` : "Start!";
} else if (module === "colors") {
    const total = colors.length;
    const pct = (score / total) * 100;
    el.style.width = pct + "%";
    el.innerText = `${score}/${total}`;
} else if (module === "reading") {
    const pct = (score / maxReadingQuestions) * 100;
    el.style.width = pct + "%";
    el.innerText = `${score}/${maxReadingQuestions}`;
} else {
    const pct = (score / maxQuestions) * 100;
    el.style.width = pct + "%";
    el.innerText = `${score}/${maxQuestions}`;
}

}

function updateStars(module, score) {
    document.getElementById(`${module}-stars`).innerHTML =
        "⭐".repeat(score);
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
    fb.className = "feedback success";
    fb.innerHTML = `<div style="font-size:3rem">🏆</div>${msgs[module]}`;
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
});
