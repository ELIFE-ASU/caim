const Jimp = require('jimp');
const { Delaunay } = require('d3-delaunay');

const Point = function(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('x and y must be numbers');
    }
    return { x, y };
};

const pointDiff = (p, q) => Point(p.x - q.x, p.y - q.y);

const pointDot = (p, q) => (p.x * q.x) + (p.y * q.y);

const pointNorm = (p) => Math.sqrt(pointDot(p, p));

const pointDistance = (p, q) => pointNorm(pointDiff(p, q));

const triangulate = function(data, alpha) {
    const isShort = (a, b) => pointDistance(a, b) < alpha;
    const { points, triangles } = Delaunay.from(data, d => d.x, d => d.y);
    let ts = Array();
    for (let i = 0, len = triangles.length / 3; i < len; ++i) {
        let p0 = triangles[3*i + 0],
            p1 = triangles[3*i + 1],
            p2 = triangles[3*i + 2];

        let a = Point(points[2*p0 + 0], points[2*p0 + 1]),
            b = Point(points[2*p1 + 0], points[2*p1 + 1]),
            c = Point(points[2*p2 + 0], points[2*p2 + 1]);

        if (isShort(a, b) && isShort(b, c) && isShort(c, a)) {
            ts.push({ a, b, c });
        }
    }
    return ts;
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
};

