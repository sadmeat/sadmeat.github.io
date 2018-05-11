const fsSource = `
    #line 3
    varying highp vec2 vTextureCoord;
    varying mediump vec3 vNormal;
    varying mediump vec3 vTangent;
    varying mediump vec3 toLightVector;
    varying mediump vec3 toCameraVector;

    uniform sampler2D aoTexture;
    uniform sampler2D norTexture;
    uniform bool uEyes;

    mediump vec3 blendSoftLight(vec3 base, vec3 blend) {
        return mix(
            sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend), 
            2.0 * base * blend + base * base * (1.0 - 2.0 * blend), 
            step(base, vec3(0.5))
        );
    }

    void main(void) {
        mediump vec3 color = vec3(0.0);
        mediump vec3 normal = normalize(vNormal);
        
        mediump vec3 unitNormal = normalize(mix(
            normalize(2.0 * texture2D(norTexture, vTextureCoord).rgb - 1.0),
            vec3(0, 0, 1), 
            uEyes ? 1.0 : 0.0
        ));
        
        mediump vec3 totalDiffuse;
        mediump vec3 totalSpecular;

        if(!uEyes) {
            mediump vec3 baseColor1 = vec3(1.0, 0.597202, 0.401978);
            mediump vec3 baseColor2 = vec3(0.461568, 0.086268, 0.056358);
            mediump float fresnel = pow(max(dot(normal, vec3(0, 0, -1)), 0.0), 1.83);
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
            
        } else {
            totalDiffuse = vec3(0.0);
            totalSpecular = vec3(pow(dot(normal, normalize(vec3(0.1, 0.15, -1))), 200.0))*2.0;
        }
        
        
        gl_FragColor = vec4(totalDiffuse,1.0) * vec4(color, 1.0) + vec4(totalSpecular,1.0);
        

    }
`;










