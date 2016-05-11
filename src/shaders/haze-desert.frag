precision mediump float;

/*
MESSY CODE AHEAD
(sorry, experimenting)
*/

uniform float u_time;
varying vec2 v_position;
uniform sampler2D u_image;
uniform sampler2D u_maps;
uniform sampler2D u_noise;
uniform sampler2D u_content;
uniform int u_contentLoaded;
uniform vec2 u_contentSize;
uniform vec2 u_contentPos;
uniform int u_noiseSize;
uniform float u_dpi;
uniform vec2 u_noiseR;
uniform vec2 u_noiseG;
uniform vec2 u_noiseB;
uniform vec2 u_mouse;
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
vec2 ratio(){
  return vec2(u_resolution.x/u_resolution.y,u_resolution.y/u_resolution.x);
}

float wave(float x,float freq, float speed){
  return sin(x*freq+((u_time*(3.1415/2.0))*speed));
}
vec2 waves(vec2 pos,bool masked){
  float mask=texture2D(u_maps,pos).b;

  vec2 intensity=vec2(2.0,1.0)*pixel();

  vec2 waves=vec2(
    wave(pos.y,190.0,0.35),
    wave(pos.x,100.0,0.4)
  );
  return pos+(waves*intensity*(masked?mask:1.0));
}
vec2 depth(vec2 pos){
  vec2 intensity=vec2(0.004,0.004);
  float d=0.0-pow(texture2D(u_maps,pos).r,1.0);
  return pos+(intensity*u_mouse*d);
}
float getNoise(vec2 offset){
  float noisePixel=(1.0/float(u_noiseSize))*0.7;
  return texture2D(u_noise,(gl_FragCoord.xy+offset)*noisePixel).r;
}
vec2 getContentPos(vec2 pos){
  vec2 pixelPos=pos*u_resolution;
  return (pixelPos-u_contentPos)/u_contentSize;
}
void main(){
  vec2 pos=v_position.xy;

  vec2 turbulence=waves(depth(pos),true);
  vec4 c=texture2D(u_image,turbulence);

  float noiseIntensity=0.1;
  vec3 noise=vec3(getNoise(u_noiseR),getNoise(u_noiseG),getNoise(u_noiseB));
  vec3 il=vec3(1.0)-c.rgb;
  // il=il*il*il;
  vec3 noiseLightIntensity=il*noiseIntensity;
  c.rgb+=noiseLightIntensity.rgb*noise;

  float vdepth=texture2D(u_maps,depth(pos)).g;
  float threshold=0.5;
  float thresholdLimit=0.1;
  float thresholdSize=threshold-thresholdLimit;
  if(vdepth<threshold){
    float amult=clamp(1.0-(vdepth-thresholdLimit)/thresholdSize,0.0,1.0);

    if(u_contentLoaded==1){
      float wavep=0.3;

      vec2 contentPos=getContentPos(waves(pos,false)*wavep+(1.0-wavep)*pos);
      vec2 contentPosNoWaves=getContentPos(pos);
      contentPos=contentPos*contentPosNoWaves.y+contentPosNoWaves*(1.0-contentPosNoWaves.y);
      if(contentPos.x>=0.0 && contentPos.x<=1.0 && contentPos.y>=0.0 && contentPos.y<=1.0){
        vec4 content=texture2D(u_content,contentPos);
        c=blend(c,vec4(content.rgb,content.a*amult));
      }
    }
  }

  gl_FragColor=vec4(c.rgb,1.0);
  // gl_FragColor=vec4(vec3(texture2D(u_mask,pos).g),1.0);
  // gl_FragColor=vec4(pos,(1.0+sin(u_time*0.1))*0.5,1.0);
  // gl_FragColor=vec4(vec3(diffi),1.0);

}
