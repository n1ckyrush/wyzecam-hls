# WyzeCam HLS support
This tool will allow you to convert MP4 files from WyzeCam into HLS stream. Then you can feed this stream to Shinobi, motioneye, or any other CCTV/NVR solution.

## Why?
WyzeCam support RTSP streams via separate official firmware which is much outdated comparing to the latest firmware. Also, it's well-known for instability and weird glitches. That's why this repo was born.

This tool will create a live stream from your Wyze cameras without RTSP. **You will need to install [WyzeHacks](https://github.com/HclX/WyzeHacks)**. This "hack" will make your camera record MP4 file every minute into NFS share instead of SD card. Then the script will pick these files to create a live HLS stream. Well, it will have **a delay of 60-80 seconds** because camera writes a current minute file in the beginning of next minute.

You can read whole story about my misery with RTSP and WyzeCam in my [personal blog post](https://n1ckyrush.com/en/blog/3-how-to-make-wyzecam-stream-stable-hls-instead-of-rtsp).

## How to configure?
There is a file `config.js` with all the configuration. Just open it with any text editor and adjust settings that you need. 

Essentially, you will have to add your cameras in `cameras` array, it's just a path to camera NFS folder.

Here is an example:
```
export const cameras = [
  {
    NAME: 'cam1',
    NFS_PATH: '/mnt/cams/WyzeCams/1ABC2D3456E7'
  }
]
```

## How to run?
I would suggest using a process manager. For example, pm2.

Here is some quick example how to run it:
```
# install dependencies
npm install

# add your cameras to the config
vi config.js

# install pm2
npm install pm2

# run the script via pm2
pm2 start pm2.config.js

# enable automatic startup on boot
pm2 startup
pm2 save

# add logrotate to pm2
pm2 install pm2-logrotate

# check logs 
pm2 logs wyzecam-hls
```

## NFS cleanup feature
This script can also clean old files from your NFS folder.
For example, you can keep files only for past 24 hours. It will make sense because your long term archive should be maintained by Shinobi or other software which consumes an HLS stream from this script.
Be default this feature is disabled, you can enable it by changing variable `NFS_CLEANUP_OLD_DAYS` variable in `config.js`.

Also, make sure that user under which you run this script has permissions in NFS folder.
For example, I run this script on the same machine where I host NFS, so I've added my user into a group and added uid and gid to exports file.
```
$ adduser --system nfs
$ usermod -a -G nfs nfs
$ usermod -a -G nfs <MY_USER>
$ cat /etc/exports
/mnt/cams 192.168.0.0/24(rw,sync,no_subtree_check,anonuid=113,anongid=<NFS_GROUP_ID>)
```

## Known bugs
### Script is not compatible with ffmpeg3
ffmpeg3 can consume HLS stream from the script, but it throws a lot of warnings about DST timestamps, and output video has a weird FPS and basically is not playable. I've tried to fix it using different options during generating both of my playlists, but nothing helped. Maybe some day somebody will solve it... ffmpeg4 works completely fine though.

## Any ideas or suggestions?
Feel free to open a pull request or create an issue.
