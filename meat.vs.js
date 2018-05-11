const vsSource = `
    #line 3
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec3 aNormal;
    attribute vec3 aTangent;
    attribute vec4 aBoneIndex;
    attribute vec4 aBoneWeight;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uBones[8];

    varying highp vec2 vTextureCoord;
    varying mediump vec3 vNormal;
    varying mediump vec3 vTangent;
    varying mediump vec3 toLightVector;
    varying mediump vec3 toCameraVector;

    void main(void) {
        //vBoneIndex = aBoneIndex;
        //vBoneWeight = aBoneWeight;
        
        mat4 skinning = mat4(0.0);
		
		skinning += aBoneWeight.x * uBones[int(aBoneIndex.x)];
		skinning += aBoneWeight.y * uBones[int(aBoneIndex.y)];
		skinning += aBoneWeight.z * uBones[int(aBoneIndex.z)];
		skinning += aBoneWeight.w * uBones[int(aBoneIndex.w)];
        
        
        vec4 positionRelativeToCam = skinning * uModelViewMatrix * vec4(aVertexPosition, 1.0);
        gl_Position = uProjectionMatrix * positionRelativeToCam;
        
        vTextureCoord.x = aTextureCoord.x;
        vTextureCoord.y = 1.0-aTextureCoord.y;
        
        vec3 norm = normalize((uModelViewMatrix * vec4(aNormal,0.0)).xyz);
        vec3 tang = normalize((uModelViewMatrix * vec4(aTangent, 0.0)).xyz);
        vec3 bitang = normalize(cross(norm, tang));
        
        mat3 toTangentSpace = mat3(
            tang.x, bitang.x, norm.x,
            tang.y, bitang.y, norm.y,
            tang.z, bitang.z, norm.z
        );
  
        
        //toLightVector = toTangentSpace * (lightPositionEyeSpace - positionRelativeToCam.xyz);
        toLightVector = toTangentSpace * vec3(-1, 0.5, 1);
        toCameraVector = toTangentSpace * (-positionRelativeToCam.xyz);
        
        vNormal = (uProjectionMatrix * uModelViewMatrix * vec4(aNormal, 0)).xyz;
        vTangent = (uBones[0]*vec4(aTangent,1.0)).xyz;
    }
`;









