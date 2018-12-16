const stats = require('statistics');

const mw_mean = function(timeseries, w) {
    if (!timeseries) {
        throw new TypeError('time series is undefined');
    } else if (timeseries.length === 0) {
        throw new Error('time series has length 0');
    } else if (timeseries.some(isNaN)) {
        throw new RangeError('timeseries has NaN value');
    }

    if (!w) {
        throw new TypeError('window size is undefined');
    } else if (w < 0) {
        throw new RangeError(`window size is negative (${w})`);
    }

    if (w % 2 === 0) {
        w += 1;
    }

    if (w === 1) {
        return timeseries.slice();
    }

    if (w > 0.1 * timeseries.length) {
        const p = Math.round(10000*w / timeseries.length)/100;
        throw new RangeError(`window size is too large, got ${w} (${p}% of time series length`);
    }

    const end = timeseries.length - 1;
    const k   = 1 / w;
    const w2  = Math.floor(w / 2);
    const mean = new Array(timeseries.length);

    mean[0] = k * w2 * timeseries[0];
    for (let i = 0; i < (w - w2); ++i) {
        mean[0] += k * timeseries[i];
    }

    for (let i = 1; i <= w2; ++i) {
        mean[i] = mean[i - 1] + k * (timeseries[i + w2] - timeseries[0]);
    }

    for (let i = w2 + 1; i < timeseries.length - w2; ++i) {
        if (isNaN(timeseries[i])) throw new RangeError(`time series had NaN at position ${i}`);
        mean[i] = mean[i - 1] + k * (timeseries[i + w2] - timeseries[i - w2 - 1]);
    }

    for (let i = timeseries.length - w2; i < timeseries.length; ++i) {
        if (isNaN(timeseries[i])) throw new RangeError(`time series had NaN at position ${i}`);
        mean[i] = mean[i - 1] + k * (timeseries[end] - timeseries[i - w2 - 1]);
    }

    if (mean.some(isNaN)) {
        throw new RangeError('mean has NaN value');
    }

    return mean;
};

const mw_subtraction = function(timeseries, w) {
    const mean = mw_mean(timeseries, w);
    const series = new Array(timeseries.length);

    let min = timeseries[0] - mean[0];
    for (let i = 0, len = timeseries.length; i < len; ++i) {
        series[i] = timeseries[i] - mean[i];
        min = Math.min(min, series[i]);
    }

    for (let i = 0, len = series.length; i < len; ++i) {
        series[i] -= min;
    }

    if (series.some(isNaN)) {
        throw new RangeError('series has NaN value');
    }

    return series;
};

const bin_extremes = function(timeseries) {
    if (!timeseries) {
        throw new TypeError('time series is undefined');
    } else if (timeseries.length === 0) {
        throw new Error('time series has length 0');
    } else if (timeseries.some(isNaN)) {
        throw new RangeError('timeseries has NaN value');
    }

    const { mean, stdev } = timeseries.reduce(stats);
    const binned = new Array(timeseries.length);
    for (let i = 0, len = timeseries.length; i < len; ++i) {
        binned[i] = (Math.abs(timeseries[i] - mean) < stdev) ? 0 : 1;
    }

    if (binned.some(isNaN)) {
        throw new RangeError('binned has NaN value');
    }

    return binned;
};

const bin_mw_extremes = function(timeseries) {
    if (!timeseries) {
        throw new TypeError('time series is undefined');
    } else if (timeseries.length === 0) {
        throw new Error('time series has length 0');
    } else if (timeseries.some(isNaN)) {
        throw new RangeError('timeseries has NaN value');
    }
    const window_size = Math.floor(timeseries.length / 20);
    const subtracted = mw_subtraction(timeseries, window_size);
    return bin_extremes(subtracted);
};

const bin_threshold = function(timeseries, threshold) {
    if (isNaN(threshold)) {
        throw new RangeError('threshold is NaN');
    }

    const binned = new Array(timeseries.length);
    for (let i = 0, len = timeseries.length; i < len; ++i) {
        binned[i] = (timeseries[i] < threshold) ? 0 : 1;
    }

    if (binned.some(isNaN)) {
        throw new RangeError('binned has NaN value');
    }

    return binned;
};

const bin_mean = function(timeseries) {
    if (!timeseries) {
        throw new TypeError('time series is undefined');
    } else if (timeseries.length === 0) {
        throw new Error('time series has length 0');
    } else if (timeseries.some(isNaN)) {
        throw new RangeError('timeseries has NaN value');
    }
    const { mean } = timeseries.reduce(stats);
    return bin_threshold(timeseries, mean);
};

module.exports = Object.create({
    'moving-extremes': {
        label: 'Extremes (Moving Window)',
        binner: bin_mw_extremes,
        selected: true
    },
    'extremes': {
        label: 'Extremes (Global)',
        binner: bin_extremes,
        selected: false
    },
    'mean-threshold': {
        label: 'Mean Threshold',
        binner: bin_mean,
        selected: false
    }
}, {
    bin: {
        value: function(method, timeseries) {
            return this[method].binner(timeseries);
        },
        enumerable: false,
        writable: false
    }
});
