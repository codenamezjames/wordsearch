import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useTimer } from '../useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    // Reset timers before each test
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Restore timers after each test
    vi.restoreAllMocks()
  })

  it('initializes with correct default values', () => {
    const { seconds, isRunning, formattedTime } = useTimer()
    expect(seconds.value).toBe(0)
    expect(isRunning.value).toBe(false)
    expect(formattedTime.value).toBe('00:00')
  })

  it('starts the timer correctly', () => {
    const { start, isRunning, seconds } = useTimer()
    start()
    expect(isRunning.value).toBe(true)

    // Advance timer by 2 seconds
    vi.advanceTimersByTime(2000)
    expect(seconds.value).toBe(2)
  })

  it('stops the timer correctly', () => {
    const { start, stop, isRunning, seconds } = useTimer()
    start()
    vi.advanceTimersByTime(2000)
    stop()

    expect(isRunning.value).toBe(false)
    const currentSeconds = seconds.value
    vi.advanceTimersByTime(1000)
    expect(seconds.value).toBe(currentSeconds) // Should not increase after stop
  })

  it('resets the timer correctly', () => {
    const { start, reset, seconds, isRunning } = useTimer()
    start()
    vi.advanceTimersByTime(5000)
    reset()

    expect(seconds.value).toBe(0)
    expect(isRunning.value).toBe(false)
  })

  it('formats time correctly', () => {
    const { start, formattedTime } = useTimer()
    start()

    // Test different time formats
    expect(formattedTime.value).toBe('00:00')

    vi.advanceTimersByTime(59000) // 59 seconds
    expect(formattedTime.value).toBe('00:59')

    vi.advanceTimersByTime(1000) // 1 minute
    expect(formattedTime.value).toBe('01:00')

    vi.advanceTimersByTime(3480000) // 58 more minutes (total 59 minutes)
    expect(formattedTime.value).toBe('59:00')

    vi.advanceTimersByTime(60000) // 1 more minute (total 60 minutes / 1 hour)
    expect(formattedTime.value).toBe('00:00') // Should wrap around at 60 minutes
  })

  it('prevents multiple timer instances', () => {
    const { start, seconds } = useTimer()
    start()
    start() // Second start should not create another interval

    vi.advanceTimersByTime(1000)
    expect(seconds.value).toBe(1) // Should only increment once
  })

  it('cleans up correctly', () => {
    const { start, cleanup, seconds } = useTimer()
    start()
    cleanup()

    vi.advanceTimersByTime(1000)
    expect(seconds.value).toBe(0) // Should not increment after cleanup
  })
})
