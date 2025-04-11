import * as THREE from "three";

export interface Triangle {
  vertices: THREE.Vector3[];
  uvs?: THREE.Vector2[];
}

export interface SplitResult {
  posTriangles: Triangle[];
  negTriangles: Triangle[];
  intersection?: [THREE.Vector3, THREE.Vector3];
}

export interface MaterialConfig {
  color?: number;
  metalness?: number;
  roughness?: number;
  map?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  aoMap?: THREE.Texture | null;
  roughnessMap?: THREE.Texture | null;
  side?: THREE.Side;
}

export interface TShirtMaterials {
  rightSleeve: MaterialConfig;
  leftSleeve: MaterialConfig;
  front: MaterialConfig;
  back: MaterialConfig;
}
