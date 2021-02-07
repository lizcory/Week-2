const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, popData, hexbinPopData;
let radiusScale, projection, hexbin, hexbinG;


svg.attr('width', size.w)
    .attr('height', size.h);

let zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
svg.call(zoom);

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
    popData = popData.filter(d => projection([d.long, d.lat]));

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
    
    // --------- DRAW HEXBINS ----------
    // translate lat/long into x & y
    popData.forEach(d => {
        d.position = projection([d.long, d.lat]);
    });
    console.log(popData[0]);
    // divide the data into bins first, based on the svg canvas -- need a more complicated zoom function
    hexbinG = containerG.append('g').classed('hexbin', true);
    drawHexbins();
});

function drawHexbins(scale = 1) {
    // defining a hexbin function 
    // that will create bins for us
    let hexbin = d3.hexbin()
        .size([size.w, size.h]) // needs size of our svg element
        .x(d => d.position[0])
        .y(d => d.position[1])
        .radius(20/scale);

    // creat the bins with the tabular/csv data
    let hexbinPopData = hexbin(popData);
    console.log(hexbinPopData); //this resulting dataset is an array of bins -- each bin is an array of all the objects that fall within that bin

    // calculating the mean population for each bin
    // so we can adjust the radius
    hexbinPopData.forEach(bin => {
        bin.meanPop = d3.mean(bin, d => +d.population);
        bin.meanAge = d3.mean(bin, d => + d.median_age);
    });

    let sizeScale = d3.scaleSqrt()
        .domain(d3.extent(hexbinPopData, d => d.meanPop))
        .range([1,20/scale]); // need to divide by zoom scale

    let colorScale = d3.scaleSequential()
        .domain(d3.extent(hexbinPopData, d => d.meanAge))
        .interpolator(d3.interpolatePlasma);

    // need to make the hexes now
    hexbinG.selectAll('path')
        .data(hexbinPopData)
        .join('path')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .attr('d', d => hexbin.hexagon(sizeScale(d.meanPop))) //this will return scaled value for how big the hex should be -- if you set this as the max value, then you can make a full hex map
        .style('fill', d => colorScale(d.meanAge)); // style b/c we want a CSS attribute, not an SVG attribute
    
}

function zoomed(event) {
    let transform = event.transform;
    containerG.attr("transform", transform);
    containerG.attr("stroke-width", 1 / transform.k);

    drawHexbins(transform.k);
}