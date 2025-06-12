import { defineStore } from 'pinia'
import { createCardDeckModifier } from '../engine/modifiers/CardDeckModifier'

export const useCardDeckStore = defineStore('cardDeck', {
  state: () => ({
    // Card deck configuration
    deckSize: 3,
    maxActiveCards: 2,
    drawCooldown: 30,

    // Card deck state
    availableCards: [],
    activeCards: [],
    cooldownRemaining: 0,

    // Internal state
    cardDeckModifier: null,
    initialized: false,
  }),

  getters: {
    canDrawCard: (state) => state.availableCards.length > 0 && state.cooldownRemaining <= 0,

    canPlayCard: (state) => (cardId) => {
      const card = state.availableCards.find((c) => c.id === cardId)
      if (!card) return false

      // Check if it's a duration card and we're at max active cards
      if (card.duration > 0 && state.activeCards.length >= state.maxActiveCards) {
        return false
      }

      return true
    },

    formattedCooldown: (state) => {
      if (state.cooldownRemaining <= 0) return '0s'
      return `${Math.ceil(state.cooldownRemaining)}s`
    },
  },

  actions: {
    /**
     * Initialize the card deck system and register the modifier
     * @param {Object} gameEngine - Game engine instance
     */
    initialize(gameEngine) {
      if (this.initialized) return

      // Create and register the card deck modifier
      this.cardDeckModifier = createCardDeckModifier({
        deckSize: this.deckSize,
        maxActiveCards: this.maxActiveCards,
        drawCooldown: this.drawCooldown,
      })

      // Register with game engine
      gameEngine.registerModifier(this.cardDeckModifier)

      // Set up event listeners
      gameEngine.eventBus.on('cards:deck_updated', this.handleDeckUpdated.bind(this))

      this.initialized = true
    },

    /**
     * Clean up the card deck system
     * @param {Object} gameEngine - Game engine instance
     */
    cleanup(gameEngine) {
      if (!this.initialized) return

      // Unregister modifier
      if (this.cardDeckModifier && gameEngine) {
        gameEngine.unregisterModifier(this.cardDeckModifier)
      }

      // Remove event listeners
      if (gameEngine) {
        gameEngine.eventBus.off('cards:deck_updated', this.handleDeckUpdated.bind(this))
      }

      // Reset state
      this.availableCards = []
      this.activeCards = []
      this.cooldownRemaining = 0
      this.cardDeckModifier = null
      this.initialized = false
    },

    /**
     * Handle deck updated event from modifier
     * @param {Object} data - Deck update data
     */
    handleDeckUpdated(data) {
      this.availableCards = data.availableCards
      this.activeCards = data.activeCards
      this.cooldownRemaining = data.cooldown
    },

    /**
     * Draw a card from the deck
     */
    drawCard() {
      if (!this.cardDeckModifier || !this.canDrawCard) return null

      return this.cardDeckModifier.drawCard()
    },

    /**
     * Play a card from the available cards
     * @param {string} cardId - Card ID to play
     */
    playCard(cardId) {
      if (!this.cardDeckModifier || !this.canPlayCard(cardId)) return false

      return this.cardDeckModifier.playCard(cardId)
    },

    /**
     * Get card by ID
     * @param {string} cardId - Card ID to find
     */
    getCardById(cardId) {
      // Check available cards
      const availableCard = this.availableCards.find((c) => c.id === cardId)
      if (availableCard) return availableCard

      // Check active cards
      const activeCard = this.activeCards.find((c) => c.id === cardId)
      if (activeCard) return activeCard

      return null
    },

    /**
     * Set deck configuration
     * @param {Object} config - Deck configuration
     */
    setConfig(config) {
      if (config.deckSize !== undefined) this.deckSize = config.deckSize
      if (config.maxActiveCards !== undefined) this.maxActiveCards = config.maxActiveCards
      if (config.drawCooldown !== undefined) this.drawCooldown = config.drawCooldown

      // Update modifier if initialized
      if (this.initialized && this.cardDeckModifier) {
        this.cardDeckModifier.deckSize = this.deckSize
        this.cardDeckModifier.maxActiveCards = this.maxActiveCards
        this.cardDeckModifier.drawCooldown = this.drawCooldown
      }
    },
  },
})
