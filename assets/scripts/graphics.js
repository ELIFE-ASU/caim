/* global d3, ipcRenderer */
const { remote } = require('electron');

function create_svg(container, { title, basename, width, height }, data) {
    return d3.select(container)
        .html('')
        .append('svg')
        .attr('title', title)
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', width)
        .attr('height', height)
        .on('contextmenu', function() {
            new remote.Menu.buildFromTemplate([
                {
                    label: 'Export Graphic',
                    id: 'export-graphic',
                    click: () => ipcRenderer.send('export', {
                        name: basename,
                        type: 'svg',
                        data: this.outerHTML
                    })
                },
                {
                    label: 'Export Data',
                    id: 'export-data',
                    click: () => ipcRenderer.send('export', {
                        name: basename,
                        type: 'json',
                        data: data
                    })
                }
            ]).popup();
        });
}

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
function single_curve(container, fmt, data) {
    const svg = create_svg(container, fmt, data);

    const width = fmt.width - fmt.margins.left - fmt.margins.right;
    const height = fmt.height - fmt.margins.top - fmt.margins.bottom;

    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([height, 0]);

    x.domain((fmt.xrange) ? fmt.xrange : d3.extent(data, (d) => d.x));
    y.domain((fmt.yrange) ? fmt.yrange : d3.extent(data, (d) => d.y));

    const line = d3.line()
        .x((d) => x(d.x))
        .y((d) => y(d.y));

    const g = svg.append('g')
        .attr('transform', 'translate(' + fmt.margins.left + ',' + fmt.margins.top + ')');

    g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))
        .append('text')
        .attr('fill', '#000000')
        .attr('x', width)
        .attr('y', 7*fmt.margins.bottom/8)
        .attr('text-anchor', 'end')
        .text(fmt.xlabel);

    g.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('fill', '#000000')
        .attr('transform', 'rotate(-90)')
        .attr('y', -3*fmt.margins.left/4)
        .attr('text-anchor', 'end')
        .text(fmt.ylabel);

    g.append('path').datum(data)
        .attr('fill', 'none')
        .attr('stroke', fmt.color_scheme(0))
        .attr('d', line);

    svg.append('text')
        .text(fmt.title)
        .attr('x', fmt.margins.left + width/2)
        .attr('y', fmt.margins.top)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'middle');
}

// eslint-disable-next-line no-unused-vars
function multiple_curves(container, fmt, data) {
    const width = fmt.width - fmt.margins.left - fmt.margins.right;
    const height = fmt.height - fmt.margins.top - fmt.margins.bottom;

    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([height, 0]);

    x.domain((fmt.xrange) ? fmt.xrange : [0, d3.max(data.map((d) => d.length)) - 1]);

    if (fmt.yrange) {
        y.domain(fmt.yrange);
    } else {
        const ymin = d3.min(data.map((d) => d3.min(d)));
        const ymax = d3.max(data.map((d) => d3.max(d)));
        y.domain([ymin, ymax]);
    }

    const line = d3.line()
        .x((d,i) => x(i))
        .y(y);

    const svg = create_svg(container, fmt, data);

    const g = svg.append('g')
        .attr('transform', 'translate(' + fmt.margins.left + ',' + fmt.margins.top + ')');

    const bottom = g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

    bottom.append('text')
        .attr('fill', '#000000')
        .attr('x', width)
        .attr('y', 7*fmt.margins.bottom/8)
        .attr('text-anchor', 'end')
        .text(fmt.xlabel);

    g.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('fill', '#000000')
        .attr('transform', 'rotate(-90)')
        .attr('y', -3*fmt.margins.left/4)
        .attr('text-anchor', 'end')
        .text(fmt.ylabel);

    g.selectAll('.series')
        .data(data)
        .enter().append('path')
        .attr('fill', 'none')
        .attr('d', line)
        .attr('stroke', (_, i) => fmt.color_scheme(i));

    svg.append('text')
        .attr('x', fmt.margins.left + width/2)
        .attr('y', fmt.margins.top/3)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .text(fmt.title);
}

// eslint-disable-next-line no-unused-vars
function spike_trains(container, fmt, data) {
    const width = fmt.width - fmt.margins.left - fmt.margins.right;
    const height = fmt.height - fmt.margins.top - fmt.margins.bottom;

    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([height, 0]);

    x.domain([0, d3.max(data.map((d) => d.length))-1]);
    y.domain([0, data.length+1]);

    const svg = create_svg(container, fmt, data);

    const g = svg.append('g')
        .attr('transform', 'translate(' + fmt.margins.left + ',' + fmt.margins.top + ')');

    g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))
        .append('text')
        .attr('fill', '#000000')
        .attr('x', width)
        .attr('y', 7*fmt.margins.bottom/8)
        .attr('text-anchor', 'end')
        .text(fmt.xlabel);

    let left = null;
    if (data.length == 1) {
        left = g.append('g').call(d3.axisLeft(y).ticks(2));
    } else {
        left = g.append('g').call(d3.axisLeft(y).ticks(Math.max(3, data.length)));
    }

    left.append('text')
        .attr('fill', '#000000')
        .attr('transform', 'rotate(-90)')
        .attr('y', -3*fmt.margins.left/4)
        .attr('text-anchor', 'end')
        .text(fmt.ylabel);

    left.selectAll('.tick')
        .each(function(d) {
            if (d == 0 || d == data.length + 1) {
                this.remove();
            }
        });

    data.forEach((d, i) => {
        g.selectAll('.train')
            .append('g')
            .data(d)
            .enter().append('line')
            .attr('x1', (_, j) => x(j))
            .attr('y1', y(i + 1.4))
            .attr('x2', (_, j) => x(j))
            .attr('y2', y(i + 0.6))
            .attr('stroke', fmt.color_scheme(i))
            .attr('stroke-opacity', (d) => d)
            .attr('stroke-width', 2);
    });

    svg.append('text')
        .text(fmt.title)
        .attr('x', fmt.margins.left + width/2)
        .attr('y', fmt.margins.top/3)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle');
}

// eslint-disable-next-line no-unused-vars
function matrix(container, fmt, data, cell_callback) {
    const num_features = Math.max(0, ...Object.keys(data).map(k => 1 + parseInt(k, 10)));

    let visible_cell = null;

    d3.select(container).classed('phase--hidden', data.length === 0).html('');

    const nodes = [];
    data.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    const width = fmt.cell_width * (nodes.length + 1) + fmt.margin + fmt.padding;
    const height = fmt.cell_height * (nodes.length + 1) + fmt.margin + fmt.padding;

    const svg = create_svg(container, Object.assign({ width, height }, fmt), data);

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

    const targets = svg.append('g')
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

    d3.select(container).classed('phase--hidden', data.length === 0).html('');

    const nodes = [];
    data.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    });

    const width = fmt.cell_width * (nodes.length + 1) + fmt.margin + fmt.padding;
    const height = 2 * fmt.cell_height + fmt.margin + fmt.padding;

    const svg = create_svg(container, Object.assign({ width, height }, fmt), data);

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
