const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);

svg.attr('width', size.w)
    .attr('height', size.h);

// defining zoom function
let zoom = d3.zoom()
    .scaleExtent([1, 8])
    // everytime we scroll or double click on the SVG
    // 'zoomed' function will be called
    .on("zoom", zoomed);
// attaching zoom function to SVG
svg.call(zoom);

// loading data
Promise.all([
    d3.json('data/maps/us-counties.geo.json'),
    d3.csv('data/us_county.csv')
]).then(function (datasets) {
    const mapData = datasets[0];
    const countyPopData = datasets[1];

    let mapG = containerG.append('g').classed('map', true);

    drawMap(mapG, mapData);
});

function drawMap(mapG, mapData) {
    // creating a projection
    let projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    // geoPath to translate projection to SVG paths
    let path = d3.geoPath(projection);

    // draw the paths
    mapG.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('id', d => d.properties.brk_a3)
        .attr('d', d => path(d));
}

function zoomed(event) {
    // zoom event tells us how much to scale
    let transform = event.transform;
    containerG.attr("transform", transform);
    containerG.attr("stroke-width", 1 / transform.k);
}