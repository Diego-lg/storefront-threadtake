import * as THREE from "three";
import { Triangle, SplitResult } from "../types/tshirt-types";

export function splitTriangleByAxis(
  vA: THREE.Vector3,
  vB: THREE.Vector3,
  vC: THREE.Vector3,
  axis: "x" | "z",
  threshold: number
): SplitResult | null {
  const dA = vA[axis] - threshold;
  const dB = vB[axis] - threshold;
  const dC = vC[axis] - threshold;

  if ((dA >= 0 && dB >= 0 && dC >= 0) || (dA < 0 && dB < 0 && dC < 0)) {
    return null;
  }

  const posTriangles: Triangle[] = [];
  const negTriangles: Triangle[] = [];
  let intersection: [THREE.Vector3, THREE.Vector3] | undefined = undefined;

  if (dA >= 0 && dB < 0 && dC < 0) {
    const tAB = dA / (dA - dB);
    const I_AB = vA.clone().lerp(vB, tAB);
    const tAC = dA / (dA - dC);
    const I_AC = vA.clone().lerp(vC, tAC);
    posTriangles.push({ vertices: [vA, I_AB, I_AC] });
    negTriangles.push({ vertices: [vB, vC, I_AC] });
    negTriangles.push({ vertices: [vB, I_AC, I_AB] });
    intersection = [I_AB, I_AC];
  } else if (dB >= 0 && dA < 0 && dC < 0) {
    const tBA = dB / (dB - dA);
    const I_BA = vB.clone().lerp(vA, tBA);
    const tBC = dB / (dB - dC);
    const I_BC = vB.clone().lerp(vC, tBC);
    posTriangles.push({ vertices: [vB, I_BA, I_BC] });
    negTriangles.push({ vertices: [vA, vC, I_BC] });
    negTriangles.push({ vertices: [vA, I_BC, I_BA] });
    intersection = [I_BA, I_BC];
  } else if (dC >= 0 && dA < 0 && dB < 0) {
    const tCA = dC / (dC - dA);
    const I_CA = vC.clone().lerp(vA, tCA);
    const tCB = dC / (dC - dB);
    const I_CB = vC.clone().lerp(vB, tCB);
    posTriangles.push({ vertices: [vC, I_CA, I_CB] });
    negTriangles.push({ vertices: [vA, vB, I_CB] });
    negTriangles.push({ vertices: [vA, I_CB, I_CA] });
    intersection = [I_CA, I_CB];
  } else if (dA < 0 && dB >= 0 && dC >= 0) {
    const tAB = -dA / (dB - dA);
    const I_AB = vA.clone().lerp(vB, tAB);
    const tAC = -dA / (dC - dA);
    const I_AC = vA.clone().lerp(vC, tAC);
    negTriangles.push({ vertices: [vA, I_AB, I_AC] });
    posTriangles.push({ vertices: [vB, vC, I_AC] });
    posTriangles.push({ vertices: [vB, I_AC, I_AB] });
    intersection = [I_AB, I_AC];
  } else if (dB < 0 && dA >= 0 && dC >= 0) {
    const tBA = -dB / (dA - dB);
    const I_BA = vB.clone().lerp(vA, tBA);
    const tBC = -dB / (dC - dB);
    const I_BC = vB.clone().lerp(vC, tBC);
    negTriangles.push({ vertices: [vB, I_BA, I_BC] });
    posTriangles.push({ vertices: [vA, vC, I_BC] });
    posTriangles.push({ vertices: [vA, I_BC, I_BA] });
    intersection = [I_BA, I_BC];
  } else if (dC < 0 && dA >= 0 && dB >= 0) {
    const tCA = -dC / (dA - dC);
    const I_CA = vC.clone().lerp(vA, tCA);
    const tCB = -dC / (dB - dC);
    const I_CB = vC.clone().lerp(vB, tCB);
    negTriangles.push({ vertices: [vC, I_CA, I_CB] });
    posTriangles.push({ vertices: [vA, vB, I_CB] });
    posTriangles.push({ vertices: [vA, I_CB, I_CA] });
    intersection = [I_CA, I_CB];
  }

  return { posTriangles, negTriangles, intersection };
}

export function createGeometryFromTriangles(
  triangles: Triangle[]
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  triangles.forEach((tri) => {
    const baseIndex = positions.length / 3;
    tri.vertices.forEach((v, j) => {
      positions.push(v.x, v.y, v.z);
      if (tri.uvs && tri.uvs[j]) {
        uvs.push(tri.uvs[j].x, tri.uvs[j].y);
      } else {
        // Generate basic UVs if none provided
        uvs.push(v.x, v.y);
      }
    });
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
