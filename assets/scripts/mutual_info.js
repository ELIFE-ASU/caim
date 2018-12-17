const d3 = require('d3');
const { ipcRenderer } = require('electron');

(function() {
    const color_scheme = d3.scaleOrdinal(d3.schemeCategory10);

    let render_mutual_info = function(links) {
        let section = d3.select('#mutual-info');

        section.classed('phase--hidden', links.length === 0).html('');

        let nodes = [];
        links.forEach(function(link) {
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
            .attr('title', 'Mutual Information')
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
            .data(links)
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
            .data(links)
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

        cells.selectAll('rect')
            .data(links)
            .enter().append('rect')
            .attr('class', 'mi-cell')
            .attr('id', (d) => 'mi-' + d.source.name + '-' + d.target.name)
            .attr('x', (d) => cell_width * d.target.name)
            .attr('y', (d) => cell_height * d.source.name)
            .attr('width', cell_width)
            .attr('height', cell_height)
            .attr('fill', (d) => local_scheme(d.value))
            .attr('stroke', 'black');

        cells.selectAll('text')
            .data(links)
            .enter().append('text')
            .attr('x', (d) => cell_width * (d.target.name + 0.5))
            .attr('y', (d) => cell_height * (d.source.name + 0.5))
            .attr('dy', '0.25em')
            .attr('text-anchor', 'middle')
            .text((d) => (Math.round(d.value * 1000) / 1000) + ' bits');
    };

    ipcRenderer.on('mutual-info', (event, links) => render_mutual_info(links));
}());
