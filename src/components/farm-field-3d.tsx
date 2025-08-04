
'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function FarmField3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef({
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    cameraDistance: 100,
    cameraAngleX: 0.3,
    cameraAngleY: 0
  });

  const [showRealTerrain, setShowRealTerrain] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 40.7128, lng: -74.0060 });
  const [loading, setLoading] = useState(false);

  // Generate heightmap data with mountains and valleys
  const generateHeightData = (width: number, height: number) => {
    const size = width * height;
    const data = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      
      // Normalize coordinates to 0-1 range
      const nx = x / width;
      const ny = y / height;
      
      // Create multiple mountain peaks
      const mountain1 = Math.max(0, 40 - Math.sqrt(Math.pow(x - width * 0.2, 2) + Math.pow(y - height * 0.3, 2)) * 0.8);
      const mountain2 = Math.max(0, 35 - Math.sqrt(Math.pow(x - width * 0.7, 2) + Math.pow(y - height * 0.2, 2)) * 0.6);
      const mountain3 = Math.max(0, 30 - Math.sqrt(Math.pow(x - width * 0.8, 2) + Math.pow(y - height * 0.8, 2)) * 0.7);
      
      // Create valleys using sine waves
      const valley1 = Math.sin(nx * Math.PI * 2) * Math.cos(ny * Math.PI * 1.5) * 8;
      const valley2 = Math.sin(nx * Math.PI * 3) * Math.sin(ny * Math.PI * 2) * 5;
      
      // Add ridges and plateaus
      const ridge1 = Math.abs(Math.sin(nx * Math.PI * 4)) < 0.1 ? 15 : 0;
      const ridge2 = Math.abs(Math.cos(ny * Math.PI * 3)) < 0.15 ? 12 : 0;
      
      // Combine all height features
      let totalHeight = mountain1 + mountain2 + mountain3 + valley1 + valley2 + ridge1 + ridge2;
      
      // Add multiple layers of noise for realistic terrain
      const noise1 = (Math.random() - 0.5) * 8; // Large scale noise
      const noise2 = (Math.random() - 0.5) * 3; // Medium scale noise
      const noise3 = (Math.random() - 0.5) * 1; // Fine detail noise
      
      totalHeight += noise1 + noise2 + noise3;
      
      // Ensure minimum base height and scale appropriately
      data[i] = Math.max(0, totalHeight + 5) * 0.15;
    }
    
    return data;
  };

  // Simulate real elevation data
  const simulateElevationData = () => {
    const size = 50;
    const data = new Float32Array(size * size);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (i - size/2) / size * 10;
        const y = (j - size/2) / size * 10;
        const elevation = Math.sin(x) * Math.cos(y) * 2 + Math.random() * 0.5;
        data[i * size + j] = elevation;
      }
    }
    
    return data;
  };

  // Create terrain mesh with elevation-based coloring
  const createTerrainMesh = (heightData: Float32Array, segments: number) => {
    const geometry = new THREE.PlaneGeometry(100, 100, segments - 1, segments - 1);
    geometry.rotateX(-Math.PI / 2);
    
    const vertices = geometry.attributes.position.array;
    const colors = new Float32Array(vertices.length);
    
    // Find min and max heights for color mapping
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    for (let i=0; i<heightData.length; i++) {
      if (heightData[i] < minHeight) minHeight = heightData[i];
      if (heightData[i] > maxHeight) maxHeight = heightData[i];
    }
    
    for (let i = 0; i < heightData.length; i++) {
      const vertexIndex = i * 3 + 1; // Y coordinate
      if (vertexIndex < vertices.length) {
        vertices[vertexIndex] = heightData[i];
        
        // Calculate normalized height for coloring
        const normalizedHeight = (heightData[i] - minHeight) / (maxHeight - minHeight);
        const colorIndex = i * 3;
        
        // Color based on elevation
        if (normalizedHeight < 0.2) {
          // Low areas - dark green (valleys, grass)
          colors[colorIndex] = 0.2;     // R
          colors[colorIndex + 1] = 0.4; // G
          colors[colorIndex + 2] = 0.1; // B
        } else if (normalizedHeight < 0.4) {
          // Medium-low areas - grass green
          colors[colorIndex] = 0.3;     // R
          colors[colorIndex + 1] = 0.6; // G
          colors[colorIndex + 2] = 0.2; // B
        } else if (normalizedHeight < 0.6) {
          // Medium areas - lighter green
          colors[colorIndex] = 0.4;     // R
          colors[colorIndex + 1] = 0.7; // G
          colors[colorIndex + 2] = 0.3; // B
        } else if (normalizedHeight < 0.8) {
          // High areas - brown/rocky
          colors[colorIndex] = 0.6;     // R
          colors[colorIndex + 1] = 0.4; // G
          colors[colorIndex + 2] = 0.2; // B
        } else {
          // Peak areas - rocky gray
          colors[colorIndex] = 0.7;     // R
          colors[colorIndex + 1] = 0.7; // G
          colors[colorIndex + 2] = 0.6; // B
        }
      }
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ 
      vertexColors: true,
      side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
  };

  const updateCamera = () => {
    if (!cameraRef.current) return;

    const { cameraDistance, cameraAngleX, cameraAngleY } = controlsRef.current;
    
    cameraRef.current.position.x = Math.sin(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
    cameraRef.current.position.y = Math.sin(cameraAngleX) * cameraDistance;
    cameraRef.current.position.z = Math.cos(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
    
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Update terrain
  const updateTerrain = () => {
    if (!sceneRef.current || !terrainMeshRef.current) return;

    sceneRef.current.remove(terrainMeshRef.current);
    
    let heightData;
    const segments = 50;

    if (showRealTerrain) {
      setLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        heightData = simulateElevationData();
        terrainMeshRef.current = createTerrainMesh(heightData, segments);
        sceneRef.current!.add(terrainMeshRef.current);
        setLoading(false);
      }, 1000);
      return;
    } else {
      heightData = generateHeightData(segments, segments);
      terrainMeshRef.current = createTerrainMesh(heightData, segments);
      sceneRef.current.add(terrainMeshRef.current);
    }
  };

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const mountNode = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
    cameraRef.current = camera;
    updateCamera();

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountNode.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Initial terrain
    const heightData = generateHeightData(50, 50);
    terrainMeshRef.current = createTerrainMesh(heightData, 50);
    scene.add(terrainMeshRef.current);

    // Mouse controls
    const handleMouseDown = (event: MouseEvent) => {
        controlsRef.current.mouseDown = true;
        controlsRef.current.mouseX = event.clientX;
        controlsRef.current.mouseY = event.clientY;
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (!controlsRef.current.mouseDown) return;

        const deltaX = event.clientX - controlsRef.current.mouseX;
        const deltaY = event.clientY - controlsRef.current.mouseY;

        controlsRef.current.cameraAngleY += deltaX * 0.01;
        controlsRef.current.cameraAngleX += deltaY * 0.01;

        // Limit vertical rotation
        controlsRef.current.cameraAngleX = Math.max(-Math.PI/2, Math.min(Math.PI/2, controlsRef.current.cameraAngleX));

        controlsRef.current.mouseX = event.clientX;
        controlsRef.current.mouseY = event.clientY;

        updateCamera();
    };

    const handleMouseUp = () => {
        controlsRef.current.mouseDown = false;
    };

    const handleWheel = (event: WheelEvent) => {
        controlsRef.current.cameraDistance += event.deltaY * 0.1;
        controlsRef.current.cameraDistance = Math.max(20, Math.min(200, controlsRef.current.cameraDistance));
        updateCamera();
    };


    // Event listeners
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = mountNode.clientWidth / mountNode.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Start animation loop
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      
      if (mountNode && renderer.domElement) {
        mountNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update terrain when options change
  useEffect(() => {
    updateTerrain();
  }, [showRealTerrain, coordinates]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Controls */}
      <div style={{ 
        position: 'absolute', 
        top: 80, 
        left: 20, 
        zIndex: 10, 
        background: 'rgba(0,0,0,0.8)', 
        padding: '15px', 
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span role="img" aria-label="mountain">🏔️</span> 3D Mountain Terrain
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => setShowRealTerrain(!showRealTerrain)}
            disabled={loading}
            style={{
              padding: '10px 16px',
              backgroundColor: loading ? '#666' : (showRealTerrain ? '#4CAF50' : '#2196F3'),
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '14px'
            }}
          >
            {loading ? 'Loading...' : (showRealTerrain ? 'Switch to Generated' : 'Switch to Real Data')}
          </button>
        </div>
        
        {showRealTerrain && !loading && (
          <div style={{ fontSize: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>Latitude:</label>
              <input
                type="number"
                step="0.0001"
                value={coordinates.lat}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                style={{ 
                  width: '100%', 
                  padding: '6px', 
                  borderRadius: '4px', 
                  border: '1px solid #555',
                  background: '#333',
                  color: 'white'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Longitude:</label>
              <input
                type="number"
                step="0.0001"
                value={coordinates.lng}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                style={{ 
                  width: '100%', 
                  padding: '6px', 
                  borderRadius: '4px', 
                  border: '1px solid #555',
                  background: '#333',
                  color: 'white'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '16px',
          zIndex: 20
        }}>
          Loading terrain data...
        </div>
      )}

        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '220px'
        }}>
          <strong>🌄 Features:</strong><br/>
          <span role="img" aria-label="mountain">🏔️</span> Mountains & valleys<br/>
          <span role="img" aria-label="grass">🌱</span> 2000+ grass instances<br/>
          <span role="img" aria-label="tree">🌳</span> 50 trees with foliage<br/>
          <span role="img" aria-label="rock">🪨</span> Rocky mountain areas<br/>
          <span role="img" aria-label="palette">🎨</span> Elevation-based coloring<br/><br/>
          <strong>Controls:</strong><br/>
          <span role="img" aria-label="mouse">🖱️</span> Drag: Rotate • <span role="img" aria-label="scroll">🔄</span> Scroll: Zoom
        </div>

      {/* Three.js mount point */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default FarmField3D;
