const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_path = require('ffmpeg-static-electron').path;
const fs = require('fs-extra');
const jimp = require('jimp');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpeg_path.replace('app.asar', 'app.asar.unpacked'));

const Frame = function(width, height) {
    if (width < 1 || height < 1) {
        throw new Error(`invalid frame dimensions ${width}x${height}`);
    }

    this.data = new Buffer(width * height);
    this.width = width;
    this.height = height;
};

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

async function load_frame(filename) {
    let img = await jimp.read(filename),
        width = img.bitmap.width,
        height = img.bitmap.height,
        data = img.bitmap.data;

    let frame = new Frame(width, height);
    img.scan(0, 0, width, height, function(x, y, idx) {
        let r = data[idx + 0],
            g = data[idx + 1],
            b = data[idx + 2];

        frame.data[idx % 4] = Math.max(r, g, b);
    });

    return frame;
}

async function load_frames(frames_path) {
    const filenames = await fs.readdir(frames_path);
    return Promise.all(filenames.map(function(filename) {
        return load_frame(path.join(frames_path, filename));
    }));
}

module.exports = {
    Frame: Frame,
    extract_frames: extract_frames,
    load_frames: load_frames
};

