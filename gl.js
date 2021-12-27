let FPS = 30;

let time = 0.0;
let mic;
let mouseX = 0;
let mouseY = 0;
let mousePressed = false;

function glmain() {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl', { antialias: true });

  canvas.onmousemove = mouseHandle;
  canvas.onmousedown = mouseHandle;
  canvas.onmouseup = mouseHandle;

  window.addEventListener('resize', resizeCanvas, false);
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
      hat: gl.getUniformLocation(shaderProgram, 'uHat'),
      aoTexture: gl.getUniformLocation(shaderProgram, 'aoTexture'),
      norTexture: gl.getUniformLocation(shaderProgram, 'norTexture'),
      hatTexture: gl.getUniformLocation(shaderProgram, 'hatTexture'),
      fabricTexture: gl.getUniformLocation(shaderProgram, 'fabricTexture'),
    },
  };


  const buffers = initBuffers(gl);
  const texture1 = loadTexture(gl, 'tex_ao.png');
  const texture2 = loadTexture(gl, 'tex_nor.png');
  const texture3 = loadTexture(gl, 'tex_hat.png');
  const texture4 = loadTexture(gl, 'tex_fabric.png');

  console.log(programInfo, buffers, gl)


  let then = 0;
  function render(now) {
    const deltaTime = (now - then) / 1000;
    if (deltaTime > 1 / FPS) {
      then = now;
      drawScene(gl, programInfo, buffers, [texture1, texture2, texture3, texture4], deltaTime);
      // console.log("noDrop");
    } else {
      // console.log("Drop");
    }


    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}


function initBuffers(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v.p), gl.STATIC_DRAW);

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v.uv), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v.n), gl.STATIC_DRAW);

  const tangentBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v.t), gl.STATIC_DRAW);

  const boneIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, boneIndexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(v.bi), gl.STATIC_DRAW);

  const boneWeightBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, boneWeightBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v.bw), gl.STATIC_DRAW);

  const indexBuffer1 = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer1);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(v.t1), gl.STATIC_DRAW);

  const indexBuffer2 = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer2);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(v.t2), gl.STATIC_DRAW);

  const indexBuffer3 = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer3);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(v.t3), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    normal: normalBuffer,
    tangent: tangentBuffer,
    boneIndex: boneIndexBuffer,
    boneWeight: boneWeightBuffer,
    indices1: indexBuffer1,
    indices2: indexBuffer2,
    indices3: indexBuffer3,
  };
}

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255]));

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  image.src = url;

  return texture;
}


let lid = 0;
let headX = 0;
let headY = 0;

const _Neck1 = mat4.create();
const mNeck1 = mat4.create();
const _Neck2 = mat4.create();
const mNeck2 = mat4.create();
const _Neck3 = mat4.create();
const mNeck3 = mat4.create();
const _Head = mat4.create();
const mHead = mat4.create();
const _TopLip = mat4.create();
const mTopLip = mat4.create();
const _BottomLip = mat4.create();
const mBottomLip = mat4.create();
const _EyeLid_R = mat4.create();
const mEyeLid_R = mat4.create();
const _EyeLid_L = mat4.create();
const mEyeLid_L = mat4.create();

let activeBlinkCheckbox;
let sensitivitySlider;
let boostInputSlider;
let boostOutputSlider;
let sensitivityLabel;
let boostInputLabel;
let boostOutputLabel;
let fpsSlider;
let fpsLabel;

function precalcBoneMatrix() {
  activeBlinkCheckbox = document.querySelector("#activateBlink");
  sensitivitySlider = document.getElementById("sensitivity");
  boostInputSlider = document.getElementById("boostInput");
  boostOutputSlider = document.getElementById("boostOutput");
  sensitivityLabel = document.getElementById("sensitivityLabel");
  boostInputLabel = document.getElementById("boostInputLabel");
  boostOutputLabel = document.getElementById("boostOutputLabel");
  sensitivitySlider.value = parseFloat(localStorage.getItem("sensitivity") || 0.5);
  boostInputSlider.value = parseFloat(localStorage.getItem("boostInput") || 2.0);
  boostOutputSlider.value = parseFloat(localStorage.getItem("boostOutput") || 2.0);
  sensitivityLabel.innerText = parseFloat(sensitivitySlider.value).toFixed(2);
  boostInputLabel.innerText = parseFloat(boostInputSlider.value).toFixed(2);
  boostOutputLabel.innerText = parseFloat(boostOutputSlider.value).toFixed(2);
  sensitivitySlider.onchange = () => localStorage.setItem("sensitivity", sensitivitySlider.value);
  sensitivitySlider.oninput = () => sensitivityLabel.innerText = parseFloat(sensitivitySlider.value).toFixed(2);
  boostInputSlider.onchange = () => localStorage.setItem("boostInput", boostInputSlider.value);
  boostInputSlider.oninput = () => boostInputLabel.innerText = parseFloat(boostInputSlider.value).toFixed(2);
  boostOutputSlider.onchange = () => localStorage.setItem("boostOutput", boostOutputSlider.value);
  boostOutputSlider.oninput = () => boostOutputLabel.innerText = parseFloat(boostOutputSlider.value).toFixed(2);
  
  fpsSlider = document.getElementById("framerate");
  fpsLabel = document.getElementById("framerateLabel");
  fpsSlider.value = parseFloat(localStorage.getItem("framerate") || 30);
  fpsLabel.innerText = fpsSlider.value;
  FPS = parseFloat(fpsSlider.value);
  fpsSlider.onchange = () => {
    localStorage.setItem("framerate", fpsSlider.value);
  }
  fpsSlider.oninput = () => {
    fpsLabel.innerText = fpsSlider.value;
    FPS = parseFloat(fpsSlider.value);
  }
  mat4.set(_Neck3, ...bonesInv[2]);
  mat4.invert(_Head, ...bonesLocal[3]);
  mat4.invert(_TopLip, ...bonesLocal[4]);
  mat4.invert(_BottomLip, ...bonesLocal[5]);
  mat4.invert(_EyeLid_R, ...bonesLocal[6]);
  mat4.invert(_EyeLid_L, ...bonesLocal[7]);
}


