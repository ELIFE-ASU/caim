// Copyright 2018. Douglas G. Moore. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
const {Session, load_session} = require('../src/session');
const fs = require('fs');
const path = require('path');

const session_dir = 'test/session';

beforeAll(function() {
    if (!fs.existsSync(session_dir)) {
        fs.mkdirSync(session_dir);
    }
});

test('session cannot save to invalid path', function() {
    expect(Session().save('does-not-exist')).rejects.toThrow(/ENOENT/);
});

test('session saves and is loadable', async function() {
    const session = Session();
    const session_file = await session.save(session_dir);

    const expectedSession = Object.assign(session, {
        save: expect.any(Function)
    });
    const read_session = await load_session(session_dir);
    expect(read_session).toMatchObject(expectedSession);
});
