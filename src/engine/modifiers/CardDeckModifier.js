/**
 * CardDeckModifier.js
 * Implementation of a card deck enhancement system
 * using the game engine's modifier architecture
 */
import { BaseModifier } from './BaseModifier'

/**
 * Card Deck Modifier - Manages a deck of enhancement cards
 * that can be drawn and played during gameplay
 */
export class CardDeckModifier extends BaseModifier {
  constructor(config = {}) {
    super({
      name: 'Card Deck System',
      description: 'Allows players to draw and play enhancement cards',
      priority: 100,
      ...config,
    })

    // Card deck configuration
    this.deckSize = config.deckSize || 3
    this.drawCooldown = config.drawCooldown || 30 // seconds
    this.maxActiveCards = config.maxActiveCards || 2

    // Card deck state
    this.availableCards = []
    this.activeCards = []
    this.lastDrawTime = 0
    this.cooldownRemaining = 0

    // Card definitions
    this.cardTypes = [
      {
        id: 'double_points',
        name: 'Double Points',
        description: 'Double all points for 30 seconds',
        duration: 30,
        rarity: 'common',
        effect: this.applyDoublePoints.bind(this),
        expireEffect: this.removeDoublePoints.bind(this),
      },
      {
        id: 'time_slow',
        name: 'Time Slow',
        description: 'Slow down the timer for 20 seconds',
        duration: 20,
        rarity: 'rare',
        effect: this.applyTimeSlow.bind(this),
        expireEffect: this.removeTimeSlow.bind(this),
      },
      {
        id: 'hint',
        name: 'Hint Card',
        description: 'Reveal one random word on the grid',
        duration: 0, // Instant effect
        rarity: 'uncommon',
        effect: this.applyHint.bind(this),
        expireEffect: null,
      },
      {
        id: 'wild_card',
        name: 'Wild Card',
        description: 'Count any word as found',
        duration: 0, // Instant effect
        rarity: 'epic',
        effect: this.applyWildCard.bind(this),
        expireEffect: null,
      },
      {
        id: 'chain_bonus',
        name: 'Chain Bonus',
        description: 'Increase chain multiplier for 45 seconds',
        duration: 45,
        rarity: 'uncommon',
        effect: this.applyChainBonus.bind(this),
        expireEffect: this.removeChainBonus.bind(this),
      },
    ]
  }

  /**
   * Initialize the card deck system
   */
  async onRegister() {
    // Set up event listeners
    this.engine.eventBus.on('game:started', this.handleGameStart.bind(this))
    this.engine.eventBus.on('game:tick', this.handleGameTick.bind(this))
    this.engine.eventBus.on('word:found', this.handleWordFound.bind(this))

    // Initialize deck
    this.initializeDeck()
  }

  /**
   * Clean up when unregistered
   */
  async onUnregister() {
    // Remove all active cards
    this.activeCards.forEach((card) => {
      if (card.expireEffect) {
        card.expireEffect()
      }
    })

    // Clear deck
    this.availableCards = []
    this.activeCards = []

    // Remove event listeners
    this.engine.eventBus.off('game:started', this.handleGameStart.bind(this))
    this.engine.eventBus.off('game:tick', this.handleGameTick.bind(this))
    this.engine.eventBus.off('word:found', this.handleWordFound.bind(this))
  }

  /**
   * Initialize the card deck with random cards
   */
  initializeDeck() {
    this.availableCards = []

    // Generate random cards based on rarity
    for (let i = 0; i < this.deckSize; i++) {
      const card = this.getRandomCard()
      this.availableCards.push(card)
    }

    // Reset state
    this.lastDrawTime = 0
    this.cooldownRemaining = 0

    // Notify UI
    this.engine.eventBus.emit('cards:deck_updated', {
      availableCards: this.availableCards,
      activeCards: this.activeCards,
      cooldown: this.cooldownRemaining,
    })
  }

  /**
   * Get a random card based on rarity
   */
  getRandomCard() {
    // Rarity weights (higher = more common)
    const rarityWeights = {
      common: 10,
      uncommon: 5,
      rare: 2,
      epic: 1,
    }

    // Calculate weighted probabilities
    const weightedCards = this.cardTypes.map((card) => ({
      card,
      weight: rarityWeights[card.rarity] || 1,
    }))

    // Get random card based on weight
    const totalWeight = weightedCards.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight

    for (const { card, weight } of weightedCards) {
      random -= weight
      if (random <= 0) {
        // Create a new instance of the card
        return { ...card, id: `${card.id}_${Date.now()}` }
      }
    }

    // Fallback to first card
    return { ...this.cardTypes[0], id: `${this.cardTypes[0].id}_${Date.now()}` }
  }

