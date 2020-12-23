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
layout(location = 0) out vec4 outputColor;
layout(location = 1) out vec4 changingImg;
layout(location = 2) out vec4 trail;

in vec2 v_texCoord;

uniform sampler2D u_image;
uniform sampler2D u_trails;
uniform sampler2D u_timeImage;
uniform float u_time;


void main() {

    vec2 nc = gl_FragCoord.xy/vec2(432, 768);

    vec2 lightCoords = gl_FragCoord.xy/vec2(432, 768);
    vec4 lightArea = vec4(0.0, 0.0, 0.0, 1.0);


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
    
    vec4 ss = vec4(0.0, 0.0, 0.0, 0.0);

    vec4 img = texture(u_image, nc);
    vec4 lastImage = texture(u_timeImage, nc);
    vec4 trails = texture(u_trails, nc);

    lightCoords = lightCoords - vec2(0.48, 0.17);
    lightCoords = rotMatrix * lightCoords;
    lightCoords = lightCoords + vec2(0.48, 0.17);

    lightArea = texture(u_image, lightCoords);

    if (lightCoords.x < 0.46 || lightCoords.x > 0.5 || lightCoords.y < 0.17) {
        //Allt fyrir utan ljósið
        lightArea = vec4(0.0, 0.0, 0.0, 0.0);
        
        if ((img + lightArea) != lastImage) {
            //ss = vec4(0.01, 0.05, 0.1, 0.0);
        }

        ss = ss - 0.009;

    } else {
        //Bara ljósið
        //img = vec4(0.0, 0.0, 0.0, 0.0);
        ss = vec4(1.0, 0.3, 0.5, 1.0); 
    }

    lastImage = vec4(0.0);
    lastImage = lastImage + ss;

    outputColor = img + trails + lightArea;  //mix(timeImage, img, 0.095);//img + lightArea;//img + lightArea + ss;//img * trails; // timeImage;

    changingImg = lastImage;

    trail = trails + ss;

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
    wrap: gl.CLAMP_TO_EDGE,
    width: 432,
    height: 768
})

// 0: Constant img, 1: timeImage, 2: only trails
let fb1 = twgl.createFramebufferInfo(gl, [{attach: gl.COLOR_ATTACHMENT0}, {attach: gl.COLOR_ATTACHMENT1}, {attach: gl.COLOR_ATTACHMENT2}])
console.log("Readyness of fb: " + gl.checkFramebufferStatus(gl.FRAMEBUFFER))
let fb2 = twgl.createFramebufferInfo(gl, [{attach: gl.COLOR_ATTACHMENT0}, {attach: gl.COLOR_ATTACHMENT1}, {attach: gl.COLOR_ATTACHMENT2}])
console.log("Readyness of fb: " + gl.checkFramebufferStatus(gl.FRAMEBUFFER))
twgl.bindFramebufferInfo(gl, null);
//let pfb1 = twgl.createFramebufferInfo(gl, [{attach: gl.COLOR_ATTACHMENT1}])
//let pfb2 = twgl.createFramebufferInfo(gl, [{attach: gl.COLOR_ATTACHMENT1}])

console.log(fb1)
console.log(fb2)

console.log(imgTex)

const uniforms = {
    u_image: imgTex,
}

function firstDraw() {


    twgl.setBuffersAndAttributes(gl, glProgram, buffers)

    gl.useProgram(glProgram.program)

    gl.viewport(0, 0, canvas.width, canvas.height)

    twgl.setUniforms(glProgram, uniforms)

    twgl.bindFramebufferInfo(gl, fb1)
    gl.drawBuffers([gl.NONE, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2])
    twgl.drawBufferInfo(gl, buffers)

    //uniforms.u_image = fb1.attachments[0]
    
    function draw(time) {

        let timeInSeconds = time * 0.001
        //console.log(timeInSeconds)

        gl.useProgram(glProgram.program)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        uniforms.u_time = timeInSeconds
        uniforms.u_trails = fb1.attachments[2]
        uniforms.u_timeImage = fb1.attachments[1]

        //uniforms.u_image = fb1.attachments[0]
        
        twgl.setUniforms(glProgram, uniforms)
        twgl.bindFramebufferInfo(gl, fb2)
        gl.drawBuffers([gl.NONE, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2])
        twgl.drawBufferInfo(gl, buffers)

        twgl.bindFramebufferInfo(gl, null)
        twgl.drawBufferInfo(gl, buffers)

        let temp = fb1
        fb1 = fb2
        fb2 = temp


        requestAnimationFrame(draw)
    }

    requestAnimationFrame(draw)
}

setTimeout(firstDraw, 8)


