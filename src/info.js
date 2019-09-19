const { activeInfo, mutualInfo, transferEntropy, Significance } = require('informjs');

const nperms = 1000;

module.exports.mutualInfo = (xs, ys) => Significance.mutualInfo(xs, ys, nperms);

module.exports.crossCorrelation = function(xs, ys) {
    const N = xs.length;
    const M = Math.ceil(N / 4);
    const curve = new Array(2*M + 1);
    for (let i = 0; i < M; ++i) {
        const mi = mutualInfo(xs.slice(0, N-M+i), ys.slice(M-i, N), nperms);
        curve[i] = { x: i - M, y: mi };
    }
    const { value, sig } = Significance.mutualInfo(xs, ys, nperms);
    curve[M] = { x: 0, y: value, sig };
    for (let i = 1; i <= M; ++i) {
        const mi = mutualInfo(xs.slice(i, N), ys.slice(0, N-i), nperms);
        curve[M+i] = { x: i, y: mi };
    }
    return curve;
};

module.exports.activeInfo = function(xs) {
    const K = Math.min(16, xs.length - 1);
    const curve = new Array(K - 1);
    for (let k = 1; k < Math.min(6, K); ++k) {
        const { value, sig } = Significance.activeInfo(xs, k, nperms);
        curve[k - 1] = { x: k, y: value, sig };
    }
    for (let k = Math.min(6, K); k < K; ++k) {
        const ai = activeInfo(xs, k);
        curve[k - 1] = { x: k, y: ai };
    }
    return curve;
};

module.exports.transferEntropy = function(xs, ys) {
    const K = Math.min(16, xs.length - 1);
    const curve = new Array(K - 1);
    for (let k = 1; k < Math.min(3, K); ++k) {
        const { value, sig } = Significance.transferEntropy(xs, ys, k, nperms);
        curve[k - 1] = { x: k, y: value, sig };
    }
    for (let k = Math.min(3, K); k < K; ++k) {
        const te = transferEntropy(xs, ys, k);
        curve[k - 1] = { x: k, y: te };
    }
    return curve;
};
