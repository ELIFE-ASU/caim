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

const Circle = function(a, b) {
    let radius = Math.sqrt((b.x - a.x)**2 + (b.y - a.y)**2),
        r = Math.ceil(radius),
        tl = Point(a.x - r, a.y - r),
        br = Point(a.x + r, a.y + r),
        box = BoundingBox(tl, br);

    return Object.assign(Object.create({
        add_point(b) {
            let { x, y } = this.center,
                radius = Math.sqrt((b.x - x)**2 + (b.y - y)**2),
                r = Math.ceil(radius);

            this.radius = radius;
            this.box = BoundingBox(Point(x - r, y - r), Point(x + r, y + r));
        },

        draw(context) {
            context.beginPath();
            context.arc(this.center.x, this.center.y, this.radius, 0, 2*Math.PI);
            context.stroke();

            context.beginPath();
            context.arc(this.center.x, this.center.y, 1, 0, 2*Math.PI);
            context.fill();
        }
    }), { center: a, radius: radius, box: box });
};

const Toolset = {
    rectangle: {
        label: 'Rectangle',
        factory: Rectangle,
        checked: true
    },
    circle: {
        label: 'Circle',
        factory: Circle,
        checked: false
    }
};

module.exports = {
    Point: Point,
    BoundingBox: BoundingBox,
    Rectangle: Rectangle,
    Circle: Circle,
    Toolset: Toolset
};
