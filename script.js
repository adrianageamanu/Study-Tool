// ==========================================
// VARIABILE GLOBALE
// ==========================================
let soundEnabled = true;
let mathScore = 0;
let readingScore = 0;
let colorsScore = 0;
let writingScore = 0;
const maxQuestions = 5;

let currentMathAnswer, currentWord, currentColor, currentLetter;

// Pentru modulul de scris
let isDrawing = false;
let drawingPoints = [];
let templatePoints = [];
let canvas, ctx, templateCanvas, templateCtx;
let canvasInitialized = false;

// ==========================================
// INIȚIALIZARE
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

function initializeApp() {
    // Event listeners pentru navigare
    document.getElementById('home-btn').addEventListener('click', () => showSection('menu'));
    document.getElementById('tts-toggle').addEventListener('click', toggleSound);
    
    // Event listeners pentru carduri
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            startModule(this.dataset.module);
        });
    });
    
    // Event listeners pentru butoanele next
    document.getElementById('math-next').addEventListener('click', generateMathQuestion);
    document.getElementById('reading-next').addEventListener('click', generateWordQuestion);
    document.getElementById('colors-next').addEventListener('click', generateColorQuestion);
    document.getElementById('writing-next').addEventListener('click', generateWritingExercise);
    
    console.log('App initialized');
}

// ==========================================
// NAVIGARE
// ==========================================
function showSection(sectionId) {
    document.querySelectorAll('.game-section, #menu').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
    
    if(sectionId === 'menu') {
        speak("Meniu principal");
        resetScores();
    }
}

function startModule(moduleId) {
    showSection(moduleId);
    resetScores();
    
    switch(moduleId) {
        case 'math':
            speak("Hai să facem matematică!");
            generateMathQuestion();
            break;
        case 'reading':
            speak("Hai să citim cuvinte!");
            generateWordQuestion();
            break;
        case 'colors':
            speak("Hai să învățăm culori!");
            generateColorQuestion();
            break;
        case 'writing':
            speak("Hai să învățăm să scriem litere!");
            // Inițializare canvas DUPĂ ce secțiunea e vizibilă
            setTimeout(() => {
                if (!canvasInitialized) {
                    initializeWritingCanvas();
                }
                generateWritingExercise();
            }, 100);
            break;
    }
}

function resetScores() {
    mathScore = 0;
    readingScore = 0;
    colorsScore = 0;
    writingScore = 0;
    
    updateProgress('math', 0);
    updateProgress('reading', 0);
    updateProgress('colors', 0);
    updateProgress('writing', 0);
    
    updateStars('math', 0);
    updateStars('reading', 0);
    updateStars('colors', 0);
    updateStars('writing', 0);
}

// ==========================================
// TEXT-TO-SPEECH
// ==========================================
function speak(text) {
    if (!soundEnabled) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ro-RO';
    utterance.rate = 0.85;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('tts-toggle').innerText = soundEnabled ? "🔊 Sunet: ON" : "🔇 Sunet: OFF";
}

// ==========================================
// MODUL MATEMATICĂ
// ==========================================
function generateMathQuestion() {
    if (mathScore >= maxQuestions) {
        showCompletion('math');
        return;
    }

    document.getElementById('math-feedback').innerText = '';
    document.getElementById('math-feedback').className = 'feedback';
    document.getElementById('math-next').classList.add('hidden');

    const num1 = Math.floor(Math.random() * 5) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    currentMathAnswer = num1 + num2;

    document.getElementById('math-question').innerText = `${num1} + ${num2} = ?`;
    speak(`Cât face ${num1} plus ${num2}?`);

    const options = [currentMathAnswer];
    while (options.length < 3) {
        const wrong = currentMathAnswer + Math.floor(Math.random() * 5) - 2;
        if (wrong > 0 && !options.includes(wrong)) options.push(wrong);
    }
    options.sort(() => Math.random() - 0.5);

    document.getElementById('math-options').innerHTML = options.map(opt => 
        `<button onclick="checkMath(${opt})">${opt}</button>`
    ).join('');
}

function checkMath(answer) {
    const feedback = document.getElementById('math-feedback');
    
    if (answer === currentMathAnswer) {
        feedback.className = 'feedback success';
        feedback.innerText = "🎉 Bravo! Corect!";
        speak("Bravo! Răspuns corect!");
        mathScore++;
        updateProgress('math', mathScore);
        updateStars('math', mathScore);
        showCelebration('🌟');
        document.getElementById('math-next').classList.remove('hidden');
        document.getElementById('math-options').innerHTML = '';
    } else {
        feedback.className = 'feedback error';
        feedback.innerText = "💪 Mai încearcă o dată!";
        speak("Mai încearcă o dată. Tu poți!");
    }
}

