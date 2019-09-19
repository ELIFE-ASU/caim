/* global single_curve, row_matrix */
const d3 = require('d3');
const { ipcRenderer } = require('electron');

(function() {
    const color_scheme = d3.scaleOrdinal(d3.schemeCategory10);
    const cell_color_scheme = d3.interpolateGnBu;

    let history = null;
    let active_info = null;

    const render_history = function({ source }) {
        if (source !== undefined) {
            d3.select('#history').classed('phase--hidden', false).html('');
            single_curve('#history', {
                width: 1024,
                height: 284,
                margins: {top: 20, right: 30, bottom: 30, left: 50},
                title: 'Active Information vs History Length',
                xlabel: 'History Length',
                ylabel: 'AI (bits)',
                color_scheme
            }, history[source]);
        } else {
            d3.select('#history').classed('phase--hidden', true);
        }
    };

    const render_active_info = function() {
        row_matrix('#active-info', {
            cell_width: 80,
            cell_height: 25,
            margin: 20,
            padding: 5,
            title: 'Active Information',
            units: 'bits',
            font_size: 12,
            color_scheme,
            cell_color_scheme
        }, active_info, render_history);
    };

    ipcRenderer.on('active-info', function(event, data) {
        history = data;

        active_info = new Array();
        for (let source in data) {
            const ai = history[source].find(({ x }) => x === 2);
            active_info.push(Object.assign({
                source: parseInt(source),
            }, ai));
        }

        render_active_info();
    });

    return {
        history: () => history,
        active_info: () => active_info
    };
}());
