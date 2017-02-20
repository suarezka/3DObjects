/**
 * Created by Kaye on 2/19/17.
 * Created by Hans Dulimarta on 2/1/17.
 */


class Ring {
    /**
     * Create a 3D cylinder with tip at the Z+ axis and base on the XY plane
     * @param {Object} gl           the current WebGL context
     * @param {Number} radiusInner  radius of the top
     * @param {Number} radiusOuter  radius of the bottom
     * @param {Number} height       height of the cone
     * @param {Number} subDiv       number of radial subdivision of the cone base
     * @param {Number} stacks       number of vertical stacks of cone
     * @param {vec3}   col1         color #1 to use
     * @param {vec3}   col2         color #2 to use
     */
    constructor(gl, radiusInner, radiusOuter, height, subDiv, stacks, col1, col2) {

        /* if colors are undefined, generate random colors */
        if (typeof col1 === "undefined") col1 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        if (typeof col2 === "undefined") col2 = vec3.fromValues(Math.random(), Math.random(), Math.random());
        let randColor = vec3.create();
        let vertices = [];
        this.vbuff = gl.createBuffer();

        //Top of ring
        for (let k = 0; k < subDiv; k++) {
            let angle = k * 2 * Math.PI / subDiv;
            let x = radiusInner * Math.cos(angle);
            let y = radiusInner * Math.sin(angle);

            let x2 = radiusOuter * Math.cos(angle);
            let y2 = radiusOuter * Math.sin(angle);

            vertices.push(x, y, height);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);

            vertices.push(x2, y2, height);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }

        //More than 1 vertical subdivision
        if (stacks > 1) {
            let h = height;
            for (let i = 1; i < stacks; i++) {
                h = height - (i * (height / stacks));

                for (let k = 0; k < subDiv; k++) {
                    let angle = k * 2 * Math.PI / subDiv;
                    let x = radiusInner * Math.cos(angle);
                    let y = radiusInner * Math.sin(angle);

                    let x2 = radiusOuter * Math.cos(angle);
                    let y2 = radiusOuter * Math.sin(angle);

                    vertices.push(x, y, h);
                    vec3.lerp(randColor, col1, col2, Math.random());
                    vertices.push(randColor[0], randColor[1], randColor[2]);

                    vertices.push(x2, y2, h);
                    vec3.lerp(randColor, col1, col2, Math.random());
                    vertices.push(randColor[0], randColor[1], randColor[2]);
                }
            }
        }

        //Bottom of ring
        for (let k = 0; k < subDiv; k++) {
            let angle = k * 2 * Math.PI / subDiv;
            let x = radiusInner * Math.cos(angle);
            let y = radiusInner * Math.sin(angle);

            let x2 = radiusOuter * Math.cos(angle);
            let y2 = radiusOuter * Math.sin(angle);

            vertices.push(x, y, 0);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);

            vertices.push(x2, y2, 0);
            vec3.lerp(randColor, col1, col2, Math.random());
            vertices.push(randColor[0], randColor[1], randColor[2]);
        }


        /* copy the (x,y,z,r,g,b) sixtuplet into GPU buffer */
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff);
        gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(vertices), gl.STATIC_DRAW);

        console.log(vertices);

        // Generate index order for top of cylinder
        let topIndex = [];
        for (let k = 0; k < 2 * subDiv; k++)
            topIndex.push(k);
        topIndex.push(0);
        topIndex.push(1);

        this.topIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.topIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(topIndex), gl.STATIC_DRAW);

        // Generate index order for bottom of cylinder
        /*
        let botIndex = [];
        let n = (stacks * (4 * subDiv)) - 1;
        botIndex.push(n);
        for (let k = n - 1; k > n - (stacks * (2 * subDiv)); k--)
            botIndex.push(k);
        botIndex.push(n);
        botIndex.push(n - 1);
        */

        let botIndex = [];
        let n = stacks * (2 * subDiv);
        botIndex.push(n);
        for (let k = n + 1; k < (n + (2 * subDiv)); k++)
            botIndex.push(k);
        botIndex.push(n);
        botIndex.push(n + 1);


        this.botIdxBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.botIdxBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(botIndex), gl.STATIC_DRAW);

        //Generate index for cylinder vertices
        let vertIndexInner = [];
        //Inner walls (evens)

        if (stacks > 1) {
            for (let k = 0; k < (2 * (stacks * subDiv)); k++) {
                if (k % (2 * subDiv) == 0 && k != 0) {
                    vertIndexInner.push(k - (2 * subDiv));
                    vertIndexInner.push(k);

                    vertIndexInner.push(k);
                    vertIndexInner.push(k + (2 * subDiv));

                } else if (k % 2 == 0) {
                    vertIndexInner.push(k);
                    vertIndexInner.push(k + (2 * subDiv));
                }

            }
            vertIndexInner.push((stacks * subDiv));
            vertIndexInner.push((stacks * (stacks * subDiv)));

        } else {
            for (let k = 0; k < (2 * subDiv); k++) {
                if (k % 2 == 0) {
                    vertIndexInner.push(k);
                    vertIndexInner.push(k + (2 * subDiv));
                }
            }

            vertIndexInner.push(0);
            vertIndexInner.push(2 * subDiv);
        }

        this.vertIdxBuffInner = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertIdxBuffInner);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(vertIndexInner), gl.STATIC_DRAW);

        //Outer walls (odds)
        let vertIndexOuter = [];

        if (stacks > 1) {
            for (let k = 0; k < (2 * (stacks * subDiv)) + 1; k++) {
                if (k % (2 * subDiv) == 0 && k != 0) {
                    vertIndexOuter.push(k - ((2 * subDiv) - 1));
                    vertIndexOuter.push(k + 1);

                } else if (k % 2 != 0) {
                    vertIndexOuter.push(k);
                    vertIndexOuter.push(k + (2 * subDiv));
                }
            }
        } else {
            for (let k = 0; k < (2 * (stacks * subDiv)) + 1; k++) {
               if (k % 2 != 0) {
                    vertIndexOuter.push(k);
                    vertIndexOuter.push(k + (2 * subDiv));
               }
            }

            vertIndexOuter.push(1);
            vertIndexOuter.push((2 * subDiv) + 1);
        }


        this.vertIdxBuffOuter = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertIdxBuffOuter);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Uint8Array.from(vertIndexOuter), gl.STATIC_DRAW);

        console.log(topIndex);
        console.log(botIndex);
        console.log(vertIndexInner);
        console.log(vertIndexOuter);


        /* Put the indices as an array of objects. Each object has three attributes:
         primitive, buffer, and numPoints */
        this.indices = [{"primitive": gl.TRIANGLE_STRIP, "buffer": this.topIdxBuff, "numPoints": topIndex.length},
            {"primitive": gl.TRIANGLE_STRIP, "buffer": this.botIdxBuff, "numPoints": botIndex.length},
            {"primitive": gl.TRIANGLE_STRIP, "buffer": this.vertIdxBuffInner, "numPoints": vertIndexInner.length},
            {"primitive": gl.TRIANGLE_STRIP, "buffer": this.vertIdxBuffOuter, "numPoints": vertIndexOuter.length}];
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