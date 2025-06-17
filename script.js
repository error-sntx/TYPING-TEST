const textDisplay = document.getElementById("textDisplay");
const timerDisplay = document.getElementById("timer");
const restartBtn = document.getElementById("restartBtn");
const endBtn = document.getElementById("endBtn");
const results = document.getElementById("results");
const wordButtons = document.querySelectorAll(".length-btn");
const customLength = document.getElementById("customLength");
const themeToggle = document.getElementById("themeToggle");
const greetingText = document.getElementById("greetingText");
const progressBar = document.getElementById("progressBar");
const wordCounter = document.getElementById("wordCounter");
const afkOverlay = document.getElementById("afkOverlay");

let timer = null;
let startTime = null;
let started = false;
let cursor;
let totalChars = 0;
let correctChars = 0;
let currentIndex = 0;
let errorCount = 0;

let afkTimeout = null;
let isAfk = false;
let pausedTime = 0;

// Set default theme
document.body.classList.add("dark");

// Greeting
function setGreeting() {
  const hr = new Date().getHours();
  let greeting = "Good Morning";
  if (hr >= 12 && hr < 17) greeting = "Good Afternoon";
  else if (hr >= 17) greeting = "Good Evening";
  greetingText.textContent = greeting;
}
setGreeting();

// Theme Toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  textDisplay.focus();
});

// Word List
const wordBank = [
  "the quick brown fox jumps over the lazy dog",
  "life is what happens when you are busy making other plans",
  "practice makes perfect in everything you do",
  "javascript is a powerful scripting language for the web",
  "coding is both an art and a science"
];

// Generate text
function getRandomText(wordCount = 30) {
  let words = [];
  while (words.length < wordCount) {
    const line = wordBank[Math.floor(Math.random() * wordBank.length)].split(" ");
    words.push(...line);
  }
  return words.slice(0, wordCount).join(" ");
}

// Render characters with cursor
function renderText(content) {
  textDisplay.innerHTML = "";
  totalChars = content.length;
  currentIndex = 0;
  correctChars = 0;
  errorCount = 0;

  wordCounter.textContent = `0 / ${content.trim().split(/\s+/).length}`;

  [...content].forEach((char, i) => {
    const wrapper = document.createElement("span");
    wrapper.classList.add("cursor-overlay-wrapper");

    const charSpan = document.createElement("span");
    charSpan.textContent = char;

    if (i === 0) {
      cursor = document.createElement("span");
      cursor.classList.add("typing-cursor");
      wrapper.appendChild(cursor);
    }

    wrapper.appendChild(charSpan);
    textDisplay.appendChild(wrapper);
  });

  progressBar.style.width = "0%";
}

// Start Timer
function startTimer() {
  startTime = new Date() - pausedTime;
  timer = setInterval(() => {
    const elapsed = Math.floor((new Date() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

// Stop Timer
function stopTimer() {
  clearInterval(timer);
  pausedTime = new Date() - startTime;
}

// Reset AFK Detection
function resetAfkDetection() {
  clearTimeout(afkTimeout);
  afkTimeout = setTimeout(() => {
    if (started && currentIndex < totalChars) {
      isAfk = true;
      stopTimer();
      afkOverlay.style.display = "flex";
    }
  }, 4000);
}

// Finish Test
function finishTest() {
  stopTimer();
  const elapsedMin = (new Date() - startTime) / 1000 / 60;
  const wpm = Math.round((correctChars / 5) / elapsedMin);
  results.textContent = `WPM: ${wpm} | Errors: ${errorCount}`;
  started = false;
}

// Reset Test
function resetTest(length = 30) {
  stopTimer();
  pausedTime = 0;
  timerDisplay.textContent = "00:00";
  started = false;
  results.textContent = "";
  afkOverlay.style.display = "none";

  const text = getRandomText(length);
  renderText(text);
  textDisplay.focus();
}

// Typing logic
textDisplay.addEventListener("keydown", (e) => {
  e.preventDefault();

  if (!started) {
    startTimer();
    started = true;
  }

  if (isAfk) {
    isAfk = false;
    afkOverlay.style.display = "none";
    startTimer();
  }

  resetAfkDetection();

  const wrappers = textDisplay.querySelectorAll(".cursor-overlay-wrapper");
  if (currentIndex >= wrappers.length) return;

  const typedChar = e.key;
  const targetSpan = wrappers[currentIndex].querySelector("span:not(.typing-cursor)");

  if (typedChar.length === 1) {
    if (typedChar === targetSpan.textContent) {
      targetSpan.classList.add("correct");
      correctChars++;
    } else {
      targetSpan.classList.add("incorrect");
      errorCount++;
    }

    // Remove old cursor
    document.querySelector(".typing-cursor")?.remove();
    currentIndex++;

    if (currentIndex < wrappers.length) {
      const nextWrapper = wrappers[currentIndex];
      cursor = document.createElement("span");
      cursor.classList.add("typing-cursor");
      nextWrapper.insertBefore(cursor, nextWrapper.firstChild);
    }

    progressBar.style.width = `${(currentIndex / totalChars) * 100}%`;

    const typedText = [...wrappers]
      .slice(0, currentIndex)
      .map(w => w.querySelector("span:not(.typing-cursor)")?.textContent)
      .join("")
      .trim();

    const wordsTyped = typedText.split(/\s+/).filter(w => w.length > 0).length;
    const totalWords = wordCounter.textContent.split("/")[1].trim();
    wordCounter.textContent = `${wordsTyped} / ${totalWords}`;

    if (currentIndex === totalChars) {
      finishTest();
    }
  }
});

// AFK event binding
["mousemove", "keydown", "mousedown", "click"].forEach(evt =>
  document.addEventListener(evt, () => {
    if (isAfk) {
      isAfk = false;
      afkOverlay.style.display = "none";
      startTimer();
    }
    resetAfkDetection();
  })
);

// Controls
wordButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    resetTest(parseInt(btn.dataset.length));
  });
});

customLength.addEventListener("change", () => {
  const val = parseInt(customLength.value);
  if (val > 0) resetTest(val);
});

restartBtn.addEventListener("click", () => {
  resetTest();
});

endBtn.addEventListener("click", () => {
  if (started) finishTest();
  textDisplay.blur();
});

textDisplay.addEventListener("click", () => textDisplay.focus());
textDisplay.setAttribute("tabindex", "0");

resetTest(); // initial load
