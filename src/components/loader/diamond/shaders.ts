/**
 * GLSL for the coal -> rough diamond -> brilliant-cut stone.
 *
 * One mesh, one material. The mesh is the brilliant cut; the vertex shader
 * morphs it into a lumpy coal silhouette or a rough crystal silhouette purely
 * from each vertex's position (identical positions move identically, so facets
 * never tear). The fragment shader derives flat facet normals and then blends:
 *   crayon coal (procedural wax hatching)  ->  rough crystal  ->  cut diamond.
 * The cut diamond is shaded by tracing rays inside the convex solid against its
 * 73 facet planes (refraction in, total internal reflection, refraction out,
 * per-channel IOR for dispersion) and sampling a procedural studio environment.
 */

export const MAX_BOUNCES = 6;

/** Fragment source with the facet-plane count baked in as a compile-time constant. */
export const fragmentWithPlanes = (n: number) => stoneFragment.replace("__NP__", String(n));

const NOISE = /* glsl */ `
float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float hash31(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vnoise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  float n000 = hash31(i);
  float n100 = hash31(i+vec3(1.0,0.0,0.0));
  float n010 = hash31(i+vec3(0.0,1.0,0.0));
  float n110 = hash31(i+vec3(1.0,1.0,0.0));
  float n001 = hash31(i+vec3(0.0,0.0,1.0));
  float n101 = hash31(i+vec3(1.0,0.0,1.0));
  float n011 = hash31(i+vec3(0.0,1.0,1.0));
  float n111 = hash31(i+vec3(1.0,1.0,1.0));
  return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
             mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
}
float fbm(vec3 p){
  float a = 0.5; float s = 0.0;
  for (int i = 0; i < 3; i++){ s += a*vnoise(p); p = p*2.03 + 17.0; a *= 0.5; }
  return s/0.875;
}
`;

export const stoneVertex = /* glsl */ `
uniform float uAssemble;
uniform float uCompress;
uniform float uCoalMix;
uniform float uCut;
varying vec3 vObj;
varying vec3 vWorld;
${NOISE}
void main(){
  vec3 p = position;                       // brilliant-cut position (object space)
  vec3 dir = normalize(p + vec3(0.0, 0.0001, 0.0));

  // Lumpy coal silhouette; compression tightens and calms it.
  float lump  = fbm(dir*2.2 + 3.1);
  float lump2 = fbm(dir*5.3 + 9.0);
  float amp = 1.0 - 0.45*uCompress;
  float rCoal = (0.78 + 0.42*lump*amp + 0.14*lump2*amp) * mix(1.0, 0.82, uCompress);
  vec3 coalP = dir * rCoal * vec3(1.12, 0.82, 0.95);

  // Rough crystal silhouette: larger planes, gentler lumps.
  float lumpD = fbm(dir*1.4 + 1.7);
  float rDia = 0.86 + 0.34*lumpD;
  vec3 diaP = dir * rDia * vec3(1.05, 0.92, 0.96);

  vec3 shape = mix(mix(diaP, coalP, uCoalMix), p, uCut);

  // Crayon marks start scattered and gather inward.
  float sc = 1.0 - uAssemble;
  float sn = vnoise(p*3.0 + 5.0);
  shape += dir * sc * (0.5 + 1.6*sn);

  vObj = shape;
  vec4 wp = modelMatrix * vec4(shape, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const stoneFragment = /* glsl */ `
#define NP __NP__
#define MAXB ${MAX_BOUNCES}
uniform float uTime;
uniform float uAssemble;
uniform float uCrystal;
uniform float uFrag;
uniform float uCut;
uniform float uDpr;
uniform float uDisperse;
uniform float uBounces;
uniform float uLight;
uniform float uOpacity;
uniform mat3 uRot;
uniform vec4 uPlanes[NP];
varying vec3 vObj;
varying vec3 vWorld;
${NOISE}

float spot(vec3 d, vec3 c, float r, float soft){
  return smoothstep(cos(r + soft), cos(r), dot(d, normalize(c)));
}

