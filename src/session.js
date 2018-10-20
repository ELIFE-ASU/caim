const fs = require('fs-extra');
const path = require('path');
const images = require('./images');

const Session = function(session_path, metadata={ }) {
    if (session_path === undefined || session_path === null || session_path.trim() === '') {
        throw new Error('session path is required');
    }

    const session = {
        path: session_path,
        active_frames: null,
        metadata: metadata
    };

    session.save = function() {
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

    session.import_video = async function(video_path) {
        const ext = path.extname(video_path);
        const video_filename = 'video' + ext;
        const local_video_path = path.join(this.path, video_filename);

        fs.copyFileSync(video_path, local_video_path);

        this.metadata.video = video_filename;
        this.save();

        return images.extract_frames(local_video_path);
    };

    session.load_frames = async function() {
        const frames_path = path.join(this.path, 'frames');
        this.active_frames = images.load_frames(frames_path);
        return this.active_frames;
    };

    return session;
};

const load_session = function(session_path) {
    const session_file = path.join(session_path, 'session.json');
    return new Promise(function(resolve, reject) {
        fs.readFile(session_file, function(err, data) {
            if (err !== null) {
                reject(err);
            } else {
                try {
                    resolve(Session(session_path, JSON.parse(data)));
                } catch (err) {
                    reject(err);
                }
            }
        });
    });
};

module.exports = {
    Session: Session,
    load_session: load_session
};
