import log from './log'

// if the queue is too long, then something is wrong probably
const LONG_QUEUE_LENGTH_THRESHOLD = 200

export const playSegment = async (camera) => {
  const { state } = camera
  const logPrefix = `${camera.logPrefix}[playSegment]`

  // default play period is 2 seconds, but some segments might have less duration
  let tickTime = 2
  if (state.segments.length > 0) {
    const nextSegment = state.segments.shift()

    tickTime = nextSegment.duration

    // EXT-X-MEDIA-SEQUENCE has to increase by 1 every time we add a new segment into HLS playlist
    state.mediaSequenceCounter++

    log('debug', logPrefix, `segments.len = ${state.segments.length}, nextSegment = ${nextSegment.filename} (${nextSegment.duration}s), added ${Math.round((Date.now() - nextSegment.addedAtMs) / 1000)}s ago`)

    if (state.segments.length >= LONG_QUEUE_LENGTH_THRESHOLD) {
      log('error', logPrefix, `segments queue is too long (${state.segments.length}), something is wrong`)
      state.errorsCount++
    }
  } else {
    log('debug', logPrefix, 'segments queue is empty')
  }

  setTimeout(() => playSegment(camera), tickTime * 1000)
}

export default playSegment
