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
                            ipcRenderer.send('selection', caim.shapes);
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
        ipcRenderer.send('selection', this.shapes);
    }
    this.redraw();
};

Caim.prototype.undo = function() {
    if (this.shapes.length !== 0) {
        this.undone_shapes.push(this.shapes.pop());
        ipcRenderer.send('selection', this.shapes);
        this.redraw();
    }
};

Caim.prototype.redo = function() {
    if (this.undone_shapes.length !== 0) {
        this.shapes.push(this.undone_shapes.pop());
        ipcRenderer.send('selection', this.shapes);
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