// Expunere globală pentru onclick din HTML
window.checkMath = checkMath;

// ==========================================
// MODUL CUVINTE
// ==========================================
const words = [
    {word: 'CASĂ', image: '🏠', sound: 'casă'},
    {word: 'PISICĂ', image: '🐱', sound: 'pisică'},
    {word: 'FLOARE', image: '🌸', sound: 'floare'},
    {word: 'SOARE', image: '☀️', sound: 'soare'},
    {word: 'MAȘINĂ', image: '🚗', sound: 'mașină'},
    {word: 'CARTE', image: '📖', sound: 'carte'},
    {word: 'MERE', image: '🍎', sound: 'mere'},
    {word: 'COPAC', image: '🌳', sound: 'copac'}
];

function generateWordQuestion() {
    if (readingScore >= maxQuestions) {
        showCompletion('reading');
        return;
    }

    document.getElementById('reading-feedback').innerText = '';
    document.getElementById('reading-feedback').className = 'feedback';
    document.getElementById('reading-next').classList.add('hidden');

    currentWord = words[Math.floor(Math.random() * words.length)];
    document.getElementById('word-display').innerText = currentWord.word;
    speak(`Citește cuvântul: ${currentWord.sound}`);

    const options = [currentWord];
    const otherWords = words.filter(w => w.word !== currentWord.word);
    while (options.length < 3) {
        const random = otherWords[Math.floor(Math.random() * otherWords.length)];
        if (!options.includes(random)) options.push(random);
    }
    options.sort(() => Math.random() - 0.5);

    document.getElementById('word-options').innerHTML = options.map(opt => 
        `<button onclick="checkWord('${opt.word}')">${opt.image}</button>`
    ).join('');
}

function checkWord(selected) {
    const feedback = document.getElementById('reading-feedback');
    
    if (selected === currentWord.word) {
        feedback.className = 'feedback success';
        feedback.innerText = `🎉 Perfect! Este ${currentWord.sound}!`;
        speak(`Bravo! Corect, este ${currentWord.sound}!`);
        readingScore++;
        updateProgress('reading', readingScore);
        updateStars('reading', readingScore);
        showCelebration('📚');
        document.getElementById('reading-next').classList.remove('hidden');
        document.getElementById('word-options').innerHTML = '';
    } else {
        feedback.className = 'feedback error';
        feedback.innerText = "💪 Încearcă din nou!";
        speak("Mai încearcă o dată!");
    }
}

// Expunere globală pentru onclick din HTML
window.checkWord = checkWord;

// ==========================================
// MODUL CULORI
// ==========================================
const colors = [
    {name: 'ROȘU', hex: '#FF0000', sound: 'roșu'},
    {name: 'ALBASTRU', hex: '#0000FF', sound: 'albastru'},
    {name: 'VERDE', hex: '#00FF00', sound: 'verde'},
    {name: 'GALBEN', hex: '#FFFF00', sound: 'galben'},
    {name: 'PORTOCALIU', hex: '#FF8800', sound: 'portocaliu'},
    {name: 'ROZ', hex: '#FF69B4', sound: 'roz'},
    {name: 'VIOLET', hex: '#9370DB', sound: 'violet'}
];

function generateColorQuestion() {
    if (colorsScore >= maxQuestions) {
        showCompletion('colors');
        return;
    }

    document.getElementById('colors-feedback').innerText = '';
    document.getElementById('colors-feedback').className = 'feedback';
    document.getElementById('colors-next').classList.add('hidden');

    currentColor = colors[Math.floor(Math.random() * colors.length)];
    document.getElementById('color-box').style.backgroundColor = currentColor.hex;
    speak(`Ce culoare este aceasta?`);

    const options = [currentColor];
    const otherColors = colors.filter(c => c.name !== currentColor.name);
    while (options.length < 3) {
        const random = otherColors[Math.floor(Math.random() * otherColors.length)];
        if (!options.includes(random)) options.push(random);
    }
    options.sort(() => Math.random() - 0.5);

    document.getElementById('color-options').innerHTML = options.map(opt => 
        `<button onclick="checkColor('${opt.name}')">${opt.name}</button>`
    ).join('');
}

