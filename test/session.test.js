const {Session, load_session} = require('../src/session');
const fs = require('fs-extra');

const session_dir = 'test/session';

beforeEach(function() {
    if (!fs.existsSync(session_dir)) {
        fs.mkdirSync(session_dir);
    }
});

afterEach(async function() {
    if (fs.existsSync(session_dir)) {
        fs.removeSync(session_dir);
    }
});

test('session requires path', function() {
    expect(Session).toThrow(Error);
    expect(() => Session(null)).toThrow(Error);
    expect(() => Session('')).toThrow(Error);
});

test('session constructs', function() {
    const session = Session(session_dir);
    expect(session.path).toBe(session_dir);
    expect(session.data).toMatchObject({});
});

test('session cosntructs with data', function() {
    const session = Session(session_dir, { video: 'video.avi' });
    expect(session.path).toBe(session_dir);
    expect(session.data).toMatchObject({ video: 'video.avi' });
});

test('session cannot save to invalid path', function() {
    expect(Session('does-not-exist').save()).rejects.toThrow(/ENOENT/);
});

test('session saves and is loadable', async function() {
    const session = Session(session_dir);
    await session.save();

    const expectedSession = Object.assign(session, {
        save: expect.any(Function)
    });

    const read_session = await load_session(session_dir);
    expect(read_session).toMatchObject(expectedSession);
});