const Rectangular =  Object.assign(Object.create(Feature), {
    async add_point(b) {
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

const Rectangle = async function(a, b) {
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
    async add_point(b) {
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

const Circle = async function(a, b) {
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
    async add_point(b) {
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

const FreeForm = async function(a) {
    return Object.assign(Object.create(Formular), {
        type: 'freeform',
        boundary: [a],
        box: BoundingBox(a, a)
    });
};

FreeForm.from = (data) => Object.assign(Object.create(Formular), data, {
    box: BoundingBox.from(data.box)
});

const Regional = Object.assign(Object.create(Feature), {
    async add_point(b) {
        this.box.include(b)
        this.points.push(b)
    },

    draw(context) {
        if (this.points.length == 1) {
            const p = this.points[0];
            context.beginPath();
            context.arc(p.x, p.y, 1, 0, 2*Math.PI);
            context.fill();

            context.beginPath();
            context.arc(p.x, p.y, 1, 0, 2*Math.PI);
            context.stroke();
        } else if (this.points.length == 2) {
            const p = this.points[0];
            const q = this.points[0];
            context.beginPath();
            context.moveTo(p.x, p.y);
            context.lineTo(q.x, q.y);
            context.stroke();
        } else {
            const triangles = triangulate(this.points, Math.sqrt(3));

            context.globalAlpha = 0.7;
            for (let i = 0; i < triangles.length; ++i) {
                context.beginPath();
                context.moveTo(triangles[i].a.x, triangles[i].a.y);
                context.lineTo(triangles[i].b.x, triangles[i].b.y);
                context.lineTo(triangles[i].c.x, triangles[i].c.y);
                context.fill();
            }
            context.globalAlpha = 1.0;
        }
    },

    is_inside(x, y) {
        for (let i = 0, len = this.points.length; i < len; ++i) {
            const p = this.points[i];
            if (p.x == x && p.y == y) {
                return true;
            }
        }
        return false;
    },
});

const Region = async function(a) {
    return Object.assign(Object.create(Regional), {
        type: 'region',
        points: [a],
        box: BoundingBox(a, a)
    });
};

Region.from = (data) => Object.assign(Object.create(Regional), data, {
    box: BoundingBox.from(data.box)
});

const FeatureGroup = {
    timeseries(frames) {
        return this.shapes.map(s => s.timeseries(frames));
    },

    draw(context) {
        const len = this.shapes.length;
        for (let i = 0; i < len - 1; ++i) {
            this.shapes[i].draw(context);
            context.next_color();
        }
        if (len != 0) {
            this.shapes[len - 1].draw(context);
        }
    },
};

const Gridy = Object.assign(Object.create(FeatureGroup), {
    async add_point(b) {
        this.boundary.b = b;
        this.box = BoundingBox(this.boundary.a, this.boundary.b);
        this.shapes = new Array();

        const { num_cells_wide, num_cells_high, shapes } = this;
        const { tl } = this.box;

        const cell_width = Math.floor(this.box.width / num_cells_wide);
        const cell_height = Math.floor(this.box.height / num_cells_high);
        let shape_index = 0;
        for (let i = 0; i < num_cells_high; i += 1) {
            for (let j = 0; j < num_cells_wide; j += 1, shape_index += 1) {
                const u = Point(tl.x + cell_width * j, tl.y + cell_height * i);
                const v = Point(tl.x + cell_width * (j + 1), tl.y + cell_height * (i + 1));
                this.shapes.push(await Rectangle(u, v));
            }
        }
    }
});

const Grid = async function(a, b, num_cells_wide, num_cells_high) {
    const box = BoundingBox(a, b);

    const shapes = new Array();
    const { tl } = box;
    const cell_width = box.width / num_cells_wide;
    const cell_height = box.height / num_cells_high;

    let shape_index = 0;
    for (let i = 0; i < num_cells_high; i += 1) {
        for (let j = 0; j < num_cells_wide; j += 1, shape_index += 1) {
            const u = Point(tl.x + cell_width * j, tl.y + cell_height * i);
            const v = Point(tl.x + cell_width * (j + 1), tl.y + cell_height * (i + 1));
            shapes.push(await Rectangle(u, v));
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

const Masky = Object.assign(Object.create(FeatureGroup), {
    async add_point() {}
});

const Mask = async function(filename) {
    const img = await Jimp.read(filename);

    const colorEqual = (c, d) => c.r == d.r && c.g == d.g && c.b == d.b;
    const colors = new Array();
    const clusters = new Array();
    const { height, width } = img.bitmap;
    const box = BoundingBox(Point(0,0), Point(width, height));
    img.scan(0, 0, width, height, function(x, y, idx) {
        let r = this.bitmap.data[idx + 0],
            g = this.bitmap.data[idx + 1],
            b = this.bitmap.data[idx + 2];

        if (r != 0x0 || g != 0x0 || b != 0x0) {
            let c = { r, g, b };
            let idx = colors.findIndex(d => colorEqual(c, d));
            if (idx === -1) {
                colors.push(c);
                clusters.push([Point(x, y)]);
            } else {
                clusters[idx].push(Point(x, y));
            }
        }
    });

    if (clusters.some(cluster => cluster.length === 0)) {
        throw(Error('The mask seems to have regions of zero area. This is likely a bug'));
    }

    const shapes = await Promise.all(clusters.map(async cluster => {
        const region = await Region(cluster[0]);
        await Promise.all(cluster.slice(1).map(p => {
            region.add_point(p);
        }));
        return region;
    }));

    return Object.assign(Object.create(Masky), {
        type: 'mask',
        filename,
        box,
        shapes
    });
};

Mask.from = (data) => Object.assign(Object.create(Masky), data, {
    box: BoundingBox.from(data.box),
    shapes: data.shapes.map(Region.from)
});

const Toolset = Object.create({
    freeform: {
        label: 'Free Form',
        factory: FreeForm,
        checked: true,
        form: undefined,
        gather: undefined,
        onclick: true
    },

    rectangle: {
        label: 'Rectangle',
        factory: Rectangle,
        checked: false,
        form: undefined,
        gather: undefined,
        onclick: true
    },

    circle: {
        label: 'Circle',
        factory: Circle,
        checked: false,
        form: undefined,
        gather: undefined,
        onclick: true
    },

    grid: {
        label: 'Grid',
        factory: Grid,
        checked: false,
        form: () => {
            const div = d3.select('#tools-form');
            div.html('')
                .classed('module__tools-form--hidden', false);

            let width = div.append('label')
                .classed('module__input-label', true);

            width.append('text')
                .text('Grid Width:');
            width.append('input')
                .attr('type', 'number')
                .attr('id', 'cells-wide')
                .classed('module__number', true)
                .attr('name', 'grid-control')
                .attr('min', 1)
                .attr('max', 100)
                .attr('value', 2);

            let height = div.append('label')
                .classed('module__input-label', true);
            height.append('text')
                .text('Grid Height:');
            height.append('input')
                .attr('type', 'number')
                .attr('id', 'cells-high')
                .classed('module__number', true)
                .attr('name', 'grid-control')
                .attr('min', 1)
                .attr('max', 100)
                .attr('value', 2);
        },
        gather: () => {
            const cell_width = d3.select('#cells-wide').property('value');
            const cell_height = d3.select('#cells-high').property('value');
            return [cell_width, cell_height];
        },
        onclick: true
    },

    mask: {
        label: 'Mask',
        factory: Mask,
        checked: false,
        form: () => {
            const div = d3.select('#tools-form');
            div.html('')
                .classed('module__tools-form--hidden', false);
            div.append('input')
                .attr('type', 'file')
                .attr('id', 'mask-filename')
                .attr('name', 'mask-control');
            let submit = div.append('input')
                .attr('type', 'submit')
                .attr('id', 'mask-submit')
                .attr('name', 'mask-control')
                .on('click', async () => {
                    const files = d3.select('#mask-filename').node().files;
                    if (files.length === 0) {
                        alert('You must choose a selection mask before continuing');
                    } else {
                        caim.submit_shape(await Toolset.shape('mask'));
                    }
                });
        },
        gather: () => {
            const filename = d3.select('#mask-filename').node().files[0].path;
            return [filename];
        },
        onclick: false
    }
}, {
    shape: {
        value: async function(type, point) {
            const tool = this[type];
            const args = tool.gather ? tool.gather() : [];
            if (this[type].onclick) {
                return this[type].factory(point, point, ...args);
            } else {
                return this[type].factory(...args);
            }
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
    },

    isFeatureGroup: {
        value: function(shape) {
            return FeatureGroup.isPrototypeOf(shape);
        },
        enumerable: false,
        writable: false
    },

    onclick: {
        value: function(type) {
            return this[type].onclick;
        },
        enumerable: false,
        writable: false
    }
});

module.exports = {
    Point,
    BoundingBox,
    Feature,
    FeatureGroup,
    Rectangle,
    Circle,
    FreeForm,
    Region,
    Grid,
    Mask,
    Toolset
};