function checkColor(selected) {
    const feedback = document.getElementById('colors-feedback');
    
    if (selected === currentColor.name) {
        feedback.className = 'feedback success';
        feedback.innerText = `🎉 Minunat! Este ${currentColor.sound}!`;
        speak(`Bravo! Da, este ${currentColor.sound}!`);
        colorsScore++;
        updateProgress('colors', colorsScore);
        updateStars('colors', colorsScore);
        showCelebration('🎨');
        document.getElementById('colors-next').classList.remove('hidden');
        document.getElementById('color-options').innerHTML = '';
    } else {
        feedback.className = 'feedback error';
        feedback.innerText = "💪 Mai gândește-te!";
        speak("Mai încearcă!");
    }
}

// Expunere globală pentru onclick din HTML
window.checkColor = checkColor;

// ==========================================
// MODUL SCRIS (NOU)
// ==========================================
const letters = [
    {char: 'A', sound: 'A'},
    {char: 'Ă', sound: 'Ă'},
    {char: 'Â', sound: 'Â din a'},
    {char: 'B', sound: 'B'},
    {char: 'C', sound: 'C'},
    {char: 'D', sound: 'D'},
    {char: 'E', sound: 'E'},
    {char: 'F', sound: 'F'},
    {char: 'G', sound: 'G'},
    {char: 'H', sound: 'H'},
    {char: 'I', sound: 'I'},
    {char: 'Î', sound: 'Î din i'},
    {char: 'J', sound: 'J'},
    {char: 'K', sound: 'K'},
    {char: 'L', sound: 'L'},
    {char: 'M', sound: 'M'},
    {char: 'N', sound: 'N'},
    {char: 'O', sound: 'O'},
    {char: 'P', sound: 'P'},
    {char: 'Q', sound: 'Q'},
    {char: 'R', sound: 'R'},
    {char: 'S', sound: 'S'},
    {char: 'Ș', sound: 'Ș'},
    {char: 'T', sound: 'T'},
    {char: 'Ț', sound: 'Ț'},
    {char: 'U', sound: 'U'},
    {char: 'V', sound: 'V'},
    {char: 'W', sound: 'W'},
    {char: 'X', sound: 'X'},
    {char: 'Y', sound: 'Y'},
    {char: 'Z', sound: 'Z'}
];

// Variabilă nouă pentru a ține minte ce litere nu au fost încă afișate
let availableLetters = [];

