/* global ipcRenderer, d3, Caim */

var caim = new Caim();

ipcRenderer.on('load-session', function(event, path, uri) {
    d3.select('#startup').style('display', 'none');
    d3.select('#session').style('display', 'block');
    d3.select('#session').select('h2').text('Session Path: ' + path);
    if (uri === undefined || uri === null) {
        d3.select('#import-video').style('display', 'block');
    } else {
        d3.select('#selection').style('display', 'block');
        caim.init(uri);
    }
});

ipcRenderer.on('load-selector', (event, uri) => caim.init(uri));

d3.select('#clear').on('click', () => caim.clear());
d3.select('#undo').on('click', () => caim.undo());
d3.select('#redo').on('click', () => caim.redo());
