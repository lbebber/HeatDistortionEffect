precision mediump float;

/* 
MESSY CODE AHEAD
(sorry, experimenting)
*/

uniform float u_time;
varying vec2 v_position;
uniform sampler2D u_image;
uniform sampler2D u_blur;
uniform sampler2D u_maps;
uniform sampler2D u_noise;
uniform int u_noiseSize;
uniform vec2 u_noiseR;
uniform vec2 u_noiseG;
uniform vec2 u_noiseB;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_dpi;

vec2 pos(){
  return vec2(0.0,0.0);
}

vec4 blend(vec4 bg,vec4 fg){
  vec3 bgm=bg.rgb*bg.a;
  vec3 fgm=fg.rgb*fg.a;
  float ia=1.0-fg.a;
  float a=(fg.a + bg.a * ia);
  vec3 rgb;
  if(a!=0.0){
    rgb=(fgm + bgm * ia) / a;
  }else{
    rgb=vec3(0.0,0.0,0.0);
  }
  return vec4(rgb,a);
}
vec2 pixel(){
  return vec2(1.0*u_dpi)/u_resolution;
}
float wave(float x,float freq, float speed){
  return sin(x*freq+((u_time*(3.1415/2.0))*speed));
}
vec2 turbulenceWaves(vec2 pos){
  float mask=texture2D(u_maps,pos).g;
  vec2 waves=vec2(
    wave(pos.x-pos.y*0.7,55.0,-0.48)+wave(pos.x,66.0,-0.33),
    wave(pos.y,50.0,0.21)+wave(pos.y,66.0,0.45)+wave(pos.y,45.0,0.25)
  );
  return waves*mask;
}
vec2 applyWaves(vec2 pos,vec2 waves){
  vec2 intensity=vec2(0.3,0.3)*pixel();
  vec2 v=intensity;

  return pos+waves*v;
}
vec2 flame(vec2 pos){
  float mask=texture2D(u_maps,pos).b;
  vec2 intensity=vec2(4.0,3.0)*pixel();
  vec2 v=mask*intensity;

  vec2 waves=vec2(
    wave(pos.x,120.0,0.4),
    wave(pos.y,120.0,0.35)+wave(pos.y,35.0,0.55)+wave(pos.y,90.0,0.25)
  );

  return pos+waves*v;
}
float getNoise(vec2 offset){
  float noisePixel=(1.0/float(u_noiseSize))*0.7;
  return texture2D(u_noise,(gl_FragCoord.xy+offset)*noisePixel).r;
}
vec2 depth(vec2 pos){
  vec2 intensity=vec2(0.045,0.04);
  vec2 speed=vec2(0.032,0.085);
  vec2 p=sin(u_time*speed);
  float d=0.45-pow(texture2D(u_maps,pos).r,1.0);
  return pos+(intensity*u_mouse*d);
}
void main(){
  vec2 pos=v_position.xy;
  // vec4 c=texture2D(u_image,pos);
  vec2 depthed=depth(pos);
  vec2 flamed=flame(depthed);
  vec2 turbulence=turbulenceWaves(flamed);
  vec2 turbulenced=applyWaves(flamed,turbulence);
  vec2 diff=turbulence;
  float diffi=0.5+clamp((diff.x+diff.y)/2.0,-1.0,1.0)*0.5;
  vec4 c=texture2D(u_image,turbulenced);
  vec4 cblur=texture2D(u_blur,turbulenced);
  c=blend(c,vec4(cblur.rgb,clamp(diffi,0.0,1.0)));

  float noiseIntensity=0.02;
  vec3 noise=vec3(getNoise(u_noiseR),getNoise(u_noiseG),getNoise(u_noiseB));
  vec3 il=vec3(1.0)-c.rgb;
  // il=il*il*il;
  vec3 noiseLightIntensity=il*noiseIntensity;
  c.rgb+=noiseLightIntensity.rgb*noise;

  gl_FragColor=vec4(c.rgb,1.0);
  // gl_FragColor=vec4(pos,(1.0+sin(u_time*0.1))*0.5,1.0);
  // gl_FragColor=vec4(vec3(diffi),1.0);

}
