const fs = require('fs-extra');
const path = require('path');
const Frame = require('./frame');

const Meta = {
    video: null,
    frames: false
};

function Session(session_path, metadata={ }) {
    if (session_path === undefined || session_path === null || session_path.trim() === '') {
        throw new Error('session path is required');
    }

    this.path = session_path;
    this.active_frames = null;
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

    fs.copyFileSync(video_path, local_video_path);

    this.active_frames = await Frame.extract(local_video_path);

    this.metadata.video = video_filename;
    this.metadata.frames = true;
};

Session.load = function(session_path) {
    const session_file = path.join(session_path, 'session.json');
    return new Promise(function(resolve, reject) {
        fs.readFile(session_file, function(err, data) {
            if (err !== null) {
                reject(err);
            } else {
                try {
                    resolve(new Session(session_path, JSON.parse(data)));
                } catch (err) {
                    reject(err);
                }
            }
        });
    });
};

module.exports = Session;
