class Grid {
	constructor(game) {
		this.game = game;
		this.grid = [];
		this.gridSize = 8;
		this.container = document.getElementById("wordSearchContainer");
		this.selectedCells = [];
		this.isSelecting = false;
		this.currentSelection = { start: null, end: null };
		this.drawnLines = [];
		this.setupEventListeners();
	}

	setupEventListeners() {
		this.container.addEventListener("mousedown", (e) => {
			if (e.target.classList.contains("cell")) {
				this.startSelection(e.target, e);
			}
		});

		this.container.addEventListener("mousemove", (e) => {
			if (this.isSelecting && e.target.classList.contains("cell")) {
				this.updateSelection(e.target, e);
			}
		});

		this.container.addEventListener("mouseup", () => {
			this.endSelection();
		});

		// Touch events
		this.container.addEventListener("touchstart", (e) => {
			const touch = e.touches[0];
			const element = document.elementFromPoint(touch.clientX, touch.clientY);
			if (element && element.classList.contains("cell")) {
				e.preventDefault();
				this.startSelection(element, touch);
			}
		});

		this.container.addEventListener("touchmove", (e) => {
			if (this.isSelecting) {
				e.preventDefault();
				const touch = e.touches[0];
				const element = document.elementFromPoint(touch.clientX, touch.clientY);
				if (element && element.classList.contains("cell")) {
					this.updateSelection(element, touch);
				}
			}
		});

		this.container.addEventListener("touchend", (e) => {
			if (this.isSelecting) {
				e.preventDefault();
				this.endSelection();
			}
		});
	}

	createGrid(size) {
		this.gridSize = size;
		this.grid = Array(size)
			.fill()
			.map(() => Array(size).fill(""));
		this.placedWords = [];
		this.foundWords = new Set();
		this.foundWordsCount = 0;
		this.placedWordsCount = 0;
		this.drawnLines = [];
	}

	render() {
		// Clear only the cells, keep the SVG
		const svg = this.container.querySelector("#lineSVG");
		this.container.innerHTML = "";
		if (svg) {
			this.container.appendChild(svg);
		}

		const cells = [];
		for (let y = 0; y < this.gridSize; y++) {
			for (let x = 0; x < this.gridSize; x++) {
				const cell = document.createElement("div");
				cell.className = "cell";
				cell.textContent = this.grid[y][x];
				cell.dataset.x = x;
				cell.dataset.y = y;
				cell.style.opacity = "0";
				this.container.appendChild(cell);
				cells.push({ cell, x, y });
			}
		}

		// Animate cells dropping in
		this.animateCellDrop(cells);
	}

	animateCellDrop(cells) {
		const shuffled = [...cells].sort(() => Math.random() - 0.5);

		shuffled.forEach((item, index) => {
			setTimeout(() => {
				item.cell.style.opacity = "1";
				item.cell.classList.add("cell-drop");

				// Play a subtle sound for some cells
				if (index % 4 === 0 && this.game.soundEnabled) {
					const freq = 200 + (item.x + item.y) * 50;
					this.game.playSound(freq, 0.05, "sine", 0.02);
				}

				setTimeout(() => {
					item.cell.classList.remove("cell-drop");
				}, 800);
			}, index * 15 + Math.random() * 30);
		});
	}

	startSelection(cell, event) {
		this.isSelecting = true;
		this.currentSelection.start = {
			x: parseInt(cell.dataset.x),
			y: parseInt(cell.dataset.y),
			element: cell,
		};
		this.clearSelection();
		this.clearHints();
		this.selectCell(cell);

		const line = document.getElementById("selectionLine");
		line.setAttribute("stroke-opacity", "0.8");
		this.game.playClickSound();
	}

