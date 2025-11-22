let soundEnabled = true;
        let mathScore = 0;
        let readingScore = 0;
        let colorsScore = 0;
        const maxQuestions = 5;
        let currentMathAnswer, currentWord, currentColor;

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
            .normalize("NFD")               // separă literele de diacritice
            .replace(/[\u0300-\u036f]/g, "") // șterge diacriticele
            .trim();
    }

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
    updateProgress('colors', 0, colors.length);

    updateStars('math', 0);
    updateStars('reading', 0);
    updateStars('colors', 0);

    // reconstruim lista culorilor într-o ordine NOUĂ random
    remainingColors = shuffle([...colors]);
}


        // TEXT-TO-SPEECH
 let selectedVoice = null;

// nume de voci preferate (poți ajusta după ce vezi ce ai în consolă)
const preferredVoices = [
    "Microsoft Andrei",         // ex. Edge pe Windows
    "Microsoft Irina",
    "Google ro-RO",             // ex. Chrome
    "Google Romanian",
];

// încarcă și alege cea mai bună voce românească disponibilă
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return;

    // 1. încercăm vocile preferate după nume
    let voice = null;
    for (const name of preferredVoices) {
        voice = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
        if (voice) break;
    }

    // 2. dacă nu găsim după nume, alegem orice voce cu ro-RO
    if (!voice) {
        voice = voices.find(v => v.lang === "ro-RO") ||
                voices.find(v => v.lang && v.lang.startsWith("ro"));
    }

    selectedVoice = voice || null;

    console.log("Toate vocile disponibile:");
    voices.forEach(v => console.log(`${v.name} (${v.lang})`));
    console.log("Vocea selectată:", selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : "nimic");
}

// vocile se încarcă asincron
window.speechSynthesis.onvoiceschanged = loadVoices;

function speak(text) {
    if (!soundEnabled) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ro-RO";

    // mai lent și mai „liniștit” pentru copii
    utterance.rate = 0.85;  // mai cursiv
    utterance.pitch = 1.0;  // ton normal
    utterance.volume = 1.0;

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
}


        function toggleSound() {
            soundEnabled = !soundEnabled;
            document.getElementById('tts-toggle').innerText = soundEnabled ? "🔊 Sunet: ON" : "🔇 Sunet: OFF";
        }

        // MATEMATICĂ
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

        // CUVINTE
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

        // CULORI
const colors = [
    { name: 'ROȘU',      hex: '#FF0000', sound: 'roșu' },
    { name: 'ALBASTRU',  hex: '#0000FF', sound: 'albastru' },
    { name: 'VERDE',     hex: '#00FF00', sound: 'verde' },
    { name: 'GALBEN',    hex: '#FFFF00', sound: 'galben' },
    { name: 'PORTOCALIU',hex: '#FF8800', sound: 'portocaliu' },
    { name: 'ROZ',       hex: '#FF69B4', sound: 'roz' },
    { name: 'VIOLET',    hex: '#9370DB', sound: 'violet' },
    { name: 'NEGRU',     hex: '#000000', sound: 'negru' },
    { name: 'ALB',       hex: '#FFFFFF', sound: 'alb' },
    { name: 'GRI',       hex: '#808080', sound: 'gri' },
    { name: 'MARO',      hex: '#8B4513', sound: 'maro' }
];

// listă de culori rămase pentru întrebări (fără repetiție)
let remainingColors = shuffle([...colors]);  // listă amestecată

       function generateColorQuestion() {
            const maxColorQuestions = colors.length;
    if (colorsScore >= maxColorQuestions) {
        showCompletion('colors');
        return;
    }

    const feedback = document.getElementById('colors-feedback');
    const nextBtn = document.getElementById('colors-next');

    feedback.innerText = '';
    feedback.className = 'feedback';
    nextBtn.classList.add('hidden');

    // dacă am epuizat toate culorile → refacem lista în ordine random
    if (remainingColors.length === 0) {
        remainingColors = shuffle([...colors]);
    }

    // luăm PRIMA culoare din lista random și o scoatem din ea
    currentColor = remainingColors.shift();

    document.getElementById('color-box').style.backgroundColor = currentColor.hex;
    speak(`Ce culoare este aceasta?`);

    // generăm butoanele (aleatoriu)
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
        // folosim aceeași validare și pentru butoane, și pentru voce
        validateColorAnswer(selected);
    }

    function validateColorAnswer(answerRaw) {
    const feedback = document.getElementById('colors-feedback');
    const normalizedSelected = normalizeText(answerRaw);
    const normalizedCorrect = normalizeText(currentColor.name);

    if (normalizedSelected === normalizedCorrect) {
        feedback.className = 'feedback success';
        feedback.innerText = `🎉 Minunat! Este ${currentColor.sound}!`;
        speak(`Bravo! Da, este ${currentColor.sound}!`);
        colorsScore++;
        updateProgress('colors', colorsScore, colors.length);
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
    let recognition;
let isListening = false;

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Acest browser nu suportă SpeechRecognition.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'ro-RO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // folosim aceeași logică de verificare ca la butoane
        validateColorAnswer(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Eroare recunoaștere voce:', event.error);
        speak("Nu am înțeles bine. Poți repeta sau poți alege culoarea din butoane.");
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
        setupSpeechRecognition();
        if (!recognition) {
            alert("Din păcate, acest browser nu suportă recunoaștere vocală.");
            return;
        }
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
    const btn = document.getElementById('voice-btn');
    if (!btn) return;
    btn.innerText = isListening ? "⏹ Oprește microfonul" : "🎤 Spune culoarea";
}

// pornește setup-ul când se încarcă pagina
window.addEventListener('load', () => {
    setupSpeechRecognition();
});

function updateProgress(module, score, max) {
    const progressBar = document.getElementById(`${module}-progress`);
    const maxValue = max ?? maxQuestions; // dacă nu dai max, folosește globalul

    const percentage = (score / maxValue) * 100;
    progressBar.style.width = percentage + '%';
    progressBar.innerText = `${score}/${maxValue}`;
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