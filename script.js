function speak(event, text) {
  // opresc propagarea dacă apăs pe 🔊 ca să nu declanșez și click-ul părintelui
  event.stopPropagation();
  if (!window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ro-RO";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function openSection(id) {
  document.querySelector('main').style.display = 'none';
  document.querySelectorAll('.screen').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function goHome() {
  document.querySelector('main').style.display = 'flex';
  document.querySelectorAll('.screen').forEach(sec => sec.classList.add('hidden'));
}

function checkAnswer(correct, chosen) {
  const feedback = document.getElementById('feedback');
  if (correct === chosen) {
    feedback.textContent = "Bravo! Ai ales bine! ✅";
  } else {
    feedback.textContent = "Mai încearcă o dată. 🙂";
  }
}
