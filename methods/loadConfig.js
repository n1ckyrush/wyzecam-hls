import {
  defaultCameraConfig,
  cameras, systemConfig
} from '../config'

import log from './log'

export const loadConfig = async () => {
  const finalConfig = []

  for (const cameraConfig of cameras) {
    const cameraFinalConfig = {
      ...defaultCameraConfig,
      ...cameraConfig,
      TMP_PATH: `${systemConfig.TMP_PATH}/${cameraConfig.NAME}`
    }

    finalConfig.push(cameraFinalConfig)
  }

  log('info', '[loadConfig]', finalConfig)

  return finalConfig
}

export default loadConfig