	updateSelection(cell, event) {
		const start = this.currentSelection.start;
		const x = parseInt(cell.dataset.x);
		const y = parseInt(cell.dataset.y);
		const dx = x - start.x;
		const dy = y - start.y;

		let snapX = start.x;
		let snapY = start.y;
		if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= Math.abs(dy)) {
			snapX = x;
			snapY = start.y;
		}
		if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= Math.abs(dx)) {
			snapX = start.x;
			snapY = y;
		}
		if (Math.abs(dx) === Math.abs(dy) && dx !== 0) {
			snapX = x;
			snapY = y;
		}

		this.currentSelection.end = {
			x: snapX,
			y: snapY,
			element: document.querySelector(`[data-x="${snapX}"][data-y="${snapY}"]`),
		};
		this.updateSelectionDisplay();
	}

	endSelection() {
		if (this.isSelecting) {
			this.game.checkForWord(this.getSelectionCells());
			this.clearSelection();
			this.clearLine();
			this.isSelecting = false;
			this.currentSelection = { start: null, end: null };
		}
	}

	updateSelectionDisplay() {
		this.clearSelection();

		if (!this.currentSelection.start || !this.currentSelection.end) return;

		const cells = this.getSelectionCells();
		cells.forEach((pos) => {
			const cell = document.querySelector(
				`[data-x="${pos.x}"][data-y="${pos.y}"]`
			);
			if (cell) this.selectCell(cell);
		});

		this.updateLine(this.currentSelection.start, this.currentSelection.end);
	}

	getSelectionCells() {
		if (!this.currentSelection.start || !this.currentSelection.end) return [];

		const { start, end } = this.currentSelection;
		const dx = end.x - start.x;
		const dy = end.y - start.y;

		if (
			(dx === 0 && dy !== 0) ||
			(dy === 0 && dx !== 0) ||
			(Math.abs(dx) === Math.abs(dy) && dx !== 0)
		) {
			const length = Math.max(Math.abs(dx), Math.abs(dy));
			const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
			const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
			const cells = [];
			for (let i = 0; i <= length; i++) {
				cells.push({
					x: start.x + stepX * i,
					y: start.y + stepY * i,
				});
			}
			return cells;
		}
		return [start];
	}

	selectCell(cell) {
		cell.style.backgroundColor = "rgba(146, 0, 183, 0.5)";
		cell.classList.add("selected");
		this.selectedCells.push(cell);
	}

	clearSelection() {
		this.selectedCells.forEach((cell) => {
			cell.style.backgroundColor = "";
			cell.classList.remove("selected");
		});
		this.selectedCells = [];
	}

	clearHints() {
		document.querySelectorAll(".cell.hint").forEach((cell) => {
			cell.classList.remove("hint");
		});
	}

	updateLine(start, end) {
		const line = document.getElementById("selectionLine");
		const containerRect = this.container.getBoundingClientRect();
		const startRect = start.element.getBoundingClientRect();
		const endRect = end.element.getBoundingClientRect();

		const startX = startRect.left + startRect.width / 2 - containerRect.left;
		const startY = startRect.top + startRect.height / 2 - containerRect.top;
		const endX = endRect.left + endRect.width / 2 - containerRect.left;
		const endY = endRect.top + endRect.height / 2 - containerRect.top;

		line.setAttribute("x1", startX);
		line.setAttribute("y1", startY);
		line.setAttribute("x2", endX);
		line.setAttribute("y2", endY);
	}

	clearLine() {
		const line = document.getElementById("selectionLine");
		line.setAttribute("x1", 0);
		line.setAttribute("y1", 0);
		line.setAttribute("x2", 0);
		line.setAttribute("y2", 0);
		line.setAttribute("stroke-opacity", "0");
	}

	drawPermanentLine(start, end) {
		const lineData = {
			startX: start.x,
			startY: start.y,
			endX: end.x,
			endY: end.y,
		};

		this.drawnLines.push(lineData);
		this.drawPermanentLineFromData(lineData);
	}

	drawPermanentLineFromData(lineData) {
		const svg = document.getElementById("lineSVG");
		const newLine = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"line"
		);

		const containerRect = this.container.getBoundingClientRect();
		const startCell = document.querySelector(
			`[data-x="${lineData.startX}"][data-y="${lineData.startY}"]`
		);
		const endCell = document.querySelector(
			`[data-x="${lineData.endX}"][data-y="${lineData.endY}"]`
		);

		if (!startCell || !endCell) return;

		const startRect = startCell.getBoundingClientRect();
		const endRect = endCell.getBoundingClientRect();

		const startX = startRect.left + startRect.width / 2 - containerRect.left;
		const startY = startRect.top + startRect.height / 2 - containerRect.top;
		const endX = endRect.left + endRect.width / 2 - containerRect.left;
		const endY = endRect.top + endRect.height / 2 - containerRect.top;

		const cellSize = startRect.width;
		const lineWidth = Math.max(3, Math.min(20, cellSize * 0.3));

		newLine.setAttribute("x1", startX);
		newLine.setAttribute("y1", startY);
		newLine.setAttribute("x2", endX);
		newLine.setAttribute("y2", endY);
		newLine.setAttribute("stroke", "#d500ff");
		newLine.setAttribute("stroke-width", lineWidth);
		newLine.setAttribute("stroke-opacity", "0.8");
		newLine.setAttribute("stroke-linecap", "round");

		svg.appendChild(newLine);
	}

	clearOldLines() {
		const svg = document.getElementById("lineSVG");
		while (svg.children.length > 1) {
			svg.removeChild(svg.lastChild);
		}
	}

	redrawLines() {
		const svg = document.getElementById("lineSVG");
		while (svg.children.length > 1) {
			svg.removeChild(svg.lastChild);
		}

		this.drawnLines.forEach((lineData) => {
			this.drawPermanentLineFromData(lineData);
		});
	}

	adjustSize() {
		const gameArea = document.getElementById("game");
		const wordsContainer = document.getElementById("wordsContainer");
		const dotsContainer = document.getElementById("dotsContainer");
		const topBarHeight = document.getElementById("topBar").offsetHeight;

		const availableHeight =
			window.innerHeight -
			topBarHeight -
			wordsContainer.offsetHeight -
			dotsContainer.offsetHeight -
			40;
		const availableWidth = window.innerWidth - 40;

		const maxCellSize =
			Math.min(
				Math.floor(availableWidth / this.gridSize),
				Math.floor(availableHeight / this.gridSize),
				60
			) - 2;

		const fontSize = Math.max(12, Math.min(24, maxCellSize * 0.6));

		this.container.style.gridTemplateColumns = `repeat(${this.gridSize}, ${maxCellSize}px)`;

		document.querySelectorAll(".cell").forEach((cell) => {
			cell.style.width = `${maxCellSize}px`;
			cell.style.height = `${maxCellSize}px`;
			cell.style.fontSize = `${fontSize}px`;
		});

		const svg = document.getElementById("lineSVG");
		const rect = this.container.getBoundingClientRect();
		svg.style.width = `${rect.width}px`;
		svg.style.height = `${rect.height}px`;

		const lineWidth = Math.max(3, Math.min(20, maxCellSize * 0.3));
		const selectionLine = document.getElementById("selectionLine");
		selectionLine.setAttribute("stroke-width", lineWidth);

		const allLines = svg.querySelectorAll("line:not(#selectionLine)");
		allLines.forEach((line) => {
			line.setAttribute("stroke-width", lineWidth);
		});

		this.redrawLines();
	}
}

// Export the Grid class
if (typeof module !== "undefined" && module.exports) {
	module.exports = Grid;
} else {
	window.Grid = Grid;
}
