let soundEnabled = true;
let mathScore = 0;
let readingScore = 0;
let colorsScore = 0;
// Păstrăm maxQuestions pentru celelalte module (reading, colors)
const maxQuestions = 5; 
let currentMathAnswer, currentWord, currentColor;
let mathInputMode = 'buttons'; // 'buttons' or 'input'

// NAVIGARE
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
    updateProgress('math', 0);
    updateProgress('reading', 0);
    updateProgress('colors', 0);
    updateStars('math', 0);
    updateStars('reading', 0);
    updateStars('colors', 0);
}

// TEXT-TO-SPEECH
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

// 🔢 MATEMATICĂ (NELIMITAT + INPUT MANUAL)
function toggleMathMode() {
    mathInputMode = mathInputMode === 'buttons' ? 'input' : 'buttons';
    const btn = document.getElementById('math-mode-toggle');
    btn.innerText = mathInputMode === 'buttons' ? ' Scrie răspunsul' : 'Alege dintre mai multe variante';
    generateMathQuestion();
}

function generateMathQuestion() {
    // Fără logică de oprire sau mesaje de felicitare la fiecare 5 întrebări.

    const feedback = document.getElementById('math-feedback');
    feedback.innerText = '';
    feedback.className = 'feedback';
    document.getElementById('math-next').classList.add('hidden');

    // Generate rolling questions with larger range
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    currentMathAnswer = num1 + num2;

    document.getElementById('math-question').innerText = `${num1} + ${num2} = ?`;
    speak(`Cât face ${num1} plus ${num2}?`);

    const container = document.getElementById('math-options');
    
    if (mathInputMode === 'input') {
        // INPUT MODE - Type the answer
        container.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
                <input 
                    type="number" 
                    id="math-input" 
                    placeholder="Scrie răspunsul"
                    style="font-size: 2rem; padding: 15px; width: 150px; text-align: center; border: 3px solid #4CAF50; border-radius: 10px;"
                    autofocus
                />
                <button onclick="checkMathInput()" style="font-size: 2rem; padding: 15px 30px;">✓</button>
            </div>
        `;
        
        // Enter key support
        setTimeout(() => {
            const input = document.getElementById('math-input');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') checkMathInput();
                });
            }
        }, 100);
    } else {
        // BUTTON MODE - Click options (optimized generation)
        const wrongAnswers = new Set();
        const offsets = [-3, -2, -1, 1, 2, 3];
        
        for (const offset of offsets) {
            if (wrongAnswers.size >= 2) break;
            const wrong = currentMathAnswer + offset;
            if (wrong > 0 && wrong !== currentMathAnswer) {
                wrongAnswers.add(wrong);
            }
        }
        
        // Backup if not enough options
        while (wrongAnswers.size < 2) {
            const wrong = Math.floor(Math.random() * 20) + 1;
            if (wrong !== currentMathAnswer) wrongAnswers.add(wrong);
        }
        
        const options = [currentMathAnswer, ...Array.from(wrongAnswers)]
            .sort(() => Math.random() - 0.5);
        
        container.innerHTML = options.map(opt => 
            `<button onclick="checkMath(${opt})">${opt}</button>`
        ).join('');
    }
}

function checkMathInput() {
    const input = document.getElementById('math-input');
    if (!input) return;
    
    const answer = parseInt(input.value);
    if (isNaN(answer)) {
        speak("Te rog introdu un număr!");
        return;
    }
    
    checkMath(answer);
}

function checkMath(answer) {
    const feedback = document.getElementById('math-feedback');
    const isCorrect = answer === currentMathAnswer;
    
    feedback.className = `feedback ${isCorrect ? 'success' : 'error'}`;
    
    if (isCorrect) {
        feedback.innerText = "🎉 Bravo! Corect!";
        speak("Bravo! Răspuns corect!");
        mathScore++;
        updateProgress('math', mathScore);
        updateStars('math', mathScore);
        showCelebration('🌟');
        document.getElementById('math-next').classList.remove('hidden');
        document.getElementById('math-options').innerHTML = '';
    } else {
        feedback.innerText = `💪 Mai încearcă! ${mathInputMode === 'input' ? `(ai scris ${answer})` : ''}`;
        speak("Mai încearcă o dată. Tu poți!");
        
        // Clear input in input mode
        const input = document.getElementById('math-input');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

// 📚 CUVINTE
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

// 🎨 CULORI
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

// UTILITĂȚI GENERALE
function updateProgress(module, score) {
    const progressBar = document.getElementById(`${module}-progress`);
    
    if (module === 'math') {
        // Logica pentru Matematică (fără limită)
        progressBar.style.width = '100%'; // Setează bara la 100% (sau la o valoare fixă)
        // Afișează numărul curent al întrebării
        progressBar.innerText = score > 0 ? `Întrebarea #${score}` : 'Start!';
    } else {
        // Logica pentru celelalte module (cu limită /5)
        const displayScore = Math.min(score, maxQuestions);
        const percentage = (displayScore / maxQuestions) * 100;
        progressBar.style.width = percentage + '%';
        progressBar.innerText = `${score}/${maxQuestions}`;
    }
}

function updateStars(module, score) {
    const starsContainer = document.getElementById(`${module}-stars`);
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
        colors: 'Fantastic! Cunoști toate culorile! 🏆'
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