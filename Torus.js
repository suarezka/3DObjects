/**
 * Created by Nate on 2/19/17.
 */
class Torus {
    /**
     * Create a 3D cone with tip at the Z+ axis and base on the XY plane
     * @param {Object} gl      the current WebGL context
     * @param {Number} lRadius large radius of the torus
     * @param {Number} sRadius radius of the tube
     * @param {Number} subDiv  number of radial subdivision of the torus
     * @param {Number} stacks  number of stacks of the sphere
     * @param {vec3}   col1    color #1 to use
     * @param {vec3}   col2    color #2 to use
     */
    constructor(gl, lRadius, sRadius, subDiv, stacks, col1, col2) {

        /* if colors are undefined, generate random colors */
        if (typeof col1 === "undefined") col1 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        if (typeof col2 === "undefined") col2 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        let randColor = vec3.create();
        let vertices = [];
        this.vbuff = gl.createBuffer();

        for (let i = 0; i <= stacks; i++) {
            let anglePhi = i * 2 * Math.PI / stacks;
            for (let k = 0; k < subDiv; k++) {
                let angle = k * 2 * Math.PI / subDiv;
                let x = (lRadius + sRadius * Math.cos(angle))* Math.cos(anglePhi);
                let y = (lRadius + sRadius * Math.cos(angle)) * Math.sin(anglePhi);
                let z = sRadius * Math.sin(angle);



                /* the first three floats are 3D (x,y,z) position */
                vertices.push(x, y, z);
                /* perimeter of base */
                vec3.lerp(randColor, col1, col2, Math.random());
                /* linear interpolation between two colors */
                /* the next three floats are RGB */
                vertices.push(randColor[0], randColor[1], randColor[2]);
            }
        }

        /* copy the (x,y,z,r,g,b) sixtuplet into GPU buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

        // Generate index order for top of sphere
        let ringIndex = [];
        for (let k = 0; k < (subDiv * stacks); k++) {
            ringIndex.push(k);
            ringIndex.push(k + subDiv);
        }
        this.ringIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ringIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(ringIndex), gl.STATIC_DRAW);

        /* Put the indices as an array of objects. Each object has three attributes:
         primitive, buffer, and numPoints */
        this.indices = [{"primitive": gl.TRIANGLE_STRIP, "buffer": this.ringIdxBuff, "numPoints": ringIndex.length}];
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
        gl.vertexAttribPointer(vertexAttr, 3, gl.FLOAT, false, 24, 0); /* (x,y,z) begins at offset 0 */
        gl.vertexAttribPointer(colorAttr, 3, gl.FLOAT, false, 24, 12); /* (r,g,b) begins at offset 12 */

        for (let k = 0; k < this.indices.length; k++) {
            let obj = this.indices[k];
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.buffer);
            gl.drawElements(obj.primitive, obj.numPoints, gl.UNSIGNED_BYTE, 0);
        }
    }
}