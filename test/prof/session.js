const Session = require('../../src/session.js');
const { Point, Circle } = require('../../src/selection.js');
const path = require('path');
const fs = require('fs-extra');

const timeit = async function(callback, message) {
    let result = null;

    if (message) { process.stdout.write(message + '... '); }

    const start = process.hrtime();
    if (callback.constructor.name === 'AsyncFunction') {
        result = await callback();
    } else {
        result = callback();
    }
    const stop = process.hrtime(start);
    const duration = stop[0] + 1e-9*stop[1];

    if (message) { process.stdout.write(`done. (${Math.round(1e3*duration)/1000}s)\n`); }

    return { result, duration };
};

const load_session = async function(session_dir, video_path) {
    let session = null;
    const session_path = path.join(session_dir, 'session.json');

    if (fs.existsSync(session_path)) {
        let { result } = await timeit(async () => Session.load(session_path), 'Reloading session');
        session = result;
    } else {
        let { result } = await timeit(async () => new Session(session_dir), 'Creating session');
        session = result;
    }

    if (!session.metadata.video) {
        await timeit(async () => session.import_video(video_path), 'Importing video');
    }

    await session.save();

    return session;
};

const statistics = function(xs) {
    const μ = xs.reduce((acc, x) => acc + x) / xs.length;
    const σ = Math.sqrt(xs.reduce((acc, x) => acc + (x - μ)**2) / (xs.length - 1));
    let min = xs[0], max = xs[0];
    xs.forEach((x) => { min = Math.min(min, x); max = Math.max(max, x); });
    return { μ, σ, min, max };
};

const evaluate = async function(session, N=100) {
    let width = session.range_image.bitmap.width,
        height = session.range_image.bitmap.height,
        shape = Circle(Point(width/2, height/2), Point(width/2, Math.round(width/20))),
        durations = new Array(N);

    for (let i = 0; i < N; ++i) {
        let { duration } = await timeit(() => shape.timeseries(session.active_frames));
        durations[i] = duration;
    }

    let stats = statistics(durations);
    process.stdout.write(`Trials: ${N}\n`);
    process.stdout.write(`Duration: ${stats.μ} ± ${stats.σ}\n`);
    process.stdout.write(`Range: [${stats.min}, ${stats.max}]\n`);
};

const session_dir = path.join('test', 'session');
const video_path = path.join('test', 'data', 'cropped.avi');

load_session(session_dir, video_path)
    .then(evaluate)
    .catch((err) => process.stderr.write(err + '\n'));
