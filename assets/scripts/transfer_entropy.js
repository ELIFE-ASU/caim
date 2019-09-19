/* global single_curve */
const d3 = require('d3');
const { ipcRenderer } = require('electron');

(function() {
    const color_scheme = d3.scaleOrdinal(d3.schemeCategory10);

    let num_features = 0;
    let history = null;
    let transfer_entropy = null;
    let visible_history = null;

    let render_transfer_entropy = function() {
        let section = d3.select('#transfer-entropy');

        section.classed('phase--hidden', transfer_entropy.length === 0).html('');

        let nodes = [];
        transfer_entropy.forEach(function(link) {
            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
        });

        let cell_width = 80,
            cell_height = 25,
            margin = 20,
            padding = 5,
            width = cell_width * (nodes.length + 1) + margin + padding,
            height = cell_height * (nodes.length + 1) + margin + padding;

        let local_scheme = d3.interpolateGnBu;

        let svg = section.append('svg')
            .attr('title', 'Transfer Entropy')
            .attr('version', 1.1)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('width', width)
            .attr('height', height)
            .attr('font-family', 'sans-serif');

        let sources = svg.append('g')
            .attr('font-size', 12)
            .attr('transform', function() {
                let x = margin, y = margin + cell_height + padding;
                return 'translate(' + x + ',' + y + ')';
            });

        sources.selectAll('rect')
            .data(transfer_entropy)
            .enter().append('rect')
            .attr('y', (d) => cell_height * d.source.name)
            .attr('width', cell_width)
            .attr('height', cell_height)
            .attr('fill', (d) => color_scheme(d.source.name))
            .attr('stroke', 'black');

        sources.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('fill', '#000000')
            .attr('dy', '-0.5em')
            .attr('text-anchor', 'end')
            .text('Source');

        let targets = svg.append('g')
            .attr('font-size', 12)
            .attr('transform', function() {
                let x = margin + cell_width + padding, y = margin;
                return 'translate(' + x + ',' + y + ')';
            });

        targets.selectAll('rect')
            .data(transfer_entropy)
            .enter().append('rect')
            .attr('x', (d) => cell_width * d.target.name)
            .attr('width', cell_width)
            .attr('height', cell_height)
            .attr('fill', (d) => color_scheme(d.target.name))
            .attr('stroke', 'black');

        targets.append('text')
            .attr('fill', '#000000')
            .attr('dy', '-0.5em')
            .text('Target');

        let cells = svg.append('g')
            .attr('font-size', 12)
            .attr('transform', function() {
                let x = margin + cell_width + padding,
                    y = margin + cell_height + padding;
                return 'translate(' + x + ',' + y + ')';
            });

        let onclick = function(d) {
            if (visible_history) {
                let { source, target } = visible_history;
                cells.select(`#te-${source}-${target}`).classed('cell--selected', false);
                if (d.source.name === source && d.target.name === target) {
                    visible_history = null;
                } else {
                    source = d.source.name;
                    target = d.target.name;
                    visible_history = { source, target };
                    cells.select(`#te-${source}-${target}`).classed('cell--selected', true);
                }
            } else {
                const source = d.source.name;
                const target = d.target.name;
                visible_history = { source, target };
                cells.select(`#te-${source}-${target}`).classed('cell--selected', true);
            }
            render_history();
        };

        cells.selectAll('rect')
            .data(transfer_entropy)
            .enter().append('rect')
            .attr('class', 'te-cell')
            .attr('id', (d) => 'te-' + d.source.name + '-' + d.target.name)
            .attr('x', (d) => cell_width * d.target.name)
            .attr('y', (d) => cell_height * d.source.name)
            .attr('width', cell_width)
            .attr('height', cell_height)
            .attr('fill', (d) => local_scheme(d.value))
            .attr('stroke', 'black')
            .on('click', onclick);

        cells.selectAll('text')
            .data(transfer_entropy)
            .enter().append('text')
            .attr('x', (d) => cell_width * (d.target.name + 0.5))
            .attr('y', (d) => cell_height * (d.source.name + 0.5))
            .attr('dy', '0.25em')
            .attr('text-anchor', 'middle')
            .text((d) => (Math.round(d.value * 1000) / 1000) + ' bits')
            .on('click', onclick);

        if (visible_history) {
            const { source, target } = visible_history;
            if (source >= num_features || target >= num_features) {
                visible_history = null;
            } else {
                cells.select(`#te-${source}-${target}`).classed('cell--selected', true);
            }
            render_history();
        }
    };

    const render_history = function() {
        if (visible_history) {
            let { source, target } = visible_history;
            let curve = [];
            for (let entry of Object.entries(history[source][target])) {
                curve.push({ x: parseInt(entry[0]), y: entry[1] });
            }
            curve.sort((a,b) => (a.x < b.x) ? -1 : (a.x > b.x) ? 1 : 0);
            d3.select('#history').classed('phase--hidden', false).html('');
            single_curve('#history', {
                width: 1024,
                height: 284,
                margins: {top: 20, right: 30, bottom: 30, left: 50},
                title: 'Transfer Entropy vs History Length',
                xlabel: 'History Length',
                ylabel: 'TE (bits)',
                color_scheme
            }, curve);
        } else {
            d3.select('#history').classed('phase--hidden', true);
        }
    };

    ipcRenderer.on('transfer-entropy', function(event, data) {
        num_features = 0;

        history = data;

        transfer_entropy = new Array();
        for (let source in data) {
            num_features = Math.max(num_features, 1 + parseInt(source));
            for (let target in data[source]) {
                transfer_entropy.push({
                    source: parseInt(source),
                    target: parseInt(target),
                    value: data[source][target][2]
                });
            }
        }

        render_transfer_entropy();
    });

    return {
        history: () => history,
        transfer_entropy: () => transfer_entropy
    };
}());
