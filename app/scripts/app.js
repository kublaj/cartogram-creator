var geojson = require('json!../data/ortsteile.json');
var d3 = require('d3');

var width = 800,
    height = 600,
    grid = 10;

var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

var projection = d3.geo.mercator()
   .translate([width / 2, height / 2])
    .center([13.4, 52.52])
    .scale([30000]);

//Define path generator
var path = d3.geo.path()
    .projection(projection);


var nodes = geojson.features.map(function(el) {
    var coords = path.centroid(el);
    return {
        x: coords[0],
        y: coords[1]
    };
});

var node = svg.selectAll('path')
  .data(nodes)
  .enter()
  .append('rect')
  .style({
      stroke: '#fff',
      fill: '#000'
  })
  .attr('x', function(d) {
      return (d.x);
  })
  .attr('y', function(d) {
      return (d.y);
  })
  .attr({
      width: (grid) + 'px',
      height: (grid) + 'px'
  });



function getGridPos(pos) {
    return Math.round(pos / grid) * grid;
}