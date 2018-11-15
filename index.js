import forceLayout from "ngraph.forcelayout"
import createRegl from "regl"
import { mat3, vec2 }  from "gl-matrix"
import { select } from "d3-selection"
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom"
import { quadtree as d3Quadtree } from "d3-quadtree"
import commands from "./lib/commands"

var d3Event = () => require("d3-selection").event

const initializeCommands = (regl, commands) => {
    var initialized = {}
    Object.keys(commands).forEach((command) => {
        initialized[command] = regl(commands[command](regl))
    })
    return(initialized)
}

export const createNetworgly = (graph, options) => {

    const defaultOptions = {
        renderEdges: true,
        highlightNode: true,
        highlightNeighbors: true
    }
    options = {...defaultOptions, ...options}
    var nodes = {}
    var layout = forceLayout(graph, {})

    graph.forEachNode((node) => {
        var data = {
            size: 4,
            color: [0,0,0,1.0]
        }
        data.pos = layout.getNodePosition(node.id)
        nodes[node.id] = data
    })
    
    var quadtree = null
    var regl = createRegl(options.canvas)
    var cmds = initializeCommands(regl, commands)
    var loop = null
    
    var zoom = d3Zoom();
    var t = null;
    select(options.canvas)
        .on("mousemove", () => {
            if (!isLayoutRunning) {
                const { offsetX, offsetY } = d3Event() 
                var inverse = mat3.create()
                var mouseTransformed = vec2.create()
                mat3.invert(inverse, transform)
                vec2.transformMat3(mouseTransformed, [offsetX, offsetY], inverse)
                if (quadtree) {
                    currentNode = quadtree.find(
                        mouseTransformed[0],
                        mouseTransformed[1],
                        7
                    )
                }
                if (options.onNodeHover) {
                    options.onNodeHover({
                        node: currentNode ? graph.getNode(currentNode.id) : null, 
                        x: offsetX,
                        y: offsetY
                    })
                }
            }
        })
        .call(zoom.on("zoom", () => {
            t = d3Event().transform;
            updateTransform(t.x, t.y, t.k)
            
            if (options.onDrag) {
                options.onDrag({x: t.x, y: t.x, scale: t.k})
            }
            
            if (options.onNodeHover) {
                options.onNodeHover({node: null, 
                                     x: null,
                                     y: null})
            }
        }))

    var transform = mat3.create()
    var projection = mat3.create()

    if (options.transform) {
        var { x, y, scale } = options.transform
        var initialT = zoomIdentity.translate(x, y).scale(scale)
        select(options.canvas)
            .call(zoom.transform, initialT)
        updateTransform(x, y, scale)
    } else {
        mat3.translate(transform, transform, [
            options.canvas.clientWidth / 2,
            options.canvas.clientHeight / 2
        ])
        mat3.projection(
            projection,
            options.canvas.clientWidth,
            options.canvas.clientHeight
        )
    }

    function updateTransform(x, y, scale) {
        mat3.identity(transform)
        mat3.translate(transform, transform, [x,y]);
        mat3.scale(transform, transform, [scale,scale]);
        mat3.translate(transform, transform, [
          options.canvas.parentNode.clientWidth / 2,
          options.canvas.parentNode.clientHeight / 2
        ]);
        mat3.projection(projection, options.canvas.parentNode.clientWidth, 
                                    options.canvas.parentNode.clientHeight);
    }

    var isLayoutRunning = true
    var currentNode = null
    var nodeIds = Object.keys(nodes)
    var points = Array(nodeIds.length)
    var nodeColors = Array(nodeIds.length)
    var edges = Array(graph.getLinksCount())

    function render() {
        isLayoutRunning = true
        setTimeout(() => { isLayoutRunning = false }, 10000)
        loop = regl.frame((context) => {
            if (isLayoutRunning) {
                layout.step()
            } else {
                if (!quadtree) {
                    var data = nodeIds.map((id, i) => {
                        return {x: nodes[id].pos.x, 
                                y: nodes[id].pos.y,
                                id: id}
                    })
                    quadtree = d3Quadtree()
                        .x((d) => d.x)
                        .y((d) => d.y)
                        .addAll(data)
                }
            }

            var neighbors;
            if (currentNode) {
                if (options.highlightNeighbors) {
                    neighbors = neighborhood(currentNode)
                } else {
                    neighbors = new Set([currentNode.id])
                }
            }

            nodeIds.forEach((node, i) => {
                points[i] = [nodes[node].pos.x, nodes[node].pos.y]
                if (currentNode) {
                    if (options.highlightNode) {
                        nodeColors[i] = neighbors.has(node) ? 
                                            [1.0, 0, 0 ,1.0] :
                                            nodes[node].color
                    }
                } else {
                    nodeColors[i] = nodes[node].color
                }
            })
            
            if (isLayoutRunning) {
                var edgeIndex = 0
                graph.forEachLink((edge) => {
                    edges[edgeIndex] = [nodes[edge.fromId].pos.x,
                                        nodes[edge.fromId].pos.y]
                    edges[edgeIndex + 1] = [nodes[edge.toId].pos.x,
                                            nodes[edge.toId].pos.y]
                    edgeIndex += 2
                })
            }

            cmds['circle']([{
                points: points,
                colors: nodeColors,
                transform: transform,
                projection: projection,
            }])

            if (options.renderEdges) {
                cmds['edges']([{
                    points: points,
                    edges: edges,
                    transform: transform,
                    projection: projection
                }])
            }
        })
    }

    function stop() {
        loop.cancel()
    }

    function resize() {
        if (t) {
            var {x, y, k} = t
            updateTransform(x, y, k)
        }
    }
    
    function neighborhood(node) {
        var neighbors = []
        graph.getNode(currentNode.id).links
             .forEach((link, i) => {
                 neighbors.push(link.fromId)
                 neighbors.push(link.toId)
             })
        neighbors = new Set(neighbors)
        return(neighbors)
    }

    var api = {
        render: render,
        stop: stop,
        resize: resize
    }

    return(api)
}
