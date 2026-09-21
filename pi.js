const FALLBACK_PI = '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
const TARGET_DIGITS = 80000000;

const form = document.querySelector('#search-form');
const input = document.querySelector('#number-input');
const result = document.querySelector('#result');
const capacity = document.querySelector('#capacity');
let piDigits = FALLBACK_PI;
let usingFallback = true;

function showCapacity() {
  const loaded = piDigits.length.toLocaleString('fr-FR');
  capacity.textContent = usingFallback
    ? `Mode test : ${loaded} decimales`
    : `${loaded} / ${TARGET_DIGITS.toLocaleString('fr-FR')} decimales`;
  capacity.classList.toggle('ready', !usingFallback);
}

function normalize(value) {
  return value.replace(/[.,\s]/g, '').replace(/^\+/, '');
}

function showResult(kicker, message, state = '') {
  result.className = `result ${state}`;
  result.querySelector('.result-kicker').textContent = kicker;
  result.querySelector('.result-copy').innerHTML = message;
}

async function loadPiDigits() {
  try {
    const response = await fetch('pi-80m.txt', { cache: 'force-cache' });
    if (!response.ok) throw new Error('digits unavailable');
    const text = (await response.text()).replace(/\D/g, '');
    if (text.length < FALLBACK_PI.length) throw new Error('digits incomplete');
    piDigits = text.startsWith('3') ? text.slice(1) : text;
    usingFallback = false;
  } catch {
    usingFallback = true;
  }
  showCapacity();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = normalize(input.value);

  if (!query || !/^\d+$/.test(query)) {
    showResult('Signal invalide', 'Entrez uniquement une suite de chiffres.', 'error');
    return;
  }

  const position = piDigits.indexOf(query);
  if (position === -1) {
    const note = usingFallback ? ' dans les decimales de test actuellement chargees' : ` dans les ${piDigits.length.toLocaleString('fr-FR')} decimales chargees`;
    showResult('Aucune correspondance', `Cette suite n'a pas ete trouvee${note}.`, 'error');
    return;
  }

  const displayPosition = position + 1;
  const start = Math.max(0, position - 10);
  const end = Math.min(piDigits.length, position + query.length + 10);
  const context = piDigits.slice(start, end);
  showResult('Correspondance trouvee', `<strong>${query}</strong> apparait a la position <strong>${displayPosition.toLocaleString('fr-FR')}</strong> apres la virgule.<br><small>Contexte : ...${context}...</small>`, 'found');
});

showCapacity();
loadPiDigits();
