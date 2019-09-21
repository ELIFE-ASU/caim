/* global single_curve, matrix */
const d3 = require('d3');
const { ipcRenderer } = require('electron');

(function() {
    const color_scheme = d3.scaleOrdinal(d3.schemeCategory10);
    const cell_color_scheme = d3.interpolateGnBu;

    let history = null;
    let transfer_entropy = null;

    const render_history = function({ source, target }) {
        if (source !== undefined && target !== undefined) {
            d3.select('#history').classed('phase--hidden', false).html('');
            single_curve('#history', {
                width: 1024,
                height: 284,
                margins: {top: 20, right: 30, bottom: 30, left: 50},
                title: 'Transfer Entropy vs History Length',
                basename: `transfer_entropy_${source}_${target}`,
                xlabel: 'History Length',
                ylabel: 'TE (bits)',
                color_scheme
            }, history[source][target]);
        } else {
            d3.select('#history').classed('phase--hidden', true);
        }
    };

    const render_transfer_entropy = function() {
        matrix('#transfer-entropy', {
            cell_width: 80,
            cell_height: 25,
            margin: 20,
            padding: 5,
            title: 'Transfer Entropy',
            basename: 'transfer_entropy',
            units: 'bits',
            font_size: 12,
            color_scheme,
            cell_color_scheme
        }, transfer_entropy, render_history);
    };

    ipcRenderer.on('transfer-entropy', function(event, data) {
        history = data;

        transfer_entropy = new Array();
        for (let source in data) {
            for (let target in data[source]) {
                const te = history[source][target].find(({ x }) => x === 2);
                transfer_entropy.push(Object.assign({
                    source: parseInt(source),
                    target: parseInt(target),
                }, te));
            }
        }

        render_transfer_entropy();
    });

    return {
        history: () => history,
        transfer_entropy: () => transfer_entropy
    };
}());
