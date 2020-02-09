const Binners = require('./binners');
const Frame = require('./frame');
const Info = require('./info');
const { Toolset } = require('./selection');
const Jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

const { major, minor, patch } = semver.parse(require('../package.json').version);

const Meta = {
    video: { major, minor, patch },
    frames: false,
    range: false,
    shapes: null,
    timeseries: null,
    binning_method: null,
    binned: null,
    analyses: {}
};

function Session(session_path, metadata={ }) {
    if (session_path === undefined || session_path === null || session_path.trim() === '') {
        throw new Error('session path is required');
    }

    this.path = session_path;
    this.active_frames = null;
    this.range_image = null;
    this.metadata = Object.assign({}, Meta, metadata);
}

Session.prototype.save = function() {
    const session = this;
    const session_file = path.join(session.path, 'session.json');
    return new Promise(function(resolve, reject) {
        fs.writeFile(session_file, JSON.stringify(session.metadata), 'utf8',
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

Session.prototype.import_video = async function(video_path) {
    const ext = path.extname(video_path);
    const video_filename = 'video' + ext;
    const local_video_path = path.join(this.path, video_filename);
    const range_path = path.join(this.path, 'range.png');

    fs.copyFileSync(video_path, local_video_path);

    this.active_frames = await Frame.extract(local_video_path);
    this.range_image = await Frame.rangeImage(this.active_frames);
    await this.range_image.write(range_path);

    this.metadata.video = video_filename;
    this.metadata.frames = true;
    this.metadata.range = true;
};

Session.load = async function(session_filename) {
    const session_path = path.dirname(session_filename);
    const data = await fs.readFile(session_filename)
        .then(data => JSON.parse(data))
        .then(data => {
            if (data.shapes) {
                data.shapes = data.shapes.map(shape => Toolset.from(shape));
            }
            return data;
        });

    let session = new Session(session_path, data);

    if (session.metadata.frames) {
        const frames_path = path.join(session.path, 'frames');
        session.active_frames = await Frame.load(frames_path);
    }

    if (session.metadata.range) {
        const range_path = path.join(session.path, 'range.png');
        session.range_image = await Jimp.read(range_path);
    }

    return session;
};

Session.prototype.clear_shapes = function() {
    this.metadata.shapes = new Array();
    this.metadata.timeseries = new Array();
    this.metadata.binned = new Array();
    this.metadata.analyses = {};
};

Session.prototype.push_shape = function(shape, binner) {
    let timeseries = shape.timeseries(this.active_frames);

    this.metadata.binning_method = binner;

    if (!this.metadata.shapes) {
        this.metadata.shapes = [ shape ];
    } else {
        this.metadata.shapes.push(shape);
    }

    if (Toolset.isFeatureGroup(shape)) {
        if (!this.metadata.timeseries) {
            this.metadata.timeseries = [...timeseries];
        } else {
            this.metadata.timeseries.push(...timeseries);
        }

        const binned = timeseries.map(ts => Binners.bin(binner, ts));
        if (!this.metadata.binned) {
            this.metadata.binned = binned;
        } else {
            this.metadata.binned.push(...binned);
        }
    } else {
        if (!this.metadata.timeseries) {
            this.metadata.timeseries = [timeseries];
        } else {
            this.metadata.timeseries.push(timeseries);
        }

        if (!this.metadata.binned) {
            this.metadata.binned = [ Binners.bin(binner, timeseries) ];
        } else {
            this.metadata.binned.push(Binners.bin(binner, timeseries));
        }
    }
};

Session.prototype.pop_shape = function() {
    if (this.metadata.shapes) {
        const shape = this.metadata.shapes.pop();

        if (Toolset.isFeatureGroup(shape)) {
            for (let i = 0; i < shape.shapes.length; ++i) {
                if (this.metadata.timeseries) {
                    this.metadata.timeseries.pop();
                }

                if (this.metadata.binned) {
                    this.metadata.binned.pop();
                }
            }
        } else {
            if (this.metadata.timeseries) {
                this.metadata.timeseries.pop();
            }

            if (this.metadata.binned) {
                this.metadata.binned.pop();
            }
        }
    }
};

Session.prototype.rebin = function(binner) {
    if (this.metadata.binning_method !== binner) {
        this.metadata.binning_method = binner;

        this.metadata.binned = new Array();

        if (this.metadata.timeseries) {
            for (let i = 0, len = this.metadata.timeseries.length; i < len; ++i) {
                const timeseries = this.metadata.timeseries[i];
                this.metadata.binned.push(Binners.bin(binner, timeseries));
            }
        }
    }
};

Session.prototype.mutual_info = function() {
    if (this.metadata.binned && this.metadata.binned.length !== 0) {
        const len = this.metadata.binned.length;
        const binned = this.metadata.binned;
        const mi = {};
        for (let source = 0; source < len; ++source) {
            mi[source] = {};
            for (let target = source; target < len; ++target) {
                mi[source][target] = Info.crossCorrelation(binned[source], binned[target]);
            }
        }
        this.metadata.analyses.mutual_info = mi;
    } else if (this.metadata.analyses.mutual_info !== undefined) {
        delete this.metadata.analyses.mutual_info;
    }
};

Session.prototype.active_info = function() {
    if (this.metadata.binned && this.metadata.binned.length !== 0) {
        const len = this.metadata.binned.length;
        const binned = this.metadata.binned;
        const ai = {};
        for (let source = 0; source < len; ++source) {
            ai[source] = Info.activeInfo(binned[source]);
        }
        this.metadata.analyses.active_info = ai;
    } else if (this.metadata.analyses.active_info !== undefined) {
        delete this.metadata.analyses.active_info;
    }
};

Session.prototype.transfer_entropy = function() {
    if (this.metadata.binned && this.metadata.binned.length !== 0) {
        const len = this.metadata.binned.length;
        const binned = this.metadata.binned;
        const te = {};
        for (let source = 0; source < len; ++source) {
            te[source] = {};
            for (let target = 0; target < len; ++target) {
                te[source][target] = Info.transferEntropy(binned[source], binned[target]);
            }
        }
        this.metadata.analyses.transfer_entropy = te;
    } else if (this.metadata.analyses.transfer_entropy !== undefined) {
        delete this.metadata.analyses.transfer_entropy;
    }
};

module.exports = Session;
