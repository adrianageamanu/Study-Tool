let soundEnabled = true;

// --- NAVIGARE ---
function showSection(sectionId) {
    // Ascunde toate secțiunile
    const sections = document.querySelectorAll('.game-section, #menu');
    sections.forEach(sec => sec.classList.add('hidden'));

    // Afișează secțiunea dorită
    const activeSection = document.getElementById(sectionId);
    activeSection.classList.remove('hidden');

    // Feedback audio la navigare
    if(sectionId === 'menu') speak("Meniu principal");
}

function startModule(moduleId) {
    showSection(moduleId);
    // Mesaj specific pentru fiecare modul
    if (moduleId === 'math') speak("Hai să facem matematică!");
    if (moduleId === 'reading') speak("Hai să citim!");
}

// --- ACCESIBILITATE (TEXT-TO-SPEECH) ---
function speak(text) {
    if (!soundEnabled) return;
    
    // Oprește orice vorbire anterioară
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ro-RO'; // Setăm limba română
    utterance.rate = 0.9; // Viteza puțin mai lentă pentru claritate
    utterance.pitch = 1.1; // Voce puțin mai prietenoasă
    
    window.speechSynthesis.speak(utterance);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('tts-toggle');
    btn.innerText = soundEnabled ? "🔊 Sunet: ON" : "🔇 Sunet: OFF";
}

// --- LOGICA JOCULUI (EXEMPLU: MATEMATICĂ) ---
function checkMath(answer) {
    const feedback = document.getElementById('math-feedback');
    
    if (answer === 5) {
        feedback.style.color = "green";
        feedback.innerText = "Bravo! Corect!";
        speak("Bravo! Corect!");
        
        // Efect vizual de succes (confetti simplificat sau schimbare culoare)
        document.body.style.backgroundColor = "#d4edda";
        setTimeout(() => document.body.style.backgroundColor = "#f0f8ff", 1000);
    } else {
        feedback.style.color = "orange";
        feedback.innerText = "Mai încearcă!";
        speak("Mai încearcă o dată.");
    }
}