import * as THREE from "three";
import { Triangle } from "./types/tshirt-types";
import {
  splitTriangleByAxis,
  createGeometryFromTriangles,
} from "./utils/triangle-utils";

interface ProcessedGeometry {
  rightSleeveGeom: THREE.BufferGeometry;
  leftSleeveGeom: THREE.BufferGeometry;
  frontGeom: THREE.BufferGeometry;
  backGeom: THREE.BufferGeometry;
}

export function processTShirtGeometry(
  geometry: THREE.BufferGeometry
): ProcessedGeometry {
  geometry.computeBoundingBox();
  if (!geometry.boundingBox) {
    throw new Error("Failed to compute bounding box");
  }

  const bbox = geometry.boundingBox;
  const centerX = (bbox.min.x + bbox.max.x) / 2;
  const centerZ = (bbox.min.z + bbox.max.z) / 2;
  const sleeveThreshold = (bbox.max.x - bbox.min.x) * 0.3;

  const rightSleeveTriangles: Triangle[] = [];
  const leftSleeveTriangles: Triangle[] = [];
  const frontTriangles: Triangle[] = [];
  const backTriangles: Triangle[] = [];

  const posAttr = geometry.getAttribute("position");
  const indexAttr = geometry.index;

  const processTriangle = (
    vA: THREE.Vector3,
    vB: THREE.Vector3,
    vC: THREE.Vector3
  ) => {
    const centroid = new THREE.Vector3(
      (vA.x + vB.x + vC.x) / 3,
      (vA.y + vB.y + vC.y) / 3,
      (vA.z + vB.z + vC.z) / 3
    );

    if (Math.abs(centroid.x - centerX) > sleeveThreshold) {
      if (centroid.x > centerX) {
        const boundary = centerX + sleeveThreshold;
        const split = splitTriangleByAxis(vA, vB, vC, "x", boundary);
        if (split) {
          split.posTriangles.forEach((tri) => rightSleeveTriangles.push(tri));
          split.negTriangles.forEach((tri) => {
            const avgZ =
              (tri.vertices[0].z + tri.vertices[1].z + tri.vertices[2].z) / 3;
            if (avgZ > centerZ) {
              frontTriangles.push(tri);
            } else {
              backTriangles.push(tri);
            }
          });
        } else {
          rightSleeveTriangles.push({ vertices: [vA, vB, vC] });
        }
      } else {
        const boundary = centerX - sleeveThreshold;
        const split = splitTriangleByAxis(vA, vB, vC, "x", boundary);
        if (split) {
          split.negTriangles.forEach((tri) => leftSleeveTriangles.push(tri));
          split.posTriangles.forEach((tri) => {
            const avgZ =
              (tri.vertices[0].z + tri.vertices[1].z + tri.vertices[2].z) / 3;
            if (avgZ > centerZ) {
              frontTriangles.push(tri);
            } else {
              backTriangles.push(tri);
            }
          });
        } else {
          leftSleeveTriangles.push({ vertices: [vA, vB, vC] });
        }
      }
    } else {
      const split = splitTriangleByAxis(vA, vB, vC, "z", centerZ);
      if (split) {
        if (centroid.z > centerZ) {
          split.posTriangles.forEach((tri) => frontTriangles.push(tri));
          split.negTriangles.forEach((tri) => backTriangles.push(tri));
        } else {
          split.negTriangles.forEach((tri) => backTriangles.push(tri));
          split.posTriangles.forEach((tri) => frontTriangles.push(tri));
        }
      } else {
        if (centroid.z > centerZ) {
          frontTriangles.push({ vertices: [vA, vB, vC] });
        } else {
          backTriangles.push({ vertices: [vA, vB, vC] });
        }
      }
    }
  };

  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i += 3) {
      const a = indexAttr.getX(i);
      const b = indexAttr.getX(i + 1);
      const c = indexAttr.getX(i + 2);
      const vA = new THREE.Vector3().fromBufferAttribute(posAttr, a);
      const vB = new THREE.Vector3().fromBufferAttribute(posAttr, b);
      const vC = new THREE.Vector3().fromBufferAttribute(posAttr, c);
      processTriangle(vA, vB, vC);
    }
  } else {
    for (let i = 0; i < posAttr.count; i += 3) {
      const vA = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const vB = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      const vC = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
      processTriangle(vA, vB, vC);
    }
  }

  return {
    rightSleeveGeom: createGeometryFromTriangles(rightSleeveTriangles),
    leftSleeveGeom: createGeometryFromTriangles(leftSleeveTriangles),
    frontGeom: createGeometryFromTriangles(frontTriangles),
    backGeom: createGeometryFromTriangles(backTriangles),
  };
}
