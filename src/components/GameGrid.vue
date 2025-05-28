<!-- GameGrid.vue - Main word search grid component -->
<template>
  <div class="game-grid-container" :style="containerStyle">
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
        class="grid-cell"
        :data-x="index % gridSize"
        :data-y="Math.floor(index / gridSize)"
        v-memo="[letter]"
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

    <!-- Confetti container for victory animation -->
    <div ref="confettiContainer" class="confetti-container" />
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
  min-height: var(--total-size);
  user-select: none;
  touch-action: none;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-size), var(--cell-size));
  gap: var(--cell-gap);
  background: var(--q-primary);
  border-radius: 8px;
  contain: strict;
  position: relative;
  overflow: visible;
}

.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: black;
  border-radius: 4px;
  font-weight: bold;
  font-size: 1.2em;
  user-select: none;
  cursor: pointer;
  width: var(--cell-size);
  height: var(--cell-size);
  will-change: transform;
  contain: content;
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
  stroke: var(--q-secondary);
  stroke-width: 8;
  stroke-linecap: round;
  opacity: 0.7;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
  vector-effect: non-scaling-stroke;
}

.selection-line.current {
  stroke-dasharray: 12;
  animation: dash 1s linear infinite;
}

.selection-line.permanent {
  opacity: 0.5;
  stroke-width: 10;
  animation: appear 0.5s ease-out;
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
  background: #ffeb3b;
  border: 2px solid #ff9800;
  border-radius: 8px;
  color: #333;
  font-family: monospace;
  min-height: 200px;
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
    stroke-width: 4;
  }
  to {
    opacity: 0.5;
    stroke-width: 10;
  }
}
</style>

<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { useWordGrid } from '../composables/useWordGrid'
import { useWordSelection } from '../composables/useWordSelection'
import { useGameAnimations } from '../composables/useGameAnimations'

const props = defineProps({
  cellSize: {
    type: Number,
    default: 40,
  },
  gap: {
    type: Number,
    default: 4,
  },
})

// Store and composables
const gameStore = useGameStore()
const { grid, gridSize } = useWordGrid()
const {
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

// Calculate total grid dimensions
const totalSize = computed(() => (props.cellSize + props.gap) * gridSize.value - props.gap)

// Container style with CSS variables
const containerStyle = computed(() => ({
  '--cell-size': `${props.cellSize}px`,
  '--cell-gap': `${props.gap}px`,
  '--grid-size': gridSize.value,
  '--total-size': `${totalSize.value}px`,
}))

// Grid style with explicit dimensions
const gridStyle = computed(() => ({
  width: `${totalSize.value}px`,
  height: `${totalSize.value}px`,
}))

// Flatten grid for better performance
const flatGrid = computed(() => grid.value.flat())

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

onUnmounted(() => {
  cleanupSelection()
  cleanupAnimations()
})
</script>
