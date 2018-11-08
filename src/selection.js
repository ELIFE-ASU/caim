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
        },

        is_inside(p) {
            let { x, y } = p;
            return x >= this.tl.x && x <= this.br.x && y >= this.tl.y && y <= this.br.y;
        },

        include(p) {
            let { x, y } = p;

            this.tl.x = Math.min(this.tl.x, x);
            this.tl.y = Math.min(this.tl.y, y);
            this.br.x = Math.max(this.br.x, x);
            this.br.y = Math.max(this.br.y, y);

            return this;
        }
    }), {tl, br});
};

const Rectangular = {
    add_point(b) {
        this.boundary.b = b;
        this.box = BoundingBox(this.boundary.a, this.boundary.b);
    },

    draw(context) {
        context.beginPath();
        context.rect(this.box.tl.x, this.box.tl.y, this.box.width, this.box.height);
        context.stroke();
    }
};

const Rectangle = function(a, b) {
    return Object.assign(Object.create(Rectangular), {
        type: 'rectangle',
        boundary: { a, b },
        box: BoundingBox(a, b)
    });
};

Rectangle.from = (data) => Object.assign(Object.create(Rectangular), data);

const Circular = {
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
};

const Circle = function(a, b) {
    let radius = Math.sqrt((b.x - a.x)**2 + (b.y - a.y)**2),
        r = Math.ceil(radius),
        tl = Point(a.x - r, a.y - r),
        br = Point(a.x + r, a.y + r);

    return Object.assign(Object.create(Circular), {
        type: 'circle',
        center: a,
        radius: radius,
        box: BoundingBox(tl, br)
    });
};

Circle.from = (data) => Object.assign(Object.create(Circular), data);

const Formular = {
    add_point(b) {
        this.boundary.push(b);
        this.box.include(b);
    },

    draw(context) {
        let points = this.boundary;
        for (let i = 0; i < points.length - 1; ++i) {
            context.beginPath();
            context.moveTo(points[i].x, points[i].y);
            context.lineTo(points[i+1].x, points[i+1].y);
            context.closePath();
            context.stroke();
        }
        if (points.length > 1) {
            let end = points.length - 1;
            context.beginPath();
            context.moveTo(points[end].x, points[end].y);
            context.lineTo(points[0].x, points[0].y);
            context.closePath();
            context.stroke();
        }
    }
};

const FreeForm = function(a) {
    return Object.assign(Object.create(Formular), {
        type: 'freeform',
        boundary: [a],
        box: BoundingBox(a, a)
    });
};

FreeForm.from = (data) => Object.assign(Object.create(Formular), data);

const Toolset = Object.create({
    freeform: {
        label: 'Free Form',
        factory: FreeForm,
        checked: true
    },

    rectangle: {
        label: 'Rectangle',
        factory: Rectangle,
        checked: false
    },

    circle: {
        label: 'Circle',
        factory: Circle,
        checked: false
    },
}, {
    shape: {
        value: function(type, point) {
            let shape = this[type].factory(point, point);
            return shape;
        },
        enumerable: false,
        writable: false
    },

    from: {
        value: function(data) {
            return this[data.type].factory.from(data);
        },
        enumerable: false,
        writable: false
    }
});

module.exports = {
    Point: Point,
    BoundingBox: BoundingBox,
    Rectangle: Rectangle,
    Circle: Circle,
    FreeForm: FreeForm,
    Toolset: Toolset
};
