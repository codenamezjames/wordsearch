# Word Search Game Engine Architecture

## Overview

The Word Search game engine provides a clean abstraction layer over the store system, handling game logic, events, and modifiers. This architecture follows modern best practices for maintainability, testability, and extensibility.

## Core Components

### GameEngine

The central orchestrator for all game logic. It manages the game lifecycle, coordinates between stores, and provides a plugin system for extending functionality.

```javascript
const gameEngine = new GameEngine()
gameEngine.initialize()
await gameEngine.startGame({ category: 'animals', difficulty: 'medium' })
```

Key responsibilities:

- Game lifecycle management (start, pause, resume, end)
- Word finding and validation
- Score calculation with modifier support
- Event broadcasting
- State management coordination

### EventBus

A powerful event system for decoupled communication between components.

```javascript
// Subscribe to events
gameEngine.on('word:found', (data) => {
  console.log(`Found word: ${data.word}, Score: ${data.score}`)
})

// Emit events
gameEngine.emit('custom:event', { data: 'value' })
```

Features:

- Priority-based event handling
- Once-only listeners
- Asynchronous event emission
- Error handling
- Namespaced events

### BaseModifier

The foundation for the plugin/extension system, allowing dynamic modification of game behavior.

```javascript
// Create a modifier that doubles scores
const doublePoints = new BaseModifier({
  name: 'DoublePoints',
  type: 'score',
  duration: 30, // seconds
})

// Override the apply method
doublePoints.apply = async (type, value, context) => {
  if (type === 'score') {
    return value * 2
  }
  return value
}

// Activate and register
await doublePoints.activate()
gameEngine.registerModifier(doublePoints)
```

Features:

- Timed or permanent modifiers
- Priority-based application
- Stackable or non-stackable
- Lifecycle hooks
- Metadata storage

## Store Integration

The engine coordinates between multiple focused stores:

- **gameState**: Core game state (grid, words, found words)
- **gameTimer**: Timer logic and controls
- **gameScoring**: Score calculation and multipliers
- **challengeMode**: Challenge-specific logic
- **categories**: Word categories and selection

## Event System

Events follow a namespaced pattern: `namespace:action`

Core events:

- **engine:initialized** - Engine has been initialized
- **game:starting** - Game is about to start
- **game:started** - Game has started
- **game:paused** - Game has been paused
- **game:resumed** - Game has been resumed
- **game:completed** - Game has been completed
- **game:ended** - Game has been ended manually
- **game:error** - Error occurred during game
- **word:found** - Word has been found
- **word:invalid** - Invalid word attempted
- **word:duplicate** - Already found word attempted
- **word:error** - Error processing word
- **modifier:activated** - Modifier has been activated
- **modifier:deactivated** - Modifier has been deactivated
- **challenge:round-complete** - Challenge round completed
- **challenge:completed** - Challenge fully completed

## Modifier System

Modifiers can affect various aspects of the game:

- **score** - Modify score calculation
- **timer** - Affect timer behavior
- **grid** - Change grid appearance or behavior
- **word** - Modify word finding behavior
- **generic** - Apply to multiple types

Modifiers have:

- **Priority** - Higher priority modifiers are applied first
- **Duration** - Timed or permanent
- **Stackability** - Whether multiple of the same type can be active

## Usage Examples

### Basic Game Flow

```javascript
// Initialize
const gameEngine = new GameEngine()
gameEngine.initialize()

// Set up event listeners
gameEngine.on('word:found', ({ word, score }) => {
  console.log(`Found ${word} for ${score} points!`)
})

gameEngine.on('game:completed', (data) => {
  console.log(`Game complete! Final score: ${data.score}`)
})

// Start a game
await gameEngine.startGame({
  category: 'animals',
  difficulty: 'medium',
})

// Find words
await gameEngine.foundWord('cat', { startPos: [0, 0], endPos: [2, 0] })
await gameEngine.foundWord('dog', { startPos: [1, 1], endPos: [3, 3] })

// End game
gameEngine.endGame()
```

### Using Modifiers

```javascript
// Create a time slow modifier
class TimeSlowModifier extends BaseModifier {
  constructor() {
    super({
      name: 'TimeSlow',
      type: 'timer',
      duration: 15,
      stackable: false,
    })
  }

  async apply(type, value, context) {
    if (type === 'timer' && context.action === 'tick') {
      // Slow down timer by returning 0.5 seconds instead of 1
      return 0.5
    }
    return value
  }
}

// Activate the modifier
const timeSlow = new TimeSlowModifier()
await timeSlow.activate()
gameEngine.registerModifier(timeSlow)

// Will automatically deactivate after duration
```

## Extension Points

The architecture is designed for extensibility:

1. **Custom Modifiers** - Create new modifier classes
2. **Event Listeners** - Subscribe to game events
3. **Store Extensions** - Add new stores for additional state
4. **Custom Game Modes** - Build on top of the core engine

## Testing

The engine is fully testable with comprehensive unit and integration tests:

```javascript
// Unit testing a modifier
describe('DoubleScoreModifier', () => {
  it('should double the score value', async () => {
    const modifier = new DoubleScoreModifier()
    await modifier.activate()

    const result = await modifier.apply('score', 100, {})
    expect(result).toBe(200)
  })
})
```

## Performance Considerations

The engine is optimized for performance:

- Event handlers are prioritized and optimized
- Modifiers are applied efficiently
- Async operations are handled properly
- Memory usage is minimized

## Future Extensibility

This architecture supports future enhancements like:

- Card deck enhancement system
- Achievements system
- Multiplayer support
- Custom game modes
- Visual effects system
