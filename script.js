/* ------------------------------
   VARIABILE GLOBALE
--------------------------------*/
let soundEnabled = true;
let mathScore = 0;
let readingScore = 0;
let colorsScore = 0;

const maxQuestions = 5; // doar pentru reading și colors
let currentMathAnswer, currentWord, currentColor;

let mathInputMode = "buttons"; // buttons | input

/* ----------------------------------
   FUNCTII HELPER (Alesia)
-----------------------------------*/
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

/* ----------------------------------
   NAVIGARE (comun)
-----------------------------------*/
function showSection(sectionId) {
    document.querySelectorAll('.game-section, #menu')
        .forEach(sec => sec.classList.add('hidden'));

    document.getElementById(sectionId).classList.remove('hidden');

    if (sectionId === 'menu') {
        speak("Meniu principal");
        resetScores();
    }
}

function startModule(moduleId) {
    showSection(moduleId);
    resetScores();

    if (moduleId === 'math') {
        speak("Hai să facem matematică!");
        generateMathQuestion();
    }
    if (moduleId === 'reading') {
        speak("Hai să citim cuvinte!");
        generateWordQuestion();
    }
    if (moduleId === 'colors') {
        speak("Hai să învățăm culori!");
        generateColorQuestion();
    }
}

function resetScores() {
    mathScore = 0;
    readingScore = 0;
    colorsScore = 0;

    updateProgress("math", 0);
    updateProgress("reading", 0);
    updateProgress("colors", 0);

    updateStars("math", 0);
    updateStars("reading", 0);
    updateStars("colors", 0);

    remainingColors = shuffle([...colors]); // pentru culori fără repetiții
}

/* ----------------------------------
   TEXT TO SPEECH (Alesia – voce bună)
-----------------------------------*/
let selectedVoice = null;

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
        selectedVoice = voices.find(v => v.lang === "ro-RO") ||
                        voices.find(v => v.lang.startsWith("ro"));
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

    if (selectedVoice) u.voice = selectedVoice;

    window.speechSynthesis.speak(u);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById("tts-toggle").innerText =
        soundEnabled ? "🔊 Sunet: ON" : "🔇 Sunet: OFF";
}

/* ----------------------------------
   MATEMATICĂ (varianta ADRIANA)
-----------------------------------*/
function toggleMathMode() {
    mathInputMode = (mathInputMode === "buttons") ? "input" : "buttons";
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
            if (w > 0) wrongs.add(w);
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
    const inp = document.getElementById("math-input");
    const val = parseInt(inp.value);

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
        if (inp) { inp.value = ""; inp.focus(); }
    }
}

/* ----------------------------------
   CUVINTE (comun)
-----------------------------------*/
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

    document.getElementById("word-options").innerHTML =
        shuffle(options).map(o =>
            `<button onclick="checkWord('${o.word}')">${o.image}</button>`
        ).join("");
}

function checkWord(selected) {
    const fb = document.getElementById("reading-feedback");

    if (selected === currentWord.word) {
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

/* ----------------------------------
   CULORI (varianta ALESIA)
-----------------------------------*/
const colors = [
    { name: 'ROȘU', hex: '#FF0000', sound: 'roșu' },
    { name: 'ALBASTRU', hex: '#0000FF', sound: 'albastru' },
    { name: 'VERDE', hex: '#00FF00', sound: 'verde' },
    { name: 'GALBEN', hex: '#FFFF00', sound: 'galben' },
    { name: 'PORTOCALIU', hex: '#FF8800', sound: 'portocaliu' },
    { name: 'ROZ', hex: '#FF69B4', sound: 'roz' },
    { name: 'VIOLET', hex: '#9370DB', sound: 'violet' },
    { name: 'NEGRU', hex: '#000000', sound: 'negru' },
    { name: 'ALB', hex: '#FFFFFF', sound: 'alb' },
    { name: 'GRI', hex: '#808080', sound: 'gri' },
    { name: 'MARO', hex: '#8B4513', sound: 'maro' }
];

let remainingColors = shuffle([...colors]);

function generateColorQuestion() {
    if (colorsScore >= maxQuestions) return showCompletion("colors");

    const fb = document.getElementById("colors-feedback");
    fb.innerText = "";
    fb.className = "feedback";
    document.getElementById("colors-next").classList.add("hidden");

    if (remainingColors.length === 0)
        remainingColors = shuffle([...colors]);

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

function checkColor(selected) {
    validateColorAnswer(selected);
}

function validateColorAnswer(answerRaw) {
    const fb = document.getElementById("colors-feedback");

    const a = normalizeText(answerRaw);
    const c = normalizeText(currentColor.name);

    if (a === c) {
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

/* ----------------------------------
   RECOGNITION (Alesia)
-----------------------------------*/
let recognition;
let isListening = false;

function setupSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    recognition = new SR();
    recognition.lang = 'ro-RO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = e => {
        const spoken = e.results[0][0].transcript;
        validateColorAnswer(spoken);
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

window.addEventListener("load", setupSpeechRecognition);

function startColorVoiceInput() {
    if (!recognition) return alert("Browserul nu suportă microfon.");

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

/* ----------------------------------
   UTILITATI GENERALE
-----------------------------------*/
function updateProgress(module, score) {
    const el = document.getElementById(`${module}-progress`);

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
    document.getElementById(`${module}-stars`).innerHTML = "⭐".repeat(score);
}

function showCelebration(emoji) {
    const c = document.createElement("div");
    c.className = "celebration";
    c.innerText = emoji;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1000);
}

function showCompletion(module) {
    const msgs = {
        math: "Felicitări! Ești un campion! 🏆",
        reading: "Grozav! Citești minunat! 🏆",
        colors: "Fantastic! Cunoști culorile! 🏆"
    };

    const fb = document.getElementById(`${module}-feedback`);
    fb.className = "feedback success";
    fb.innerHTML = `<div style="font-size:3rem;">🏆</div>${msgs[module]}`;

    speak(msgs[module]);
    showCelebration("🏆");

    setTimeout(() => {
        if (confirm("Vrei să joci din nou?"))
            startModule(module);
        else
            showSection("menu");
    }, 3000);
}