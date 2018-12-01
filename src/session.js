const fs = require('fs-extra');
const path = require('path');
const Frame = require('./frame');
const Jimp = require('jimp');

const Meta = {
    video: null,
    frames: false,
    range: false,
    shapes: null,
    timeseries: null,
    binning_method: null,
    binned: null
};

function Session(session_path, metadata={ }) {
    if (session_path === undefined || session_path === null || session_path.trim() === '') {
        throw new Error('session path is required');
    }

    this.path = session_path;
    this.active_frames = null;
    this.range_image = null;
    this.metadata = Object.assign({}, Meta, metadata);
}

Session.prototype.save = function() {
    const session = this;
    const session_file = path.join(session.path, 'session.json');
    return new Promise(function(resolve, reject) {
        fs.writeFile(session_file, JSON.stringify(session.metadata), 'utf8',
            function(err) {
                if (err !== null) {
                    reject(err);
                } else {
                    resolve(session_file);
                }
            }
        );
    });
};

Session.prototype.import_video = async function(video_path) {
    const ext = path.extname(video_path);
    const video_filename = 'video' + ext;
    const local_video_path = path.join(this.path, video_filename);
    const range_path = path.join(this.path, 'range.png');

    fs.copyFileSync(video_path, local_video_path);

    this.active_frames = await Frame.extract(local_video_path);
    this.range_image = await Frame.rangeImage(this.active_frames);
    await this.range_image.write(range_path);

    this.metadata.video = video_filename;
    this.metadata.frames = true;
    this.metadata.range = true;
};

Session.load = async function(session_filename) {
    const session_path = path.dirname(session_filename);
    const data = await fs.readFile(session_filename);

    let session = new Session(session_path, JSON.parse(data));

    if (session.metadata.frames) {
        const frames_path = path.join(session.path, 'frames');
        session.active_frames = await Frame.load(frames_path);
    }

    if (session.metadata.range) {
        const range_path = path.join(session.path, 'range.png');
        session.range_image = await Jimp.read(range_path);
    }

    return session;
};

module.exports = Session;
