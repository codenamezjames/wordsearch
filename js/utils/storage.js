const storage = {
  // Keys for local storage
  WINS_KEY: "wordSearchWins",
  SETTINGS_KEY: "wordSearchSettings",
  LEGACY_KEYS: [
    "wordSearchWins",
    "wordSearchSettings",
    "wordSearchDifficulty",
    "wordSearchCategory",
    "wordSearchSoundEnabled",
    "wordSearchHintsEnabled",
  ],

  // Default settings
  defaultSettings: {
    difficulty: "medium",
    category: "animals",
    soundEnabled: true,
    hintsEnabled: false,
  },

  // Clear all legacy storage
  clearLegacyStorage() {
    try {
      this.LEGACY_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
      console.log("Cleared legacy storage");
    } catch (error) {
      console.warn("Failed to clear legacy storage:", error);
    }
  },

  // Save wins count
  saveWins(wins) {
    try {
      localStorage.setItem(this.WINS_KEY, wins.toString());
    } catch (error) {
      console.warn("Failed to save wins to localStorage:", error);
      this.handleStorageError();
    }
  },

  // Get wins count
  getWins() {
    try {
      const wins = localStorage.getItem(this.WINS_KEY);
      return wins ? parseInt(wins) : 0;
    } catch (error) {
      console.warn("Failed to get wins from localStorage:", error);
      this.handleStorageError();
      return 0;
    }
  },

  // Clear wins count
  clearWins() {
    try {
      localStorage.removeItem(this.WINS_KEY);
    } catch (error) {
      console.warn("Failed to clear wins from localStorage:", error);
      this.handleStorageError();
    }
  },

  // Save game settings
  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save settings to localStorage:", error);
      this.handleStorageError();
    }
  },

  // Get game settings
  getSettings() {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        try {
          return JSON.parse(settings);
        } catch (parseError) {
          console.warn(
            "Failed to parse settings from localStorage:",
            parseError
          );
          this.handleStorageError();
          return this.defaultSettings;
        }
      }
      return this.defaultSettings;
    } catch (error) {
      console.warn("Failed to get settings from localStorage:", error);
      this.handleStorageError();
      return this.defaultSettings;
    }
  },

  // Handle storage errors by clearing legacy data
  handleStorageError() {
    try {
      // Check if we can still access localStorage
      const testKey = "storageTest";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
    } catch (error) {
      // If we can't access localStorage, clear everything
      this.clearLegacyStorage();
      // Try to set default settings
      try {
        localStorage.setItem(
          this.SETTINGS_KEY,
          JSON.stringify(this.defaultSettings)
        );
        localStorage.setItem(this.WINS_KEY, "0");
      } catch (finalError) {
        console.error("Storage is completely unavailable:", finalError);
      }
    }
  },

  // Initialize storage
  init() {
    try {
      // Test storage access
      const testKey = "storageTest";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);

      // Try to get settings
      const settings = this.getSettings();
      if (!settings || typeof settings !== "object") {
        throw new Error("Invalid settings format");
      }

      // Validate settings structure
      const requiredKeys = Object.keys(this.defaultSettings);
      const hasAllKeys = requiredKeys.every((key) => key in settings);
      if (!hasAllKeys) {
        throw new Error("Missing required settings keys");
      }
    } catch (error) {
      console.warn("Storage initialization failed:", error);
      this.clearLegacyStorage();
      // Set default settings
      this.saveSettings(this.defaultSettings);
      this.saveWins(0);
    }
  },

  // High score methods
  getHighScore(category, difficulty) {
    try {
      const key = `highscore:${category}:${difficulty}`;
      const val = localStorage.getItem(key);
      return val ? parseInt(val) : 0;
    } catch (error) {
      console.warn("Failed to get high score from localStorage:", error);
      this.handleStorageError();
      return 0;
    }
  },

  setHighScore(category, difficulty, score) {
    try {
      const key = `highscore:${category}:${difficulty}`;
      localStorage.setItem(key, score.toString());
    } catch (error) {
      console.warn("Failed to set high score in localStorage:", error);
      this.handleStorageError();
    }
  },
};

// Initialize storage when loaded
storage.init();

// Export the storage object
if (typeof module !== "undefined" && module.exports) {
  module.exports = storage;
} else {
  window.storage = storage;
}
