/**
 * Created by Kaye on 2/14/17.
 */


class Cube {
    /**
     * Create a 3D cone with tip at the Z+ axis and base on the XY plane
     * @param {Object} gl      the current WebGL context
     * @param {Number} height  height of cube
     * @param {Number} subDiv  number of radial subdivision of the cube base
     * @param {Number} stacks  number of vertical stacks of cube
     * @param {vec3}   col1    color #1 to use
     * @param {vec3}   col2    color #2 to use
     */
    constructor(gl, height, radius, subDiv, stacks, col1, col2) {

        /* if colors are undefined, generate random colors */
        if (typeof col1 === "undefined") col1 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        if (typeof col2 === "undefined") col2 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        let randColor = vec3.create();
        let vertices = [];
        this.vbuff = gl.createBuffer();

        //VERTICAL INTERVAL OF STACKS
        let div = height / stacks;

        for (let k = 0; k < 2 * subDiv; k++) {
            let angle = k * 2 * Math.PI / subDiv;
            let x = radius * Math.cos(angle);
            let y = radius * Math.sin(angle);

            if (k >= subDiv) {
                vertices.push(x, y, height);
            } else {
                /* the first three floats are 3D (x,y,z) position */
                vertices.push(x, y, 0);
                /* perimeter of base */
            }

            vec3.lerp(randColor, col1, col2, Math.random());
            /* linear interpolation between two colors */
            /* the next three floats are RGB */
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }

        /* copy the (x,y,z,r,g,b) sixtuplet into GPU buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

        // Generate index order for top of cone
        let topIndex = [4, 0, 1, 5, 6, 7, 3, 0];

        /* CREATE LOOP TO FILL ARRAY FOR TRIANGLE FAN //TODO:
        topIndex.push(subDiv);
        for (let k = 0; k < 2 * subDiv; k++) {

        }
        */

        this.topIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.topIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(topIndex), gl.STATIC_DRAW);

        // Generate index order for bottom of cone
        let botIndex = [2, 3, 7, 6, 5, 1, 0, 3];

        /* CREATE LOOP TO FILL ARRAY FOR TRIANGLE FAN //TODO: */


        this.botIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.botIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(botIndex), gl.STATIC_DRAW);

        console.log(vertices);
        console.log(topIndex);
        console.log(botIndex);


        /* Put the indices as an array of objects. Each object has three attributes:
         primitive, buffer, and numPoints */
        this.indices = [{"primitive": gl.TRIANGLE_FAN, "buffer": this.topIdxBuff, "numPoints": topIndex.length},
                        {"primitive": gl.TRIANGLE_FAN, "buffer": this.botIdxBuff, "numPoints": botIndex.length}];
    }

    /**
     * Draw the object
     * @param {Number} vertexAttr a handle to a vec3 attribute in the vertex shader for vertex xyz-position
     * @param {Number} colorAttr  a handle to a vec3 attribute in the vertex shader for vertex rgb-color
     * @param {Number} modelUniform a handle to a mat4 uniform in the shader for the coordinate frame of the model
     * @param {mat4} coordFrame a JS mat4 variable that holds the actual coordinate frame of the object
     */
    draw(vertexAttr, colorAttr, modelUniform, coordFrame) {
        /* copy the coordinate frame matrix to the uniform memory in shader */
        gl.uniformMatrix4fv(modelUniform, false, coordFrame);

        /* binder the (vertex+color) buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);

        /* with the "packed layout"  (x,y,z,r,g,b),
         the stride distance between one group to the next is 24 bytes */
        gl.vertexAttribPointer(vertexAttr, 3, gl.FLOAT, false, 24, 0);
        /* (x,y,z) begins at offset 0 */
        gl.vertexAttribPointer(colorAttr, 3, gl.FLOAT, false, 24, 12);
        /* (r,g,b) begins at offset 12 */

        for (let k = 0; k < this.indices.length; k++) {
            let obj = this.indices[k];
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.buffer);
            gl.drawElements(obj.primitive, obj.numPoints, gl.UNSIGNED_BYTE, 0);
        }
    }
}