// Procedural studio on pure black: a few controlled light sources, no backdrop.
vec3 envC(vec3 d0){
  float ca = cos(uLight); float sa = sin(uLight);
  vec3 d = vec3(ca*d0.x - sa*d0.z, d0.y, sa*d0.x + ca*d0.z);
  vec3 c = vec3(0.010, 0.014, 0.020);
  c += vec3(1.00, 1.00, 1.00) * 9.0 * spot(d, vec3(0.25, 1.0, 0.35), 0.38, 0.12);
  c += vec3(0.92, 0.96, 1.00) * 6.0 * spot(d, vec3(-1.0, 0.25, 0.45), 0.20, 0.08);
  c += vec3(0.66, 0.80, 0.96) * 4.0 * spot(d, vec3(0.95, -0.05, -0.55), 0.24, 0.10);
  c += vec3(1.00, 1.00, 1.00) * 5.0 * spot(d, vec3(0.1, 0.35, -1.0), 0.10, 0.05);
  float band = (1.0 - smoothstep(0.0, 0.07, abs(d.y - 0.12))) * smoothstep(0.2, 0.85, d.x);
  c += vec3(0.85, 0.92, 1.00) * 3.0 * band;
  c += vec3(0.50, 0.65, 0.85) * 0.15 * smoothstep(0.0, 1.0, -d.y);
  return c;
}

// Wax-crayon coal: hand-hatched strokes on tooth paper, scratched highlights.
vec3 coalColor(vec3 nO, vec3 rdO, vec2 fc, float jit){
  vec3 L = normalize(vec3(-0.45, 0.85, 0.55));
  float tone = clamp(dot(nO, L)*0.5 + 0.5, 0.0, 1.0);
  float ang = hash31(floor(nO*5.0) + 3.0) * 3.14159;
  vec2 dir = vec2(cos(ang), sin(ang));
  float wob = vnoise(vec3(fc*0.018, ang*2.0 + jit*0.13)) * 5.0;
  float hatch = sin(dot(fc, dir)*0.55 + wob)*0.5 + 0.5;
  float stroke = smoothstep(0.35, 0.85, hatch);
  float grain = hash21(floor(fc*0.9) + jit*13.0);
  float tooth = smoothstep(0.25, 0.75, grain);
  float pig = stroke * mix(0.35, 1.0, tooth) * (0.12 + 0.88*tone);
  float ang2 = ang + 1.2;
  float hatch2 = smoothstep(0.55, 0.9, sin(dot(fc, vec2(cos(ang2), sin(ang2)))*0.7 + wob*0.7)*0.5 + 0.5);
  pig += hatch2 * (1.0 - tone) * 0.25 * tooth;
  float scratch = smoothstep(0.93, 0.99, vnoise(vec3(fc*vec2(0.05, 0.9), ang))) * tone;
  float rim = 1.0 - abs(dot(nO, rdO));
  float outline = smoothstep(0.72, 0.95, rim) * step(0.4, hash21(floor(fc/4.0) + 7.0));
  float v = pig*0.55 + scratch*0.55 + outline*0.3;
  return vec3(0.62, 0.64, 0.68) * v + vec3(0.012);
}

// Rough crystal: one refraction with internal fracture jitter, fringes, fresnel.
vec3 roughCrystal(vec3 nO, vec3 rdW){
  vec3 nW = normalize(uRot * nO);
  float fres = pow(1.0 - clamp(dot(-rdW, nW), 0.0, 1.0), 3.0);
  vec3 rf = reflect(rdW, nW);
  vec3 t = refract(rdW, nW, 1.0/2.2);
  vec3 jit = vec3(vnoise(vObj*4.0), vnoise(vObj*4.0 + 7.0), vnoise(vObj*4.0 + 13.0)) - 0.5;
  vec3 inner = envC(normalize(t + jit*0.9 + vec3(0.0001))) * vec3(0.55, 0.65, 0.75);
  vec3 fringe = 0.5 + 0.5*cos(6.2831*(dot(nW, vec3(0.3, 0.6, 0.1))*2.0 + vec3(0.0, 0.33, 0.67)));
  inner *= mix(vec3(1.0), fringe, 0.25);
  return inner*0.7 + envC(rf)*(0.15 + 0.85*fres) + vec3(0.02, 0.03, 0.04);
}

