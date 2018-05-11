var cubeRotation = 0.0;
var mic;
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;

window.onload = () => main();

function main() {
  if(isExe())
      document.querySelector('#download').remove();
  
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl', {antialias: true});
  
  canvas.onmousemove = mouseHandle;
  canvas.onmousedown = mouseHandle;
  canvas.onmouseup = mouseHandle;
  
  window.addEventListener('resize', resizeCanvas, false);
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight-50;
  }
  resizeCanvas();
  
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


let lid=0;
let headX = 0;
let headY = 0;

function calcBoneMatrix() {
  if(mousePressed) {
     var a = 0.5;
     headX = headX * a + (1-a) * mouseX; 
     headY = headY * a + (1-a) * mouseY; 
  }
  
  var vol = (mic?mic.getLevel(0.7):0);
  var sens = 1-document.getElementById("sensitivity").value;
  var vol2 = Math.pow(Math.max(vol-0.05, 0), 1.5*sens);
  
  var t = 0.01*Math.sin(cubeRotation*1.5);
  
  var mNeck1 = mat4.create();
  var mNeck2 = mat4.create();
  var mNeck3 = mat4.create();
  var mHead = mat4.create();
  var mTopLip = mat4.create();
  var mBottomLip = mat4.create();
  var mEyeLid_R = mat4.create();
  var mEyeLid_L = mat4.create();
  
  mat4.set(mNeck3, ...bonesInv[2]);
  mat4.rotate(mNeck3, mNeck3, 0.5*(headX), [0, 0, 1])
  mat4.mul(mNeck3, bonesMat[2], mNeck3);
  
  mat4.invert(mHead, ...bonesLocal[3]);
  mat4.rotate(mHead, mHead, 0.5*(headY), [1, 0, 0])
  mat4.rotate(mHead, mHead, 0.5*(headX), [0, 0, 1])
  mat4.mul(mHead,  mNeck3, mHead)
  
  mat4.invert(mTopLip, ...bonesLocal[4]);
  //mat4.rotate(mTopLip, mTopLip, 0.1*vol2+t, [-1, 0, 0])
  mat4.translate(mTopLip, mTopLip, [0, 0.1*vol2, 0.5*vol2+t])
  mat4.mul(mTopLip, mHead, mTopLip);
  
  mat4.invert(mBottomLip, ...bonesLocal[5]);
  //mat4.rotate(mBottomLip, mBottomLip, 1.1*vol2+t, [0, 0, 1])
  mat4.translate(mBottomLip, mBottomLip, [0, 0.1*vol2, -0.5*vol2-t])
  mat4.mul(mBottomLip, mHead, mBottomLip);
  
  
  mat4.invert(mEyeLid_R, ...bonesLocal[6]);
  mat4.mul(mEyeLid_R, mHead, mEyeLid_R);
  
  mat4.invert(mEyeLid_L, ...bonesLocal[7]);
  //lid = 0.9*lid+ 0.1*(mousePressed?1:0);
  mat4.translate(mEyeLid_L, mEyeLid_L, [0, 0, 0.2*lid])
  mat4.mul(mEyeLid_L, mHead, mEyeLid_L);
  
  return [...mNeck1, ...mNeck2, ...mNeck3, ...mHead, 
          ...mTopLip, ...mBottomLip, ...mEyeLid_R, ...mEyeLid_L]
    
}

function drawScene(gl, programInfo, buffers, texture_ao, texture_nor, deltaTime) {
  gl.clearColor(0.0, 1.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things


  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


  const fieldOfView = 50 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, -4.0, -6]); 
  //mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, -4.0, -20.5]); 
  mat4.rotate(modelViewMatrix, modelViewMatrix, -Math.PI/2+0.01*Math.sin(cubeRotation*1.5), [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, +0.125+0.06*Math.sin(cubeRotation*0.6), [0, 0, 1]);
  
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
  
  gl.uniformMatrix4fv(programInfo.uniformLocations.bones, false, calcBoneMatrix());

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

function isExe() {
    return new URL(window.location.href).searchParams.get("exe")!==null;
}

function mouseHandle(e){
    mouseX = e.clientX/window.innerWidth*2 - 1;
    mouseY = e.clientY/(window.innerHeight-50)*2 - 1;
    mousePressed = e.buttons !==0;
}

function toggleMic() {
    if(mic === undefined) {
        mic = new Microphone();
        mic.init();
        return true;
    } else {
        mic = undefined;
        return false;
    }
    
}