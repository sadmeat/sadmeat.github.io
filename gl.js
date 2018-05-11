var cubeRotation = 0.0;
var mic;
var vol = 0;

window.onload = () => main();


function main() {
  mic = new p5.AudioIn();
  mic.start();
  
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl', {antialias: true});
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      normal: gl.getAttribLocation(shaderProgram, 'aNormal'),
      tangent: gl.getAttribLocation(shaderProgram, 'aTangent'),
      boneIndex: gl.getAttribLocation(shaderProgram, 'aBoneIndex'),
      boneWeight: gl.getAttribLocation(shaderProgram, 'aBoneWeight'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      bones: gl.getUniformLocation(shaderProgram, 'uBones'),
      eyes: gl.getUniformLocation(shaderProgram, 'uEyes'),
      aoTexture: gl.getUniformLocation(shaderProgram, 'aoTexture'),
      norTexture: gl.getUniformLocation(shaderProgram, 'norTexture'),
    },
  };


  const buffers = initBuffers(gl);
  const texture1 = loadTexture(gl, 'tex_ao.png');
  const texture2 = loadTexture(gl, 'tex_nor.png');

  console.log(programInfo, buffers, gl)
  
  
  var then = 0;
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, texture1, texture2, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}


function initBuffers(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal), gl.STATIC_DRAW);

  const tangentBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangent), gl.STATIC_DRAW);

  const boneIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, boneIndexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(boneIndex), gl.STATIC_DRAW);

  const boneWeightBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, boneWeightBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boneWeight), gl.STATIC_DRAW);

  const indexBuffer1 = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer1);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objIndex1), gl.STATIC_DRAW);
  
  const indexBuffer2 = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer2);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objIndex2), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    normal: normalBuffer,
    tangent: tangentBuffer,
    boneIndex: boneIndexBuffer,
    boneWeight: boneWeightBuffer,
    indices1: indexBuffer1,
    indices2: indexBuffer2,
  };
}

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255]));

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  image.src = url;

  return texture;
}

function drawScene(gl, programInfo, buffers, texture_ao, texture_nor, deltaTime) {
  gl.clearColor(0.0, 1.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things


  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  vol = vol*0.7 + 0.3*mic.getLevel();
  var vol2 = Math.pow(Math.max(vol-0.04, 0), 0.4);

  const fieldOfView = 70 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, -4.0, -4.5]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              -Math.PI/2+0.01*Math.sin(cubeRotation*1.5),// amount to rotate in radians
              [1, 0, 0]);       // axis to rotate around (X)
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              0.125+0*0.06*Math.sin(cubeRotation*0.6),     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)

  var m = mat4.create();
  var m2 = mat4.create();
  var m3 = mat4.create();
  
  mat4.translate(m2,  m2, [0, 0.5*vol2, -0.5*vol2])   
  mat4.translate(m3,  m3, [0, -0.5*vol2, -0.5*vol2])   
  //mat4.rotate(m2,  m2,  Math.sin(cubeRotation), [1, 0, 0])
  //mat4.translate(m2,  m2, [0, -0.957687, 3.7845469])
  
  
  //           Neck1 Neck2 Neck3 Head TopLip BottomLip EyeLid_R EyeLid_L
  var bones = [...m, ...m, ...m, ...m, ...m2, ...m3, ...m, ...m]
  

  {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.normal);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.tangent);
    gl.vertexAttribPointer(programInfo.attribLocations.tangent, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.tangent);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.boneIndex);
    gl.vertexAttribPointer(programInfo.attribLocations.boneIndex, 4, gl.UNSIGNED_BYTE, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.boneIndex);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.boneWeight);
    gl.vertexAttribPointer(programInfo.attribLocations.boneWeight, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.boneWeight);
  }

  gl.useProgram(programInfo.program);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture_ao);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture_nor);
  
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  gl.uniform1i(programInfo.uniformLocations.aoTexture, 0);
  gl.uniform1i(programInfo.uniformLocations.norTexture, 1);
  
  gl.uniformMatrix4fv(programInfo.uniformLocations.bones, false, bones);

  {
    gl.uniform1i(programInfo.uniformLocations.eyes, false);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices1);
    gl.drawElements(gl.TRIANGLES, objIndex1.length, gl.UNSIGNED_SHORT, 0);
    
    gl.uniform1i(programInfo.uniformLocations.eyes, true);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices2);
    gl.drawElements(gl.TRIANGLES, objIndex2.length, gl.UNSIGNED_SHORT, 0);
  }


  cubeRotation += deltaTime;
}

function initShaderProgram(gl, vsSource, fsSource) {
  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
  
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  
  return shaderProgram;
}


