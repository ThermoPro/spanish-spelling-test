const wordsInput = document.getElementById('wordsInput');
const startBtn = document.getElementById('startBtn');
const gameContainer = document.getElementById('gameContainer');
const spokenWord = document.getElementById('spokenWord');
const userInput = document.getElementById('userInput');
const checkSpellingBtn = document.getElementById('checkSpellingBtn');
const repeatWordBtn = document.getElementById('repeatWordBtn');
const feedback = document.getElementById('feedback');
const meaningContainer = document.getElementById('meaningContainer');
const choices = document.getElementById('choices');
const submitMeaningBtn = document.getElementById('submitMeaningBtn');
const nextWordBtn = document.getElementById('nextWordBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScore = document.getElementById('finalScore');

let words = [];
let meanings = {};
let randomizedWords = [];
let correctWords = [];
let incorrectWords = [];
let currentWordIndex = 0;
let currentCorrectMeaning = '';
let spellingCorrect = false;
let score = { correct: 0, incorrect: 0 };

startBtn.addEventListener('click', () => {
  words = wordsInput.value.split(',').map(word => word.trim());
  if (words.length === 0) {
    alert('Please enter some Spanish words.');
    return;
  }
  randomizedWords = shuffleArray([...words]); // Shuffle the words for randomized order
  fetchMeanings();
});

async function fetchMeanings() {
  meanings = {};
  for (const word of words) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (response.ok) {
        const data = await response.json();
        const definitions = data[0]?.meanings.flatMap(meaning =>
          meaning.definitions.map(def => def.definition)
        ) || [];
        meanings[word] = definitions.slice(0, 3); // Store up to 3 definitions for the word
      } else {
        meanings[word] = ['No detailed definitions available.'];
      }
    } catch (error) {
      meanings[word] = ['Error fetching definitions.'];
    }
  }
  startGame();
}

function startGame() {
  currentWordIndex = 0;
  correctWords = [];
  incorrectWords = [];
  score = { correct: 0, incorrect: 0 };
  updateScoreDisplay();
  gameContainer.classList.remove('hidden');
  startBtn.classList.add('hidden');
  wordsInput.classList.add('hidden');
  loadNextWord();
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Correct: ${score.correct} | Incorrect: ${score.incorrect}`;
}

function loadNextWord() {
  if (currentWordIndex >= randomizedWords.length) {
    endGame();
    return;
  }
  const word = randomizedWords[currentWordIndex];
  spellingCorrect = false;
  feedback.textContent = '';
  meaningContainer.classList.add('hidden');
  nextWordBtn.classList.add('hidden');
  userInput.value = '';
  speakWord(word);
  spokenWord.textContent = `Spell the word you hear.`;
}

function speakWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'es-ES';
  speechSynthesis.speak(utterance);
}

repeatWordBtn.addEventListener('click', () => {
  speakWord(randomizedWords[currentWordIndex]);
});

checkSpellingBtn.addEventListener('click', () => {
  const userSpelling = userInput.value.trim().toLowerCase();
  const correctSpelling = randomizedWords[currentWordIndex].toLowerCase();

  if (userSpelling === correctSpelling) {
    spellingCorrect = true;
    feedback.textContent = 'Correct spelling!';
    feedback.style.color = 'green';
    loadMeaningQuestion();
  } else {
    spellingCorrect = false;
    feedback.textContent = `Incorrect! The correct spelling is "${correctSpelling}".`;
    feedback.style.color = 'red';
    loadMeaningQuestion();
  }
});

function loadMeaningQuestion() {
  const word = randomizedWords[currentWordIndex];
  const correctMeaning = meanings[word][0]; // Use the first meaning as the correct one
  currentCorrectMeaning = correctMeaning;

  const allMeanings = Object.values(meanings).flat();
  const incorrectOptions = allMeanings.filter(m => m !== correctMeaning);
  const options = [correctMeaning, ...incorrectOptions.slice(0, 2)]; // Add 2 incorrect options

  while (options.length < 3) {
    options.push('No definition available.'); // Fallback if insufficient distractors
  }

  shuffleArray(options);

  choices.innerHTML = '';
  options.forEach((option) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'meaning';
    radio.value = option;
    label.appendChild(radio);
    label.appendChild(document.createTextNode(option));
    choices.appendChild(label);
    choices.appendChild(document.createElement('br'));
  });

  meaningContainer.classList.remove('hidden');
  submitMeaningBtn.classList.remove('hidden');
}

submitMeaningBtn.addEventListener('click', () => {
  const selectedOption = document.querySelector('input[name="meaning"]:checked');
  if (!selectedOption) {
    alert('Please select a meaning.');
    return;
  }

  const word = randomizedWords[currentWordIndex];
  if (selectedOption.value === currentCorrectMeaning) {
    if (spellingCorrect) {
      score.correct++;
      correctWords.push(word);
      feedback.textContent = 'Correct spelling and meaning!';
      feedback.style.color = 'green';
    } else {
      score.incorrect++;
      incorrectWords.push(word);
      feedback.textContent = 'Correct meaning, but incorrect spelling.';
      feedback.style.color = 'orange'; // Optional: Different color for partial correctness
    }
  } else {
    score.incorrect++;
    incorrectWords.push(word);
    feedback.innerHTML = `Incorrect meaning! The correct meaning is: <strong>${currentCorrectMeaning}</strong>`;
    feedback.style.color = 'red';
  }

  updateScoreDisplay();
  submitMeaningBtn.classList.add('hidden');
  nextWordBtn.classList.remove('hidden');
});

nextWordBtn.addEventListener('click', () => {
  currentWordIndex++;
  loadNextWord();
});

function endGame() {
  gameContainer.classList.add('hidden');
  finalScore.classList.remove('hidden');

  const correctList = correctWords.length > 0
    ? correctWords.map(word => `<span style="color: green;">${word}</span>`).join(', ')
    : '<span style="color: gray;">None</span>';
  
  const incorrectList = incorrectWords.length > 0
    ? incorrectWords.map(word => `<span style="color: red;">${word}</span>`).join(', ')
    : '<span style="color: gray;">None</span>';

  finalScore.innerHTML = `
    <h2>Final Score</h2>
    <p>Correct: ${score.correct}</p>
    <p>Incorrect: ${score.incorrect}</p>
    <h3>Correct Words:</h3>
    <p>${correctList}</p>
    <h3>Incorrect Words:</h3>
    <p>${incorrectList}</p>
    <button id="startOverBtn">Start Over</button>
  `;

  const startOverBtn = document.getElementById('startOverBtn');
  startOverBtn.addEventListener('click', () => {
    resetGame();
  });
}

function resetGame() {
  finalScore.classList.add('hidden');
  startBtn.classList.remove('hidden');
  wordsInput.classList.remove('hidden');
  wordsInput.value = words.join(', ');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
