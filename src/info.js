const { mutualInfo, transferEntropy, Significance } = require('informjs');

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

module.exports.transferEntropy = function(xs, ys) {
    const K = Math.min(16, xs.length-1);
    const curve = {};
    for (let k=1; k < K; ++k) {
        curve[k] = transferEntropy(xs, ys, k);
    }
    return curve;
};
