import * as twgl from "./twgl-full.module.js"//"/twgl.js-4.16.0/dist/4.x/twgl-full.module.js"

const vertexSource = `#version 300 es

in vec2 a_position;

in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}

`

const fragmentSource = `#version 300 es
precision mediump float;
out vec4 outputColor;

in vec2 v_texCoord;

uniform sampler2D u_image;
uniform float u_time;

void rr() {

    //float gray = dot(img.rgb, vec3(0.299, 0.587, 0.114));
    //vec4 grayImg = vec4(vec3(gray), 1.0);

    //float totalColor = img.r + img.g + img.b;
    //vec2 imgCoords = vec2(0.0, 0.0);

    //imgCoords = rotMatrix * imgCoords;
    //vec4 imgTex = texture(u_image, imgCoords);

}

void main() {

    vec2 nc = gl_FragCoord.xy/vec2(432, 768);

    vec2 lightCoords = gl_FragCoord.xy/vec2(432, 768);
    vec4 lightArea = vec4(0.0, 0.0, 0.0, 1.0);

    float initTime = 1.0;

    vec4 img = vec4(0.0, 0.0, 0.0, 1.0);

    float angle = sin(u_time) * 0.6;
    float sinOfAngle = sin(angle);
    float cosOfAngle = cos(angle);

    mat2 rotMatrix = mat2(
        cosOfAngle, sinOfAngle,
        -sinOfAngle, cosOfAngle
    );

    mat2 translateMatrix = mat2(
        1.0, 0.0,
        0.0, 1.0 
    );

    mat2 inverseTM = inverse(translateMatrix);

    img = texture(u_image, nc);

    lightCoords = lightCoords - vec2(0.48, 0.17);
    lightCoords = rotMatrix * lightCoords;
    lightCoords = lightCoords + vec2(0.48, 0.17);

    lightArea = texture(u_image, lightCoords);

    if (lightCoords.x < 0.46 || lightCoords.x > 0.5 || lightCoords.y < 0.17) {
        //Allt fyrir utan ljósið
    	lightArea = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
        //Bara ljósið
        img = vec4(0.0, 0.0, 0.0, 0.0);
        initTime = 0.0;
    }
    
    if (initTime != 1.0) {
        initTime = initTime - fract(u_time);
    }

    //lightArea = lightArea * vec4(1.0, 0.0, 0.0, 1.0);

    //if (lightCoords.x < 0.2) {
        //img = vec4(1.0, 0.0, 0.0, 1.0);
    //}

    outputColor = lightArea + (img);
}
`
const canvas = document.getElementById("c")

canvas.width = 432
canvas.height = 768

const gl = canvas.getContext("webgl2")
console.log(gl)
twgl.isWebGL2(gl) ? console.log("Webgl2 True") : console.error("Not Webgl2")

const glProgram = twgl.createProgramInfo(gl, [vertexSource, fragmentSource])

const arrays = {
    a_position: { numComponents: 2, data: [
        -1, -1,
        -1, 1,
        1, -1,

        1, -1,
        1, 1,
        -1, 1
    ] },

    a_texCoord: { numComponents: 2, data: [
        0, 0,
        0, 1,
        1, 0,

        1, 0,
        1, 1,
        0, 1
    ]}
    
}

const buffers = twgl.createBufferInfoFromArrays(gl, arrays);
console.log(buffers)

const imgTex = twgl.createTexture(gl, {
    src: "Tumi-Peace.png",
    flipY: true,
    wrap: gl.CLAMP_TO_EDGE
})

console.log(imgTex)

const uniforms = {
    u_image: imgTex,
}

twgl.setBuffersAndAttributes(gl, glProgram, buffers)

gl.useProgram(glProgram.program)
gl.viewport(0, 0, canvas.width, canvas.height)
twgl.setUniforms(glProgram, uniforms)

//setTimeout(ss, 100)

//function ss() {
    //twgl.drawBufferInfo(gl, buffers)
//}

function draw(time) {

    let timeInSeconds = time * 0.001
    console.log(timeInSeconds)

    gl.useProgram(glProgram.program)
    gl.viewport(0, 0, canvas.width, canvas.height)
    uniforms.u_time = timeInSeconds
    
    twgl.setUniforms(glProgram, uniforms)
    twgl.drawBufferInfo(gl, buffers)
    requestAnimationFrame(draw)
}

requestAnimationFrame(draw)