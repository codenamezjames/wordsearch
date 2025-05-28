// Create SVG for lines if it doesn't exist
function createLineSVG() {
  const container = document.getElementById("wordSearchContainer");
  if (!container.querySelector("#lineSVG")) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "lineSVG";
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "10";

    const selectionLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    selectionLine.id = "selectionLine";
    selectionLine.setAttribute("stroke", "#d500ff");
    selectionLine.setAttribute("stroke-width", "3");
    selectionLine.setAttribute("stroke-opacity", "0");
    selectionLine.setAttribute("stroke-linecap", "round");

    svg.appendChild(selectionLine);
    container.appendChild(svg);
  }
}

let game;
window.addEventListener("load", () => {
  createLineSVG(); // Ensure SVG is created
  game = new Game();
  window.game = game; // Make game instance globally accessible
});

// Also initialize audio on first user interaction
document.addEventListener(
  "click",
  function initAudio() {
    audio.init(true);
    document.removeEventListener("click", initAudio);
  },
  { once: true }
);

// Global functions for menu interactions
function newGame() {
  if (window.game) {
    window.game.startNewGame();
  }
}

function showHint() {
  if (window.game) {
    window.game.toggleHint();
  }
}

function toggleSound() {
  if (window.game) {
    window.game.toggleSound();
  }
}

function setDifficulty(level) {
  if (window.game) {
    window.game.difficulty = level;
    window.game.saveSettings();
    window.game.startNewGame();
  }
}

function setCategory(category) {
  if (window.game) {
    window.game.currentCategory = category;
    window.game.saveSettings();
    window.game.startNewGame();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("game");
  const settingsContainer = document.getElementById("settingsContainer");
  if (gameContainer) gameContainer.style.display = "none";
  if (settingsContainer) settingsContainer.classList.remove("open");

  const startMenu = new StartMenu(() => {
    if (gameContainer) gameContainer.style.display = "";
    if (window.game) {
      window.game.startNewGame();
    }
  });

  startMenu.show();

  const optionsMenu = document.getElementById("optionsMenuContainer");
  const closeOptionsMenuButton = document.getElementById(
    "closeOptionsMenuButton"
  );

  // Options button on start menu
  const optionsButton = document.getElementById("optionsButton");
  if (optionsButton && optionsMenu) {
    optionsButton.addEventListener("click", () => {
      startMenu.container.classList.add("hide");
      optionsMenu.classList.remove("hide");
      // Sync values from real settings
      const settings = window.game ? window.game.settings : null;
      if (settings) {
        if (document.getElementById("optionsWins")) {
          document.getElementById("optionsWins").textContent =
            document.getElementById("wins").textContent || "Wins: 0";
        }

        document.getElementById("optionsSoundToggle").checked =
          settings.game.soundEnabled;
        document.getElementById("optionsDifficulty").value =
          settings.game.difficulty;
        document.getElementById("optionsCategory").value =
          settings.game.currentCategory;
      }
    });
  }

  // Back button on options menu
  if (closeOptionsMenuButton && optionsMenu) {
    closeOptionsMenuButton.addEventListener("click", () => {
      optionsMenu.classList.add("hide");
      setTimeout(() => startMenu.show(), 400);
    });
  }

  // Quit to Menu button
  const quitToMenuButton = document.getElementById("quitToMenuButton");
  if (quitToMenuButton) {
    quitToMenuButton.addEventListener("click", () => {
      if (gameContainer) gameContainer.style.display = "none";
      startMenu.show();
      if (settingsContainer) settingsContainer.classList.remove("open");
      if (settingsOverlay) settingsOverlay.classList.remove("open");
      // Optionally, stop the timer/game logic here if needed
      if (
        window.game &&
        window.game.timer &&
        typeof window.game.timer.stop === "function"
      ) {
        window.game.timer.stop();
      }
    });
  }

  // Inject shared settings form into both menus
  const settingsForm = window.createSettingsForm({
    idPrefix: "",
    initial: {
      soundEnabled: window.game?.soundEnabled,
      difficulty: window.game?.difficulty,
      category: window.game?.currentCategory,
    },
    onSoundChange: (e) => {
      if (window.game) {
        window.game.soundEnabled = e.target.checked;
        window.game.settings.saveSettings();
      }
    },
    onDifficultyChange: (e) => {
      if (window.game) {
        window.game.difficulty = e.target.value;
        window.game.settings.saveSettings();
      }
    },
    onCategoryChange: (e) => {
      if (window.game) {
        window.game.currentCategory = e.target.value;
        window.game.settings.saveSettings();
      }
    },
  });
  const settingsFormContainer = document.getElementById("sharedSettingsForm");
  if (settingsFormContainer) {
    settingsFormContainer.innerHTML = "";
    settingsFormContainer.appendChild(settingsForm);
  }

  const optionsForm = window.createSettingsForm({
    idPrefix: "options",
    initial: {
      soundEnabled: window.game?.soundEnabled,
      difficulty: window.game?.difficulty,
      category: window.game?.currentCategory,
    },
    onSoundChange: (e) => {
      if (window.game) {
        window.game.soundEnabled = e.target.checked;
        window.game.settings.saveSettings();
      }
    },
    onDifficultyChange: (e) => {
      if (window.game) {
        window.game.difficulty = e.target.value;
        window.game.settings.saveSettings();
      }
    },
    onCategoryChange: (e) => {
      if (window.game) {
        window.game.currentCategory = e.target.value;
        window.game.settings.saveSettings();
      }
    },
  });
  const optionsFormContainer = document.getElementById(
    "sharedSettingsFormOptions"
  );
  if (optionsFormContainer) {
    optionsFormContainer.innerHTML = "";
    optionsFormContainer.appendChild(optionsForm);
  }

  // Restore hamburger menu functionality
  const settingsButton = document.getElementById("settingsButton");
  const settingsOverlay = document.getElementById("settingsOverlay");
  if (settingsButton && settingsContainer && settingsOverlay) {
    settingsButton.addEventListener("click", () => {
      settingsContainer.classList.add("open");
      settingsOverlay.classList.add("open");
    });
    settingsOverlay.addEventListener("click", () => {
      settingsContainer.classList.remove("open");
      settingsOverlay.classList.remove("open");
    });
  }
});
