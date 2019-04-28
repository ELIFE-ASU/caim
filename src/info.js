const { mutualInfo } = require('@dglmoore/imogen').Series;

const crossCorrelation = function(xs, ys) {
    const N = xs.length;
    const M = Math.ceil(N / 4);
    const curve = new Array(2*M + 1);
    for (let i = 0; i <= M; ++i) {
        const mi = mutualInfo(xs.slice(0, N-M+i), ys.slice(M-i, N));
        curve[i] = { x: i - M, y: mi };
    }
    for (let i = 1; i <= M; ++i) {
        const mi = mutualInfo(xs.slice(i, N), ys.slice(0, N-i));
        curve[M+i] = { x: i, y: mi };
    }
    return curve;
};

module.exports = { mutualInfo, crossCorrelation };
