<!-- GameGrid.vue - Main word search grid component -->
<template>
  <div class="game-grid-container" :style="containerStyle" ref="containerRef">
    <!-- Grid cells -->
    <div
      class="game-grid"
      :style="gridStyle"
      @mousedown.prevent="handleMouseDown"
      @mouseup.prevent="handleMouseUp"
      @mouseleave.prevent="handleMouseUp"
      @mousemove.prevent="handleMouseMove"
      @touchstart.prevent="handleTouchStart"
      @touchend.prevent="handleTouchEnd"
      @touchmove.prevent="handleTouchMove"
    >
      <!-- SVG overlay for drawing selection lines -->
      <svg
        class="selection-overlay"
        :width="totalSize"
        :height="totalSize"
        :viewBox="`0 0 ${totalSize} ${totalSize}`"
        preserveAspectRatio="none"
      >
        <!-- Found word lines -->
        <line
          v-for="(line, index) in permanentLines"
          :key="index"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          class="selection-line permanent"
        />
        <!-- Current selection line -->
        <line
          v-if="selectionLine"
          :x1="selectionLine.x1"
          :y1="selectionLine.y1"
          :x2="selectionLine.x2"
          :y2="selectionLine.y2"
          class="selection-line current"
        />
      </svg>

      <div
        v-for="(letter, index) in flatGrid"
        :key="index"
        :class="[
          'grid-cell',
          {
            selected: isCellSelected(index % gridSize, Math.floor(index / gridSize)),
          },
        ]"
        :data-x="index % gridSize"
        :data-y="Math.floor(index / gridSize)"
      >
        {{ letter }}
      </div>

      <!-- Debug info when grid is empty -->
      <div v-if="flatGrid.length === 0" class="debug-info">
        <p>Grid is empty!</p>
        <p>Grid size: {{ gridSize }}</p>
        <p>Grid data: {{ JSON.stringify(grid) }}</p>
      </div>
    </div>

    <!-- Update confetti container to use canvas -->
    <canvas ref="confettiContainer" class="confetti-container" />
  </div>
</template>

