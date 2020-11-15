import { systemConfig } from '../config'

const minVerbosityLevelsByTypes = {
  error: 0,
  warn: 1,
  info: 1,
  debug: 2,
  debug2: 3
}

export const log = (...args) => {
  if (typeof minVerbosityLevelsByTypes[args[0]] !== 'undefined') {
    const logType = args.shift()
    const minVerbosityLevel = minVerbosityLevelsByTypes[logType]
    if (minVerbosityLevel > 0 && minVerbosityLevel > systemConfig.VERBOSITY_LEVEL) {
      return
    }

    const logArgs = [(new Date()).toISOString(), `[${minVerbosityLevel}]`, ...args]
    if (logType === 'error') {
      console.error(...logArgs)
    } else if (logType === 'warn') {
      console.warn(...logArgs)
    } else {
      console.log(...logArgs)
    }
  } else {
    console.log((new Date()).toISOString(), ...args)
  }
}

export default log
