const Session = require('../src/session');
const fs = require('fs-extra');

const session_dir = 'test/session';

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
    expect((new Session('does-not-exist')).save()).rejects.toThrow(/ENOENT/);
});

test('session saves and is loadable', async function() {
    const session = new Session(session_dir);
    await session.save();

    const expectedSession = Object.assign(session, {
        save: expect.any(Function),
        import_video: expect.any(Function),
    });

    const read_session = await Session.load(session_dir);
    expect(read_session).toMatchObject(expectedSession);
});
