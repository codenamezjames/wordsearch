class Menu {
	constructor(game) {
		this.game = game;
		this.setupEventListeners();
		this.loadSettings();
	}

	setupEventListeners() {
		const menuButton = document.getElementById("menuButton");
		const menuContainer = document.getElementById("menuContainer");
		const closeMenuButton = document.getElementById("closeMenuButton");
		const menuOverlay = document.getElementById("menuOverlay");
		const difficultySelect = document.getElementById("difficulty");
		const categorySelect = document.getElementById("category");

		menuButton.addEventListener("click", () => {
			menuContainer.classList.add("open");
			menuOverlay.classList.add("open");
		});

		const closeMenu = () => {
			menuContainer.classList.remove("open");
			menuOverlay.classList.remove("open");
		};

		closeMenuButton.addEventListener("click", closeMenu);
		menuOverlay.addEventListener("click", closeMenu);

		difficultySelect.addEventListener("change", (e) => {
			setDifficulty(e.target.value);
		});

		categorySelect.addEventListener("change", (e) => {
			setCategory(e.target.value);
		});

		// Close menu when clicking outside
		document.addEventListener("click", (event) => {
			if (
				!menuContainer.contains(event.target) &&
				!menuButton.contains(event.target) &&
				menuContainer.classList.contains("open")
			) {
				closeMenu();
			}
		});
	}

	closeMenu() {
		document.getElementById("menuContainer").classList.remove("open");
		document.getElementById("menuOverlay").classList.remove("open");
	}

	updateWinsCount(wins) {
		document.getElementById("wins").textContent = `Wins: ${wins}`;
	}

	loadSettings() {
		const settings = storage.getSettings();
		if (settings) {
			const difficultySelect = document.getElementById("difficulty");
			const categorySelect = document.getElementById("category");

			// Update select elements
			difficultySelect.value = settings.difficulty;
			categorySelect.value = settings.category;

			// Update game settings
			this.game.difficulty = settings.difficulty;
			this.game.currentCategory = settings.category;
			this.game.soundEnabled = settings.soundEnabled;
			this.game.hintsEnabled = settings.hintsEnabled;

			// Update UI states
			const soundButton = document.getElementById("soundButton");
			const hintButton = document.getElementById("hintButton");
			// soundButton.classList.toggle("active", settings.soundEnabled);
			// hintButton.classList.toggle("active", settings.hintsEnabled);
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
	module.exports = Menu;
} else {
	window.Menu = Menu;
}
