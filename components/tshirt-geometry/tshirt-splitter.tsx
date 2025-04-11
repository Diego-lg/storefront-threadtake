import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { processTShirtGeometry } from "./tshirt-geometry";

export function TShirtSplitter() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 1.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load(
      "https://raw.githubusercontent.com/Diego-lg/vite_showcase/6dc603ba0c7e90bdd77f050a7eee4dd3cdaa68a0/public/tshirt.glb",
      (gltf) => {
        const originalMesh = gltf.scene.children[0] as THREE.Mesh;
        let geometry: THREE.BufferGeometry;
        if (originalMesh && originalMesh.geometry) {
          geometry = originalMesh.geometry as THREE.BufferGeometry;
        } else {
          geometry = new THREE.BufferGeometry();
        }

        const { rightSleeveGeom, leftSleeveGeom, frontGeom, backGeom } =
          processTShirtGeometry(geometry);

        const materials = {
          rightSleeve: new THREE.MeshPhongMaterial({
            color: 0x4caf50,
            opacity: 0.9,
            side: THREE.DoubleSide,
            flatShading: true,
          }),
          leftSleeve: new THREE.MeshPhongMaterial({
            color: 0x2196f3,
            opacity: 0.9,
            side: THREE.DoubleSide,
            flatShading: true,
          }),
          front: new THREE.MeshPhongMaterial({
            color: 0xff9800,
            opacity: 0.9,
            side: THREE.DoubleSide,
            flatShading: true,
          }),
          back: new THREE.MeshPhongMaterial({
            color: 0xe91e63,
            opacity: 0.9,
            side: THREE.DoubleSide,
            flatShading: true,
          }),
        };

        const meshes = {
          rightSleeve: new THREE.Mesh(rightSleeveGeom, materials.rightSleeve),
          leftSleeve: new THREE.Mesh(leftSleeveGeom, materials.leftSleeve),
          front: new THREE.Mesh(frontGeom, materials.front),
          back: new THREE.Mesh(backGeom, materials.back),
        };

        Object.values(meshes).forEach((mesh) => scene.add(mesh));

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 0.5;
        controls.maxDistance = 3;
        controls.maxPolarAngle = Math.PI / 2;

        const animate = () => {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };

        animate();
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
      }
    );

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);
    const container = containerRef.current; // Store ref value

    return () => {
      window.removeEventListener("resize", handleResize);
      // Use the stored value in the cleanup
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} />;
}