function initializeWritingCanvas() {
    console.log('Initializing writing canvas...');
    
    canvas = document.getElementById('writing-canvas');
    templateCanvas = document.getElementById('template-canvas');
    
    if (!canvas || !templateCanvas) {
        console.error('Canvas elements not found!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    templateCtx = templateCanvas.getContext('2d');
    
    // Setare dimensiuni canvas
    const container = document.querySelector('.canvas-container');
    if (!container) {
        console.error('Canvas container not found!');
        return;
    }
    
    const size = Math.min(container.clientWidth, container.clientHeight, 600);
    canvas.width = size;
    canvas.height = size;
    templateCanvas.width = size;
    templateCanvas.height = size;
    
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    
    // Event listeners pentru desenare - Mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Event listeners pentru desenare - Touch
    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
    
    // Butoane control
    const clearBtn = document.getElementById('clear-btn');
    const hintBtn = document.getElementById('hint-btn');
    const checkBtn = document.getElementById('check-writing-btn');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
        console.log('Clear button connected');
    }
    if (hintBtn) {
        hintBtn.addEventListener('click', showHint);
        console.log('Hint button connected');
    }
    if (checkBtn) {
        checkBtn.addEventListener('click', checkWriting);
        console.log('Check button connected');
    }
    
    canvasInitialized = true;
    console.log('Canvas initialized successfully!');
}

function generateWritingExercise() {
    // Verificăm dacă am terminat numărul de exerciții setat pentru sesiune
    if (writingScore >= maxQuestions) {
        showCompletion('writing');
        return;
    }
    
    console.log('Generating writing exercise...');
    
    if (!canvasInitialized || !ctx) {
        console.log('Canvas not ready, initializing...');
        initializeWritingCanvas();
        setTimeout(generateWritingExercise, 200);
        return;
    }
    
    // --- LOGICĂ NOUĂ PENTRU ALEATORIU ---
    // Dacă nu mai avem litere disponibile în "pachet", îl umplem din nou
    if (availableLetters.length === 0) {
        // Copiem toate literele în lista de disponibile
        availableLetters = [...letters];
    }

    // Alegem un index aleatoriu din literele RĂMASE
    const randomIndex = Math.floor(Math.random() * availableLetters.length);
    
    // Extragem litera și o eliminăm din lista de disponibile ca să nu se repete imediat
    currentLetter = availableLetters[randomIndex];
    availableLetters.splice(randomIndex, 1); 
    // -------------------------------------

    clearCanvas();
    document.getElementById('writing-feedback').innerText = '';
    document.getElementById('writing-feedback').className = 'feedback';
    document.getElementById('writing-next').classList.add('hidden');
    document.getElementById('accuracy-display').classList.add('hidden');
    
    document.getElementById('current-letter').innerText = `Scrie litera: ${currentLetter.char}`;
    speak(`Hai să scriem litera ${currentLetter.sound}`);
    
    drawLetterTemplate(currentLetter.char);
}

function drawLetterTemplate(letter) {
    if (!templateCtx) {
        console.error('Template context not available');
        return;
    }
    
    console.log('Drawing letter template:', letter);
    
    templateCtx.clearRect(0, 0, templateCanvas.width, templateCanvas.height);
    templatePoints = [];
    
    // Font size proporțional cu canvas-ul
    const fontSize = Math.floor(templateCanvas.width * 0.7);
    
    templateCtx.font = `bold ${fontSize}px Arial`;
    templateCtx.fillStyle = 'rgba(100, 100, 255, 0.15)';
    templateCtx.textAlign = 'center';
    templateCtx.textBaseline = 'middle';
    
    const centerX = templateCanvas.width / 2;
    const centerY = templateCanvas.height / 2;
    
    // Desenare fundal literă
    templateCtx.fillText(letter, centerX, centerY);
    
    // Desenare contur
    templateCtx.strokeStyle = '#4CAF50';
    templateCtx.lineWidth = 8;
    templateCtx.lineJoin = 'round';
    templateCtx.strokeText(letter, centerX, centerY);
    
    // Generare puncte pentru comparație
    const imageData = templateCtx.getImageData(0, 0, templateCanvas.width, templateCanvas.height);
    for (let y = 0; y < imageData.height; y += 5) {
        for (let x = 0; x < imageData.width; x += 5) {
            const index = (y * imageData.width + x) * 4;
            if (imageData.data[index + 3] > 128) {
                templatePoints.push({x, y});
            }
        }
    }
    
    console.log('Template drawn, points generated:', templatePoints.length);
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('Start drawing at:', x, y);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingPoints.push({x, y});
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    drawingPoints.push({x, y});
}

function stopDrawing(e) {
    if (isDrawing) {
        console.log('Stop drawing. Total points:', drawingPoints.length);
    }
    isDrawing = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    console.log('Touch start at:', x, y);
    
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingPoints.push({x, y});
}

function handleTouchMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    drawingPoints.push({x, y});
}

function clearCanvas() {
    if (!ctx || !canvas) {
        console.error('Canvas not initialized');
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingPoints = [];
    const accuracyDisplay = document.getElementById('accuracy-display');
    if (accuracyDisplay) {
        accuracyDisplay.classList.add('hidden');
    }
    console.log('Canvas cleared');
}

function showHint() {
    console.log('Showing hint');
    speak(`Începe de sus și urmărește conturul literei`);
    
    if (!templateCanvas) {
        console.error('Template canvas not found');
        return;
    }
    
    // Efect de flash pe template
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        templateCanvas.style.opacity = flashCount % 2 === 0 ? '0.3' : '1';
        flashCount++;
        if (flashCount > 5) {
            clearInterval(flashInterval);
            templateCanvas.style.opacity = '1';
        }
    }, 300);
}

function checkWriting() {
    console.log('Checking writing. Points drawn:', drawingPoints.length);
    
    if (drawingPoints.length < 10) {
        speak("Trebuie să scrii litera pe canvas!");
        const feedback = document.getElementById('writing-feedback');
        if (feedback) {
            feedback.className = 'feedback error';
            feedback.innerText = "✏️ Desenează litera pe canvas!";
        }
        return;
    }
    
    const accuracy = calculateAccuracy();
    console.log('Accuracy calculated:', accuracy);
    displayAccuracy(accuracy);
    
    const feedback = document.getElementById('writing-feedback');
    if (!feedback) {
        console.error('Feedback element not found');
        return;
    }
    
    if (accuracy >= 70) {
        feedback.className = 'feedback success';
        feedback.innerText = "🎉 Excelent! Ai scris foarte frumos!";
        speak("Bravo! Ai scris foarte frumos!");
        writingScore++;
        updateProgress('writing', writingScore);
        updateStars('writing', writingScore);
        showCelebration('✏️');
        const nextBtn = document.getElementById('writing-next');
        if (nextBtn) nextBtn.classList.remove('hidden');
    } else if (accuracy >= 50) {
        feedback.className = 'feedback success';
        feedback.innerText = "👍 Bine! Mai exersează puțin!";
        speak("Bine! Mai încearcă o dată să fie și mai frumos!");
    } else {
        feedback.className = 'feedback error';
        feedback.innerText = "💪 Mai încearcă! Urmărește conturul cu atenție!";
        speak("Mai încearcă! Urmărește linia verde cu degetul sau mouse-ul!");
    }
}

