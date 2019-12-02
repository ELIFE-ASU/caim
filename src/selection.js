const Point = function(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('x and y must be numbers');
    }
    return { x, y };
};

const Box = {
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
};

const BoundingBox = function(a, b) {
    let tl = Point(Math.min(a.x, b.x), Math.min(a.y, b.y)),
        br = Point(Math.max(a.x, b.x), Math.max(a.y, b.y));

    return Object.assign(Object.create(Box), {tl, br});
};

BoundingBox.from = ({ tl, br }) => Object.assign(Object.create(Box), { tl, br });

const Feature = {
    get interior() {
        let points = new Array();
        for (let x = this.box.tl.x; x < this.box.br.x; ++x) {
            for (let y = this.box.tl.y; y < this.box.br.y; ++y) {
                if (this.is_inside(x, y)) {
                    points.push(Point(x, y));
                }
            }
        }
        return points;
    },

    timeseries(frames) {
        let mean = new Array(frames.length).fill(0),
            points = this.interior;

        if (points.length !== 0) {
            for (let t = 0, frame_count = frames.length; t < frame_count; ++t) {
                const frame = frames[t];
                let N = 0.0;
                for (let i = 0, point_count = points.length; i < point_count; ++i) {
                    const p = points[i];
                    if (0 <= p.x && p.x < frame.width && 0 <= p.y && p.y < frame.height) {
                        N += 1.0;
                        mean[t] += frame.data[p.x + frame.width * p.y] / 255;
                    }
                }
                mean[t] /= N;
            }
        }
        return mean;
    },

    is_group: false
};

const Rectangular =  Object.assign(Object.create(Feature), {
    add_point(b) {
        this.boundary.b = b;
        this.box = BoundingBox(this.boundary.a, this.boundary.b);
    },

    draw(context) {
        context.beginPath();
        context.rect(this.box.tl.x, this.box.tl.y, this.box.width, this.box.height);
        context.stroke();
    },

    is_inside(x, y) {
        let {tl, br} = this.box;
        return tl.x <= x && x <= br.x && tl.y <= y && y <= br.y;
    }
});

const Rectangle = function(a, b) {
    return Object.assign(Object.create(Rectangular), {
        type: 'rectangle',
        boundary: { a, b },
        box: BoundingBox(a, b)
    });
};

Rectangle.from = (data) => Object.assign(Object.create(Rectangular), data, {
    box: BoundingBox.from(data.box)
});

const Circular = Object.assign(Object.create(Feature), {
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
    },

    is_inside(x, y) {
        let rx = x - this.center.x,
            ry = y - this.center.y;
        return Math.sqrt(rx**2 + ry**2) <= this.radius;
    }
});

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

Circle.from = (data) => Object.assign(Object.create(Circular), data, {
    box: BoundingBox.from(data.box)
});

const Formular = Object.assign(Object.create(Feature), {
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
    },

    is_inside(x, y) {
        let inside = false;
        for (let i = 0, len = this.boundary.length; i < len; ++i) {
            let p = this.boundary[i],
                q = this.boundary[(i + 1 < len) ? i + 1 : 0];
            if ((p.y <= y && q.y > y) || (p.y > y && q.y <= y)) {
                let v = (y - p.y) / (q.y - p.y),
                    z = p.x + v * (q.x - p.x);

                if (x < z) {
                    inside = !inside;
                }
            }
        }
        return inside;
    }
});

const FreeForm = function(a) {
    return Object.assign(Object.create(Formular), {
        type: 'freeform',
        boundary: [a],
        box: BoundingBox(a, a)
    });
};

FreeForm.from = (data) => Object.assign(Object.create(Formular), data, {
    box: BoundingBox.from(data.box)
});

const FeatureGroup = Object.assign({
    timeseries(frames) {
        return this.shapes.map(s => s.timeseries(frames));
    },

    draw(context) {
        for (let shape of this.shapes) {
            shape.draw(context);
        }
    }
}, {
    type: 'feature-group',
    is_group: true,
    shapes: []
});

const Gridy = Object.assign(Object.create(FeatureGroup), {
    add_point(b) {
        this.boundary.b = b;
        this.box = BoundingBox(this.boundary.a, this.boundary.b);

        let { num_cells_wide, num_cells_high, shapes } = this;
        let { tl } = this.box;

        const cell_width = this.box.width / num_cells_wide;
        const cell_height = this.box.height / num_cells_high;
        let shape_index = 0;
        for (let i = 0; i < num_cells_high; i += 1) {
            for (let j = 0; j < num_cells_wide; j += 1, shape_index += 1) {
                const x = tl.x + cell_width * (i + 1);
                const y = tl.y + cell_height * (j + 1);
                shapes[shape_index].add_point(Point(x, y));
            }
        }
    }
});

const Grid = function(a, b, num_cells_wide = 2, num_cells_high = 2) {
    const box = BoundingBox(a, b);

    const shapes = new Array();
    const { tl } = box;
    const cell_width = box.width / num_cells_wide;
    const cell_height = box.height / num_cells_high;
    let shape_index = 0;
    for (let i = 0; i < num_cells_high; i += 1) {
        for (let j = 0; j < num_cells_wide; j += 1, shape_index += 1) {
            const u = Point(tl.x + cell_width * i, tl.y + cell_height * j);
            const v = Point(tl.x + cell_width * (i + 1), tl.y + cell_height * (j + 1));
            shapes.push(Rectangle(u, v));
        }
    }

    return Object.assign(Object.create(Gridy), {
        type: 'grid',
        num_cells_wide,
        num_cells_high,
        boundary: { a, b },
        box,
        shapes
    });
};

Grid.from = (data) => Object.assign(Object.create(Gridy), data, {
    box: BoundingBox.from(data.box),
    shapes: data.shapes.map(Rectangle.from)
});

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

    grid: {
        label: 'Grid',
        factory: Grid,
        checked: false
    }
}, {
    shape: {
        value: function(type, point, ...args) {
            let shape = this[type].factory(point, point, ...args);
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
    Grid: Grid,
    Toolset: Toolset
};
