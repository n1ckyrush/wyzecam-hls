import { promises as fs } from 'fs'

import log from './log'
import { systemConfig } from '../config'

export const createHttpHandler = (camerasInstances) => {
  const baseUrl = `http://${systemConfig.HOST}:${systemConfig.PORT}`
  for (const camera of camerasInstances) {
    log('info', camera.logPrefix, `HLS URL: ${baseUrl}/${camera.config.NAME}/hls.m3u8`)
  }

  return async (req, res) => {
    const logPrefix = '[HTTP]'
    const urlObj = new URL(req.url, baseUrl)
    const cameraName = urlObj.pathname.split('/')[1] || ''
    const clientIp = req.connection.remoteAddress

    log('debug', logPrefix, `[${clientIp}] ${req.method} ${req.url}, camera = ${cameraName}`)
    const cameraInstance = camerasInstances.find(cam => cam.config.NAME === cameraName)
    if (cameraInstance) {
      if (req.url.includes('.ts')) {
        // endpoint to serve .ts files
        const filename = urlObj.pathname.split('/').pop()
        const filenameExists = cameraInstance.state.filenames[filename]
        if (filenameExists) {
          const filepath = [cameraInstance.config.TMP_PATH, filename].join('/')
          try {
            const fileData = await fs.readFile(filepath)
            res.statusCode = 200
            res.setHeader('Content-Type', 'video/MP2T')
            res.end(fileData)
          } catch (fileErr) {
            log('error', logPrefix, `${filepath} - error:`, fileErr.stack)
            cameraInstance.state.errorsCount++
            res.statusCode = 500
            res.end(JSON.stringify(fileErr))
          }
          return
        }
      } else if (req.url.includes('/hls.m3u8')) {
        // endpoint to serve HLS playlist
        const currentSegments = []
        for (const segNum in cameraInstance.state.segments) {
          const seg = cameraInstance.state.segments[segNum]
          currentSegments.push(`#EXTINF:${seg.duration},`)
          currentSegments.push(`/${cameraName}/${seg.filename}`)
          log('debug2', logPrefix, `[${cameraName}][${cameraInstance.state.mediaSequenceCounter}] ${seg.filename}`)

          if ((segNum + 1) >= systemConfig.MAX_SEGMENTS_IN_PLAYLIST) {
            break
          }
        }

        const plsBody = [
          '#EXTM3U',
          '#EXT-X-VERSION:3',
          '#EXT-X-TARGETDURATION:2',
          `#EXT-X-MEDIA-SEQUENCE:${cameraInstance.state.mediaSequenceCounter}`,
          currentSegments.join('\n')
        ]

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/x-mpegURL')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(plsBody.join('\n'))
        return
      }
    }

    log('debug', logPrefix, `404 Not Found: ${req.url}`)

    res.statusCode = 404
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.write('Not Found')
    res.end()
  }
}

export default createHttpHandler
