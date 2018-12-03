/* global ipcRenderer, d3, Caim, Toolset */

var caim = new Caim();

ipcRenderer.on('load-session', function(event, path, metadata, uri) {
    d3.select('#startup').classed('phase--hidden', true);
    d3.select('#import').select('.phase__title').text('Session Path: ' + path);
    d3.select('#session').select('.phase__title').text('Session Path: ' + path);
    if (uri === undefined || uri === null) {
        d3.select('#import').classed('phase--hidden', false);
    } else {
        d3.select('#import').classed('phase--hidden', true);
        d3.select('#session').classed('phase--hidden', false);
        caim.init(metadata, uri);
    }
});

ipcRenderer.on('plot-timeseries', function(event, data) {
    caim.render_series(data.timeseries, data.binned);
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

const select_signal = function(){
    d3.selectAll('input[name="signal-selector"]').each(function(){
        const signal_name = this.id.replace('select-', '');
        d3.select('#' + signal_name).classed('module__plot--hidden', !this.checked);
    });
};

d3.selectAll('input[name="signal-selector"]').on('change', () => select_signal());
select_signal();
