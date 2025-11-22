let soundEnabled = true;
        let mathScore = 0;
        let readingScore = 0;
        let colorsScore = 0;
        const maxQuestions = 5;
        let currentMathAnswer, currentWord, currentColor;

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

        // UTILITĂȚI
        function updateProgress(module, score) {
            const progressBar = document.getElementById(`${module}-progress`);
            const percentage = (score / maxQuestions) * 100;
            progressBar.style.width = percentage + '%';
            progressBar.innerText = `${score}/${maxQuestions}`;
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