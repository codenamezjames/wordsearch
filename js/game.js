class Game {
	constructor() {
		this.grid = null;
		this.timer = null;
		this.menu = null;
		this.words = [];
		this.foundWords = new Set();
		this.soundEnabled = true;
		this.hintsEnabled = false;
		this.currentCategory = "animals";
		this.difficulty = "medium";
		this.wins = 0;
		this.isGameActive = false;
		this.initializeComponents();
	}

	initializeComponents() {
		this.grid = new Grid(this);
		this.timer = new Timer();
		this.menu = new Menu(this);
		this.setupEventListeners();
		this.loadSettings();
	}

	setupEventListeners() {
		window.addEventListener("resize", () => {
			if (this.grid) {
				this.grid.adjustSize();
			}
		});

		document.getElementById("newGameButton").addEventListener("click", () => {
			this.startNewGame();
		});

		// document.getElementById("hintButton").addEventListener("click", () => {
		// 	this.toggleHint();
		// });

		const soundToggle = document.getElementById("soundToggle");
		soundToggle.addEventListener("change", (e) => {
			this.soundEnabled = e.target.checked;
			this.saveSettings();
			if (this.soundEnabled) {
				this.playClickSound();
			}
		});
	}

	loadSettings() {
		const settings = storage.getSettings();
		if (settings) {
			this.difficulty = settings.difficulty;
			this.currentCategory = settings.category;
			this.soundEnabled = settings.soundEnabled;
			this.hintsEnabled = settings.hintsEnabled;
			this.wins = storage.getWins();
			this.menu.updateWinsCount(this.wins);

			// Update sound toggle state
			const soundToggle = document.getElementById("soundToggle");
			if (soundToggle) {
				soundToggle.checked = this.soundEnabled;
			}
		}
	}

	saveSettings() {
		storage.saveSettings({
			difficulty: this.difficulty,
			category: this.currentCategory,
			soundEnabled: this.soundEnabled,
			hintsEnabled: this.hintsEnabled,
		});
	}

	startNewGame() {
		this.isGameActive = true;
		this.foundWords.clear();
		this.words = this.getWordsForCategory();
		this.placeWords();
		this.grid.render();
		this.grid.adjustSize();
		this.updateWordsList();
		this.updateProgress();
		this.timer.reset();
		this.timer.start();
		this.menu.closeMenu();
		this.playClickSound();
	}

	getWordsForCategory() {
		const categoryWords = categories[this.currentCategory] || [];
		const wordCount = this.getWordCountForDifficulty();
		return this.getRandomWords(categoryWords, wordCount);
	}

	getWordCountForDifficulty() {
		switch (this.difficulty) {
			case "baby":
				return 1;
			case "easy":
				return 5;
			case "medium":
				return 8;
			case "hard":
				return 12;
			default:
				return 8;
		}
	}

	getRandomWords(words, count) {
		const shuffled = [...words].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}

	placeWords() {
		const gridSize = this.getGridSizeForDifficulty();
		this.grid.createGrid(gridSize);
		this.grid.clearOldLines();

		const directions = [
			{ dx: 1, dy: 0 }, // horizontal
			{ dx: 0, dy: 1 }, // vertical
			{ dx: 1, dy: 1 }, // diagonal down-right
			{ dx: 1, dy: -1 }, // diagonal up-right
		];

		for (const word of this.words) {
			let placed = false;
			let attempts = 0;
			const maxAttempts = 100;

			while (!placed && attempts < maxAttempts) {
				const direction =
					directions[Math.floor(Math.random() * directions.length)];
				const x = Math.floor(Math.random() * gridSize);
				const y = Math.floor(Math.random() * gridSize);

				if (this.canPlaceWord(word, x, y, direction, gridSize)) {
					this.placeWord(word, x, y, direction);
					placed = true;
				}
				attempts++;
			}

			if (!placed) {
				console.warn(`Could not place word: ${word}`);
			}
		}

		this.fillEmptyCells();
	}

	getGridSizeForDifficulty() {
		switch (this.difficulty) {
			case "baby":
				return 8;
			case "easy":
				return 8;
			case "medium":
				return 10;
			case "hard":
				return 12;
			default:
				return 10;
		}
	}

	canPlaceWord(word, startX, startY, direction, gridSize) {
		const { dx, dy } = direction;
		const length = word.length;

		// Check if word fits within grid bounds
		if (
			startX + dx * (length - 1) >= gridSize ||
			startX + dx * (length - 1) < 0 ||
			startY + dy * (length - 1) >= gridSize ||
			startY + dy * (length - 1) < 0
		) {
			return false;
		}

		// Check if space is available
		for (let i = 0; i < length; i++) {
			const x = startX + dx * i;
			const y = startY + dy * i;
			const currentCell = this.grid.grid[y][x];
			if (currentCell !== "" && currentCell !== word[i]) {
				return false;
			}
		}

		return true;
	}

	placeWord(word, startX, startY, direction) {
		const { dx, dy } = direction;
		for (let i = 0; i < word.length; i++) {
			const x = startX + dx * i;
			const y = startY + dy * i;
			this.grid.grid[y][x] = word[i];
		}
	}

	fillEmptyCells() {
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		for (let y = 0; y < this.grid.gridSize; y++) {
			for (let x = 0; x < this.grid.gridSize; x++) {
				if (this.grid.grid[y][x] === "") {
					this.grid.grid[y][x] =
						letters[Math.floor(Math.random() * letters.length)];
				}
			}
		}
	}

	updateWordsList() {
		const container = document.getElementById("wordsContainer");
		container.innerHTML = "";
		this.words.forEach((word) => {
			const wordElement = document.createElement("div");
			wordElement.className = "word";
			wordElement.textContent = word;
			if (this.foundWords.has(word)) {
				wordElement.classList.add("found");
			}
			container.appendChild(wordElement);
		});
	}

	updateProgress() {
		const progressFill = document.querySelector(".progress-fill");
		const statsText = document.getElementById("statsText");
		const percent = (this.foundWords.size / this.words.length) * 100;

		statsText.textContent = `${this.foundWords.size}/${this.words.length} words found`;
		animations.animateProgress(progressFill, percent);
	}

	checkForWord(selectedCells) {
		if (selectedCells.length < 3) return;

		const word = selectedCells
			.map((cell) => this.grid.grid[cell.y][cell.x])
			.join("");
		const reversedWord = word.split("").reverse().join("");

		for (const targetWord of this.words) {
			if (
				(word === targetWord || reversedWord === targetWord) &&
				!this.foundWords.has(targetWord)
			) {
				this.foundWords.add(targetWord);
				this.updateWordsList();
				this.updateProgress();

				// Find and animate the word element
				const wordElements = Array.from(
					document.querySelectorAll(".word:not(.found)")
				);
				const wordElement = wordElements.find(
					(el) => el.textContent === targetWord
				);
				if (wordElement) {
					animations.animateWordFound(wordElement);
				}

				// Add found-animation to each cell in the word with delay
				selectedCells.forEach((cell, index) => {
					const cellElement = document.querySelector(
						`[data-x="${cell.x}"][data-y="${cell.y}"]`
					);
					if (cellElement) {
						setTimeout(() => {
							cellElement.classList.add("found-animation");
							setTimeout(() => {
								cellElement.classList.remove("found-animation");
							}, 600);
						}, index * 50);
					}
				});

				if (selectedCells.length > 0) {
					const centerIndex = Math.floor(selectedCells.length / 2);
					const centerCell = document.querySelector(
						`[data-x="${selectedCells[centerIndex].x}"][data-y="${selectedCells[centerIndex].y}"]`
					);
					if (centerCell) {
						const rect = centerCell.getBoundingClientRect();
						const x = rect.left + rect.width / 2;
						const y = rect.top + rect.height / 2;
						animations.createParticles(x, y, 12, "#d500ff");
						animations.createFloatingText(word, x - 50, y - 30, "#9200b7");
						animations.createSparkles(x, y, 8);
					}
				}

				this.drawPermanentLine(
					selectedCells[0],
					selectedCells[selectedCells.length - 1]
				);
				this.playSuccessSound();
				this.checkWinCondition();
				return;
			}
		}

		this.playErrorSound();
	}

	drawPermanentLine(start, end) {
		this.grid.drawPermanentLine(start, end);
	}

	checkWinCondition() {
		if (this.foundWords.size === this.words.length) {
			this.handleWin();
		}
	}

	handleWin() {
		this.isGameActive = false;
		this.timer.stop();
		this.wins++;
		storage.saveWins(this.wins);
		this.menu.updateWinsCount(this.wins);
		this.playWinSound();

		// Show confetti and rainbow mode
		animations.showConfetti();

		// Screen shake for impact
		animations.shakeScreen();

		// Create victory particles and affirmation
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;
		const affirmation = animations.getRandomAffirmation();

		animations.createParticles(centerX, centerY, 20, "#ffd700");
		animations.createFloatingText(
			affirmation,
			centerX - 100,
			centerY - 100,
			"#ffd700"
		);

		// Replace words list with New Game button
		const wordsContainer = document.getElementById("wordsContainer");
		wordsContainer.innerHTML = `
			<div class="win-message">
				<h2>Congratulations!</h2>
				<p>You found all words in ${this.timer.formatTime(this.timer.time)}!</p>
				<button class="btn win-new-game">Play Again</button>
			</div>
		`;

		// Add event listener to the new button
		const newGameBtn = wordsContainer.querySelector(".win-new-game");
		if (newGameBtn) {
			newGameBtn.addEventListener("click", () => {
				this.startNewGame();
			});
		}
	}

	toggleHint() {
		this.hintsEnabled = !this.hintsEnabled;
		this.saveSettings();
		const hintButton = document.getElementById("hintButton");
		// hintButton.classList.toggle("active", this.hintsEnabled);
		this.playClickSound();
	}

	playClickSound() {
		if (this.soundEnabled) {
			audio.playBeep(400, 0.1);
		}
	}

	playSuccessSound() {
		if (this.soundEnabled) {
			audio.playSuccess();
		}
	}

	playErrorSound() {
		if (this.soundEnabled) {
			audio.playError();
		}
	}

	playWinSound() {
		if (this.soundEnabled) {
			audio.playWin();
		}
	}

	playSound(frequency, duration, type = "sine", volume = 0.1) {
		if (this.soundEnabled) {
			audio.playBeep(frequency, duration, type, volume);
		}
	}
}

// Export the Game class
if (typeof module !== "undefined" && module.exports) {
	module.exports = Game;
} else {
	window.Game = Game;
}
