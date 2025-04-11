import React, { useRef, useMemo, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// Re-import Decal
import { Decal } from "@react-three/drei";
import { Triangle, TShirtMaterials, SplitResult } from "./types/tshirt-types";
import {
  splitTriangleByAxis,
  createGeometryFromTriangles,
} from "./utils/triangle-utils";

interface TShirtModelProps {
  materials?: TShirtMaterials;
  logoTexture?: THREE.Texture | null; // Allow null
  isLogoMode?: boolean;
  logoTargetPart?: "front" | "back";
  // Re-add props for decal control
  logoScale?: number;
  logoOffset?: THREE.Vector2;
}

const defaultMaterials: TShirtMaterials = {
  rightSleeve: { color: 0x4caf50 },
  leftSleeve: { color: 0x2196f3 },
  front: { color: 0xff9800 },
  back: { color: 0xe91e63 },
};

const interpolateUvLinear = (
  uvA: THREE.Vector2,
  uvB: THREE.Vector2,
  t: number
): THREE.Vector2 => {
  const clampedT = Math.max(0, Math.min(1, t));
  return uvA.clone().lerp(uvB, clampedT);
};

const TShirtModel: React.FC<TShirtModelProps> = ({
  materials = defaultMaterials,
  logoTexture, // Used for Decal map
  isLogoMode = false,
  logoTargetPart = "front",
  logoScale = 0.15, // Default decal scale (world units relative to mesh)
  logoOffset = new THREE.Vector2(0, 0.04), // Default decal offset (world units relative to mesh center)
}) => {
  const group = useRef<THREE.Group>(null);
  // Re-add refs for meshes
  const frontMeshRef = useRef<THREE.Mesh>(null);
  const backMeshRef = useRef<THREE.Mesh>(null);

  const gltf = useLoader(
    GLTFLoader,
    "https://raw.githubusercontent.com/Diego-lg/vite_showcase/6dc603ba0c7e90bdd77f050a7eee4dd3cdaa68a0/public/tshirt.glb"
  );

  const [aoMap, normalMap, roughnessMap] = useLoader(THREE.TextureLoader, [
    "/assets/tshirt/textures/fabric_167_ambientocclusion-4K.png",
    "/assets/tshirt/textures/fabric_167_normal-4K.png",
    "/assets/tshirt/textures/fabric_167_roughness-4K.png",
  ]);
  const [aoMap_logo, normalMap_logo, roughnessMap_logo] = useLoader(
    THREE.TextureLoader,
    [
      "/assets/tshirt/textures/fabric_167_ambientocclusion-4K.png",
      "/assets/tshirt/textures/fabric_167_normal-4K.png",
      "/assets/tshirt/textures/fabric_167_roughness-4K.png",
    ]
  );
  // Configure PBR textures after loading
  useEffect(() => {
    // Configure both fabric and logo textures
    const textures = [
      aoMap,
      normalMap,
      roughnessMap,
      aoMap_logo,
      normalMap_logo,
      roughnessMap_logo,
    ];
    textures.forEach((texture) => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.flipY = false; // PBR maps usually don't need flipping
        texture.needsUpdate = true;
      }
    });
    // Add logo textures to dependency array
  }, [
    aoMap,
    normalMap,
    roughnessMap,
    aoMap_logo,
    normalMap_logo,
    roughnessMap_logo,
  ]);

  // Alpha mask texture loading removed
  // Alpha mask texture loading removed

  // --- Geometry splitting logic useMemo (remains the same) ---
  const { rightSleeveGeom, leftSleeveGeom, frontGeom, backGeom } =
    useMemo(() => {
      const geometry = (gltf.scene.children[0] as THREE.Mesh).geometry;
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
      const uvAttr = geometry.getAttribute(
        "uv"
      ) as THREE.BufferAttribute | null;
      const indexAttr = geometry.index;

      const generateUVFallback = (vertex: THREE.Vector3): THREE.Vector2 => {
        const u = (vertex.x - bbox.min.x) / (bbox.max.x - bbox.min.x);
        const v = (vertex.y - bbox.min.y) / (bbox.max.y - bbox.min.y);
        return new THREE.Vector2(u, v);
      };

      const addCompleteTriangle = (
        list: Triangle[],
        vertices: THREE.Vector3[],
        uvs: THREE.Vector2[]
      ) => {
        if (vertices.length === 3 && uvs.length === 3) {
          list.push({ vertices, uvs });
        } else {
          console.warn("Attempted to add incomplete triangle data", {
            vertices,
            uvs,
          });
        }
      };

      const handleSplitResult = (
        splitResult: SplitResult,
        targetListPositive: Triangle[],
        targetListNegative: Triangle[],
        origVerts: { vA: THREE.Vector3; vB: THREE.Vector3; vC: THREE.Vector3 },
        origUvs: { uvA: THREE.Vector2; uvB: THREE.Vector2; uvC: THREE.Vector2 }
      ) => {
        const { vA, vB, vC } = origVerts;
        const { uvA, uvB, uvC } = origUvs;

        const findOrInterpolateUv = (vertex: THREE.Vector3): THREE.Vector2 => {
          const epsilon = 1e-5;
          if (vertex.distanceTo(vA) < epsilon) return uvA;
          if (vertex.distanceTo(vB) < epsilon) return uvB;
          if (vertex.distanceTo(vC) < epsilon) return uvC;

          const lineAB = new THREE.Line3(vA, vB);
          const lineBC = new THREE.Line3(vB, vC);
          const lineCA = new THREE.Line3(vC, vA);
          const tempPoint = new THREE.Vector3();

          if (
            lineAB
              .closestPointToPoint(vertex, true, tempPoint)
              .distanceTo(vertex) < epsilon
          ) {
            const totalDist = vA.distanceTo(vB);
            const dist = vA.distanceTo(vertex);
            const t = totalDist > epsilon ? dist / totalDist : 0;
            return interpolateUvLinear(uvA, uvB, t);
          } else if (
            lineBC
              .closestPointToPoint(vertex, true, tempPoint)
              .distanceTo(vertex) < epsilon
          ) {
            const totalDist = vB.distanceTo(vC);
            const dist = vB.distanceTo(vertex);
            const t = totalDist > epsilon ? dist / totalDist : 0;
            return interpolateUvLinear(uvB, uvC, t);
          } else if (
            lineCA
              .closestPointToPoint(vertex, true, tempPoint)
              .distanceTo(vertex) < epsilon
          ) {
            const totalDist = vC.distanceTo(vA);
            const dist = vC.distanceTo(vertex);
            const t = totalDist > epsilon ? dist / totalDist : 0;
            return interpolateUvLinear(uvC, uvA, t);
          } else {
            console.warn(
              "Could not determine edge for UV interpolation, using fallback.",
              vertex
            );
            return generateUVFallback(vertex);
          }
        };

        splitResult.posTriangles.forEach((tri) => {
          if (tri.vertices.length === 3) {
            const newUvs = tri.vertices.map((v) => findOrInterpolateUv(v));
            addCompleteTriangle(targetListPositive, tri.vertices, newUvs);
          } else {
            console.warn(
              "Split resulted in degenerate positive triangle",
              tri.vertices
            );
          }
        });
        splitResult.negTriangles.forEach((tri) => {
          if (tri.vertices.length === 3) {
            const newUvs = tri.vertices.map((v) => findOrInterpolateUv(v));
            addCompleteTriangle(targetListNegative, tri.vertices, newUvs);
          } else {
            console.warn(
              "Split resulted in degenerate negative triangle",
              tri.vertices
            );
          }
        });
      };

      const processTriangle = (
        vA: THREE.Vector3,
        vB: THREE.Vector3,
        vC: THREE.Vector3,
        uvA_orig: THREE.Vector2 | null,
        uvB_orig: THREE.Vector2 | null,
        uvC_orig: THREE.Vector2 | null
      ) => {
        const centroid = new THREE.Vector3(
          (vA.x + vB.x + vC.x) / 3,
          (vA.y + vB.y + vC.y) / 3,
          (vA.z + vB.z + vC.z) / 3
        );

        const uvA = uvA_orig ?? generateUVFallback(vA);
        const uvB = uvB_orig ?? generateUVFallback(vB);
        const uvC = uvC_orig ?? generateUVFallback(vC);
        const currentUvs = { uvA, uvB, uvC };
        const currentVerts = { vA, vB, vC };

        if (Math.abs(centroid.x - centerX) > sleeveThreshold) {
          const isRightSide = centroid.x > centerX;
          const boundary = isRightSide
            ? centerX + sleeveThreshold
            : centerX - sleeveThreshold;
          const splitX = splitTriangleByAxis(vA, vB, vC, "x", boundary);

          if (splitX) {
            const sleeveList = isRightSide
              ? rightSleeveTriangles
              : leftSleeveTriangles;
            const torsoPartsPositive: Triangle[] = [];
            const torsoPartsNegative: Triangle[] = [];

            handleSplitResult(
              splitX,
              isRightSide ? sleeveList : torsoPartsPositive,
              isRightSide ? torsoPartsNegative : sleeveList,
              currentVerts,
              currentUvs
            );

            const processTorsoList = (torsoList: Triangle[]) => {
              torsoList.forEach((torsoTri) => {
                if (
                  !torsoTri.vertices ||
                  torsoTri.vertices.length !== 3 ||
                  !torsoTri.uvs ||
                  torsoTri.uvs.length !== 3
                ) {
                  console.warn(
                    "Invalid triangle data in torso list before Z split",
                    torsoTri
                  );
                  return;
                }
                const triCentroidZ =
                  (torsoTri.vertices[0].z +
                    torsoTri.vertices[1].z +
                    torsoTri.vertices[2].z) /
                  3;
                const splitZ = splitTriangleByAxis(
                  torsoTri.vertices[0],
                  torsoTri.vertices[1],
                  torsoTri.vertices[2],
                  "z",
                  centerZ
                );

                if (splitZ) {
                  handleSplitResult(
                    splitZ,
                    frontTriangles,
                    backTriangles,
                    {
                      vA: torsoTri.vertices[0],
                      vB: torsoTri.vertices[1],
                      vC: torsoTri.vertices[2],
                    },
                    {
                      uvA: torsoTri.uvs[0],
                      uvB: torsoTri.uvs[1],
                      uvC: torsoTri.uvs[2],
                    }
                  );
                } else {
                  addCompleteTriangle(
                    triCentroidZ > centerZ ? frontTriangles : backTriangles,
                    torsoTri.vertices,
                    torsoTri.uvs
                  );
                }
              });
            };

            processTorsoList(torsoPartsPositive);
            processTorsoList(torsoPartsNegative);
          } else {
            addCompleteTriangle(
              isRightSide ? rightSleeveTriangles : leftSleeveTriangles,
              [vA, vB, vC],
              [uvA, uvB, uvC]
            );
          }
        } else {
          const splitZ = splitTriangleByAxis(vA, vB, vC, "z", centerZ);
          if (splitZ) {
            handleSplitResult(
              splitZ,
              frontTriangles,
              backTriangles,
              currentVerts,
              currentUvs
            );
          } else {
            addCompleteTriangle(
              centroid.z > centerZ ? frontTriangles : backTriangles,
              [vA, vB, vC],
              [uvA, uvB, uvC]
            );
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
          const uvA_orig = uvAttr
            ? new THREE.Vector2().fromBufferAttribute(uvAttr, a)
            : null;
          const uvB_orig = uvAttr
            ? new THREE.Vector2().fromBufferAttribute(uvAttr, b)
            : null;
          const uvC_orig = uvAttr
            ? new THREE.Vector2().fromBufferAttribute(uvAttr, c)
            : null;
          processTriangle(vA, vB, vC, uvA_orig, uvB_orig, uvC_orig);
        }
      } else {
        for (let i = 0; i < posAttr.count; i += 3) {
          const vA = new THREE.Vector3().fromBufferAttribute(posAttr, i);
          const vB = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
          const vC = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
          const uvA_orig = uvAttr
            ? new THREE.Vector2().fromBufferAttribute(uvAttr, i)
            : null;
          const uvB_orig = uvAttr
            ? new THREE.Vector2().fromBufferAttribute(uvAttr, i + 1)
            : null;
          const uvC_orig = uvAttr
            ? new THREE.Vector2().fromBufferAttribute(uvAttr, i + 2)
            : null;
          processTriangle(vA, vB, vC, uvA_orig, uvB_orig, uvC_orig);
        }
      }

      return {
        rightSleeveGeom: createGeometryFromTriangles(rightSleeveTriangles),
        leftSleeveGeom: createGeometryFromTriangles(leftSleeveTriangles),
        frontGeom: createGeometryFromTriangles(frontTriangles),
        backGeom: createGeometryFromTriangles(backTriangles),
      };
    }, [gltf]);

  // Revert material creation for Decal approach
  const meshMaterials = useMemo(() => {
    const createMaterial = (
      partName: "front" | "back" | "leftSleeve" | "rightSleeve",
      partMaterialProps: THREE.MeshStandardMaterialParameters
    ) => {
      let currentMap: THREE.Texture | undefined | null = undefined;

      if (isLogoMode) {
        // In Logo Mode: ALL parts get no map on the base material
        currentMap = null;
      } else {
        // In Pattern Mode: Apply pattern texture
        currentMap = partMaterialProps.map;
      }

      return new THREE.MeshStandardMaterial({
        ...partMaterialProps,
        map: currentMap, // Pattern map or null
        aoMap: aoMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        aoMapIntensity: 1,
        side: THREE.DoubleSide,
        // Polygon offset removed from base, applied only to decal
      });
    };

    return {
      rightSleeve: createMaterial("rightSleeve", materials.rightSleeve),
      leftSleeve: createMaterial("leftSleeve", materials.leftSleeve),
      front: createMaterial("front", materials.front),
      back: createMaterial("back", materials.back),
    };
    // Dependencies: isLogoMode triggers map change and polygonOffset
  }, [materials, isLogoMode, aoMap, normalMap, roughnessMap]); // Removed logoTargetPart, logoTexture

  // Calculate Decal position based on offset, with Y clamping based on scale
  const decalPosition = useMemo(() => {
    const basePosition = new THREE.Vector3(0, 0, 0);
    let currentOffsetY = logoOffset.y;

    // Clamp Y offset if scale is within the specified range
    if (logoScale >= 0.15 && logoScale <= 0.2) {
      currentOffsetY = Math.max(-0.08, Math.min(logoOffset.y, 0.08));
    }

    // Adjust Z based on target part - may need tweaking
    if (logoTargetPart === "front") {
      basePosition.z = 0.15; // Push slightly forward
    } else {
      basePosition.z = -0.15; // Push slightly backward
    }

    basePosition.x += logoOffset.x;
    basePosition.y += currentOffsetY; // Use the potentially clamped Y offset
    return basePosition;
  }, [logoOffset, logoTargetPart, logoScale]); // Add logoScale as dependency

  // Calculate Decal rotation
  const decalRotation = useMemo(() => {
    return logoTargetPart === "front"
      ? new THREE.Euler(0, 0, 0)
      : new THREE.Euler(0, Math.PI, 0);
  }, [logoTargetPart]);
  // Removed unused decalMaterial definition
  // Calculate Decal scale (size in world units)
  const decalScaleVector = useMemo(() => {
    const size = logoScale * 0.5; // Adjust multiplier as needed
    return new THREE.Vector3(size, size, size); // Use uniform scale for decal projection box
  }, [logoScale]);

  return (
    <group ref={group} position={[0, 0, 0]} scale={4.5}>
      {/* Sleeves */}
      <mesh geometry={rightSleeveGeom} material={meshMaterials.rightSleeve} />
      <mesh geometry={leftSleeveGeom} material={meshMaterials.leftSleeve} />

      {/* Front Mesh + Conditional Decal */}
      <mesh
        ref={frontMeshRef}
        geometry={frontGeom}
        material={meshMaterials.front}
      >
        {isLogoMode &&
          logoTargetPart === "front" &&
          logoTexture &&
          frontMeshRef.current && (
            <>
              {/* Debug Logs Start */}
              {console.log("Applying logoTexture as decal to front...")}
              {console.log("Decal Texture:", logoTexture)}
              {console.log("Target Mesh Ref Exists:", !!frontMeshRef.current)}
              {console.log("Decal Props:", {
                position: decalPosition,
                rotation: decalRotation,
                scale: decalScaleVector,
              })}
              {/* Debug Logs End */}
              <Decal
                mesh={frontMeshRef as React.MutableRefObject<THREE.Mesh>} // Assert as MutableRefObject (non-null current)
                position={decalPosition}
                rotation={decalRotation}
                scale={decalScaleVector}
                map={logoTexture!} // Map is still a prop of Decal - Assert non-null
                // Use inline material definition like the back decal
              >
                <meshStandardMaterial
                  map={logoTexture!} // Apply logo texture to the inline material - Assert non-null
                  aoMap={aoMap} // Use base fabric PBR maps
                  normalMap={normalMap}
                  roughnessMap={roughnessMap}
                  roughness={0.4} // Match original roughness
                  transparent={true} // Decals often need transparency
                  polygonOffset={true} // Enable polygon offset for z-fighting
                  polygonOffsetFactor={-1} // Push decal slightly behind surface
                  depthTest={false} // Optional: Render decal on top
                  depthWrite={false} // Optional: Decal doesn't write to depth buffer
                />
              </Decal>
            </>
          )}
      </mesh>

      {/* Back Mesh + Conditional Decal */}
      <mesh ref={backMeshRef} geometry={backGeom} material={meshMaterials.back}>
        {isLogoMode &&
          logoTargetPart === "back" &&
          logoTexture &&
          backMeshRef.current && (
            <>
              {/* Debug Logs Start */}
              {console.log("Applying logoTexture as decal to back...")}
              {console.log("Decal Texture:", logoTexture)}
              {console.log("Target Mesh Ref Exists:", !!backMeshRef.current)}
              {console.log("Decal Props:", {
                position: decalPosition,
                rotation: decalRotation,
                scale: decalScaleVector,
              })}
              {/* Debug Logs End */}
              <Decal
                mesh={backMeshRef as React.MutableRefObject<THREE.Mesh>} // Assert as MutableRefObject (non-null current)
                position={decalPosition}
                rotation={decalRotation}
                scale={decalScaleVector}
                map={logoTexture!} // Assert non-null
              >
                {/* Decal Material Setup - Use logo PBR properties */}
                <meshStandardMaterial
                  map={logoTexture!} // Assert non-null
                  // Use logo-specific PBR maps
                  aoMap={aoMap_logo}
                  normalMap={normalMap_logo}
                  roughnessMap={roughnessMap_logo}
                  aoMapIntensity={1} // Standard intensity
                  // Set decal-specific roughness/metalness if needed, otherwise maps control it
                  // roughness={0.2}
                  // metalness={0.0}
                  // Decal specific settings
                  polygonOffset
                  polygonOffsetFactor={-1} // Push decal slightly forward
                  polygonOffsetUnits={-1}
                  transparent={false} // Enable transparency for PNG logos etc.
                />
              </Decal>
            </>
          )}
      </mesh>
    </group>
  );
};

export default TShirtModel;

// Reminder: Ensure types are correct in ./types/tshirt-types.ts
/* ... type definitions ... */
