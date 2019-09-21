/* global single_curve, matrix */
const d3 = require('d3');
const { ipcRenderer } = require('electron');

(function() {
    const color_scheme = d3.scaleOrdinal(d3.schemeCategory10);
    const cell_color_scheme = d3.interpolateGnBu;

    let cross_correlation = null;
    let mutual_info = null;

    const render_correlation = function({ source, target }) {
        if (source !== undefined && target !== undefined) {
            d3.select('#cross-correlation').classed('phase--hidden', false).html('');
            single_curve('#cross-correlation', {
                width: 1024,
                height: 284,
                margins: {top: 20, right: 30, bottom: 30, left: 50},
                title: 'Time-lagged Mutual Information',
                basename: `cross_correlation_${source}_${target}`,
                xlabel: 'Temporal Offset',
                ylabel: 'MI (bits)',
                color_scheme
            }, cross_correlation[source][target]);
        } else {
            d3.select('#cross-correlation').classed('phase--hidden', true);
        }
    };

    const render_mutual_info = function() {
        matrix('#mutual-info', {
            cell_width: 80,
            cell_height: 25,
            margin: 20,
            padding: 5,
            title: 'Mutual Information',
            basename: 'mutual_info',
            units: 'bits',
            font_size: 12,
            color_scheme,
            cell_color_scheme
        }, mutual_info, render_correlation);
    };

    ipcRenderer.on('mutual-info', function(event, data) {
        cross_correlation = data;

        mutual_info = new Array();
        for (let source in cross_correlation) {
            for (let target in cross_correlation[source]) {
                const mi = cross_correlation[source][target].find(({ x }) => x === 0);
                mutual_info.push(Object.assign({
                    source: parseInt(source),
                    target: parseInt(target)
                }, mi));
            }
        }

        render_mutual_info();
    });

    return {
        cross_correlation: () => cross_correlation,
        mutual_info: () => mutual_info
    };
}());

