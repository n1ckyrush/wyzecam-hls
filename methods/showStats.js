import log from './log'

import { systemConfig } from '../config'

export const showStats = async (camera) => {
  if (!systemConfig.STATS_PERIOD_SEC) {
    // disabled
    return
  }

  const { state } = camera
  const logPrefix = `${camera.logPrefix}[stats]`

  const delaySec = state.segments[0] ? Math.round((Date.now() - state.segments[0].timestampMs) / 1000) : '-'
  const latestFilename = state.latestFilePath ? state.latestFilePath.split('/').slice(-3).join('/') : '-'

  log('info', logPrefix, `stream delay: ${delaySec}s, segments in queue: ${state.segments.length}, latest file: ${latestFilename}, errors: ${state.errorsCount}, warnings: ${state.warningsCount}`)

  setTimeout(() => showStats(camera), systemConfig.STATS_PERIOD_SEC * 1000)
}

export default showStats