<style scoped>
.game-grid-container {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  user-select: none;
  touch-action: none;
  padding: 8px;
  box-sizing: border-box;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-size), var(--cell-size));
  gap: var(--cell-gap);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: var(--grid-padding);
  contain: strict;
  position: relative;
  overflow: visible;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: var(--q-primary);
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.2em;
  user-select: none;
  cursor: pointer;
  width: var(--cell-size);
  height: var(--cell-size);
  will-change: transform;
  contain: content;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.grid-cell:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.grid-cell.selected {
  background: var(--q-secondary, #26a69a) !important;
  color: white !important;
  transform: scale(1.1) !important;
  box-shadow: 0 0 16px rgba(38, 166, 154, 0.6) !important;
  z-index: 1;
  position: relative;
  border: 2px solid #ffffff !important;
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.selection-line {
  stroke: rgba(255, 255, 255, 0.8);
  stroke-width: var(--stroke-width);
  stroke-linecap: round;
  opacity: 0.8;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
  transition: all 0.3s ease;
  vector-effect: non-scaling-stroke;
}

.selection-line.current {
  stroke-dasharray: 12;
  animation: dash 1s linear infinite;
  stroke: var(--q-secondary);
  filter: drop-shadow(0 0 12px rgba(38, 166, 154, 0.8));
}

.selection-line.permanent {
  opacity: 0.6;
  stroke-width: var(--permanent-stroke-width);
  animation: appear 0.5s ease-out;
  stroke: var(--q-positive);
  filter: drop-shadow(0 0 8px rgba(var(--q-positive-rgb), 0.6));
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.debug-info {
  padding: 20px;
  background: rgba(255, 235, 59, 0.9);
  border: 2px solid #ff9800;
  border-radius: 8px;
  color: #333;
  font-family: monospace;
  min-height: 200px;
  backdrop-filter: blur(5px);
}

.debug-info p {
  margin: 5px 0;
  word-break: break-all;
}

@keyframes dash {
  to {
    stroke-dashoffset: -24;
  }
}

@keyframes appear {
  from {
    opacity: 0;
    stroke-width: calc(var(--stroke-width) * 0.4);
  }
  to {
    opacity: 0.6;
    stroke-width: var(--permanent-stroke-width);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .game-grid-container {
    padding: 6px;
    --grid-padding: 8px;
  }

  .game-grid {
    padding: 8px;
    border-radius: 8px;
  }

  .grid-cell {
    border-radius: 6px;
    font-size: 1.1em;
  }
}

@media (max-width: 480px) {
  .game-grid-container {
    padding: 4px;
    --grid-padding: 6px;
  }

  .game-grid {
    padding: 6px;
    border-radius: 6px;
  }

  .grid-cell {
    border-radius: 4px;
    font-size: 1em;
  }
}

@media (max-height: 600px) {
  .game-grid-container {
    padding: 4px;
    --grid-padding: 6px;
  }

  .game-grid {
    padding: 6px;
  }
}

/* Dark mode adjustments */
body.body--dark .game-grid {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.05);
}

body.body--dark .grid-cell {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

body.body--dark .grid-cell:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

<script setup>
import { computed, onUnmounted, watch, ref, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { useWordGrid } from '../composables/useWordGrid'
import { useWordSelection } from '../composables/useWordSelection'
import { useGameAnimations } from '../composables/useGameAnimations'

const props = defineProps({
  gap: {
    type: Number,
    default: 4,
  },
})

// Store and composables
const gameStore = useGameStore()
const { gridSize } = useWordGrid()
// Use the game store grid directly to ensure consistency
const grid = computed(() => gameStore.grid)
const {
  selectedCells,
  selectionLine,
  permanentLines,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  cleanup: cleanupSelection,
} = useWordSelection()

const {
  confettiContainer,
  createFloatingText,
  triggerVictoryConfetti,
  cleanup: cleanupAnimations,
} = useGameAnimations()

// Add these refs and computed properties
const containerRef = ref(null)
const dynamicCellSize = ref(40) // Default size

// Calculate the optimal cell size based on container dimensions
const calculateCellSize = (containerWidth, containerHeight) => {
  if (!containerWidth || !containerHeight) return 40

  // Use the smaller dimension to ensure square grid fits
  const minDimension = Math.min(containerWidth, containerHeight)

  // Account for container padding and grid padding
  const availableSpace = minDimension - 48 // 24px total padding (12px each side)

  // Calculate size based on grid size and gaps
  const size = Math.floor((availableSpace - (gridSize.value - 1) * props.gap) / gridSize.value)

  // Clamp the size between reasonable bounds
  return Math.max(20, Math.min(size, 60))
}

// Update the totalSize computation
const totalSize = computed(() => {
  const baseSize = (dynamicCellSize.value + props.gap) * gridSize.value - props.gap
  return baseSize + 24 // Add padding (12px on each side)
})

// Add stroke width calculation to container style
const containerStyle = computed(() => {
  // Calculate stroke width based on cell size (between 4 and 12)
  const baseStrokeWidth = Math.max(4, Math.min(12, dynamicCellSize.value * 0.2))
  const permanentStrokeWidth = baseStrokeWidth * 1.25 // Slightly thicker for found words

  return {
    '--cell-size': `${dynamicCellSize.value}px`,
    '--cell-gap': `${props.gap}px`,
    '--grid-size': gridSize.value,
    '--total-size': `${totalSize.value}px`,
    '--grid-padding': '12px',
    '--stroke-width': `${baseStrokeWidth}px`,
    '--permanent-stroke-width': `${permanentStrokeWidth}px`,
  }
})

// Grid style with explicit dimensions
const gridStyle = computed(() => ({
  width: `${totalSize.value}px`,
  height: `${totalSize.value}px`,
  padding: 'var(--grid-padding)',
}))

// Flatten grid for better performance
const flatGrid = computed(() => grid.value.flat())

// Helper function to check if a cell is selected
const isCellSelected = (x, y) => {
  const isSelected = selectedCells.value.some((cell) => cell.x === x && cell.y === y)
  if (isSelected && selectedCells.value.length > 0) {
    console.log(`Cell (${x}, ${y}) is selected - total selected: ${selectedCells.value.length}`)
  }
  return isSelected
}

// Watch for game completion
watch(
  () => gameStore.progress,
  (newValue) => {
    if (newValue === 100) {
      triggerVictoryConfetti()
    }
  },
)

// Watch for found words to trigger animations
watch(
  () => gameStore.foundWordsCount,
  (newValue, oldValue) => {
    console.log('Watch triggered - foundWordsCount changed:', { newValue, oldValue })

    if (newValue > oldValue && gameStore.lastFoundWordData) {
      console.log('Conditions met - proceeding with animation')
      console.log('lastFoundWordData:', gameStore.lastFoundWordData)

      const wordData = gameStore.lastFoundWordData
      const centerIndex = Math.floor(wordData.selectedCells.length / 2)
      const centerCell = wordData.selectedCells[centerIndex]
      const element = document.querySelector(`[data-x="${centerCell.x}"][data-y="${centerCell.y}"]`)

      console.log('Center cell:', centerCell)
      console.log('Found element:', element)

      if (element) {
        const rect = element.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2

        console.log('Creating floating text:', {
          word: wordData.word,
          x,
          y,
          rect,
          element,
        })

        // Trigger animation
        createFloatingText(wordData.word, x, y)

        // Clear the data after using it
        gameStore.lastFoundWordData = null
      } else {
        console.warn('Could not find center element for animation')
      }
    } else {
      console.log('Conditions not met:', {
        newValueGreaterThanOld: newValue > oldValue,
        hasWordData: !!gameStore.lastFoundWordData,
      })
    }
  },
)

// Watch for game restarts
watch(
  () => gameStore.isGameActive,
  (isActive) => {
    if (isActive) {
      // Clear permanent lines when game starts
      permanentLines.value = []
      cleanupSelection()
    }
  },
)

// Add resize observer setup
let resizeObserver = null

onMounted(() => {
  const updateSize = () => {
    if (!containerRef.value) return

    const rect = containerRef.value.getBoundingClientRect()
    dynamicCellSize.value = calculateCellSize(rect.width, rect.height)

    // Update confetti canvas size
    if (confettiContainer.value) {
      const canvas = confettiContainer.value
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }
  }

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === containerRef.value) {
        updateSize()
      }
    }
  })

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
    // Initial size calculation
    updateSize()
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  cleanupSelection()
  cleanupAnimations()
})
</script>
