import path from 'path'

export const systemConfig = {
  // How detailed would you like to have logs in console (from 0 to 3)
  VERBOSITY_LEVEL: 1,

  // HTTP server host and port
  // WARNING: for security purposes use 127.0.0.1 or make sure to configure firewall properly
  // Otherwise some bad guys would be able to access your HLS playlists from LAN and watch your cameras
  HOST: '127.0.0.1',
  PORT: 9001,

  // Path for temporary files for generated .pls and .ts files
  TMP_PATH: path.resolve([__dirname, './tmp'].join('/')),

  // How many segments will be included in HLS playlist
  MAX_SEGMENTS_IN_PLAYLIST: 3,

  // How often to output stats (in seconds)
  // Set 0 to disable
  STATS_PERIOD_SEC: 30
}

// This is default settings for each camera
export const defaultCameraConfig = {
  // Path to NFS folder that mounted in your camera
  // It can be a local path if you run this script on NFS server
  NFS_PATH: '',

  // Internal name for camera, will be used in logs and in URL for playlists
  NAME: '',

  // Folders to cleanup in NFS
  NFS_CLEANUP_FOLDERS: [
    'alarm',
    'photo',
    'time_lapse',
    'record'
  ],

  // How many days to keep files in NFS before remove
  // Set 0 if you want to disable it and keep files forever
  NFS_CLEANUP_OLD_DAYS: 2,

  // How often to check files in NFS for cleanup (in seconds)
  NFS_CLEANUP_PERIOD_SEC: 5 * 60,

  // How many seconds to keep files in temporary folder
  TMP_CLEANUP_OLD_SEC: 3 * 60,

  // How often to check temporary files for cleanup (in seconds)
  TMP_CLEANUP_PERIOD_SEC: 3 * 60,

  // How often to check new videl file in NFS folder (in seconds)
  CHECK_NEW_VIDEO_FILE_PERIOD_SEC: 3,

  // To enable some features for deep debugging
  DEBUG_MODE: 0
}

// Here you should put all of your cameras for HLS streaming
// The only required variable for each camera is NFS_PATH
export const cameras = [

]

export default cameras
