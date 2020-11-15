module.exports = {
  apps: [
    {
      name: 'wyzecam-hls',
      script: './app.js',
      node_args: '-r esm',
      watch: false
    }
  ]
}
