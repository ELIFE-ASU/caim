const fs = require('fs');
const path = require('path');

// ## Sessions
//
// Caim maintains all of its working data inside of directories which have a
// particular internal structure. These directories are referred to as
// "Sessions". A session can be created given a directory path.
const Session = function(session_path) {
    // I have to make sure that the path is neither `undefined` nor empty
    // (`''`).
    if (session_path === undefined) {
        throw new Error('no session path');
    } else if (session_path === '') {
        throw new Error(`invalid session path ("$(session_path)")`);
    }

    // Sessions store within themselves the path to their. This property is
    // overwritten when the session is (re)loaded, and all files in the session
    // are referred to relative to this.
    const session = { path: session_path };

    // The session directory contains a JSON file, `{path}/session.json` which
    // stores the content of the Session object.
    session.save = function() {
        const session = this;
        const session_file = path.join(session.path, 'session.json');
        return new Promise(function(resolve, reject) {
            fs.writeFile(session_file, JSON.stringify(session), 'utf8',
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

    return session;
};

module.exports = {
    Session: Session
};
