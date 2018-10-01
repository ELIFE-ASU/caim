// Copyright 2018. Douglas G. Moore. All rights reserved.
// Use of this source code is governed by the MIT
// license that can be found in the LICENSE file.
const {Session} = require('../src/session');
const fs = require('fs');
const path = require('path');

const session_dir = 'test/session';

beforeAll(function() {
    if (!fs.existsSync(session_dir)) {
        fs.mkdirSync(session_dir);
    }
});

test('session throws', function() {
    expect(Session).toThrow(Error);
    expect(() => Session('')).toThrow(Error);
});

test('session store path', function() {
    expect(Session(session_dir).path).toBe(session_dir);
});

test('session cannot save to invalid path', function() {
    expect(Session('does-not-exist').save()).rejects.toThrow(/ENOENT/);
});

test('session saves to path', async function() {
    const session = Session(session_dir);
    const session_file = await session.save();
    const read_session = JSON.parse(fs.readFileSync(session_file));
    expect(session).toMatchObject(read_session);
});
