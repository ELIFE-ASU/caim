const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_path = require('ffmpeg-static-electron').path;
const fs = require('fs-extra');
const Jimp = require('jimp');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpeg_path.replace('app.asar', 'app.asar.unpacked'));

const Frame = function(width, height, data=null) {
    if (width < 1 || height < 1) {
        throw new Error(`invalid frame dimensions ${width}x${height}`);
    }

    if (data === null) {
        this.data = new Buffer.alloc(width * height);
    } else {
        this.data = Buffer.from(data);
    }

    this.width = width;
    this.height = height;
};

Frame.from = function(value) {
    if (typeof value === 'string') {
        return Jimp.read(value).then(Frame.from);
    }

    let width = value.bitmap.width,
        height = value.bitmap.height,
        frame = new Frame(width, height);

    value.scan(0, 0, width, height, function(x, y, idx) {
        let r = this.bitmap.data[idx + 0],
            g = this.bitmap.data[idx + 1],
            b = this.bitmap.data[idx + 2];

        frame.data[idx / 4] = Math.max(r, g, b);
    });

    return frame;
};

Frame.prototype.image = async function() {
    let img = await (new Jimp(this.width, this.height)),
        data = this.data;

    img.scan(0, 0, this.width, this.height, function(x, y, idx) {
        this.bitmap.data[idx + 0] = data[idx / 4];
        this.bitmap.data[idx + 1] = data[idx / 4];
        this.bitmap.data[idx + 2] = data[idx / 4];
        this.bitmap.data[idx + 3] = 0xff;
    });

    return img;
};

Frame.prototype.copy = function() {
    return new Frame(this.width, this.height, this.data);
};

Frame.extract = async function(video_path) {
    const session_path = path.dirname(video_path);
    const frames_path = path.join(session_path, 'frames');
    const frames_format = path.join(frames_path, '%06d.png');

    await fs.emptyDir(frames_path);

    await new Promise((resolve, reject) => {
        ffmpeg(video_path)
            .on('start', () => {})
            .on('end', () => resolve(frames_format))
            .on('error', (err) => reject(err))
            .output(frames_format)
            .run();
    });

    return Frame.load(frames_path);
};

Frame.load = async function(frames_path) {
    const filenames = await fs.readdir(frames_path);

    return Promise.all(filenames.map(function(filename) {
        return Frame.from(path.join(frames_path, filename));
    }));
};

Frame.rangeImage = async function(frames) {
    let first = frames[0],
        max_frame = first.copy(),
        min = Buffer.from(first.data),
        max = max_frame.data;

    for (let t = 0, frame_count = frames.length; t < frame_count; ++t) {
        const frame = frames[t];
        for (let i = 0, len = frame.data.length; i < len; ++i) {
            let x = frame.data[i];
            min[i] = Math.min(min[i], x);
            max[i] = Math.max(max[i], x);
        }
    }

    let max_value = 0x0;
    for (let i = 0, len = max.length; i < len; ++i) {
        max[i] -= min[i];
        max_value = Math.max(max_value, max[i]);
    }

    max.map((x) => Math.round(0xff * (x / max_value)));

    return max_frame.image();
};

module.exports = Frame;
