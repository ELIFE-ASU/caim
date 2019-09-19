/* global d3 */

// eslint-disable-next-line no-unused-vars
function text_color(scheme, value, threshold=186) {
    const [r, g, b] = scheme(value).slice(4,-1).split(', ').map(c => parseInt(c, 10));
    const x = 0.299*r + 0.587*g + 0.114*b;
    if (x <= threshold) {
        return '#ffffff';
    } else {
        return '#000000';
    }
}

// eslint-disable-next-line no-unused-vars
function matrix(container, fmt, data, cell_callback) {
    const num_features = Math.max(0, ...Object.keys(data).map(k => 1 + parseInt(k, 10)));

    let visible_cell = null;

    const section = d3.select(container)
        .classed('phase--hidden', data.length === 0)
        .html('');

    const nodes = [];
    data.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    const width = fmt.cell_width * (nodes.length + 1) + fmt.margin + fmt.padding;
    const height = fmt.cell_height * (nodes.length + 1) + fmt.margin + fmt.padding;

    const svg = section.append('svg')
        .attr('title', fmt.title)
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', width)
        .attr('height', height)
        .attr('font-family', 'sans-serif');

    const sources = svg.append('g')
        .attr('font-size', fmt.font_size)
        .attr('transform', function() {
            const x = fmt.margin;
            const y = fmt.margin + fmt.cell_height + fmt.padding;
            return 'translate(' + x + ',' + y + ')';
        });

    sources.selectAll('rect')
        .data(data)
        .enter().append('rect')
        .attr('y', (d) => fmt.cell_height * d.source.name)
        .attr('width', fmt.cell_width)
        .attr('height', fmt.cell_height)
        .attr('fill', (d) => fmt.color_scheme(d.source.name))
        .attr('stroke', 'black');

    sources.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('fill', '#000000')
        .attr('dy', '-0.5em')
        .attr('text-anchor', 'end')
        .text('Source');

    let targets = svg.append('g')
        .attr('font-size', fmt.font_size)
        .attr('transform', function() {
            const x = fmt.margin + fmt.cell_width + fmt.padding;
            const y = fmt.margin;
            return 'translate(' + x + ',' + y + ')';
        });

    targets.selectAll('rect')
        .data(data)
        .enter().append('rect')
        .attr('x', (d) => fmt.cell_width * d.target.name)
        .attr('width', fmt.cell_width)
        .attr('height', fmt.cell_height)
        .attr('fill', (d) => fmt.color_scheme(d.target.name))
        .attr('stroke', 'black');

    targets.append('text')
        .attr('fill', '#000000')
        .attr('dy', '-0.5em')
        .text('Target');

    const cells = svg.append('g')
        .attr('font-size', fmt.font_size)
        .attr('transform', function() {
            const x = fmt.margin + fmt.cell_width + fmt.padding;
            const y = fmt.margin + fmt.cell_height + fmt.padding;
            return 'translate(' + x + ',' + y + ')';
        });

    function onclick(d) {
        if (cell_callback) {
            if (visible_cell) {
                let { source, target } = visible_cell;
                cells.select(`#cell-${source}-${target}`).classed('cell--selected', false);
                cells.select(`#cell-text-${source}-${target}`).classed('text--selected', false);
                if (d.source.name === source && d.target.name === target) {
                    visible_cell = null;
                } else {
                    source = d.source.name;
                    target = d.target.name;
                    visible_cell = { source, target };
                    cells.select(`#cell-${source}-${target}`).classed('cell--selected', true);
                    cells.select(`#cell-text-${source}-${target}`).classed('text--selected', true);
                }
            } else {
                const source = d.source.name;
                const target = d.target.name;
                visible_cell = { source, target };
                cells.select(`#cell-${source}-${target}`).classed('cell--selected', true);
                cells.select(`#cell-text-${source}-${target}`).classed('text--selected', true);
            }
            cell_callback(visible_cell);
        }
    }

    cells.selectAll('rect')
        .data(data)
        .enter().append('rect')
        .attr('class', 'cell')
        .attr('id', (d) => 'cell-' + d.source.name + '-' + d.target.name)
        .attr('x', (d) => fmt.cell_width * d.target.name)
        .attr('y', (d) => fmt.cell_height * d.source.name)
        .attr('width', fmt.cell_width)
        .attr('height', fmt.cell_height)
        .attr('fill', (d) => fmt.cell_color_scheme(Number(d.sig.p < 0.05)))
        .attr('stroke', 'black')
        .on('click', onclick)
        .append('title')
        .text((d) => `p = ${d.sig.p.toFixed(3)}`);

    cells.selectAll('text')
        .data(data)
        .enter().append('text')
        .attr('class', 'cell-text')
        .attr('id', (d) => 'cell-text-' + d.source.name + '-' + d.target.name)
        .attr('x', (d) => fmt.cell_width * (d.target.name + 0.5))
        .attr('y', (d) => fmt.cell_height * (d.source.name + 0.5))
        .attr('dy', '0.25em')
        .attr('text-anchor', 'middle')
        .attr('fill', (d) => text_color(fmt.cell_color_scheme, Number(d.sig.p < 0.05)))
        .text((d) => `${d.y.toFixed(3)} ${fmt.units}`)
        .on('click', onclick)
        .append('title')
        .text((d) => `p = ${d.sig.p.toFixed(3)}`);

    if (cell_callback && visible_cell) {
        const { source, target } = visible_cell;
        if (source >= num_features || target >= num_features) {
            visible_cell = null;
        } else {
            cells.select(`#cell-${source}-${target}`).classed('cell--selected', true);
        }
        cell_callback(visible_cell);
    }
}

