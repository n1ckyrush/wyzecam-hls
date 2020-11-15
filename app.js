import http from 'http'

import { systemConfig } from './config'
import log from './methods/log'
import loadConfig from './methods/loadConfig'
import createCameraInstance from './methods/createCameraInstance'
import createHttpHandler from './methods/createHttpHandler'

const start = async () => {
  const cameras = await loadConfig()
  if (cameras.length === 0) {
    log('error', 'No cameras found in the config. Please, take a look inside config.js file.')
    return
  }

  const camerasInstances = []
  for (const camera of cameras) {
    const cameraInstance = await createCameraInstance(camera)
    camerasInstances.push(cameraInstance)
  }

  log(`creating server on ${systemConfig.HOST}:${systemConfig.PORT}`)
  http
    .createServer(createHttpHandler(camerasInstances))
    .listen(systemConfig.PORT, systemConfig.HOST)
}
start()
