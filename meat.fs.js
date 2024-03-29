const fsSource = `
    #line 3
    precision highp float;

    varying highp vec2 vTextureCoord;
    varying mediump vec3 vNormal;
    varying mediump vec3 vTangent;
    varying mediump vec3 toLightVector;
    varying mediump vec3 toCameraVector;

    uniform sampler2D aoTexture;
    uniform sampler2D norTexture;
    uniform sampler2D hatTexture;
    uniform sampler2D fabricTexture;
    uniform bool uEyes;
    uniform bool uHat;

    mediump vec3 blendSoftLight(vec3 base, vec3 blend) {
        return mix(
            sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend), 
            2.0 * base * blend + base * base * (1.0 - 2.0 * blend), 
            step(base, vec3(0.5))
        );
    }
    
    mediump float fresnel_(vec3 normal, vec3 lightDir, float exponent) {
        return pow(max(dot(normal, lightDir), 0.0), exponent);
    }

    void main(void) {
        mediump vec3 color = vec3(0.0);
        mediump vec3 normal = normalize(vNormal);
        
        mediump vec3 unitNormal = normalize(2.0 * texture2D(norTexture, vTextureCoord).rgb - 1.0);
        
        mediump vec3 totalDiffuse;
        mediump vec3 totalSpecular;

        if(uEyes) {
            totalDiffuse = vec3(0.0);
            totalSpecular = vec3(pow(dot(normal, normalize(vec3(0.1, 0.15, -1))), 200.0))*2.0;
        } else if (uHat) {
            mediump float fresnel = fresnel_(normal, vec3(0, 0, 1), 2.0);
            color = blendSoftLight(texture2D(hatTexture, vTextureCoord).rgb, (texture2D(fabricTexture, vTextureCoord*2.0).rgb-0.6)*0.4+0.6);
            color = mix(color, color*0.7, fresnel);
            
            totalDiffuse = vec3(fresnel_(normal, vec3(0, 0, 1), 0.5));
            totalSpecular = vec3(0.0);
            
        } else {
            mediump vec3 baseColor1 = vec3(1.0, 0.597202, 0.401978);
            mediump vec3 baseColor2 = vec3(0.461568, 0.086268, 0.056358);
            mediump float fresnel = fresnel_(normal, vec3(0, 0, 1), 2.3);
            mediump float ao = texture2D(aoTexture, vTextureCoord).r;

            baseColor1 = blendSoftLight(baseColor1, vec3(ao));
            color = mix(baseColor2, baseColor1, fresnel);
            
            mediump vec3 unitVectorToCamera = normalize(toCameraVector);
            mediump vec3 unitLightVector = normalize(toLightVector);
            
            mediump vec3 reflectedLightDirection = reflect(-unitLightVector, unitNormal);
            
            mediump float nDotl = max(dot(unitNormal, unitLightVector)*0.5+0.5, 0.0);
            mediump float specularFactor = max(dot(reflectedLightDirection, unitVectorToCamera), 0.0);
            
            mediump float dampedFactor = pow(specularFactor, 200.0);
            totalDiffuse = vec3(nDotl)+0.5;
            totalSpecular = (dampedFactor * 1.0 * vec3(1.0));
        }
        
        
        gl_FragColor = vec4(totalDiffuse,1.0) * vec4(color, 1.0) + vec4(totalSpecular,1.0);
    }
`;










