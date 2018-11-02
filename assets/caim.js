/* global Image */
const {ipcRenderer} = require('electron');
const d3 = require('d3');

function Caim() {
    let caim = this,
        canvas = d3.select('#selection canvas').node();

    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.background = new Image();
    this.background.onload = function() {
        d3.select('#import-video').style('display', 'none');
        d3.select('#selection').style('display', 'block');

        if (this.naturalHeight && this.naturalWidth) {
            canvas.width = this.naturalWidth;
            canvas.height = this.naturalHeight;
        } else {
            canvas.width = this.width;
            canvas.height = this.height;
        }

        caim.redraw();
    };
}

Caim.prototype.init = function(uri) {
    this.background.src = uri;
};

Caim.prototype.redraw = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.background, 0, 0);
};

Caim.prototype.new_session = function() {
    ipcRenderer.send('new-session');
};

Caim.prototype.import_video = function() {
    ipcRenderer.send('import-video');
};

