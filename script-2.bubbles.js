const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, popData;
let bubblesG, radiusScale, colorScale, projection;

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
    d3.json('data/maps/us-states.geo.json'),
    d3.csv('data/us_county.csv')
]).then(function (datasets) {
    mapData = datasets[0];
    popData = datasets[1];

    // --------- DRAW MAP ----------
    // creating a group for map paths
    let mapG = containerG.append('g').classed('map', true);

    // defining a projection that we will use
    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    // defining a geoPath function
    let path = d3.geoPath(projection);

    // adding county paths
    mapG.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', function(d) {
            return path(d);
        });

    // --------- DRAW BUBBLES ----------
    // creating a group for bubbles
    bubblesG = containerG.append('g').classed('bubbles', true);

    // defining a scale for the radius of bubbles
    radiusScale = d3.scaleSqrt()
        .domain(d3.extent(popData, d => +d.population))
        .range([1, 20]);
    
    // color scale for color
    colorScale = d3.scaleSequential()
        .domain(d3.extent(popData, d => d.median_age))
        .interpolator(d3.interpolatePuOr);

    drawBubbles();
});

function drawBubbles(scale = 1) {
    // creating a bubbles selection
    let bubblesSelection = bubblesG.selectAll('circle')
        .data(popData, d => d.fips);

    console.log(popData[0])
    // creating/updating circles
    bubblesSelection
        .join('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .style('fill', d => colorScale(d.median_age))
        // projection is the function that translates lat,long
        // to the x,y coordinates on our 2D canvas
        .attr('transform', d => 'translate('+projection([d.long, d.lat])+')')
        // dividing by scale
        // to make the circles adjust for particular zoom levels
        .attr('r', d => radiusScale(+d.population)/scale);
}

function zoomed(event) {
    // event contains the transform variable
    // which tells us about the zoom-level
    let transform = event.transform;
    containerG.attr("transform", transform);
    containerG.attr("stroke-width", 1 / transform.k);

    // adjust the bubbles according to zoom level
    drawBubbles(transform.k);
}