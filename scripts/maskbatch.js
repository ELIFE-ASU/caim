const program = require('commander');
const Session = require('../src/session.js');
const fs = require('fs-extra');
const path = require('path');
const process = require('process');
const { Mask } = require('../src/selection.js');
const { Signale } = require('signale');
const stringify = require('csv-stringify');

const { warn, fatal } = new Signale();
const signale = new Signale({ disabled: true });
signale.config({ underlineLabel: false });

const VIDEOS = [/^.*\.avi$/i, /^.*\.mov$/i, /^.*\.m4v$/i, /^.*\.mp4$/i];
const IMAGES = [/^.*\.jpe?g$/i, /^.*\.png$/i, /^.*\.tiff?$/i];

const matchesany = (regexs, str) => regexs.some(r => r.test(str));

const isvideo = (path) => matchesany(VIDEOS, path);

const isimage = (path) => matchesany(IMAGES, path);

function groupBy(xs, key) {
    return xs.reduce((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

function pairToObject(pair) {
    try {
        const p = { };
        for (let path of pair) {
            if (isvideo(path)) {
                if (p.video !== undefined) {
                    throw new Error('multiple videos in the pair');
                }
                p.video = path;
            } else if (isimage(path)) {
                if (p.mask !== undefined) {
                    throw Error('multiple images in the pair');
                }
                p.mask = path;
            } else {
                throw Error(`a non-image and non-video file ("${path}") found in pair`);
            }
        }
        if (p.video === undefined) {
            throw Error('no video file found in pair');
        } else if (p.mask === undefined) {
            throw Error('no image file found in pair');
        }
        return p;
    } catch (e) {
        throw Error(e.message + '; ' + JSON.stringify(pair));
    }
}

async function readdir(dir) {
    const files = await fs.readdir(dir);
    return files
        .map(f => path.join(dir, f))
        .filter(f => fs.lstatSync(f).isFile())
        .filter(f => isimage(f) || isvideo(f))
        .map(path.parse);
}

async function getDataPairs(dir) {
    const files = await readdir(dir);
    const pairs = Object.values(groupBy(files, 'name')).map(p => p.map(path.format));
    const valid = pairs.filter(xs => xs.length == 2);
    const invalid = pairs.filter(xs => xs.length != 2);
    if (invalid.length != 0) {
        warn('found files which are not properly paired; skipping ', invalid);
    }
    return valid.map(pairToObject);
}

async function runSession({ video, mask }, { mi, ai, te }) {
    const { root, dir, name } = path.parse(video);
    const sessionDir = path.join(root, dir, 'sessions', name);

    await fs.mkdirs(sessionDir);

    const session = new Session(sessionDir);

    await session.import_video(video);

    const shape = await Mask(mask);
    session.push_shape(shape, 'moving-extremes');

    if (mi) session.mutual_info();
    if (ai) session.active_info();
    if (te) session.transfer_entropy();

    await session.save();

    return session;
}

async function toCSV(data) {
    return new Promise((resolve, reject) => {
        stringify(data, (err, output) => {
            if (err) {
                reject(err);
            } else {
                resolve(output);
            }
        });
    });
}

const prepare = {
    active_info(data, { hlength, pvalue }) {
        const active_info = new Array();
        let warned = false;
        for (let source in data) {
            const ai = data[source].find(({ x }) => x === hlength);
            if (ai === undefined) {
                throw new Error(`no AI values found for history length ${hlength}`);
            }
            if (ai.sig) {
                active_info.push([(ai.sig.p < pvalue) ? ai.y : 0.0]);
            } else {
                if (pvalue <= 1.0 && !warned) {
                    warn(`no significance estimates for AI at history length ${hlength}`);
                    warned = true;
                }
                active_info.push([ai.y]);
            }
        }
        return active_info;
    },

    mutual_info(data, { lag, pvalue }) {
        const N = Object.keys(data).length;
        const mutual_info = new Array();
        for (let i = 0; i < N; ++i) {
            mutual_info.push(new Array(N));
        }
        let warned = false;
        for (let source in data) {
            for (let target in data[source]) {
                const mi = data[source][target].find(({ x }) => x === lag);
                if (mi === undefined) {
                    throw new Error(`no MI values found for lag ${lag}`);
                }
                if (mi.sig) {
                    mutual_info[source][target] = (mi.sig.p < pvalue) ? mi.y : 0.0;
                } else {
                    if (pvalue <= 1.0 && !warned) {
                        warn(`no significance estimates for MI at lag ${lag}`);
                        warned = true;
                    }
                    mutual_info[source][target] = mi.y;
                }
                mutual_info[target][source] = mutual_info[source][target];
            }
        }
        return mutual_info;
    },

    transfer_entropy(data, { hlength, pvalue }) {
        const N = Object.keys(data).length;
        const transfer_entropy = new Array();
        for (let i = 0; i < N; ++i) {
            transfer_entropy.push(new Array(N));
        }
        let warned = false;
        for (let source in data) {
            for (let target in data[source]) {
                const te = data[source][target].find(({ x }) => x === hlength);
                if (te === undefined) {
                    throw new Error(`no TE values found for history length ${hlength}`);
                }
                if (te.sig) {
                    transfer_entropy[source][target] = (te.sig.p < pvalue) ? te.y : 0.0;
                } else {
                    if (pvalue <= 1.0 && !warned) {
                        warn(`no significance estimates for TE at history length ${hlength}`);
                        warned = true;
                    }
                    transfer_entropy[source][target] = te.y;
                }
            }
        }
        return transfer_entropy;
    }
}

async function extractAnalysis(outpath, analysis, data, opts) {
    let prepared = [];
    if (analysis in prepare) {
        prepared = prepare[analysis](data, opts);
    } else {
        throw new Error(`extraction of '${analysis}' is not supported yet`);
    }
    const csv = await toCSV(prepared);
    await fs.writeFile(outpath, csv);
}

async function extract(session, opts) {
    const { root, dir, name } = path.parse(session.path);
    const basename = path.join(root, path.dirname(dir), name);
    const analyses = session.metadata.analyses;
    const promises = [];
    for (let analysis in analyses) {
        const outpath = basename + '_' + analysis + '.csv';
        promises.push(extractAnalysis(outpath, analysis, analyses[analysis], opts))
    }
    return Promise.all(promises);
}

async function main(dir, opts) {
    const data = await getDataPairs(dir);
    for (let pair of data) {
        signale.time(JSON.stringify(pair));
        const session = await runSession(pair, opts);
        await extract(session, opts);
        signale.timeEnd(JSON.stringify(pair));
    }
}

let inputdir = undefined;

program
    .version('0.0.1')
    .arguments("<dir>")
    .option('-p, --pvalue <p>', 'output 0.0 for values with significance ≥ p', parseFloat, 0.05)
    .option('-k, --hlength <k>', 'history length to output for AI and TE', x => parseInt(x), 2)
    .option('-l, --lag <l>', 'lag to output for MI', x => parseInt(x), 0)
    .option('--mi', 'compute and extract mutual information')
    .option('--ai', 'compute and extract active information')
    .option('--te', 'compute and extract transfer entropy')
    .option('-v, --verbose', 'verbose output')
    .action(async (dir, opts) => {
        inputdir = dir;
        if (opts.verbose) {
            signale._disabled = false;
        }
        if ([opts.mi, opts.ai, opts.te].every(x => x === undefined)) {
            opts.mi = opts.ai = opts.te = true;
        }
        return main(dir, opts);
    });

program.parseAsync(process.argv).catch(err => {
    fatal(err);
    process.exit(1);
});

if (!inputdir) {
    program.help();
}
