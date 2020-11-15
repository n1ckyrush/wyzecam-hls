import { spawn } from 'child_process'
import { promises as fs } from 'fs'

import log from './log'

// wait X seconds after the latest file was created
// sometimes file might be created in NFS but writing from a cam isn't finished yet
const FRESH_FILE_THRESHOLD_SEC = 10

const convertFile = async (camera, filepath, startNumber) => {
  const logPrefix = `${camera.logPrefix}[convertFile]`
  const cmd = 'ffmpeg'
  const args = [
    '-i', filepath,
    '-vcodec', 'copy',
    '-c', 'copy',
    '-hls_allow_cache', '0',
    '-hls_list_size', '0',
    '-hls_time', '2',
    '-start_number', startNumber,
    '-hls_flags', 'delete_segments+omit_endlist',
    '-f', 'hls', `${camera.config.TMP_PATH}/latest.m3u8`
  ]

  log('debug', logPrefix, `${cmd} ${args.join(' ')}`)

  return new Promise((resolve) => {
    const proc = spawn(cmd, args)

    proc.stdout.on('data', (data) => {
      log('debug2', logPrefix, 'stdout:', data)
    })

    proc.stderr.setEncoding('utf8')
    proc.stderr.on('data', (data) => {
      log('debug2', logPrefix, 'stderr:', data)
    })

    proc.on('close', (code) => {
      log('debug', logPrefix, `finished with code ${code}`)
      resolve()
    })
  })
}

const runTimeout = (camera, timeoutSec) => {
  setTimeout(() => checkNewVideoFile(camera), (timeoutSec || camera.config.CHECK_NEW_VIDEO_FILE_PERIOD_SEC) * 1000)
}

export const checkNewVideoFile = async (camera) => {
  const { config, state } = camera
  const camRootPath = `${config.NFS_PATH}/record`
  const logPrefix = `${camera.logPrefix}[checkNewVideoFile]`

  // find the latest date
  let datesList = await fs.readdir(camRootPath)
  datesList = datesList.filter(file => parseInt(file) > 0)
  if (!datesList.length) {
    log('warn', logPrefix, 'no dates folders exist')
    state.warningsCount++
    return runTimeout(camera)
  }
  let latestDate = datesList.pop()

  // find the latest hour
  let hoursList = await fs.readdir([camRootPath, latestDate].join('/'))
  hoursList = hoursList.filter(file => parseInt(file) >= 0)
  if (!hoursList.length) {
    log('warn', logPrefix, 'no hours folders exist')
    state.warningsCount++
    return runTimeout(camera)
  }

  let latestHour
  let latestFile
  while (!latestFile) {
    if (hoursList.length === 0) {
      log('warn', logPrefix, `no hours left in the latest day, try the day before... ${latestDate} -> ${datesList[datesList.length - 1]}`)
      state.warningsCount++
      latestDate = datesList.pop()
      hoursList = await fs.readdir([camRootPath, latestDate].join('/'))
      hoursList = hoursList.filter(file => parseInt(file) >= 0)
    }
    latestHour = hoursList.pop()

    // find the latest minute
    let minutesList = await fs.readdir([camRootPath, latestDate, latestHour].join('/'))
    minutesList = minutesList.filter(file => parseInt(file) >= 0)
    if (minutesList.length === 0) {
      continue
    }

    latestFile = minutesList.pop()
  }

  const filePath = [camRootPath, latestDate, latestHour, latestFile].join('/')
  const fileStat = await fs.stat(filePath)
  const fileCreatedAgo = (Date.now() - fileStat.ctimeMs) / 1000
  const freshThresholdDiff = Math.floor(FRESH_FILE_THRESHOLD_SEC - fileCreatedAgo)
  log('debug', logPrefix, `latestDate = ${latestDate}, latestHour = ${latestHour}, latestFile = ${latestFile} (created ${Math.round(fileCreatedAgo)}s ago)`)
  if (freshThresholdDiff > 0) {
    log('debug', logPrefix, `the latest file is too fresh, wait ${freshThresholdDiff}s...`)
    return runTimeout(camera, freshThresholdDiff)
  }

  if (fileCreatedAgo > 60) {
    log('error', logPrefix, `${latestFile} - file was created ${fileCreatedAgo}s ago, probably there are missing minutes. It might be because of bad wifi connection.`)
    state.errorsCount++
  }

  log('debug', logPrefix, `new file: ${filePath}, current file: ${state.latestFilePath}`)
  if (filePath !== state.latestFilePath) {
    state.latestFilePath = filePath
    state.latestFileCtimeMs = fileStat.ctimeMs

    // by default set segment start number to current timestamp
    let segmentStartNumber = Math.floor(Date.now() / 1000)
    if (config.DEBUG_MODE) {
      // for debugging it might be useful to have some of latest file info inside the number
      const curDate = new Date()
      segmentStartNumber = `${curDate.getMinutes()}${curDate.getSeconds()}000${latestHour}${latestFile.split('.')[0]}000`
    }

    await convertFile(camera, filePath, segmentStartNumber)
  }

  runTimeout(camera)
}

export default checkNewVideoFile
