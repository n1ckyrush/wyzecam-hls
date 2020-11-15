import { promises as fs } from 'fs'

import log from './log'

export const checkPlaylistFile = async (camera) => {
  const { config, state } = camera
  const logPrefix = `${camera.logPrefix}[checkPlaylistFile]`
  const plsPath = `${config.TMP_PATH}/latest.m3u8`
  try {
    const plsData = await fs.readFile(plsPath)
    const fileStat = await fs.stat(plsPath)
    const fileCreatedAgo = (Date.now() - fileStat.ctimeMs) / 1000

    // make sure that this is a new playlist and ffmpeg finished writing it
    if (state.latestPlsCtimeMs !== fileStat.ctimeMs && fileCreatedAgo >= 1) {
      // assume that file was created exactly after 60 seconds after segment started
      // sometimes it might be not the case
      const plsStartTimestampMs = fileStat.ctimeMs - 60 * 1000
      const plsSegments = []
      let plsTotalDuration = 0

      // read segments from new playlist
      const re = /EXTINF:([\d.]+),\s+(.*)\.ts/gi
      let found
      while ((found = re.exec(plsData))) {
        const segmentFilename = `${found[2]}.ts`
        plsSegments.push({
          duration: parseFloat(found[1]),
          filename: segmentFilename,
          timestampMs: plsStartTimestampMs + plsTotalDuration * 1000,
          // mostly for debug purposes
          addedAtMs: new Date()
        })

        plsTotalDuration += parseFloat(found[1])

        // add file to the state to make it available via HTTP
        state.filenames[segmentFilename] = fileStat.ctimeMs
      }

      // add these segments into the queue
      state.segments = state.segments.concat(plsSegments)
      state.latestPlsCtimeMs = fileStat.ctimeMs

      const prevFileCreatedAgo = (Date.now() - state.latestPlsCtimeMs) / 1000
      log('debug', logPrefix, `New playlist! Current pls created ${Math.round(prevFileCreatedAgo)}s ago, new pls created ${Math.round(fileCreatedAgo)}s ago. Total duration ${plsTotalDuration}s, ${plsSegments.length} segments (${plsSegments[0].filename}-${plsSegments[plsSegments.length - 1].filename})`)
    }
  } catch (plsFileErr) {
    log('error', logPrefix, 'playlist file error', plsFileErr.stack)
    state.errorsCount++
  }

  setTimeout(() => checkPlaylistFile(camera), 2 * 1000)
}

export default checkPlaylistFile
