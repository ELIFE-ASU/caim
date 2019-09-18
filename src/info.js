const { mutualInfo } = require('informjs').Significance;
const { transferEntropy } = require('informjs');

const nperms = 1000;

module.exports.mutualInfo = (xs, ys) => mutualInfo(xs, ys, nperms);

module.exports.crossCorrelation = function(xs, ys) {
    const N = xs.length;
    const M = Math.ceil(N / 4);
    const curve = new Array(2*M + 1);
    for (let i = 0; i <= M; ++i) {
        const { value, sig } = mutualInfo(xs.slice(0, N-M+i), ys.slice(M-i, N), nperms);
        curve[i] = { x: i - M, y: value, sig };
    }
    for (let i = 1; i <= M; ++i) {
        const { value, sig } = mutualInfo(xs.slice(i, N), ys.slice(0, N-i), nperms);
        curve[M+i] = { x: i, y: value, sig };
    }
    return curve;
};

module.exports.transferEntropy = function(xs, ys) {
    const K = Math.min(16, xs.length-1);
    const curve = {};
    for (let k=1; k < K; ++k) {
        curve[k] = transferEntropy(xs, ys, k);
    }
    return curve;
};
