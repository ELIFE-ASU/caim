const Point = function(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('x and y must be numbers');
    }
    return { x, y };
};

const BoundingBox = function(a, b) {
    let tl = Point(Math.min(a.x, b.x), Math.min(a.y, b.y)),
        br = Point(Math.max(a.x, b.x), Math.max(a.y, b.y));

    return Object.assign(Object.create({
        get width() {
            return this.br.x - this.tl.x;
        },

        get height() {
            return this.br.y - this.tl.y;
        }
    }), {tl, br});
};

module.exports = {
    Point: Point,
    BoundingBox: BoundingBox
};