// Expunere globală pentru butoane
window.clearCanvas = clearCanvas;
window.showHint = showHint;
window.checkWriting = checkWriting;

// ==========================================
// ALGORITMI MATEMATICI AVANSAȚI
// ==========================================

/**
 * Calculează distanța Hausdorff între două mulțimi de puncte
 * Măsoară cât de departe sunt cele mai îndepărtate puncte între cele două mulțimi
 */
function hausdorffDistance(setA, setB) {
    if (setA.length === 0 || setB.length === 0) return Infinity;
    
    // Distanța maximă de la A la B
    let maxDistAtoB = 0;
    for (let pointA of setA) {
        let minDist = Infinity;
        for (let pointB of setB) {
            const dist = euclideanDistance(pointA, pointB);
            if (dist < minDist) minDist = dist;
        }
        if (minDist > maxDistAtoB) maxDistAtoB = minDist;
    }
    
    // Distanța maximă de la B la A
    let maxDistBtoA = 0;
    for (let pointB of setB) {
        let minDist = Infinity;
        for (let pointA of setA) {
            const dist = euclideanDistance(pointA, pointB);
            if (dist < minDist) minDist = dist;
        }
        if (minDist > maxDistBtoA) maxDistBtoA = minDist;
    }
    
    return Math.max(maxDistAtoB, maxDistBtoA);
}

/**
 * Distanța euclidiană între două puncte
 */
function euclideanDistance(p1, p2) {
    if (!p1 || !p2 || p1.x === undefined || p1.y === undefined || p2.x === undefined || p2.y === undefined) {
        console.error('Invalid points in euclideanDistance:', p1, p2);
        return 0;
    }
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Dynamic Time Warping - Compară două secvențe de puncte
 * Găsește cea mai bună aliniere între traiectorii
 */
function dynamicTimeWarping(seq1, seq2) {
    const n = seq1.length;
    const m = seq2.length;
    
    if (n === 0 || m === 0) return Infinity;
    
    // Matrice DTW
    const dtw = Array(n + 1).fill(null).map(() => Array(m + 1).fill(Infinity));
    dtw[0][0] = 0;
    
    // Populare matrice
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const cost = euclideanDistance(seq1[i - 1], seq2[j - 1]);
            dtw[i][j] = cost + Math.min(
                dtw[i - 1][j],      // inserție
                dtw[i][j - 1],      // ștergere
                dtw[i - 1][j - 1]   // potrivire
            );
        }
    }
    
    return dtw[n][m];
}

/**
 * Calculează vectorul de direcție pentru fiecare punct
 */
function calculateDirectionVectors(points) {
    const vectors = [];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude > 0) {
            vectors.push({
                dx: dx / magnitude,
                dy: dy / magnitude,
                angle: Math.atan2(dy, dx)
            });
        }
    }
    return vectors;
}

/**
 * Calculează curbatura (curvature) pentru fiecare punct
 * Măsoară cât de mult se schimbă direcția
 */
function calculateCurvature(points) {
    const curvatures = [];
    for (let i = 1; i < points.length - 1; i++) {
        const v1x = points[i].x - points[i - 1].x;
        const v1y = points[i].y - points[i - 1].y;
        const v2x = points[i + 1].x - points[i].x;
        const v2y = points[i + 1].y - points[i].y;
        
        // Produsul scalar
        const dotProduct = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
        
        if (mag1 > 0 && mag2 > 0) {
            const cosAngle = dotProduct / (mag1 * mag2);
            curvatures.push(Math.acos(Math.max(-1, Math.min(1, cosAngle))));
        }
    }
    return curvatures;
}

/**
 * Calculează centrul de masă al unei mulțimi de puncte
 */
function calculateCentroid(points) {
    if (points.length === 0) return {x: 0, y: 0};
    
    let sumX = 0, sumY = 0;
    for (let point of points) {
        sumX += point.x;
        sumY += point.y;
    }
    return {
        x: sumX / points.length,
        y: sumY / points.length
    };
}

