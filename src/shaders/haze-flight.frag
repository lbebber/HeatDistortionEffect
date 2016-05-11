precision mediump float;

/*
MESSY CODE AHEAD
(sorry, experimenting)
*/

uniform float u_time;
varying vec2 v_position;
uniform sampler2D u_image;
uniform sampler2D u_image2;
uniform sampler2D u_mask;
uniform sampler2D u_depth;
uniform sampler2D u_noise;
uniform sampler2D u_content;
uniform int u_contentLoaded;
uniform vec2 u_contentSize;
uniform vec2 u_contentPos;
uniform int u_noiseSize;
uniform vec2 u_noiseR;
uniform vec2 u_noiseG;
uniform vec2 u_noiseB;
uniform vec2 u_parallax;
uniform float u_distort;
uniform vec2 u_resolution;
uniform float u_scroll;


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

vec2 pos(){
  return vec2(0.0,0.0);
}

float wave(float x,float freq, float speed){
  return sin(x*freq+((u_time*(3.1415/2.0))*speed));
}

vec2 turbulence(vec2 pos,float mask){

  vec2 intensity=vec2(0.0025,0.0016);
  vec2 v=mask*intensity;

  vec2 vwave=vec2(
    wave(pos.x,25.0,-0.73),
    wave(pos.y,40.0,0.5)
  );

  return pos+vwave*v;
}
vec2 depth(vec2 pos){
  vec2 intensity=vec2(0.0085,0.004);
  float vdepth=texture2D(u_depth,pos).r;
  float d=0.5-pow(vdepth,1.0);
  vec2 parallax=u_parallax;
  return pos+(intensity*parallax*d);
}

float getNoise(vec2 offset){
  float noisePixel=(1.0/float(u_noiseSize))*1.0;
  return texture2D(u_noise,(gl_FragCoord.xy+offset)*noisePixel).r;
}

vec2 getContentPos(vec2 pos){
  vec2 pixelPos=pos*u_resolution;
  return (pixelPos-u_contentPos)/u_contentSize;
}

void main(){
  vec2 pos=v_position.xy;

  /*float mask=texture2D(u_mask,pos).r;
  vec2 turbulenced=turbulence(pos,mask);
  vec2 diff=abs(turbulenced-pos);
  vec2 depthed=depth(turbulenced);
  gl_FragColor=texture2D(u_image,depthed);*/

  pos-=vec2(0.0,u_scroll*0.001);
  float mask=texture2D(u_mask,pos).r;
  vec2 turbulenced=turbulence(pos,mask);
  vec2 diff=abs(turbulenced-pos);
  vec2 depthed=depth(turbulenced);
  vec4 c=texture2D(u_image,depthed);
  //gl_FragColor=c;

  if(u_contentLoaded==1){
    vec2 contentPos=getContentPos(turbulenced);
    if(contentPos.x>=0.0 && contentPos.x<=1.0 && contentPos.y>=0.0 && contentPos.y<=1.0){
      vec4 content=texture2D(u_content,contentPos);

      c=blend(c,content);
    }
  }
  // vec4 c2=vec4(vec3(0.0),1.0);
  // c+=texture2D(u_image,pos+getNoise(u_noiseR)*0.005);
  // c+=texture2D(u_image,pos+getNoise(u_noiseG)*0.005);
  // c+=texture2D(u_image,pos+getNoise(u_noiseB)*0.005);
  // c/=4.0;

  // c+=vec4(vec3(u_distort),1.0);
  float noise=0.1;
  // c*=(1.0-noise)+(mod(u_time*3535.546+pos.x*3423.66+pos.y*653.39,10.0)/10.0)*noise;
  gl_FragColor=vec4(c);
}
