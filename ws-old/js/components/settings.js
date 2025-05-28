class Settings {
  constructor(game) {
    this.game = game;
    this.loadSettings();
  }

  updateWinsCount(wins) {
    const winsElem = document.getElementById("wins");
    if (winsElem) winsElem.textContent = `Wins: ${wins}`;
  }

  loadSettings() {
    const settings = storage.getSettings();
    if (settings) {
      // Update game settings only
      this.game.difficulty = settings.difficulty;
      this.game.currentCategory = settings.category;
      this.game.soundEnabled = settings.soundEnabled;
      this.game.hintsEnabled = settings.hintsEnabled;
    }
  }

  saveSettings() {
    storage.saveSettings({
      difficulty: this.game.difficulty,
      category: this.game.currentCategory,
      soundEnabled: this.game.soundEnabled,
      hintsEnabled: this.game.hintsEnabled,
    });
  }
}

// Export the Menu class
if (typeof module !== "undefined" && module.exports) {
  module.exports = Settings;
} else {
  window.Settings = Settings;
}

// Factory function to create the shared settings form
function createSettingsForm({
  idPrefix = "",
  onSoundChange,
  onDifficultyChange,
  onCategoryChange,
  initial = {},
} = {}) {
  const form = document.createElement("div");
  form.className = "settings-form";

  // Sound toggle
  const soundDiv = document.createElement("div");
  soundDiv.className = "setting";
  soundDiv.innerHTML = `
    <div class="setting-row">
      <label class="setting-label">Sound</label>
      <label class="toggle-switch">
        <input type="checkbox" id="${idPrefix}SoundToggle" ${
    initial.soundEnabled ? "checked" : ""
  } />
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
  form.appendChild(soundDiv);

  // Difficulty select
  const difficultyDiv = document.createElement("div");
  difficultyDiv.className = "setting";
  difficultyDiv.innerHTML = `
    <label for="${idPrefix}Difficulty">Difficulty:</label>
    <select id="${idPrefix}Difficulty">
      <option value="baby">Baby</option>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>
  `;
  form.appendChild(difficultyDiv);

  // Category select
  const categoryDiv = document.createElement("div");
  categoryDiv.className = "setting";
  categoryDiv.innerHTML = `
    <label for="${idPrefix}Category">Category:</label>
    <select id="${idPrefix}Category">
      <option value="animals">Animals</option>
      <option value="disney">Disney</option>
      <option value="famousLandmarks">Famous Landmarks</option>
      <option value="friendsAndFamilies">Friends & Family</option>
      <option value="fruits">Fruits</option>
      <option value="greekGods">Greek Gods</option>
      <option value="harryPotter">Harry Potter</option>
      <option value="space">Space</option>
      <option value="superheroes">Superheroes</option>
      <option value="vampireDiaries">Vampire Diaries</option>
      <option value="vegetables">Vegetables</option>
    </select>
  `;
  form.appendChild(categoryDiv);

  // Set initial values
  if (initial.difficulty) {
    form.querySelector(`#${idPrefix}Difficulty`).value = initial.difficulty;
  }
  if (initial.category) {
    form.querySelector(`#${idPrefix}Category`).value = initial.category;
  }

  // Event listeners
  if (onSoundChange) {
    form
      .querySelector(`#${idPrefix}SoundToggle`)
      .addEventListener("change", onSoundChange);
  }
  if (onDifficultyChange) {
    form
      .querySelector(`#${idPrefix}Difficulty`)
      .addEventListener("change", onDifficultyChange);
  }
  if (onCategoryChange) {
    form
      .querySelector(`#${idPrefix}Category`)
      .addEventListener("change", onCategoryChange);
  }

  return form;
}

window.createSettingsForm = createSettingsForm;
