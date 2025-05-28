class Timer {
	constructor() {
		this.time = 0;
		this.timerInterval = null;
		this.timerPaused = false;
		this.timerStopped = false;
		this.timerElement = document.getElementById("timer");
	}

	reset() {
		this.time = 0;
		this.timerStopped = false;
		this.timerPaused = false;
		this.timerElement.textContent = "Time: 0:00";
	}

	start() {
		this.timerInterval = setInterval(() => {
			if (!this.timerStopped && !this.timerPaused) {
				this.time++;
				this.timerElement.textContent = `Time: ${this.formatTime(this.time)}`;

				// Pulse timer every 10 seconds
				if (this.time % 10 === 0) {
					this.pulseTimer();
				}
			}
		}, 1000);
	}

	stop() {
		this.timerStopped = true;
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	toggle() {
		this.timerPaused = !this.timerPaused;
		if (this.timerPaused) {
			this.timerElement.textContent = "⏸️ " + this.timerElement.textContent;
		} else {
			this.timerElement.textContent = this.timerElement.textContent.replace(
				"⏸️ ",
				""
			);
		}
	}

	formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	pulseTimer() {
		this.timerElement.classList.add("timer-pulse");
		setTimeout(() => {
			this.timerElement.classList.remove("timer-pulse");
		}, 300);
	}

	getCurrentTime() {
		return this.time;
	}
}

// Export the Timer class
if (typeof module !== "undefined" && module.exports) {
	module.exports = Timer;
} else {
	window.Timer = Timer;
}
