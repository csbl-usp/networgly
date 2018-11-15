## networkgly

Inspired be [VivagraphJS](https://github.com/anvaka/VivaGraphJS), *networgly* is an performant WebGL network visualization library.

It relies on [ngraph.graph]() for the graph data structure, [ngraph.forcelayout]() for the network layout simulation and [regl]() as the WebGL interface for visualization.

This library is still at early development stage

### Usage
```js
import createGraph from 'ngraph.graph';
import networgly from 'networgly';

// initialize graph object
var graph = createGraph();
graph.addLink(1, 2);
graph.addLink(2, 3);)

// create or select canvas element
var canvas = document.createElement('canvas');

var vis = networgly(graph, {
    canvas: canvas  
})

vis.render()
```
