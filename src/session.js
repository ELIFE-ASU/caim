const fs = require('fs');
const path = require('path');

const Session = function() {
    const session = { };

    session.save = function(session_path) {
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
