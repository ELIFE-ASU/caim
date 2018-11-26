/* global Image */
const {ipcRenderer} = require('electron');
const d3 = require('d3');
const {Point, Toolset} = require('../src/selection');

function Caim() {
    this.canvas = d3.select('#selection canvas').node();
    this.context = this.canvas.getContext('2d');
    this.color_scheme = d3.scaleOrdinal(d3.schemeCategory10);
    this.background = new Image();
    this.background.onload = (function(caim) {
        return function() {
            d3.select('#import-video').style('display', 'none');
            d3.select('#selection').style('display', 'block');

            caim.render_timeseries();

            if (this.naturalHeight && this.naturalWidth) {
                caim.canvas.width = this.naturalWidth;
                caim.canvas.height = this.naturalHeight;
            } else {
                caim.canvas.width = this.width;
                caim.canvas.height = this.height;
            }

            let paint = false;

            let add_click = function(x, y, start) {
                if (caim.undone_shapes.length !== 0) {
                    caim.undone_shapes = new Array();
                }

                if (start) {
                    let tool = d3.select('input[name="tool"]:checked').attr('id');
                    caim.shapes.push(Toolset.shape(tool, Point(x, y)));
                } else {
                    let shape = caim.shapes[caim.shapes.length - 1];
                    shape.add_point(Point(x, y));
                }
            };

            caim.canvas.onmousedown = function(event) {
                let x = event.pageX - this.offsetLeft,
                    y = event.pageY - this.offsetTop;

                paint = true;
                add_click(x, y, true);
                caim.redraw();
            };

            caim.canvas.onmousemove = function(event) {
                if (paint) {
                    let x = event.pageX - this.offsetLeft,
                        y = event.pageY - this.offsetTop;

                    add_click(x, y, false);
                    caim.redraw();
                }
            };

            caim.canvas.onmouseup = function() {
                if (paint) {
                    paint = false;
                    if (caim.shapes.length !== 0) {
                        let shape = caim.shapes[caim.shapes.length - 1];
                        if (shape.box.width === 0 || shape.box.height == 0) {
                            caim.shapes.pop();
                        } else {
                            ipcRenderer.send('push-shape', shape);
                        }
                    }
                    caim.redraw();
                }
            };

            caim.canvas.onmouseleave = caim.canvas.onmouseup;

            caim.redraw();
        };
    })(this);
}

Caim.prototype.init = function(metadata, uri) {
    if (metadata.shapes === null) {
        this.shapes = new Array();
    } else {
        metadata.shapes.forEach(function(shapes, idx, array) {
            array[idx] = Toolset.from(shapes);
        });
        this.shapes = metadata.shapes;
    }
    if (metadata.timeseries === null) {
        this.timeseries = new Array();
    } else {
        this.timeseries = metadata.timeseries;
    }
    this.undone_shapes = new Array();
    this.background.src = uri;
};

Caim.prototype.redraw = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.background, 0, 0);
    this.context.lineJoint = 'round';
    this.context.lineWidth = 5;

    this.shapes.forEach((shape, idx) => {
        this.context.strokeStyle = this.color_scheme(idx);
        this.context.fillStyle = this.color_scheme(idx);
        shape.draw(this.context);
    });
};

Caim.prototype.clear = function() {
    let already_empty = this.shapes.length === 0;

    this.shapes = new Array();
    this.undone_shapes = new Array();
    if (!already_empty) {
        ipcRenderer.send('clear-shapes');
    }
    this.redraw();
};

Caim.prototype.undo = function() {
    if (this.shapes.length !== 0) {
        this.undone_shapes.push(this.shapes.pop());
        ipcRenderer.send('pop-shape');
        this.redraw();
    }
};

Caim.prototype.redo = function() {
    if (this.undone_shapes.length !== 0) {
        let shape = this.undone_shapes.pop();
        this.shapes.push(shape);
        ipcRenderer.send('push-shape', shape);
        this.redraw();
    }
};

Caim.prototype.new_session = function() {
    ipcRenderer.send('new-session');
};

Caim.prototype.open_session = function() {
    ipcRenderer.send('open-session');
};

Caim.prototype.import_video = function() {
    ipcRenderer.send('import-video');
};

Caim.prototype.render_timeseries = function(timeseries) {
    if (timeseries) {
        this.timeseries = timeseries;
    }

    if (this.timeseries && this.timeseries.length !== 0) {
        let container = d3.select('#timeseries').html('').attr('display', 'block');

        this.multiple_curves(container, {
            width: 1024,
            height: 284,
            margins: {top: 20, right: 30, bottom: 30, left: 50},
            title: 'Brightness Timeseries by Feature',
            xlabel: 'Timesteps',
            ylabel: 'Average Brightness',
            labels: this.timeseries.map((_, i) => 'Feature ' + (i+1)),
        }, this.timeseries);
    } else {
        d3.select('#timeseries').html('').attr('display', 'none');
    }
};

Caim.prototype.multiple_curves = function(container, fmt, data) {
    let width = fmt.width - fmt.margins.left - fmt.margins.right,
        height = fmt.height - fmt.margins.top - fmt.margins.bottom;

    let x = d3.scaleLinear().rangeRound([0, width]),
        y = d3.scaleLinear().rangeRound([height, 0]);

    x.domain((fmt.xrange) ? fmt.xrange : [0, d3.max(data.map((d) => d.length)) - 1]);

    if (fmt.yrange) {
        y.domain(fmt.yrange);
    } else {
        let ymin = d3.min(data.map((d) => d3.min(d))),
            ymax = d3.max(data.map((d) => d3.max(d)));
        y.domain([ymin, ymax]);
    }

    let line = d3.line()
        .x((d,i) => x(i))
        .y(y);

    let svg = container.append('svg')
        .attr('title', fmt.title)
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', fmt.width)
        .attr('height', fmt.height);

    let g = svg.append('g')
        .attr('transform', 'translate(' + fmt.margins.left + ',' + fmt.margins.top + ')');

    let bottom = g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

    bottom.append('text')
        .attr('fill', '#000000')
        .attr('x', width)
        .attr('y', 7*fmt.margins.bottom/8)
        .attr('text-anchor', 'end')
        .text(fmt.xlabel);

    g.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('fill', '#000000')
        .attr('transform', 'rotate(-90)')
        .attr('y', -3*fmt.margins.left/4)
        .attr('text-anchor', 'end')
        .text(fmt.ylabel);

    g.selectAll('.series')
        .data(data)
        .enter().append('path')
        .attr('fill', 'none')
        .attr('d', line)
        .attr('stroke', (_, i) => this.color_scheme(i));

    svg.append('text')
        .attr('x', fmt.margins.left + width/2)
        .attr('y', fmt.margins.top/3)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .text(fmt.title);

    this.downloadable(svg, fmt.width - fmt.margins.right, fmt.margins.top/3, '1em');
};

Caim.prototype.downloadable = function(svg, x, y, dy) {
    let clean_svg = svg.node().cloneNode(true),
        html = clean_svg.outerHTML,
        data = 'data:image/svg+xml;base64,\n' + Buffer.from(html).toString('base64');

    svg.append('a')
        .attr('href-lang', 'image/svg+xml')
        .attr('href', data)
        .append('text')
        .attr('font-size', 10)
        .attr('font-family', 'sans-serif')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', dy)
        .attr('text-anchor', 'end')
        .text('Right click to download');
};
