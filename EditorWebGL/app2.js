// Game Of Life Shaders
const vertexCode=`
precision mediump float;

attribute vec2 vertPosition;
    
varying vec3 fragColor;
    
void main(){
    gl_Position=vec4(vertPosition, 0.0, 1.0);
}
`;
const fragmentCode=`
precision mediump float;

uniform float iTime;
uniform int iFrame;
uniform vec2 iResolution;
uniform sampler2D world;
uniform vec4 iMouse;
uniform float density;
uniform int spawn;

varying vec3 fragColor;

vec3 cell(int x, int y){
    return texture2D(world, (gl_FragCoord.xy+vec2(float(x),float(y)))/iResolution).xyz;
}

bool cellType(int x, int y, vec3 type){
	vec2 res=gl_FragCoord.xy+vec2(float(x),float(y));
    return 0.0<=res.x&&res.x<iResolution.x&&0.0<=res.y&&res.y<iResolution.y&&(texture2D(world, res/iResolution).xyz==type);
}

bool empty(int x, int y){
    return cellType(x,y,vec3(0.0));
}

void main(){
	ivec2 px=ivec2(gl_FragCoord.xy);
	vec3 result=cell(0,0);

	// WORLD RULES
	if (empty(0,0)){
		if (cellType(0,1,vec3(1,1,0))) result=vec3(1,1,0);
		else if (cellType(-1,1,vec3(1,1,0))&&!empty(-1,0)) result=vec3(1,1,0);
		else if (cellType(1,1,vec3(1,1,0))&&!empty(1,0)&&!empty(2,0)) result=vec3(1,1,0);

		else if (cellType(0,1,vec3(0,0,1))) result=vec3(0,0,1);
		else if (cellType(-1,1,vec3(0,0,1))&&!empty(-1,0)) result=vec3(0,0,1);
		else if (cellType(1,1,vec3(0,0,1))&&!empty(1,0)&&!empty(2,0)) result=vec3(0,0,1);

		else if (cellType(-1,0,vec3(0,0,1))&&!empty(0,-1)&&!empty(-1,-1)&&!empty(-2,-1)) result=vec3(0,0,1);
		else if (cellType(1,0,vec3(0,0,1))&&!empty(0,-1)&&!empty(1,-1)&&!empty(2,-1)&&!empty(2,0)) result=vec3(0,0,1);
	} else {
		if (empty(-1,-1)||empty(0,-1)||empty(1,-1)) result=vec3(0);
	}
	//MOUSE DRAWING
    if (spawn!=0&&distance(iMouse.xy, gl_FragCoord.xy)<density){
        if (spawn==1) result=vec3(0,0,0);
        else if (spawn==2) result=vec3(1,1,0);
        else if (spawn==3) result=vec3(0,0,1);
        else if (spawn==4) result=vec3(0,1,0);
    }
	gl_FragColor=vec4(result,1);
}
`;
const vertices=[
    -1, 1,
    -1, -1,
    1, -1,
    
    -1, 1,
    1, 1,
    1, -1,
];
const frameBufferCount=2;

// Game Of Life JavaScript
const mouse=[0,0,0,0];
let spawn=0
let Density=10.0;

function initialize(gl, canvas){
	window.addEventListener("mousemove", function (e) {
		mouse[0]=e.clientX;
		mouse[1]=canvas.clientHeight-e.clientY;
		mouse[2]=mouse[0];
		mouse[3]=mouse[1];
	});
	window.addEventListener("keydown", function (e) {
		console.log(0<e.key&&e.key<58, e.key-48)
		if (0<=e.key&&e.key<10) spawn=parseInt(e.key);
	})
	window.addEventListener("wheel", function (e) {
		Density-=e.deltaY/25;
	});
}

function render(gl, program, fboArray, frame, uniforms){
    var now=performance.now();

        const inputTexture=fboArray[frame%2].tex;
        const outputFBO=fboArray[(frame+1)%2].fb;

        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFBO);
        gl.useProgram(program);

        gl.uniform4fv(uniforms.iMouse, mouse);
        gl.uniform1f(uniforms.density, Density);
        gl.uniform1i(uniforms.world, 0);
        gl.uniform1i(uniforms.iFrame, frame);
        gl.uniform1f(uniforms.iTime, now/1000.0);
        gl.uniform2f(uniforms.iResolution, gl.canvas.width, gl.canvas.height);
        gl.uniform1i(uniforms.spawn, spawn);

        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, fboArray[(frame+1)%2].tex);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Init Program
var Init=function(){
	var canvas=document.getElementById('wall-paper');
	var gl=canvas.getContext('webgl');
	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl=canvas.getContext('experimental-webgl');
	}
	if (!gl) {
		alert('Your browser does not support WebGL');
	}
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var program=createShaderProgram(gl, vertexCode, fragmentCode);
	var vertexBuffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	let byteSize=0;
	var attributes=vertexCode.split(/\r?\n/).reduce((attributes, line) => {
		if (line.startsWith("attribute")){
			var args=line.split(" ");
			switch (args[1]){
				case "vec2":{
					byteSize+=2*Float32Array.BYTES_PER_ELEMENT;
					break;
				}
				case "vec3": {
					byteSize+=3*Float32Array.BYTES_PER_ELEMENT;
					break;
				}
			}
			attributes.push({name: args[2].substring(0, args[2].length-1), type: args[1]});
		}
		return attributes;
	}, []);
    attributes.forEach(attribute => {
        let offset=0;
		var location=gl.getAttribLocation(program, attribute.name);
        switch (attribute.type){
            case "vec2": {
				gl.vertexAttribPointer(location, 2, gl.FLOAT, gl.FALSE, byteSize, offset);
                offset+=2;
            }
        }
		gl.enableVertexAttribArray(location);
    });
	canvas.width=window.innerWidth;
	canvas.height=window.innerHeight;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    initialize(gl, canvas);

    const uniforms=fragmentCode.split(/\r?\n/).reduce((uniforms, line) => {
		if (line.startsWith("uniform")){
			var name=line.split(" ")[2];
			name=name.substring(0, name.length-1);
			uniforms[name]=gl.getUniformLocation(program, name);
		}
		return uniforms;
	}, []);

    const FBO_ARRAY=Array.from({length: frameBufferCount}, (_, i) => createFramebuffer(gl));


	
	var frame=0;
	gl.activeTexture(gl.TEXTURE0)
	var loop=function () {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
        render(gl, program, FBO_ARRAY, frame++, uniforms);
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
}

function createShaderProgram(gl, vertexShaderText, fragmentShaderText){
	var vertexShader=gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader=gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	var program=gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}
	return program;
}

function createFramebuffer(gl) {
	const tex=gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	const fb=gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

	return {tex, fb};
}