class StartMenu {
  constructor(onStart) {
    this.container = document.getElementById("startMenuContainer");
    this.onStart = onStart;
    this.init();
  }

  init() {
    if (!this.container) return;
    const startGameButton = document.getElementById("startGameButton");
    if (startGameButton) {
      startGameButton.addEventListener("click", () => this.hideAndStart());
    }
  }

  show() {
    if (this.container) {
      this.container.classList.remove("hide");
      // Force reflow to ensure transition triggers next time
      void this.container.offsetWidth;
    }
  }

  hideAndStart() {
    if (!this.container) return;
    if (!this.container.classList.contains("hide")) {
      // Force reflow before adding .hide to trigger transition
      void this.container.offsetWidth;
      this.container.classList.add("hide");
    }
    setTimeout(() => {
      if (typeof this.onStart === "function") this.onStart();
    }, 400); // match CSS transition
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = StartMenu;
} else {
  window.StartMenu = StartMenu;
}
