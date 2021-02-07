const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const containerG = svg.append('g').classed('container', true);
let mapData, popData, projection, hexbin, bubblesG, radiusScale;

// d3.zoom defines event from scrolling or double click
let zoom = d3.zoom()
    .scaleExtent([1,8])  // limit of zoom for the k value
    .on('zoom', zoomed);
svg.call(zoom);

svg.attr('width', size.w)
    .attr('height', size.h);

Promise.all([
    d3.json('data/maps/us-states.geo.json'),
    d3.csv('data/us_county.csv')
]).then(function (datasets) {
    mapData = datasets[0];
    popData = datasets[1];
    // popData = popData.filter(d => projection([d.long && d.lat]) );
    // popData.forEach(d => {
        // d.population = +d.population;
    // })

    // --------- DRAW MAP ----------
    // creating a group for map paths
    let mapG = containerG.append('g').classed('map', true);

    // defining a projection that we will use
    projection = d3.geoAlbersUsa()
        .fitSize([size.w, size.h], mapData);

    // defining a geoPath function
    let path = d3.geoPath(projection);

    // adding county paths into the SVG
    mapG.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', function(d) {
            return path(d);
        });
   
    // DRAW BUBBLES
    /// Add a group
    bubblesG = containerG.append('g').classed('bubbles', true);

    // need to make two scales -- one is x & y, one is radius

    radiusScale = d3.scaleSqrt()
        .domain(d3.extent(popData, d=> +d.population)) // scale functions only work with numbers >> plus sign does that
        .range([1, 20]);  // limit to 20 -- maybe do some trial & error
    
    drawBubbles();

});

function drawBubbles(zoomScale = 1) {
    // now add the circles
    bubblesG.selectAll('circle')
        .data(popData)
        .join('circle')
        // .enter()
        // .append('circle')
        .attr('cx',0 )
        .attr('cy', 0)
        // .attr('transform', 'translate('+projection([d.long, d.lat])+')')
        .attr('transform', function(d) {
            //translate(x,y)
            return `translate(${projection([d.long, d.lat])})`; 
            // return 'translate('+projection([d.long, d.lat])+')';   // same as above
        })
        .attr('r', d => radiusScale(+d.population)/zoomScale); 
        
     // Enter
     // all the incoming rows/svg elements
     
     // Update
     // existing svg elements

     // Exit
     // extra svg elements 
};

// moved to bottom because usually these functions have a lot to them
// d3.zoom also lets you pan
function zoomed(event) { 
    console.log('zoomed', event);
    // event.transform = {x:1 , y: 2 k: 3} // use k to define zoom of map

    containerG.attr('transform', event.transform); // event.transform is saying to scale -- translate object?

    // we want the stroke to visibly stay the same
    containerG.attr('stroke-width', 1/event.transform.k) // need to make it even by dividing by zoom scale

    drawBubbles(event.transform.k);
};