/**
 * Normalizează punctele în raport cu centrul de masă și scalare
 */
function normalizePoints(points) {
    if (points.length === 0) return [];
    
    const centroid = calculateCentroid(points);
    
    // Calculează raza maximă
    let maxRadius = 0;
    for (let point of points) {
        const dist = euclideanDistance(point, centroid);
        if (dist > maxRadius) maxRadius = dist;
    }
    
    if (maxRadius === 0) return points;
    
    // Normalizează
    return points.map(p => ({
        x: (p.x - centroid.x) / maxRadius,
        y: (p.y - centroid.y) / maxRadius
    }));
}

/**
 * Calculează similaritatea între două mulțimi de puncte folosind
 * transformata Fourier discretă (aproximare simplificată)
 */
function shapeSimilarity(points1, points2) {
    if (points1.length === 0 || points2.length === 0) {
        console.log('Empty point sets in shapeSimilarity');
        return 0;
    }
    
    const norm1 = normalizePoints(points1);
    const norm2 = normalizePoints(points2);
    
    if (norm1.length === 0 || norm2.length === 0) {
        console.log('Normalization failed');
        return 0;
    }
    
    // Eșantionare uniformă la același număr de puncte
    const sampleSize = Math.min(50, Math.min(norm1.length, norm2.length));
    const sample1 = resamplePoints(norm1, sampleSize);
    const sample2 = resamplePoints(norm2, sampleSize);
    
    if (sample1.length !== sampleSize || sample2.length !== sampleSize) {
        console.log('Resampling failed:', sample1.length, sample2.length);
        return 0;
    }
    
    // Calculează distanța medie între puncte corespunzătoare
    let sumDist = 0;
    for (let i = 0; i < sampleSize; i++) {
        if (!sample1[i] || !sample2[i]) {
            console.log('Undefined point at index', i);
            continue;
        }
        sumDist += euclideanDistance(sample1[i], sample2[i]);
    }
    
    const avgDist = sumDist / sampleSize;
    return Math.max(0, 1 - avgDist); // Similaritate între 0 și 1
}

/**
 * Re-eșantionează o secvență de puncte la un număr fix de puncte
 */
function resamplePoints(points, numPoints) {
    if (points.length === 0) return [];
    if (points.length === 1) return points;
    if (points.length <= numPoints) return [...points]; // Returnează o copie
    
    // Calculează lungimea totală a curbei
    let totalLength = 0;
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
        const dist = euclideanDistance(points[i - 1], points[i]);
        totalLength += dist;
        lengths.push(totalLength);
    }
    
    if (totalLength === 0) return points;
    
    const segmentLength = totalLength / (numPoints - 1);
    const resampled = [points[0]];
    let targetLength = segmentLength;
    
    for (let i = 1; i < points.length && resampled.length < numPoints; i++) {
        const prevLength = lengths[i - 1];
        const currLength = lengths[i];
        
        while (targetLength <= currLength && resampled.length < numPoints) {
            // Interpolează între punctele i-1 și i
            const t = (targetLength - prevLength) / (currLength - prevLength);
            const newPoint = {
                x: points[i - 1].x + t * (points[i].x - points[i - 1].x),
                y: points[i - 1].y + t * (points[i].y - points[i - 1].y)
            };
            resampled.push(newPoint);
            targetLength += segmentLength;
        }
    }
    
    // Asigură-te că avem exact numPoints
    while (resampled.length < numPoints) {
        resampled.push(points[points.length - 1]);
    }
    
    return resampled.slice(0, numPoints);
}

/**
 * Algoritm principal de calcul al acurateței
 * Combină multiple metrici matematice CU STRICTEȚE CRESCUTĂ
 */
/**
 * Algoritm REVIZUIT de calcul al acurateței
 * Mai tolerant la tremurat și imperfecțiuni, dar strict la "mâzgăleli" aleatorii
 */