// Exact ray path inside the convex cut: bounce off facet planes until the ray
// can leave (refraction) rather than total-internally reflect.
vec3 trace(vec3 pos, vec3 dir, float ior){
  float att = 1.0;
  for (int b = 0; b < MAXB; b++){
    if (float(b) >= uBounces) break;
    float tmin = 1e9;
    vec3 pn = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < NP; i++){
      vec4 pl = uPlanes[i];
      float dn = dot(pl.xyz, dir);
      if (dn > 1e-4){
        float t = (pl.w - dot(pl.xyz, pos)) / dn;
        if (t > 1e-4 && t < tmin){ tmin = t; pn = pl.xyz; }
      }
    }
    pos += dir * tmin;
    vec3 o = refract(dir, -pn, ior);
    if (dot(o, o) > 0.0){
      return envC(normalize(uRot * o)) * att;
    }
    dir = reflect(dir, -pn);
    att *= 0.985;
  }
  return envC(normalize(uRot * dir)) * 0.12 * att;
}

vec3 tracedDiamond(vec3 nO, vec3 rdO){
  float cosI = clamp(dot(-rdO, nO), 0.0, 1.0);
  float F = 0.17 + 0.83*pow(1.0 - cosI, 5.0);
  vec3 refl = envC(normalize(uRot * reflect(rdO, nO)));
  vec3 inner;
  if (uDisperse > 0.5){
    inner.r = trace(vObj, refract(rdO, nO, 1.0/2.40), 2.40).r;
    inner.g = trace(vObj, refract(rdO, nO, 1.0/2.43), 2.43).g;
    inner.b = trace(vObj, refract(rdO, nO, 1.0/2.47), 2.47).b;
  } else {
    inner = trace(vObj, refract(rdO, nO, 1.0/2.42), 2.42);
  }
  return inner*(1.0 - F) + refl*F;
}

void main(){
  vec3 rdW = normalize(vWorld - cameraPosition);
  vec3 rdO = normalize(transpose(uRot) * rdW);
  vec3 nO = normalize(cross(dFdx(vObj), dFdy(vObj)));
  if (dot(nO, rdO) > 0.0) nO = -nO;

  vec2 fc = gl_FragCoord.xy / uDpr;
  float jit = floor(uTime*7.0);

  // Act II: crayon marks appear progressively.
  float marks = vnoise(vObj*7.0 + 2.0)*0.6 + hash21(floor(fc/3.0) + jit)*0.4;
  if (marks > uAssemble*1.15) discard;

  // Act IV: crystal grows in patches; un-grown crayon flakes away.
  float grow = smoothstep(0.0, 1.0, uCrystal*1.9 - vnoise(vObj*3.5 + 4.0)*0.9);
  float flake = vnoise(vObj*5.0 + 11.0) + 0.25*hash21(floor(fc/2.0));
  if (flake < uFrag*0.7*(1.0 - grow)) discard;

  vec3 col = coalColor(nO, rdO, fc, jit);
  if (grow > 0.001){
    vec3 crys = roughCrystal(nO, rdW);
    if (uCut > 0.4){
      crys = mix(crys, tracedDiamond(nO, rdO), smoothstep(0.55, 0.95, uCut));
    }
    col = mix(col, crys, grow);
  }

  col = 1.0 - exp(-col*1.1);
  col = pow(col, vec3(0.4545)) * uOpacity;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const debrisVertex = /* glsl */ `
attribute float aSeed;
attribute vec3 aDir;
uniform float uP;
uniform float uDpr;
uniform float uCrystal;
varying float vA;
varying float vMix;
void main(){
  float e = 1.0 - pow(1.0 - clamp(uP, 0.0, 1.0), 2.0);
  vec3 pos = position + aDir * e * (0.4 + 1.6*aSeed)
    + vec3(sin(aSeed*40.0 + uP*6.0), cos(aSeed*30.0 + uP*5.0), sin(aSeed*20.0)) * 0.04 * e;
  vA = sin(3.14159 * clamp(uP, 0.0, 1.0)) * (0.3 + 0.7*aSeed);
  vMix = clamp(uCrystal, 0.0, 1.0);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.5 + 4.0*aSeed) * uDpr * (4.0 / -mv.z);
}
`;

export const debrisFragment = /* glsl */ `
varying float vA;
varying float vMix;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q);
  if (r > 0.5) discard;
  float a = 1.0 - smoothstep(0.0, 0.5, r);
  vec3 c = mix(vec3(0.45, 0.47, 0.50), vec3(0.81, 0.91, 1.0), vMix);
  gl_FragColor = vec4(c, a * vA);
}
`;