function calcBoneMatrix() {
  if (mousePressed) {
    let a = 0.5;
    headX = headX * a + (1 - a) * mouseX * 4;
    headY = headY * a + (1 - a) * mouseY * 1;
  }

  let sensitivity = 1 - Math.sqrt(sensitivitySlider.value);
  let boostIn = boostInputSlider.value;
  let boostOut = boostOutputSlider.value;

  let level = mic ? mic.getLevel(0.7) : 0;
  let levelAdj = (level - 0.05) / 0.95;
  let input = Math.max(levelAdj, 0);
  let inputBoosted = Math.min(boostIn * input, 1);
  let output = Math.pow(inputBoosted, 4 * sensitivity) / 0.95;
  let outputBoosted = boostOut * output;
  let volume = outputBoosted;

  // console.log(
  //   input.toFixed(3),
  //   inputBoosted.toFixed(3),
  //   output.toFixed(3),
  //   outputBoosted.toFixed(3),
  // );

  let t = 0.01 * Math.sin(time * 1.5);

  // mat4.copy(mNeck1, _Neck1);
  // mat4.copy(mNeck2, _Neck2);

  mat4.copy(mNeck3, _Neck3);
  mat4.rotateZ(mNeck3, mNeck3, 0.5 * (headX))
  mat4.mul(mNeck3, bonesMat[2], mNeck3);

  mat4.copy(mHead, _Head);
  mat4.rotateX(mHead, mHead, 0.5 * (headY))
  mat4.rotateZ(mHead, mHead, 0.5 * (headX))
  mat4.mul(mHead, mNeck3, mHead)

  mat4.copy(mTopLip, _TopLip);
  //mat4.rotate(mTopLip, mTopLip, 0.1*volume+t, [-1, 0, 0])
  mat4.translate(mTopLip, mTopLip, [0, 0.1 * volume, 0.5 * volume + t])
  mat4.mul(mTopLip, mHead, mTopLip);

  mat4.copy(mBottomLip, _BottomLip);
  //mat4.rotate(mBottomLip, mBottomLip, 1.1*volume+t, [0, 0, 1])
  mat4.translate(mBottomLip, mBottomLip, [0, 0.1 * volume, -0.5 * volume - t])
  mat4.mul(mBottomLip, mHead, mBottomLip);

  let x = (time % 7 < 0.25 && activeBlinkCheckbox.checked) ? Math.sin(time % 1 * 4 * Math.PI) : 0;

  mat4.copy(mEyeLid_R, _EyeLid_R);
  mat4.translate(mEyeLid_R, mEyeLid_R, [0.1 * x * x, 0, -0.05 * x * x])
  mat4.mul(mEyeLid_R, mHead, mEyeLid_R);

  mat4.copy(mEyeLid_L, _EyeLid_L);
  mat4.translate(mEyeLid_L, mEyeLid_L, [-0.1 * x * x, 0, -0.05 * x * x])
  mat4.mul(mEyeLid_L, mHead, mEyeLid_L);

  return [...mNeck1, ...mNeck2, ...mNeck3, ...mHead,
  ...mTopLip, ...mBottomLip, ...mEyeLid_R, ...mEyeLid_L];
}


const projectionMatrix = mat4.create();
const modelViewMatrix = mat4.create();
let sceneOnce = true;

function drawScene(gl, programInfo, buffers, texture, deltaTime) {
  if (sceneOnce) {
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const fieldOfView = 50 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  mat4.fromTranslation(modelViewMatrix, [-0.0, -4.0, -6]);
  //mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, -4.0, -20.5]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, -Math.PI / 2 + 0.01 * Math.sin(time * 1.5), [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, +0.125 + 0.06 * Math.sin(time * 0.6), [0, 0, 1]);

  if (sceneOnce) {
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

  if (sceneOnce)
    gl.useProgram(programInfo.program);

  if (sceneOnce) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture[2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture[3]);
  }

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  gl.uniform1i(programInfo.uniformLocations.aoTexture, 0);
  gl.uniform1i(programInfo.uniformLocations.norTexture, 1);
  gl.uniform1i(programInfo.uniformLocations.hatTexture, 2);
  gl.uniform1i(programInfo.uniformLocations.fabricTexture, 3);

  if (sceneOnce)
    precalcBoneMatrix();

  gl.uniformMatrix4fv(programInfo.uniformLocations.bones, false, calcBoneMatrix());

  {
    gl.uniform1i(programInfo.uniformLocations.eyes, false);
    gl.uniform1i(programInfo.uniformLocations.hat, true);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices3);

    if (document.querySelector("#activateHat").checked)
      gl.drawElements(gl.TRIANGLES, v.t3.length, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(programInfo.uniformLocations.hat, false);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices1);
    gl.drawElements(gl.TRIANGLES, v.t1.length, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(programInfo.uniformLocations.eyes, true);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices2);
    gl.drawElements(gl.TRIANGLES, v.t2.length, gl.UNSIGNED_SHORT, 0);
  }


  time += deltaTime;
  sceneOnce = false;
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


function mouseHandle(e) {
  mouseX = e.clientX / window.innerWidth * 2 - 1;
  mouseY = e.clientY / (window.innerHeight - 50) * 2 - 1;
  mousePressed = e.buttons !== 0;
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