function calculateAccuracy() {
    if (templatePoints.length === 0 || drawingPoints.length === 0) {
        return 0;
    }
    
    // 1. RELAXARE: Creștem zona de toleranță (cât de "lat" poate fi scrisul)
    let validPoints = 0;
    const strictThreshold = 60; // Era 30. Acum acceptăm o deviație mai mare.
    
    for (let drawPoint of drawingPoints) {
        let minDist = Infinity;
        for (let templatePoint of templatePoints) {
            const distance = euclideanDistance(drawPoint, templatePoint);
            if (distance < minDist) minDist = distance;
        }
        
        // Numărăm punctele care sunt "în zona" literei
        if (minDist < strictThreshold) {
            validPoints++;
        }
    }
    
    const validityScore = (validPoints / drawingPoints.length) * 100;
    console.log('Validity Score:', validityScore.toFixed(2) + '%');
    
    // PENALIZARE: Doar dacă sub 30% din desen e pe lângă literă (mâzgăleală totală)
    // Era 60%, acum e mult mai permisiv.
    if (validityScore < 30) {
        console.log('⚠️ REJECTED: Prea multe puncte în afara conturului!');
        return 20; // Scor minim
    }
    
    // 2. ACOPERIRE: Cât din literă a fost atinsă?
    let coveredTemplatePoints = 0;
    const coverageThreshold = 55; // Era 35. Mai ușor de "nimerit" punctele template-ului.
    
    for (let templatePoint of templatePoints) {
        for (let drawPoint of drawingPoints) {
            const distance = euclideanDistance(templatePoint, drawPoint);
            if (distance < coverageThreshold) {
                coveredTemplatePoints++;
                break;
            }
        }
    }
    
    let templateCoverageScore = (coveredTemplatePoints / templatePoints.length) * 100;
    // Bonus artificial pentru acoperire: copiii tind să nu umple perfect colțurile
    templateCoverageScore = Math.min(100, templateCoverageScore * 1.1); 
    
    // 3. Hausdorff Distance (Relaxat semnificativ)
    // Penalizăm outlierii (liniile trase aiurea) mai puțin drastic
    const hausdorff = hausdorffDistance(
        resamplePoints(drawingPoints, 30),
        resamplePoints(templatePoints, 30)
    );
    const maxCanvasSize = Math.max(canvas.width, canvas.height);
    // Era * 200 (foarte strict), acum e * 100.
    const hausdorffScore = Math.max(0, 100 - (hausdorff / maxCanvasSize) * 100); 
    
    // 4. Similaritate de formă
    const shapeSim = shapeSimilarity(drawingPoints, templatePoints);
    const shapeScore = shapeSim * 100;
    
    // 5. Analiză de direcție (Importantă pentru pedagogie)
    const drawingVectors = calculateDirectionVectors(drawingPoints);
    const templateVectors = calculateDirectionVectors(templatePoints);
    let directionMatch = 0;
    
    if (drawingVectors.length > 0 && templateVectors.length > 0) {
        const drawingSample = resampleVectors(drawingVectors, 20);
        const templateSample = resampleVectors(templateVectors, 20);
        const iterations = Math.min(drawingSample.length, templateSample.length);
        
        for (let i = 0; i < iterations; i++) {
            let angleDiff = Math.abs(drawingSample[i].angle - templateSample[i].angle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            // Relaxare calcul unghiular
            const angleScore = Math.max(0, 1 - (angleDiff / Math.PI)); 
            directionMatch += angleScore;
        }
        directionMatch = (directionMatch / iterations) * 100;
    }

    // 6. DTW (Relaxat)
    const drawingSample = resamplePoints(drawingPoints, 30); // Mai puține puncte pentru viteză
    const templateSample = resamplePoints(templatePoints, 30);
    const dtwDist = dynamicTimeWarping(drawingSample, templateSample);
    // Era (maxCanvasSize * 5), relaxăm divizorul pentru a permite variații de viteză/distanță
    const dtwScore = Math.max(0, 100 - (dtwDist / (maxCanvasSize * 8)) * 100); 

    // 7. Mărime (Relaxat)
    const drawingBounds = getBoundingBox(drawingPoints);
    const templateBounds = getBoundingBox(templatePoints);
    const sizeRatioW = drawingBounds.width / templateBounds.width;
    const sizeRatioH = drawingBounds.height / templateBounds.height;
    
    // Penalizăm doar dacă e mai mic de jumătate sau dublu
    let sizeScore = 100;
    if (sizeRatioW < 0.5 || sizeRatioH < 0.5 || sizeRatioW > 2 || sizeRatioH > 2) {
        sizeScore = 60;
    }

    // PONDERARE FINALĂ REVIZUITĂ
    // Punem accent pe "A atins copilul litera?" (Coverage) și "A mers în direcția bună?" (Direction)
    // Ignorăm puțin precizia matematică strictă (Hausdorff/DTW)
    const weights = {
        validity: 0.10,          // Scăzut (nu contează așa mult punctele extra)
        templateCoverage: 0.35,  // CRESCUT MASIV (Cel mai important e să treacă peste literă)
        hausdorff: 0.05,         // Scăzut drastic (prea sensibil la erori mici)
        shape: 0.15,             // Păstrat mediu
        direction: 0.20,         // Crescut (important didactic)
        dtw: 0.10,               // Păstrat mediu
        size: 0.05               // Scăzut
    };
    
    let finalScore = 
        validityScore * weights.validity +
        templateCoverageScore * weights.templateCoverage +
        hausdorffScore * weights.hausdorff +
        shapeScore * weights.shape +
        directionMatch * weights.direction +
        dtwScore * weights.dtw +
        sizeScore * weights.size;
    
    // BONUS: Dacă a acoperit bine litera (>70%), îi dăm un boost la scor
    // Asta ajută copiii care scriu "tremurat" dar corect
    if (templateCoverageScore > 70) {
        finalScore += 10;
    }

    console.log('=== FINAL SCORE (RELAXED):', finalScore.toFixed(2), '===');
    
    return Math.min(100, Math.max(0, finalScore));
}

/**
 * Calculează bounding box-ul pentru o mulțime de puncte
 */
function getBoundingBox(points) {
    if (points.length === 0) return {x: 0, y: 0, width: 0, height: 0};
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (let point of points) {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
    }
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Re-eșantionează vectori de direcție
 */
function resampleVectors(vectors, numVectors) {
    if (vectors.length === 0) return [];
    if (vectors.length <= numVectors) return vectors;
    
    const step = vectors.length / numVectors;
    const resampled = [];
    
    for (let i = 0; i < numVectors; i++) {
        const index = Math.floor(i * step);
        resampled.push(vectors[Math.min(index, vectors.length - 1)]);
    }
    
    return resampled;
}

function displayAccuracy(accuracy) {
    const display = document.getElementById('accuracy-display');
    const circle = document.getElementById('accuracy-circle');
    const percentage = document.getElementById('accuracy-percentage');
    const message = document.getElementById('accuracy-message');
    
    if (!display || !circle || !percentage || !message) {
        console.error('Accuracy display elements not found!');
        return;
    }
    
    display.classList.remove('hidden');
    percentage.innerText = Math.round(accuracy) + '%';
    
    // Elimină clase anterioare
    circle.classList.remove('excellent', 'good', 'fair', 'poor');
    
    if (accuracy >= 85) {
        circle.classList.add('excellent');
        message.innerText = '🌟 Extraordinar!';
        message.style.color = '#4CAF50';
    } else if (accuracy >= 70) {
        circle.classList.add('good');
        message.innerText = '👍 Foarte bine!';
        message.style.color = '#8BC34A';
    } else if (accuracy >= 50) {
        circle.classList.add('fair');
        message.innerText = '💪 Mai exersează!';
        message.style.color = '#FFC107';
    } else {
        circle.classList.add('poor');
        message.innerText = '🎯 Mai încearcă!';
        message.style.color = '#FF9800';
    }
    
    console.log('Accuracy displayed:', accuracy);
}

// Expunere globală
window.displayAccuracy = displayAccuracy;

// ==========================================
// UTILITĂȚI
// ==========================================
function updateProgress(module, score) {
    const progressBar = document.getElementById(`${module}-progress`);
    if (!progressBar) return;
    
    const percentage = (score / maxQuestions) * 100;
    progressBar.style.width = percentage + '%';
    progressBar.innerText = `${score}/${maxQuestions}`;
}

function updateStars(module, score) {
    const starsContainer = document.getElementById(`${module}-stars`);
    if (!starsContainer) return;
    
    starsContainer.innerHTML = '⭐'.repeat(score);
}

function showCelebration(emoji) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerText = emoji;
    document.body.appendChild(celebration);
    setTimeout(() => celebration.remove(), 1000);
}

function showCompletion(module) {
    const messages = {
        math: 'Felicitări! Ești un campion la matematică! 🏆',
        reading: 'Grozav! Citești minunat! 🏆',
        colors: 'Fantastic! Cunoști toate culorile! 🏆',
        writing: 'Bravo! Scrii foarte frumos! 🏆'
    };
    
    const feedback = document.getElementById(`${module}-feedback`);
    feedback.className = 'feedback success';
    feedback.innerHTML = `<div style="font-size: 3rem;">🏆</div>${messages[module]}`;
    speak(messages[module]);
    showCelebration('🏆');
    
    setTimeout(() => {
        if (confirm('Vrei să joci din nou?')) {
            startModule(module);
        } else {
            showSection('menu');
        }
    }, 3000);
}