  /**
   * Draw a new card if available and cooldown has expired
   */
  drawCard() {
    // Check if we can draw
    if (this.availableCards.length === 0) {
      this.engine.eventBus.emit('cards:draw_failed', { reason: 'no_cards' })
      return null
    }

    // Check cooldown
    if (this.cooldownRemaining > 0) {
      this.engine.eventBus.emit('cards:draw_failed', {
        reason: 'cooldown',
        remaining: this.cooldownRemaining,
      })
      return null
    }

    // Draw a card
    const card = this.availableCards.shift()

    // Reset cooldown
    this.lastDrawTime = Date.now()
    this.cooldownRemaining = this.drawCooldown

    // Notify UI
    this.engine.eventBus.emit('cards:drawn', { card })
    this.engine.eventBus.emit('cards:deck_updated', {
      availableCards: this.availableCards,
      activeCards: this.activeCards,
      cooldown: this.cooldownRemaining,
    })

    return card
  }

  /**
   * Play a card from the available cards
   */
  playCard(cardId) {
    // Find the card
    const cardIndex = this.availableCards.findIndex((c) => c.id === cardId)

    if (cardIndex === -1) {
      this.engine.eventBus.emit('cards:play_failed', {
        reason: 'card_not_found',
        cardId,
      })
      return false
    }

    // Check if we can have more active cards
    if (
      this.activeCards.length >= this.maxActiveCards &&
      this.availableCards[cardIndex].duration > 0
    ) {
      this.engine.eventBus.emit('cards:play_failed', {
        reason: 'max_active_cards',
        cardId,
      })
      return false
    }

    // Remove from available cards
    const card = this.availableCards.splice(cardIndex, 1)[0]

    // Apply card effect
    card.effect(card)

    // Add to active cards if it has duration
    if (card.duration > 0) {
      this.activeCards.push({
        ...card,
        startTime: Date.now(),
        endTime: Date.now() + card.duration * 1000,
        timeRemaining: card.duration,
      })
    }

    // Notify UI
    this.engine.eventBus.emit('cards:played', { card })
    this.engine.eventBus.emit('cards:deck_updated', {
      availableCards: this.availableCards,
      activeCards: this.activeCards,
      cooldown: this.cooldownRemaining,
    })

    return true
  }

  /**
   * Handle game start event
   */
  handleGameStart() {
    this.initializeDeck()
  }

  /**
   * Handle game tick event
   */
  handleGameTick(data) {
    const { deltaTime } = data

    // Update cooldown
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= deltaTime
      if (this.cooldownRemaining < 0) {
        this.cooldownRemaining = 0
      }
    }

    // Update active cards
    const now = Date.now()
    const expiredCards = []

    this.activeCards.forEach((card) => {
      // Update remaining time
      card.timeRemaining = Math.max(0, (card.endTime - now) / 1000)

      // Check for expired cards
      if (card.timeRemaining <= 0) {
        expiredCards.push(card)
      }
    })

