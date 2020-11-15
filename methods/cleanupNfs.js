import { promises as fs } from 'fs'

import log from './log'

export const cleanupNfs = async (camera) => {
  const { config, state } = camera
  const logPrefix = `${camera.logPrefix}[cleanupNfs]`

  const NFS_CLEANUP_OLD_SEC = config.NFS_CLEANUP_OLD_DAYS * 24 * 60 * 60
  if (!(NFS_CLEANUP_OLD_SEC > 0)) {
    log('info', logPrefix, 'no NFS_CLEANUP_OLD_SEC, disable NFS cleanup')
    return
  }

  const stats = {
    total: 0,
    deleted: 0
  }
  for (const nfsFolder of config.NFS_CLEANUP_FOLDERS) {
    const nfsFolderPath = `${config.NFS_PATH}/${nfsFolder}`

    let folderExists = false
    try {
      await fs.access(nfsFolderPath)
      folderExists = true
    } catch (fsErr) {

    }
    if (!folderExists) {
      continue
    }

    const filenames = await fs.readdir(nfsFolderPath)
    log('debug', logPrefix, `checking ${nfsFolderPath}...`)
    for (const filename of filenames) {
      // delete only directories based on modified time
      // assume that folder will change mtime once new file added
      const filePath = [nfsFolderPath, filename].join('/')
      const fileStat = await fs.stat(filePath)
      const fileModifiedAgoSec = (Date.now() - fileStat.mtimeMs) / 1000
      if (fileStat.isDirectory() && fileModifiedAgoSec >= NFS_CLEANUP_OLD_SEC) {
        log('debug', logPrefix, `${filePath}: modified ${fileModifiedAgoSec}s ago => remove`)
        try {
          await fs.rmdir(filePath, { recursive: true })
        } catch (rmErr) {
          log('error', logPrefix, 'rmDir error:', rmErr)
          state.errorsCount++
        }
        stats.deleted++
      }
      stats.total++
    }
  }
  log('info', logPrefix, `stats: ${JSON.stringify(stats)}`)

  setTimeout(() => cleanupNfs(camera), camera.config.NFS_CLEANUP_PERIOD_SEC * 1000)
}

export default cleanupNfs
