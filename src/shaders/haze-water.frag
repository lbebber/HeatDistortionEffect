precision mediump float;

/*
MESSY CODE AHEAD
(sorry, experimenting)
*/

uniform float u_time;
varying vec2 v_position;
uniform sampler2D u_image;
uniform sampler2D u_maps;
uniform vec2 u_mouse;
uniform float u_dpi;
uniform vec2 u_resolution;

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
vec2 waves(vec2 pos){
  vec4 maps=texture2D(u_maps,pos);
  float mask=maps.r;
  float y=maps.g;
  float y2=pow(y,2.0);

  vec2 intensity=vec2(
    0.5-(y2*0.5),
    0.2+(y2*1.8)
  )*pixel();

  vec2 waves=vec2(
    wave(y,400.0-(y2*200.0),-0.03),
     wave(y,400.0-(y2*400.0*0.05),-0.045)
    +wave(y,900.0-(y2*900.0*0.05),-0.05)
    +wave(pos.x,20.0+(y2*20.0*1.5),-0.01)
  );
  return pos+(waves*intensity*mask);
}
vec2 depth(vec2 pos){
  vec2 intensity=vec2(0.01,0.01);
  float d=0.05-pow(texture2D(u_maps,pos).b,1.0);
  return pos+(intensity*u_mouse*d);
}
void main(){
  vec2 pos=v_position.xy;

  vec2 turbulence=depth(waves(pos));
  vec2 noTurbulence=depth(pos);
  vec4 c=texture2D(u_image,turbulence);


  gl_FragColor=vec4(c.rgb,1.0);

}
