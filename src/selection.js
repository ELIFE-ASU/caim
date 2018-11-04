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

const Rectangle = function(a, b) {
    let box = BoundingBox(a, b);

    return Object.assign(Object.create({
        add_point(b) {
            this.boundary.b = b;
            this.box = BoundingBox(this.boundary.a, this.boundary.b);
        },

        draw(context) {
            context.beginPath();
            context.rect(this.box.tl.x, this.box.tl.y, this.box.width, this.box.height);
            context.stroke();
        }
    }), { boundary: { a, b }, box });
};

module.exports = {
    Point: Point,
    BoundingBox: BoundingBox,
    Rectangle: Rectangle
};
