/* global d3 */

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
