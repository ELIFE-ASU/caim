/* global d3, ipcRenderer */
const { remote } = require('electron');

// eslint-disable-next-line no-unused-vars
function single_curve(container, fmt, data) {
    let svg = d3.select(container).append('svg')
        .attr('title', fmt.title)
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', fmt.width)
        .attr('height', fmt.height);

    let width = fmt.width - fmt.margins.left - fmt.margins.right,
        height = fmt.height - fmt.margins.top - fmt.margins.bottom;

    let x = d3.scaleLinear().rangeRound([0, width]),
        y = d3.scaleLinear().rangeRound([height, 0]);

    x.domain((fmt.xrange) ? fmt.xrange : d3.extent(data, (d) => d.x));
    y.domain((fmt.yrange) ? fmt.yrange : d3.extent(data, (d) => d.y));

    let line = d3.line()
        .x((d) => x(d.x))
        .y((d) => y(d.y));

    let g = svg.append('g')
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
    let width = fmt.width - fmt.margins.left - fmt.margins.right,
        height = fmt.height - fmt.margins.top - fmt.margins.bottom;

    let x = d3.scaleLinear().rangeRound([0, width]),
        y = d3.scaleLinear().rangeRound([height, 0]);

    x.domain((fmt.xrange) ? fmt.xrange : [0, d3.max(data.map((d) => d.length)) - 1]);

    if (fmt.yrange) {
        y.domain(fmt.yrange);
    } else {
        let ymin = d3.min(data.map((d) => d3.min(d))),
            ymax = d3.max(data.map((d) => d3.max(d)));
        y.domain([ymin, ymax]);
    }

    let line = d3.line()
        .x((d,i) => x(i))
        .y(y);

    let svg = d3.select(container)
        .html('')
        .append('svg')
        .attr('title', fmt.title)
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', fmt.width)
        .attr('height', fmt.height)
        .on('contextmenu', function() {
            new remote.Menu.buildFromTemplate([
                {
                    label: 'Export Graphic',
                    id: 'export-graphic',
                    click: () => ipcRenderer.send('export', {
                        name: 'timeseries',
                        type: 'svg',
                        data: this.outerHTML
                    })
                },
                {
                    label: 'Export Data',
                    id: 'export-data',
                    click: () => ipcRenderer.send('export', {
                        name: 'timeseries',
                        type: 'json',
                        data
                    })
                }
            ]).popup();
        });

    let g = svg.append('g')
        .attr('transform', 'translate(' + fmt.margins.left + ',' + fmt.margins.top + ')');

    let bottom = g.append('g')
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

    let svg = container.append('svg')
        .attr('title', fmt.title)
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', fmt.width)
        .attr('height', fmt.height);

    let g = svg.append('g')
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
