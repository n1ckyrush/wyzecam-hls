import { promises as fs } from 'fs'

import log from './log'
import cleanupTmpFiles from './cleanupTmpFiles'
import cleanupNfs from './cleanupNfs'
import checkNewVideoFile from './checkNewVideoFile'
import checkPlaylistFile from './checkPlaylistFile'
import playSegment from './playSegment'
import showStats from './showStats'

export const createCameraInstance = async (cameraConfig) => {
  if (!cameraConfig.NFS_PATH) {
    log('error', 'FATAL: no NFS_PATH is set, skip this camera...')
    return
  }

  if (!cameraConfig.NAME) {
    // by default set camera name equal to NFS folder name
    cameraConfig.NAME = cameraConfig.NFS_PATH.split('/').pop()
  }

  const camera = {
    config: cameraConfig,
    state: {
      mediaSequenceCounter: 0,
      segments: [],
      filenames: {},
      latestPlsCtimeMs: null,
      latestFilePath: null,
      latestFileCtimeMs: null,
      warningsCount: 0,
      errorsCount: 0
    },
    logPrefix: `[${cameraConfig.NAME}]`
  }

  // clean old previous tmp files
  try {
    await fs.rmdir(cameraConfig.TMP_PATH, { recursive: true })
  } catch (fsErr) {
    console.error('rmdir rerror:')
    log(fsErr)
    return
  }

  // check tmp dir existence
  try {
    await fs.mkdir(cameraConfig.TMP_PATH, { recursive: true })
  } catch (fsErr) {
    console.error('mkdir error:')
    log(fsErr)
    return
  }

  await cleanupNfs(camera)
  await cleanupTmpFiles(camera)

  await checkNewVideoFile(camera)
  await checkPlaylistFile(camera)
  await playSegment(camera)

  await showStats(camera)

  return camera
}

export default createCameraInstance
