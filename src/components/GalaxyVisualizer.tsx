import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { NoteNode, GraphLink } from '../types';

interface GalaxyVisualizerProps {
  nodes: NoteNode[];
  links: GraphLink[];
  selectedNodeId: number | null;
  highlightedNodeIds: number[];
  clusterMode: boolean;
  onSelectNode: (node: NoteNode) => void;
  newBornNodeId?: number | null;
}

const GROUP_COLORS: Record<string, string> = {
  Strategy: '#f59e0b',    // Amber
  Engineering: '#06b6d4', // Cyan
  Operations: '#10b981',  // Emerald / British racing green
  Product: '#a855f7',     // Purple
  Research: '#3b82f6',    // Blue
  Captures: '#ec4899',    // Pink / Supernova
};

export const GalaxyVisualizer: React.FC<GalaxyVisualizerProps> = ({
  nodes,
  links,
  selectedNodeId,
  highlightedNodeIds,
  clusterMode,
  onSelectNode,
  newBornNodeId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodeMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const linkLinesRef = useRef<THREE.LineSegments | null>(null);
  const nodePositionsRef = useRef<Map<number, THREE.Vector3>>(new Map());

  // Camera animation tween state
  const cameraTargetRef = useRef<{
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    startPos: THREE.Vector3;
    startLookAt: THREE.Vector3;
    startTime: number;
    duration: number;
    animating: boolean;
  }>({
    pos: new THREE.Vector3(0, 0, 480),
    lookAt: new THREE.Vector3(0, 0, 0),
    startPos: new THREE.Vector3(0, 0, 480),
    startLookAt: new THREE.Vector3(0, 0, 0),
    startTime: 0,
    duration: 1200,
    animating: false
  });

  // Current lookAt tracking for smooth transitions
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Auto idle rotation
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const idleRotationSpeedRef = useRef(0.0008);

  // Compute 3D node positions in a spherical organic constellation layout
  const computeConstellationPositions = useCallback(() => {
    const posMap = new Map<number, THREE.Vector3>();
    const groupCenters: Record<string, THREE.Vector3> = {
      Strategy: new THREE.Vector3(120, 80, -40),
      Engineering: new THREE.Vector3(-140, 60, 50),
      Operations: new THREE.Vector3(0, -110, 80),
      Product: new THREE.Vector3(130, -70, 70),
      Research: new THREE.Vector3(-100, -90, -100),
      Captures: new THREE.Vector3(40, 130, 90)
    };

    const groupCounts: Record<string, number> = {};
    const groupTotals: Record<string, number> = {};
    nodes.forEach((n) => {
      groupTotals[n.group] = (groupTotals[n.group] || 0) + 1;
    });

    nodes.forEach((node) => {
      const center = groupCenters[node.group] || new THREE.Vector3(0, 0, 0);
      const idx = groupCounts[node.group] || 0;
      groupCounts[node.group] = idx + 1;
      const totalInGroup = Math.max(groupTotals[node.group] || 1, 4);

      // Spherical Fibonacci distribution without Math.acos domain NaN vulnerability
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad
      const theta = idx * goldenAngle;
      // Strictly bounded normalized fraction in (-1, 1)
      const normalized = (idx + 0.5) / totalInGroup;
      const y = Math.max(-0.95, Math.min(0.95, 1 - 2 * normalized));
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const clusterRadius = 45 + (idx % 3) * 16;

      const offset = new THREE.Vector3(
        clusterRadius * radiusAtY * Math.cos(theta),
        clusterRadius * y * 0.85,
        clusterRadius * radiusAtY * Math.sin(theta)
      );

      // Defensive finite check
      if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y) || !Number.isFinite(offset.z)) {
        offset.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
      }

      const finalPos = center.clone().add(offset);
      posMap.set(node.id, finalPos);
    });

    nodePositionsRef.current = posMap;
    return posMap;
  }, [nodes]);

  useEffect(() => {
    computeConstellationPositions();
  }, [computeConstellationPositions]);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070a, 0.0012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 3000);
    camera.position.set(0, 20, 480);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05070a, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x2dd4bf, 2, 800);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // 1. Starfield Particles (2,800 stars)
    const starCount = 2800;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const r = 400 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = r * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.8) {
        starColors[i3] = 0.4;
        starColors[i3 + 1] = 0.8;
        starColors[i3 + 2] = 1.0; // Cool star
      } else if (tint > 0.6) {
        starColors[i3] = 1.0;
        starColors[i3 + 1] = 0.8;
        starColors[i3 + 2] = 0.4; // Amber star
      } else {
        starColors[i3] = 0.9;
        starColors[i3 + 1] = 0.95;
        starColors[i3 + 2] = 1.0; // White star
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 2. Cosmic Filament Rings
    const ringGeo = new THREE.RingGeometry(240, 241, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const celestialRing = new THREE.Mesh(ringGeo, ringMat);
    celestialRing.rotation.x = Math.PI / 3;
    scene.add(celestialRing);

    // Node & Link Group
    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Idle rotation if not dragging and not currently animating camera
      if (!isDraggingRef.current && !cameraTargetRef.current.animating) {
        graphGroup.rotation.y += idleRotationSpeedRef.current;
        starField.rotation.y += idleRotationSpeedRef.current * 0.3;
      }

      // Smooth camera tweening (Prompt 03 & 04)
      if (cameraTargetRef.current.animating) {
        const now = performance.now();
        const elapsed = now - cameraTargetRef.current.startTime;
        const progress = Math.min(1, elapsed / cameraTargetRef.current.duration);

        // Smooth cubic ease-in-out
        const t = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(cameraTargetRef.current.startPos, cameraTargetRef.current.pos, t);
        currentLookAtRef.current.lerpVectors(cameraTargetRef.current.startLookAt, cameraTargetRef.current.lookAt, t);
        camera.lookAt(currentLookAtRef.current);

        if (progress >= 1) {
          cameraTargetRef.current.animating = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse Interaction Handlers
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left click only
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      graphGroup.rotation.y += deltaX * 0.005;
      graphGroup.rotation.x += deltaY * 0.005;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.4;
      camera.position.z = Math.min(900, Math.max(120, camera.position.z + zoomFactor));
    };

    // Raycaster for Node Clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const nodeId = (hitMesh as any).userData?.nodeId;
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          onSelectNode(targetNode);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('click', onClick);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('click', onClick);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [computeConstellationPositions, nodes, onSelectNode]);

  // Rebuild Graph Meshes & Links inside the Three.js scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Find or create GraphGroup
    let graphGroup = scene.children.find(c => c.name === 'GraphGroup') as THREE.Group;
    if (!graphGroup) {
      graphGroup = new THREE.Group();
      graphGroup.name = 'GraphGroup';
      scene.add(graphGroup);
    } else {
      // Clear old meshes
      while (graphGroup.children.length > 0) {
        const obj = graphGroup.children[0];
        graphGroup.remove(obj);
      }
    }

    nodeMeshesRef.current.clear();

    // Ensure positions are computed for all nodes
    let currentPosMap = nodePositionsRef.current;
    if (currentPosMap.size < nodes.length) {
      currentPosMap = computeConstellationPositions();
    }

    // 1. Create Node Spheres with Glow Halos
    nodes.forEach((node) => {
      const rawPos = currentPosMap.get(node.id) || new THREE.Vector3(0, 0, 0);
      const pos = new THREE.Vector3(
        Number.isFinite(rawPos.x) ? rawPos.x : 0,
        Number.isFinite(rawPos.y) ? rawPos.y : 0,
        Number.isFinite(rawPos.z) ? rawPos.z : 0
      );
      const colorHex = GROUP_COLORS[node.group] || '#38bdf8';
      const threeColor = new THREE.Color(colorHex);

      const isSelected = node.id === selectedNodeId;
      const isHighlighted = highlightedNodeIds.includes(node.id);
      const isNewBorn = node.id === newBornNodeId;

      // Base radius
      let radius = 3.6;
      if (isSelected) radius = 6.8;
      else if (isHighlighted) radius = 5.2;

      // Core sphere
      const sphereGeo = new THREE.SphereGeometry(radius, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xffffff : threeColor,
        emissive: isHighlighted || isSelected ? threeColor : threeColor.clone().multiplyScalar(0.4),
        emissiveIntensity: isSelected ? 2.5 : isHighlighted ? 1.8 : 0.8,
        roughness: 0.2,
        metalness: 0.7
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.copy(pos);
      (sphereMesh as any).userData = { nodeId: node.id };

      // Outer luminous corona ring
      const coronaGeo = new THREE.RingGeometry(radius * 1.4, radius * 2.0, 32);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: threeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.75 : isHighlighted ? 0.5 : 0.15
      });
      const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      sphereMesh.add(coronaMesh);

      // Supernova pulse for newly captured notes (Prompt 05)
      if (isNewBorn) {
        const shockwaveGeo = new THREE.RingGeometry(radius * 2.2, radius * 3.5, 32);
        const shockwaveMat = new THREE.MeshBasicMaterial({
          color: 0xec4899,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
        sphereMesh.add(shockwave);
      }

      graphGroup.add(sphereMesh);
      nodeMeshesRef.current.set(node.id, sphereMesh);
    });

    // 2. Create Links Lines
    const linkPositions: number[] = [];
    const linkColors: number[] = [];

    links.forEach((link) => {
      const posA = currentPosMap.get(link.source);
      const posB = currentPosMap.get(link.target);
      if (!posA || !posB) return;
      if (
        !Number.isFinite(posA.x) || !Number.isFinite(posA.y) || !Number.isFinite(posA.z) ||
        !Number.isFinite(posB.x) || !Number.isFinite(posB.y) || !Number.isFinite(posB.z)
      ) {
        return;
      }

      linkPositions.push(posA.x, posA.y, posA.z);
      linkPositions.push(posB.x, posB.y, posB.z);

      const isConnectedToSelected = link.source === selectedNodeId || link.target === selectedNodeId;
      const isConnectedToHighlight = highlightedNodeIds.includes(link.source) && highlightedNodeIds.includes(link.target);

      if (isConnectedToSelected || isConnectedToHighlight) {
        // Bright golden filament
        linkColors.push(0.9, 0.8, 0.2);
        linkColors.push(0.9, 0.8, 0.2);
      } else {
        // Subtle constellation line
        linkColors.push(0.12, 0.18, 0.24);
        linkColors.push(0.12, 0.18, 0.24);
      }
    });

    if (linkPositions.length > 0) {
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
      lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(linkColors, 3));
      lineGeometry.computeBoundingSphere();

      const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.65
      });

      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      graphGroup.add(lines);
      linkLinesRef.current = lines;
    } else {
      linkLinesRef.current = null;
    }

  }, [nodes, links, selectedNodeId, highlightedNodeIds, newBornNodeId, computeConstellationPositions]);

  // Smooth Camera Fly-To Behavior (Prompt 03: The Demo Moment & Prompt 05: Total Recall)
  useEffect(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    // Rule: If 4 or more notes drawn, do NOT fly anywhere! Cluster lighting only (Prompt 03)
    if (clusterMode) {
      return;
    }

    if (selectedNodeId !== null) {
      const targetPos = nodePositionsRef.current.get(selectedNodeId);
      if (!targetPos) return;

      // Position camera offset gracefully in front of the target node
      const cameraDestination = targetPos.clone().add(new THREE.Vector3(0, 15, 90));

      cameraTargetRef.current = {
        pos: cameraDestination,
        lookAt: targetPos.clone(),
        startPos: camera.position.clone(),
        startLookAt: currentLookAtRef.current.clone(),
        startTime: performance.now(),
        duration: 1100,
        animating: true
      };
    }
  }, [selectedNodeId, clusterMode]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Three.js Canvas Container */}
      <div id="galaxy-3d-canvas" ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Subtle Cosmos Coordinates Telemetry Overlay */}
      <div className="absolute top-4 left-6 pointer-events-none flex flex-col gap-1 text-[11px] font-mono text-slate-400 tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-200 font-semibold tracking-widest uppercase">ASTRA CONSTELLATION ENGINE</span>
        </div>
        <div className="text-slate-400 flex items-center gap-3">
          <span>NODES: <strong className="text-slate-200">{nodes.length}</strong></span>
          <span>FILAMENTS: <strong className="text-slate-200">{links.length}</strong></span>
          <span>SECTORS: <strong className="text-slate-200">6</strong></span>
        </div>
      </div>

      {/* Sector Color Legend */}
      <div className="absolute bottom-24 left-6 pointer-events-none hidden md:flex items-center gap-4 bg-slate-950/60 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-800/80 text-[11px] font-mono">
        {Object.entries(GROUP_COLORS).map(([group, color]) => (
          <div key={group} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
            <span className="text-slate-400">{group}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
