const fs = require('fs');
const path = require('path');

// ## Sessions
//
// Caim maintains all of its working data inside of directories which have a
// particular internal structure. These directories are referred to as
// "Sessions". A session can be created given a directory path.
const Session = function() {
    // Sessions as they are now do not store any information.
    const session = { };

    // Sessions can save their internal state as a JSON object. Calling
    // `save(session_path)` on a session will save the JSON object in a file
    // `${session_path}/session.json`.
    session.save = function(session_path) {
        // I have to make sure that the path is neither `undefined` nor empty
        // (`''`).
        if (session_path === undefined) {
            throw new Error('no session path');
        } else if (session_path === '') {
            throw new Error(`invalid session path ("$(session_path)")`);
        }
        const session = this;
        const session_file = path.join(session_path, 'session.json');
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
