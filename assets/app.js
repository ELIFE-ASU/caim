/* global ipcRenderer, d3, Caim, Toolset */

var caim = new Caim();

ipcRenderer.on('load-session', function(event, path, metadata, uri) {
    d3.select('#startup').style('display', 'none');
    d3.select('#session').style('display', 'block');
    d3.select('#session').select('h2').text('Session Path: ' + path);
    if (uri === undefined || uri === null) {
        d3.select('#import-video').style('display', 'block');
    } else {
        d3.select('#import-video').style('display', 'none');
        d3.select('#selection').style('display', 'block');
        caim.init(metadata, uri);
    }
});

d3.select('#clear').on('click', () => caim.clear());
d3.select('#undo').on('click', () => caim.undo());
d3.select('#redo').on('click', () => caim.redo());

let tools = d3.select('#tools');
for (let tool in Toolset) {
    let label = tools.append('label');

    label.append('input')
        .attr('type', 'radio')
        .attr('id', tool)
        .attr('name', 'tool')
        .property('checked', Toolset[tool].checked);

    label.append('text').text(Toolset[tool].label);
}
