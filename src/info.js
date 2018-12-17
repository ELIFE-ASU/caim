const mutual_info = function(xs, ys) {
    if (xs.length !== ys.length) {
        throw new Error('timeseries are different lengths');
    } else if (xs.some((x) => !(0 <= x && x <= 1))) {
        throw new RangeError('xs timeseries is not binary');
    } else if (ys.some((y) => !(0 <= y && y <= 1))) {
        throw new RangeError('ys timeseries is not binary');
    }

    const volume = 4;
    const joint = new Array(volume).fill(0);
    const marginals = [new Array(2).fill(0), new Array(2).fill(0)];

    let N = xs.length;
    for (let t = 0; t < N; ++t) {
        marginals[0][xs[t]] += 1.0;
        marginals[1][ys[t]] += 1.0;
        joint[2 * xs[t] + ys[t]] += 1.0;
    }

    let mi = 0, p = 0;
    for (let i = 0; i < volume; ++i) {
        const n = joint[i];
        if (n !== 0) {
            p = n / N;
            mi += p * Math.log2(p);
        }
    }

    for (let i = 0, nmarginals = marginals.length; i < nmarginals; ++i) {
        const marginal = marginals[i];
        for (let j = 0, len = marginal.length; j < len; ++j) {
            const n = marginal[j];
            if (n !== 0) {
                p = n / N;
                mi -= p * Math.log2(p);
            }
        }
    }

    return mi;
};

const cross_correlation = function(xs, ys) {
    const N = xs.length;
    const M = Math.ceil(N / 4);
    const curve = new Array(2*M + 1);
    for (let i = 0; i <= M; ++i) {
        const mi = mutual_info(xs.slice(0, N-M+i), ys.slice(M-i, N));
        curve[i] = { x: i - M, y: mi };
    }
    for (let i = 1; i <= M; ++i) {
        const mi = mutual_info(xs.slice(i, N), ys.slice(0, N-i));
        curve[M+i] = { x: i, y: mi };
    }
    return curve;
};

module.exports = { mutual_info, cross_correlation };
