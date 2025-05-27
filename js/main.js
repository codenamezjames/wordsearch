// Initialize audio context
audio.init();

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

// Initialize the game when the page loads
window.addEventListener("load", () => {
	// Initialize audio context
	audio.init();

	createLineSVG(); // Ensure SVG is created
	const game = new Game();
	window.game = game; // Make game instance globally accessible
	game.startNewGame(); // Start the game immediately
});

// Also initialize audio on first user interaction
document.addEventListener(
	"click",
	function initAudio() {
		audio.init();
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

// Add custom contains selector for finding word elements
document.querySelectorAll = (function (orig) {
	return function (selector) {
		if (selector.includes(":contains(")) {
			const [baseSelector, text] = selector.split(":contains(");
			const textToFind = text.slice(0, -1);
			const elements = orig.call(document, baseSelector);
			return Array.from(elements).filter((el) => el.textContent === textToFind);
		}
		return orig.call(document, selector);
	};
})(document.querySelectorAll);
