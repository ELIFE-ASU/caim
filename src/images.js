const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_path = require('ffmpeg-static-electron').path;

ffmpeg.setFfmpegPath(ffmpeg_path);

async function extract_frames(video_path) {
    const session_path = path.dirname(video_path);
    const frames_path = path.join(session_path, 'frames');
    const frames_format = path.join(frames_path, '%06d.bmp');

    await fs.emptyDir(frames_path);

    return new Promise((resolve, reject) => {
        ffmpeg(video_path)
            .on('start', () => {})
            .on('end', () => resolve(frames_format))
            .on('error', (err) => reject(err))
            .output(frames_format)
            .run();
    });
}

module.exports = {
    extract_frames: extract_frames
};