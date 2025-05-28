const animations = {
  createDot(x, y) {
    const dot = document.createElement("div");
    dot.className = "dot";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    return dot;
  },

  showDot(x, y) {
    const dot = this.createDot(x, y);
    document.getElementById("dotsContainer").appendChild(dot);
    dot.style.opacity = "1";
    setTimeout(() => {
      dot.style.opacity = "0";
      setTimeout(() => dot.remove(), 300);
    }, 500);
  },

  animateWordFound(wordElement) {
    wordElement.classList.add("found");
    wordElement.style.transform = "scale(1.1)";
    wordElement.style.color = "#d500ff";
    setTimeout(() => {
      wordElement.style.transform = "";
      wordElement.style.color = "";
    }, 500);
  },

  animateProgress(element, targetPercent) {
    const startPercent = parseInt(element.style.width) || 0;
    const startTime = performance.now();
    const duration = 500; // 500ms animation

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentPercent =
        startPercent + (targetPercent - startPercent) * easeProgress;

      element.style.width = `${currentPercent}%`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  },

  showConfetti() {
    if (typeof confetti !== "undefined") {
      // Multiple confetti bursts
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.25, y: 0.6 },
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.75, y: 0.6 },
        });
      }, 400);

      // Rainbow mode for celebration
      document.getElementById("game").classList.add("rainbow-mode");
      setTimeout(() => {
        document.getElementById("game").classList.remove("rainbow-mode");
      }, 3000);
    }
  },

  toggleMenu(menuElement, overlayElement, isOpen) {
    if (isOpen) {
      menuElement.style.transform = "translateX(0)";
      overlayElement.style.opacity = "1";
      overlayElement.style.pointerEvents = "auto";
    } else {
      menuElement.style.transform = "translateX(-100%)";
      overlayElement.style.opacity = "0";
      overlayElement.style.pointerEvents = "none";
    }
  },

  createParticles(x, y, count = 8, color = "#9200b7") {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = x + "px";
      particle.style.top = y + "px";
      particle.style.background = color;

      const angle = (i / count) * Math.PI * 2;
      const velocity = 50 + Math.random() * 50;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      document.body.appendChild(particle);

      let posX = x;
      let posY = y;
      let opacity = 1;

      const animate = () => {
        posX += vx * 0.02;
        posY += vy * 0.02 + 0.5; // gravity
        opacity -= 0.02;

        particle.style.left = posX + "px";
        particle.style.top = posY + "px";
        particle.style.opacity = opacity;

        if (opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          document.body.removeChild(particle);
        }
      };

      requestAnimationFrame(animate);
    }
  },

  createFloatingText(text, x, y, color = "#9200b7") {
    const floatingText = document.createElement("div");
    floatingText.className = "floating-text";
    floatingText.textContent = text;
    floatingText.style.left = x + "px";
    floatingText.style.top = y + "px";
    floatingText.style.color = color;

    document.body.appendChild(floatingText);

    setTimeout(() => {
      if (document.body.contains(floatingText)) {
        document.body.removeChild(floatingText);
      }
    }, 1000);
  },

  createSparkles(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const sparkle = document.createElement("div");
        sparkle.className = "sparkle";
        sparkle.style.left = x + (Math.random() - 0.5) * 100 + "px";
        sparkle.style.top = y + (Math.random() - 0.5) * 100 + "px";

        document.body.appendChild(sparkle);

        setTimeout(() => {
          if (document.body.contains(sparkle)) {
            document.body.removeChild(sparkle);
          }
        }, 1000);
      }, i * 100);
    }
  },

  shakeScreen() {
    document.getElementById("game").classList.add("game-shake");
    setTimeout(() => {
      document.getElementById("game").classList.remove("game-shake");
    }, 500);
  },

  // Affirmations for celebrations
  affirmations: [
    "You are beautiful!",
    "Skillful Execution!",
    "Genius!",
    "Unstoppable!",
    "Legendary!",
    "You did it!",
    "Brilliant!",
    "You rock!",
    "Superb!",
    "Outstanding!",
    "Incredible!",
    "Phenomenal!",
    "You crushed it!",
    "Victory!",
    "Spectacular!",
    "You're a star!",
    "Flawless Victory!",
    "Magnificent!",
    "You're amazing!",
    "Word Wizard!",
    "Champion!",
    "Perfection!",
    "Marvelous!",
    "You're unstoppable!",
    "So smart!",
    "You nailed it!",
  ],

  getRandomAffirmation() {
    return this.affirmations[
      Math.floor(Math.random() * this.affirmations.length)
    ];
  },
};

// Export the animations object
if (typeof module !== "undefined" && module.exports) {
  module.exports = animations;
} else {
  window.animations = animations;
}
