const audio = {
	context: null,

	init() {
		try {
			const AudioContext = window.AudioContext || window.webkitAudioContext;
			this.context = new AudioContext();
		} catch (error) {
			console.warn("Web Audio API is not supported in this browser:", error);
		}
	},

	playBeep(frequency = 440, duration = 0.1, type = "sine", volume = 0.1) {
		if (!this.context) return;

		try {
			const oscillator = this.context.createOscillator();
			const gainNode = this.context.createGain();

			oscillator.type = type;
			oscillator.frequency.value = frequency;
			gainNode.gain.value = volume;

			oscillator.connect(gainNode);
			gainNode.connect(this.context.destination);

			oscillator.start();
			oscillator.stop(this.context.currentTime + duration);
		} catch (error) {
			console.warn("Failed to play beep:", error);
		}
	},

	playSuccess() {
		this.playBeep(523.25, 0.1); // C5
		setTimeout(() => this.playBeep(659.25, 0.1), 100); // E5
		setTimeout(() => this.playBeep(783.99, 0.2), 200); // G5
	},

	playError() {
		this.playBeep(392.0, 0.1); // G4
		setTimeout(() => this.playBeep(349.23, 0.2), 100); // F4
	},

	playWin() {
		// Play a rising arpeggio
		this.playBeep(523.25, 0.1); // C5
		setTimeout(() => this.playBeep(659.25, 0.1), 100); // E5
		setTimeout(() => this.playBeep(783.99, 0.1), 200); // G5
		setTimeout(() => this.playBeep(1046.5, 0.2), 300); // C6
		setTimeout(() => this.playBeep(783.99, 0.1), 400); // G5
		setTimeout(() => this.playBeep(1046.5, 0.3), 500); // C6
	},
};

// Export the audio object
if (typeof module !== "undefined" && module.exports) {
	module.exports = audio;
} else {
	window.audio = audio;
}
