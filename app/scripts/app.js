import geojson from 'json!../data/ortsteile.json';
import d3 from 'd3';

const width = 800;
const height = 600;
const path = d3.geo.path().projection(d3.geo.mercator());
const mapCenter = path.centroid(geojson);

var grid = {
    cells: [],
    initialCellSize: 0,
    cellSize: 0,
    isUsed(x, y) {
        return this.cells.some(cell => (cell.x === x && cell.y === y));
    },
    use(x, y) {
        return this.cells.push({x, y});
    },
    getInterestingCells() {
        let iCells = this.cells.map(cell => makeCell(cell.x, cell.y, this.cellSize, true));
        this.cells.forEach(cell => {
            [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}].forEach(nb => {
                let x = cell.x + nb.x;
                let y = cell.y + nb.y;
                if (!iCells.some(iCell => (iCell.x === x && iCell.y === y))) {
                    iCells.push(makeCell(x, y, this.cellSize, false));
                }
            });
        });
        return iCells;
        function makeCell(x, y, cellSize, used) {
            return {
                x,
                y,
                x1: (x - .5) * cellSize,
                x2: (x + .5) * cellSize,
                y1: (y - .5) * cellSize,
                y2: (y + .5) * cellSize,
                used
            }
        }
    }
};

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.cell = null;
    }

    assignCell(cell) {
        this.cell = cell;
    }

    isAssigned() {
        return this.cell !== null;
    }
}

let nodes = geojson.features.map(el => {
    let coords = path.centroid(el);
    let scale = 1000;
    return new Node((coords[0] - mapCenter[0]) * scale, (coords[1] - mapCenter[1]) * scale);
});

var mapBounds = nodes.reduce((prev, node) => ({
    x1: node.x < prev.x1 ? node.x : prev.x1,
    x2: node.x > prev.x2 ? node.x : prev.x2,
    y1: node.y < prev.y1 ? node.y : prev.y1,
    y2: node.y > prev.y2 ? node.y : prev.y2
}), {x1: 0, x2: 0, y1: 0, y2: 0});

grid.cellSize = grid.initialCellSize = Math.max(mapBounds.x2 - mapBounds.x1, mapBounds.y2 - mapBounds.y1);

var centralNode = nodes.reduce((bestCandidate, node) => {
    function dist(el) {
        return el.x * el.x + el.y * el.y;
    }

    return (dist(node) < dist(bestCandidate))
        ? node
        : bestCandidate;
}, nodes[0]);

let viewBox = mapBounds.x1 + ' ' + mapBounds.y1 + ' ' + (mapBounds.x2 - mapBounds.x1) + ' ' + (mapBounds.y2 - mapBounds.y1);
var svg = d3.select('body').append('svg').attr({width, height, viewBox});

centralNode.assignCell(grid.use(0, 0));

function getNodesInCells(cells) {
    var nodesInCells = [];
    nodes.forEach(node => {
        if (node.isAssigned()) return;
        for (let i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (node.x > cell.x1 && node.x < cell.x2 && node.y > cell.y1 && node.y < cell.y2) {
                nodesInCells.push({node, cell});
                break;
            }
        }
    });
    return nodesInCells;
}

function getNextNode() {
    let nodesInCells;
    let direction = 1;
    let directionChange;
    //grid.cellSize = grid.initialCellSize;
    let step = grid.cellSize;
    do {
        nodesInCells = getNodesInCells(grid.getInterestingCells());
        if (nodesInCells.length < 1) {
            directionChange = (direction !== (direction = 1));
            step = directionChange ? step / 2 : step;
            grid.cellSize += step;
        }
        else if (nodesInCells.length > 1 || nodesInCells[0].cell.used) {
            directionChange = (direction !== (direction = -1));
            step = directionChange ? step / 2 : step;
            grid.cellSize -= step;
        }

    } while (nodesInCells.length !== 1 || nodesInCells[0].cell.used);
    return nodesInCells[0];
}

function allocateAllNodes() {
    while (nodes.some(node => !node.isAssigned())) {
        let nextNode = getNextNode();
        nextNode.node.assignCell(grid.use(nextNode.cell.x, nextNode.cell.y));
    }
}

//allocateAllNodes();

function drawAll() {
    svg.selectAll('*').remove();
    svg.selectAll('path')
        .data(nodes)
        .enter()
        .append('circle')
        .style('fill', node => ((node === centralNode) ? '#f00' : node.isAssigned() ? '#00f' : '#000'))
        .attr({
            cx: node => node.x,
            cy: node => node.y,
            r: 5
        });

    svg.append('circle')
        .style({
            fill: '#0f0'
        })
        .attr({
            cx: 0,
            cy: 0,
            r: 5
        });
    let scale = 70;
    svg.selectAll('path')
        .data(grid.cells)
        .enter()
        .append('rect')
        .style('fill', 'rgba(0,0,255,.5)')
        .attr({
            x: cell=> (cell.x - .5) * scale,
            y: cell =>(cell.y - .5) * scale,
            width: scale + 'px',
            height: scale + 'px'
        });
}


document.querySelector('#step').addEventListener('click', () => {
    allocateAllNodes();
    drawAll();
});