import { buildDiamond } from "../src/components/loader/diamond/diamondGeometry.ts";
const d = buildDiamond(2);
console.log("planes", d.planeCount, "tris", d.positions.length/9);
let maxOut=0, minNZ=1;
for (let i=0;i<d.positions.length;i+=3){
  const x=d.positions[i],y=d.positions[i+1],z=d.positions[i+2];
  for(let p=0;p<d.planeCount;p++){
    const o=d.planes[p*4]*x+d.planes[p*4+1]*y+d.planes[p*4+2]*z-d.planes[p*4+3];
    if(o>maxOut) maxOut=o;
  }
}
console.log("max vertex outside any plane (convexity/planarity):", maxOut.toExponential(2));
// each triangle's vertices lie on its facet plane
let maxOn=0;
for(let t=0;t<d.positions.length/9;t++){
  const f=d.facetIds[t*3];
  for(let v=0;v<3;v++){
    const o=d.planes[f*4]*d.positions[t*9+v*3]+d.planes[f*4+1]*d.positions[t*9+v*3+1]+d.planes[f*4+2]*d.positions[t*9+v*3+2]-d.planes[f*4+3];
    maxOn=Math.max(maxOn,Math.abs(o));
  }
}
console.log("max |dist| of facet vertices to own plane:", maxOn.toExponential(2));
let ymin=1e9,ymax=-1e9,rmax=0;
for(let i=0;i<d.positions.length;i+=3){ymin=Math.min(ymin,d.positions[i+1]);ymax=Math.max(ymax,d.positions[i+1]);rmax=Math.max(rmax,Math.hypot(d.positions[i],d.positions[i+2]));}
console.log("y range",ymin.toFixed(3),ymax.toFixed(3),"girdle r",rmax.toFixed(3));
// plane normals unit & distinct count
let bad=0;for(let p=0;p<d.planeCount;p++){const l=Math.hypot(d.planes[p*4],d.planes[p*4+1],d.planes[p*4+2]);if(Math.abs(l-1)>1e-6)bad++;}
console.log("non-unit normals",bad);
