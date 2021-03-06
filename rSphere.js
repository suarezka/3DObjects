/**
 * Created by Hans Dulimarta on 2/1/17.
 */
class rSphere {
    /**
     * Create a 3D cone with tip at the Z+ axis and base on the XY plane
     * @param {Object} gl      the current WebGL context
     * @param {Number} radius  radius of the cone base
     * @param {Number} subDiv  number of radial subdivision of the cone base
     * @param {vec3}   col1    color #1 to use
     * @param {vec3}   col2    color #2 to use
     */
    constructor (gl, radius, subDiv, col1, col2) {

        /* if colors are undefined, generate random colors */
        if (typeof col1 === "undefined") col1 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        if (typeof col2 === "undefined") col2 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        let randColor = vec3.create();
        let vertices = [];
        this.vbuff = gl.createBuffer();

        /* Instead of allocating two separate JS arrays (one for position and one for color),
         in the following loop we pack both position and color
         so each tuple (x,y,z,r,g,b) describes the properties of a vertex
         */
        vertices.push(radius,radius,radius);
        vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
        vertices.push(randColor[0], randColor[1], randColor[2]);
        vertices.push(-radius,-radius,radius);
        vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
        vertices.push(randColor[0], randColor[1], randColor[2]);
        vertices.push(-radius,radius,-radius);
        vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
        vertices.push(randColor[0], randColor[1], randColor[2]);
        vertices.push(radius,-radius,-radius);
        vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
        vertices.push(randColor[0], randColor[1], randColor[2]);

        function tri(N,ax,ay,az,bx,by,bz,cx,cy,cz,na,nb,nc) {
            if(N == 0) {
                return;
            } else {
                let m1x = 0.5 * (ax + bx);
                let m1y = 0.5 * (ay + by);
                let m1z = 0.5 * (az + bz);
                let m2x = 0.5 * (bx + cx);
                let m2y = 0.5 * (by + cy);
                let m2z = 0.5 * (bz + cz);
                let m3x = 0.5 * (ax + cx);
                let m3y = 0.5 * (ay + cy);
                let m3z = 0.5 * (az + cz);
                vertices.push(m1x, m1y, m1z);
                vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
                vertices.push(randColor[0], randColor[1], randColor[2]);
                vertices.push(m2x, m2y, m2z);
                vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
                vertices.push(randColor[0], randColor[1], randColor[2]);
                vertices.push(m3x, m3y, m3z);
                vec3.lerp (randColor, col1, col2, Math.random()); /* linear interpolation between two colors */
                vertices.push(randColor[0], randColor[1], randColor[2]);
                tri(N - 1, ax, ay, az, m1x, m1y, m1z, m3x, m3y, m3z, na+6, nb+6, nc+6);
                tri(N - 1, bx, by, bz, m1x, m1y, m1z, m3x, m3y, m3z, na+6, nb+6, nc+6);
                tri(N - 1, cx, cy, cz, m1x, m1y, m1z, m3x, m3y, m3z, na+6, nb+6, nc+6);
            }
        }

        tri(subDiv, radius, radius, radius, -radius, -radius, radius, -radius, radius, -radius, 0, 1, 2);
        tri(subDiv, -radius, -radius, radius, -radius, radius, -radius, radius, radius, radius, 1, 2, 3);
        tri(subDiv, -radius, radius, -radius, radius, radius, radius, -radius, -radius, radius, 2, 3, 0);
        //tri(subDiv, radius, radius, radius, -radius, -radius, radius, -radius, radius, -radius, 3, 0, 1);;

        /* copy the (x,y,z,r,g,b) sixtuplet into GPU buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

        // Generate index order for top of sphere
        let topIndex = [];
        for (let k = 0; k <= 160; k++)
            topIndex.push(k);
        this.topIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.topIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(topIndex), gl.STATIC_DRAW);

        // // Generate index order for middle of sphere
        // let middleIndex = [];
        // for (let k = 1; k <= subDiv * stacks - (subDiv * 2); k++) {
        //     middleIndex.push(k);
        //     middleIndex.push(k + subDiv);
        //
        //     if (k % subDiv == 0) {
        //         middleIndex.push(k - (subDiv - 1));
        //         middleIndex.push(k + 1);
        //     }
        // }
        // this.midIdxBuff = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.midIdxBuff);
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(middleIndex), gl.STATIC_DRAW);
        //
        // // Generate index order for bottom of sphere
        // let botIndex = [];
        // let max = subDiv * stacks - subDiv + 2;
        // botIndex.push(max);
        // for (let k = max - 1; k >= (max - 1) - subDiv; k--)
        //     botIndex.push(k);
        // botIndex.push(max - 2);
        // this.botIdxBuff = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.botIdxBuff);
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(botIndex), gl.STATIC_DRAW);

        /* Put the indices as an array of objects. Each object has three attributes:
         primitive, buffer, and numPoints */
        this.indices = [{"primitive": gl.POINT, "buffer": this.topIdxBuff, "numPoints": topIndex.length}];
            //{"primitive": gl.TRIANGLE_STRIP, "buffer": this.midIdxBuff, "numPoints": middleIndex.length},
            //{"primitive": gl.TRIANGLE_FAN, "buffer": this.botIdxBuff, "numPoints": botIndex.length}];
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