    // Handle expired cards
    if (expiredCards.length > 0) {
      // Remove expired cards
      this.activeCards = this.activeCards.filter((card) => !expiredCards.includes(card))

      // Call expire effects
      expiredCards.forEach((card) => {
        if (card.expireEffect) {
          card.expireEffect(card)
        }

        // Notify UI
        this.engine.eventBus.emit('cards:expired', { card })
      })

      // Update UI
      this.engine.eventBus.emit('cards:deck_updated', {
        availableCards: this.availableCards,
        activeCards: this.activeCards,
        cooldown: this.cooldownRemaining,
      })
    }
  }

  /**
   * Handle word found event - chance to get a new card
   */
  handleWordFound() {
    // 20% chance to get a new card when finding a word
    if (this.availableCards.length < this.deckSize && Math.random() < 0.2) {
      const card = this.getRandomCard()
      this.availableCards.push(card)

      // Notify UI
      this.engine.eventBus.emit('cards:new_card', { card })
      this.engine.eventBus.emit('cards:deck_updated', {
        availableCards: this.availableCards,
        activeCards: this.activeCards,
        cooldown: this.cooldownRemaining,
      })
    }
  }

  /**
   * Card effect: Double Points
   */
  applyDoublePoints(card) {
    // Get the scoring store
    const scoringStore = this.engine.getStore('gameScoring')
    if (!scoringStore) return

    // Save original multiplier
    card._originalMultiplier = scoringStore.scoreMultiplier

    // Double the score multiplier
    scoringStore.setMultiplier(scoringStore.scoreMultiplier * 2)

    // Notify UI
    this.engine.eventBus.emit('cards:effect_applied', {
      card,
      effect: 'Score multiplier doubled',
    })
  }

  /**
   * Card effect: Remove Double Points
   */
  removeDoublePoints(card) {
    // Get the scoring store
    const scoringStore = this.engine.getStore('gameScoring')
    if (!scoringStore) return

    // Restore original multiplier
    if (card._originalMultiplier) {
      scoringStore.setMultiplier(card._originalMultiplier)
    } else {
      scoringStore.setMultiplier(1)
    }

    // Notify UI
    this.engine.eventBus.emit('cards:effect_removed', {
      card,
      effect: 'Score multiplier restored',
    })
  }

  /**
   * Card effect: Time Slow
   */
  applyTimeSlow(card) {
    // This would require a timer modification system
    // For now, just notify that it would slow down the timer
    this.engine.eventBus.emit('cards:effect_applied', {
      card,
      effect: 'Timer slowed down',
    })
  }

  /**
   * Card effect: Remove Time Slow
   */
  removeTimeSlow(card) {
    // This would require a timer modification system
    // For now, just notify that timer speed is restored
    this.engine.eventBus.emit('cards:effect_removed', {
      card,
      effect: 'Timer speed restored',
    })
  }

  /**
   * Card effect: Hint
   */
  applyHint() {
    // Get the game state store
    const gameStateStore = this.engine.getStore('gameState')
    if (!gameStateStore) return

    // Find a random word that hasn't been found yet
    const unfoundWords = gameStateStore.words.filter((word) => !gameStateStore.foundWords.has(word))

    if (unfoundWords.length === 0) {
      // No unfound words
      this.engine.eventBus.emit('cards:effect_applied', {
        effect: 'No words to hint',
      })
      return
    }

    // Select a random unfound word
    const randomWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)]

    // Emit hint event (UI would handle highlighting)
    this.engine.eventBus.emit('cards:hint', {
      word: randomWord,
    })

    // Notify UI
    this.engine.eventBus.emit('cards:effect_applied', {
      effect: `Hint provided for: ${randomWord}`,
    })
  }

  /**
   * Card effect: Wild Card
   */
  applyWildCard() {
    // Get the game state store
    const gameStateStore = this.engine.getStore('gameState')
    if (!gameStateStore) return

    // Find a random word that hasn't been found yet
    const unfoundWords = gameStateStore.words.filter((word) => !gameStateStore.foundWords.has(word))

    if (unfoundWords.length === 0) {
      // No unfound words
      this.engine.eventBus.emit('cards:effect_applied', {
        effect: 'No words to find',
      })
      return
    }

    // Select a random unfound word
    const randomWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)]

    // Add the word as found
    this.engine.addFoundWord(randomWord)

    // Notify UI
    this.engine.eventBus.emit('cards:effect_applied', {
      effect: `Word automatically found: ${randomWord}`,
    })
  }

  /**
   * Card effect: Chain Bonus
   */
  applyChainBonus(card) {
    // Get the scoring store
    const scoringStore = this.engine.getStore('gameScoring')
    if (!scoringStore) return

    // Save original chain multiplier
    card._originalChainMultiplier = scoringStore.chainMultiplier

    // Increase chain multiplier
    scoringStore.setChainMultiplier(scoringStore.chainMultiplier + 1)

    // Notify UI
    this.engine.eventBus.emit('cards:effect_applied', {
      card,
      effect: `Chain multiplier increased to ${scoringStore.chainMultiplier}x`,
    })
  }

  /**
   * Card effect: Remove Chain Bonus
   */
  removeChainBonus(card) {
    // Get the scoring store
    const scoringStore = this.engine.getStore('gameScoring')
    if (!scoringStore) return

    // Restore original chain multiplier
    if (card._originalChainMultiplier) {
      scoringStore.setChainMultiplier(card._originalChainMultiplier)
    } else {
      scoringStore.setChainMultiplier(1)
    }

    // Notify UI
    this.engine.eventBus.emit('cards:effect_removed', {
      card,
      effect: 'Chain multiplier restored',
    })
  }

  /**
   * Public API for the card deck system
   */
  getPublicAPI() {
    return {
      drawCard: this.drawCard.bind(this),
      playCard: this.playCard.bind(this),
      getAvailableCards: () => [...this.availableCards],
      getActiveCards: () => [...this.activeCards],
      getCooldownRemaining: () => this.cooldownRemaining,
    }
  }
}

// Export a factory function for creating card deck modifiers
export function createCardDeckModifier(config) {
  return new CardDeckModifier(config)
}
