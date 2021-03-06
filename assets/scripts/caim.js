/* global Image, multiple_curves, spike_trains, remote */
const {ipcRenderer} = require('electron');
const d3 = require('d3');
const {Point, Toolset} = require('../src/selection');
const Binners = require('../src/binners');

const GraphicsContext = (canvas, color_scheme) => {
    const context = Object.assign(canvas.getContext('2d'), {
        next_color() {
            this.color_index += 1;
            this.strokeStyle = this.color_scheme(this.color_index);
            this.fillStyle = this.color_scheme(this.color_index);
        },

        reset_colors() {
            this.color_index = 0;
            this.strokeStyle = this.color_scheme(this.color_index);
            this.fillStyle = this.color_scheme(this.color_index);
        },

        color() {
            return this.color_scheme(this.color_index);
        }
    }, {
        color_index: 0,
        color_scheme
    });

    return context;
};

function Caim() {
    this.canvas = d3.select('#selection canvas').node();
    this.context = GraphicsContext(this.canvas, d3.scaleOrdinal(d3.schemeCategory10));
    this.background = new Image();
    this.background.onload = (function(caim) {
        return function() {
            if (this.naturalHeight && this.naturalWidth) {
                caim.canvas.width = this.naturalWidth;
                caim.canvas.height = this.naturalHeight;
            } else {
                caim.canvas.width = this.width;
                caim.canvas.height = this.height;
            }

            d3.select('#binners').selectAll('option').property('selected', null);
            d3.select(`#${caim.binning_method}`).property('selected', true);

            caim.render_series();

            let paint = false;

            let add_click = async function(x, y, tool, start) {
                if (caim.undone_shapes.length !== 0) {
                    caim.undone_shapes = new Array();
                }

                if (start) {
                    caim.shapes.push(await Toolset.shape(tool, Point(x, y)));
                } else {
                    let shape = caim.shapes[caim.shapes.length - 1];
                    await shape.add_point(Point(x, y));
                }
            };

            caim.canvas.onmousedown = async function(event) {
                let tool = d3.select('input[name="tool"]:checked').attr('id');
                if (Toolset.onclick(tool)) {
                    let x = event.pageX - this.offsetLeft,
                        y = event.pageY - this.offsetTop;

                    paint = true;
                    await add_click(x, y, tool, true);
                }
                caim.redraw();
            };

            caim.canvas.onmousemove = async function(event) {
                let tool = d3.select('input[name="tool"]:checked').attr('id');
                if (Toolset.onclick(tool) && paint) {
                    let x = event.pageX - this.offsetLeft,
                        y = event.pageY - this.offsetTop;

                    await add_click(x, y, tool, false);
                }
                caim.redraw();
            };

            caim.canvas.onmouseup = function() {
                let tool = d3.select('input[name="tool"]:checked').attr('id');
                if (Toolset.onclick(tool) && paint) {
                    paint = false;
                    if (caim.shapes.length !== 0) {
                        let shape = caim.shapes[caim.shapes.length - 1];
                        if (shape.box.width === 0 || shape.box.height == 0) {
                            caim.shapes.pop();
                        } else {
                            ipcRenderer.send('push-shape', shape, caim.binning_method);
                        }
                    }
                }
                caim.redraw();
            };

            caim.canvas.oncontextmenu = function() {
                const data = this.toDataURL('image/png');
                new remote.Menu.buildFromTemplate([
                    {
                        label: 'Export Graphic',
                        id: 'export-graphic',
                        click: () => ipcRenderer.send('export', {
                            name: 'selection',
                            type: 'png',
                            data: data
                        })
                    },
                    {
                        label: 'Export Selection Data',
                        id: 'export-data',
                        click: () => ipcRenderer.send('export', {
                            name: 'selection',
                            type: 'json',
                            data: (caim.shapes === null) ? [] : caim.shapes
                        })
                    }
                ]).popup();
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

    if (metadata.binning_method === null) {
        for (let binner in Binners) {
            if (Binners[binner].selected) {
                this.binning_method = binner;
                break;
            }
        }
    } else {
        this.binning_method = metadata.binning_method;
    }

    if (metadata.binned === null) {
        this.binned = new Array();
    } else {
        this.binned = metadata.binned;
    }

    this.undone_shapes = new Array();
    this.background.src = uri;
};

Caim.prototype.redraw = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.background, 0, 0);
    this.context.lineJoint = 'round';
    this.context.lineWidth = 5;

    this.context.reset_colors();
    this.shapes.forEach(shape => {
        shape.draw(this.context);
        this.context.next_color();
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
        ipcRenderer.send('push-shape', shape, this.binning_method);
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

Caim.prototype.import_frames = function() {
    ipcRenderer.send('import-frames');
};

Caim.prototype.rebin = function(binner) {
    this.binning_method = binner;
    ipcRenderer.send('rebin', this.binning_method);
};

Caim.prototype.render_series = function(timeseries, binned) {
    if (timeseries) {
        this.timeseries = timeseries;
    }

    if (binned) {
        this.binned = binned;
    }

    if (this.timeseries && this.binned) {
        if (this.render_timeseries() && this.render_binned()) {
            d3.select('#signal').classed('module--hidden', false);
        } else {
            d3.select('#signal').classed('module--hidden', true);
        }
    } else if (!this.timeseries && !this.binned) {
        d3.select('#signal').classed('module--hidden', true);
    } else {
        throw new Error('binned or unbinned timeseries is missing');
    }
};

Caim.prototype.render_timeseries = function() {
    if (this.timeseries.length !== 0) {
        multiple_curves('#timeseries', {
            width: 1024,
            height: 284,
            margins: {top: 20, right: 30, bottom: 30, left: 50},
            title: 'Brightness Timeseries by Feature',
            basename: 'timeseries',
            xlabel: 'Timesteps',
            ylabel: 'Average Brightness',
            color_scheme: this.context.color_scheme
        }, this.timeseries);

        return true;
    } else {
        return false;
    }
};

Caim.prototype.render_binned = function() {
    if (this.binned.length !== 0) {
        spike_trains('#binned', {
            width: 1024,
            height: 284,
            margins: {top: 20, right: 30, bottom: 30, left: 50},
            title: 'Binned Brightness by Feature',
            basename: 'timeseries_binned',
            xlabel: 'Timesteps',
            ylabel: 'Binned Brightness',
            color_scheme: this.context.color_scheme
        }, this.binned);

        return true;
    } else {
        return false;
    }
};

Caim.prototype.submit_shape = function(shape) {
    this.shapes.push(shape);
    ipcRenderer.send('push-shape', shape, this.binning_method);
    this.redraw();
};
