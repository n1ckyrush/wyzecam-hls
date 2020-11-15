import { promises as fs } from 'fs'

import log from './log'

export const cleanupTmpFiles = async (camera) => {
  const { config, state } = camera
  const logPrefix = `${camera.logPrefix}[cleanupTmpFiles]`

  // clean temporary files on disk
  const stats = {
    total: 0,
    deleted: 0
  }
  const filenames = await fs.readdir(config.TMP_PATH)
  for (const filename of filenames) {
    if (!filename.includes('.ts')) {
      continue
    }

    stats.total++
    const filepath = `${config.TMP_PATH}/${filename}`
    const fileStat = await fs.stat(filepath)
    const fileCreatedAgoSec = (Date.now() - fileStat.ctimeMs) / 1000
    if (fileCreatedAgoSec >= config.TMP_CLEANUP_OLD_SEC) {
      log('debug', logPrefix, `${filename}: modified ${fileCreatedAgoSec}s ago => remove`)
      try {
        await fs.unlink(filepath)
      } catch (unlinkErr) {
        log('error', logPrefix, 'unlink error:', unlinkErr)
        state.errorsCount++
      }
      stats.deleted++
    }
  }
  log('info', logPrefix, `stats: ${JSON.stringify(stats)}`)

  // clean temporary files in memory, which is used by HTTP handler
  Object.entries(state.filenames).forEach(([filename, createdAtMs]) => {
    const fileCreatedAgo = (Date.now() - createdAtMs) / 1000
    if (fileCreatedAgo >= 120) {
      log('debug', logPrefix, `purge ${filename} from memory, created ${fileCreatedAgo}s ago`)
      delete state.filenames[filename]
    }
  })

  setTimeout(() => cleanupTmpFiles(camera), config.TMP_CLEANUP_PERIOD_SEC * 1000)
}

export default cleanupTmpFiles
