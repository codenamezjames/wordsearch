/**
 * Score Calculation Module
 *
 * Usage:
 *   const score = calculateScore(timeElapsed, [modifier1, modifier2, ...]);
 *
 * - timeElapsed: total time in seconds
 * - modifiers: array of functions(score, context) => score
 *   Each modifier receives the current score and a context object, and returns a new score.
 *
 * Default logic: score = Math.max(1000 - timeElapsed * 10, 0)
 *
 * Modifiers are applied in order, and can adjust the score as needed.
 *
 * This module is self-contained and does not depend on any game state.
 */

function calculateScore(timeElapsed, modifiers = [], context = {}) {
  // Default scoring logic: faster = higher score
  let score = Math.max(1000 - timeElapsed * 10, 0);

  // Context can include more info in the future (difficulty, powerups, etc)
  context = { timeElapsed, ...context };

  // Apply modifiers in order
  for (const modifier of modifiers) {
    if (typeof modifier === "function") {
      score = modifier(score, context);
    }
  }

  // Always return integer score
  return Math.round(score);
}

/**
 * Modifier Interface Example
 *
 * A modifier is a function that takes (score, context) and returns a new score.
 * Example: Give a 100 point bonus if no hints were used.
 *
 * @param {number} score - The current score
 * @param {Object} context - Context object (e.g., { timeElapsed, hintsUsed })
 * @returns {number} Modified score
 */
function bonusForNoHints(score, context) {
  if (context.hintsUsed === 0) return score + 100;
  return score;
}

// To use:
//   calculateScore(timeElapsed, [bonusForNoHints], { hintsUsed: 0 })
//
// Modifiers can be composed and passed in any order.

// Attach to window for browser usage (non-module)
if (typeof window !== "undefined") {
  window.calculateScore = calculateScore;
  window.bonusForNoHints = bonusForNoHints;
}