// eslint-disable-next-line no-unused-vars
function row_matrix(container, fmt, data, cell_callback) {
    const num_features = Math.max(0, ...Object.keys(data).map(k => 1 + parseInt(k, 10)));

    let visible_cell = null;

    const section = d3.select(container)
        .classed('phase--hidden', data.length === 0)
        .html('');

    const nodes = [];
    data.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    });

    const width = fmt.cell_width * (nodes.length + 1) + fmt.margin + fmt.padding;
    const height = 2 * fmt.cell_height + fmt.margin + fmt.padding;

    const svg = section.append('svg')
        .attr('title', fmt.title)
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', width)
        .attr('height', height)
        .attr('font-family', 'sans-serif');

    const sources = svg.append('g')
        .attr('font-size', fmt.font_size)
        .attr('transform', function() {
            const x = fmt.padding;
            const y = fmt.margin;
            return 'translate(' + x + ',' + y + ')';
        });

    sources.selectAll('rect')
        .data(data)
        .enter().append('rect')
        .attr('x', (d) => fmt.cell_width * d.source.name)
        .attr('width', fmt.cell_width)
        .attr('height', fmt.cell_height)
        .attr('fill', (d) => fmt.color_scheme(d.source.name))
        .attr('stroke', 'black');

    sources.append('text')
        .attr('fill', '#000000')
        .attr('dy', '-0.5em')
        .text('Target');

    function onclick(d) {
        if (cell_callback) {
            if (visible_cell) {
                let { source } = visible_cell;
                cells.select(`#cell-${source}`).classed('cell--selected', false);
                cells.select(`#cell-text-${source}`).classed('text--selected', false);
                if (d.source.name === source) {
                    visible_cell = null;
                } else {
                    source = d.source.name;
                    visible_cell = { source };
                    cells.select(`#cell-${source}`).classed('cell--selected', true);
                    cells.select(`#cell-text-${source}`).classed('text--selected', true);
                }
            } else {
                const source = d.source.name;
                visible_cell = { source };
                cells.select(`#cell-${source}`).classed('cell--selected', true);
                cells.select(`#cell-text-${source}`).classed('text--selected', true);
            }
            cell_callback(visible_cell);
        }
    }

    const cells = svg.append('g')
        .attr('font-size', fmt.font_size)
        .attr('transform', function() {
            const x = fmt.padding;
            const y = fmt.margin + fmt.cell_height + fmt.padding;
            return 'translate(' + x + ',' + y + ')';
        });

    cells.selectAll('rect')
        .data(data)
        .enter().append('rect')
        .attr('class', 'cell')
        .attr('id', (d) => 'cell-' + d.source.name)
        .attr('x', (d) => fmt.cell_width * d.source.name)
        .attr('width', fmt.cell_width)
        .attr('height', fmt.cell_height)
        .attr('fill', (d) => fmt.cell_color_scheme(Number(d.sig.p < 0.05)))
        .attr('stroke', 'black')
        .on('click', onclick)
        .append('title')
        .text((d) => `p = ${d.sig.p.toFixed(3)}`);

    cells.selectAll('text')
        .data(data)
        .enter().append('text')
        .attr('class', 'cell-text')
        .attr('id', (d) => 'cell-text-' + d.source.name)
        .attr('x', (d) => fmt.cell_width * (d.source.name + 0.5))
        .attr('y', 0.5 * fmt.cell_height)
        .attr('dy', '0.25em')
        .attr('text-anchor', 'middle')
        .attr('fill', (d) => text_color(fmt.cell_color_scheme, Number(d.sig.p < 0.05)))
        .text((d) => `${d.y.toFixed(3)} ${fmt.units}`)
        .on('click', onclick)
        .append('title')
        .text((d) => `p = ${d.sig.p.toFixed(3)}`);

    if (cell_callback && visible_cell) {
        const { source } = visible_cell;
        if (source >= num_features) {
            visible_cell = null;
        } else {
            cells.select(`#cell-${source}`).classed('cell--selected', true);
        }
        cell_callback(visible_cell);
    }
}
