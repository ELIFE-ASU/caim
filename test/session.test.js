const Session = require('../src/session');
const fs = require('fs-extra');
const path = require('path');

const session_dir = path.join('test','session');
const session_path = path.join(session_dir, 'session.json');

beforeEach(() => fs.emptyDirSync(session_dir));

afterEach(() => fs.removeSync(session_dir));

test('session requires path', function() {
    expect(() => new Session()).toThrow(Error);
    expect(() => new Session(null)).toThrow(Error);
    expect(() => new Session('')).toThrow(Error);
});

test('session constructs', function() {
    const session = new Session(session_dir);
    expect(session.path).toBe(session_dir);
    expect(session.metadata).toMatchObject({});
});

test('session constructs with data', function() {
    const session = new Session(session_dir, { video: 'video.avi' });
    expect(session.path).toBe(session_dir);
    expect(session.metadata).toMatchObject({ video: 'video.avi' });
});

test('session cannot save to invalid path', function() {
    return expect((new Session('does-not-exist')).save()).rejects.toThrow(/ENOENT/);
});

test('session saves and is loadable', async function() {
    const session = new Session(session_dir);
    await session.save();

    const read_session = await Session.load(session_path);
    expect(read_session).toMatchObject(session);
});
