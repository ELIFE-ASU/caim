const fs = require('fs-extra');
const path = require('path');
const extractFrames = require('ffmpeg-extract-frames');

async function extract_frames(video_path) {
    const session_path = path.dirname(video_path);
    const frames_path = path.join(session_path, 'frames');
    const frames_format = path.join(frames_path, '%06d.bmp');

    await fs.emptyDir(frames_path);

    return extractFrames({
        input: video_path,
        output: frames_format
    });
}

module.exports = {
    extract_frames: extract_frames
};