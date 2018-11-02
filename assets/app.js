/* global ipcRenderer, d3, Caim */

var caim = new Caim();

ipcRenderer.on('load-session', function(event, path, video) {
    d3.select('#startup').style('display', 'none');
    d3.select('#session').style('display', 'block');
    d3.select('#session').select('h2')
        .text(() => `Session Path: ${path}`);
    if (video === undefined || video === null) {
        d3.select('#import-video').style('display', 'block');
    } else {
        d3.select('#selection').style('display', 'block');
    }
});

ipcRenderer.on('load-selector', (event, uri) => caim.init(uri));
