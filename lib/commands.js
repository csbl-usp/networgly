const drawCircles = (regl) => {
    return ({
      frag: `
      precision mediump float;
      varying vec4 nodeColor;
      void main () {
        float r = 0.0, delta = 0.0, alpha = 1.0;
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        r = dot(cxy, cxy);
        if (r > 1.0) {
            discard;
        }
        gl_FragColor = nodeColor * alpha;
      }`,

      vert: `
      precision mediump float;
      attribute vec2 position;
      attribute vec4 color;

      uniform mat3 transform;
      uniform mat3 projection;
      uniform vec2 mouse;

      uniform float pixelRatio;
      uniform float stageWidth;
      uniform float stageHeight;

      varying vec4 nodeColor;

      void main () {
        gl_PointSize = 7.0;
        vec3 final =  projection * transform * vec3(position, 1);
        nodeColor = color;
        gl_Position = vec4(final.xy, 0, 1);
      }`,

      attributes: {
        position: regl.prop('points'),
        color: regl.prop('colors')
      },

      uniforms: {
        transform: regl.prop('transform'),
        projection: regl.prop('projection'),
        mouse: regl.prop('mouse'),
        stageWidth: regl.context('drawingBufferWidth'),
        stageHeight: regl.context('drawingBufferHeight')
      },

      count: function(context, props) {
        // set the count based on the number of points we have
        return props.points.length
      },

      primitive: 'points'
    })
}


const drawEdges = (regl) => {
    return ({
      frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(0, 0, 0, 0.5);
      }`,

      vert: `
      precision mediump float;
      attribute vec2 position;

      uniform mat3 transform;
      uniform mat3 projection;

      uniform float stageWidth;
      uniform float stageHeight;


      void main () {
        vec3 final =  projection * transform * vec3(position, 1);
        gl_Position = vec4(final.xy, 0, 1);
      }`,

      attributes: {
        position: regl.prop('edges')
      },

      uniforms: {
        transform: regl.prop('transform'),
        projection: regl.prop('projection'),
        stageWidth: regl.context('drawingBufferWidth'),
        stageHeight: regl.context('drawingBufferHeight')
      },

      count: function(context, props) {
        return props.edges.length
      },

      primitive: 'lines'
    })
}
const cmds = {
    circle: drawCircles,
    edges: drawEdges
}

export default cmds
