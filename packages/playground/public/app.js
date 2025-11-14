/**
 * Gati Playground - Three.js Application
 * 3D visualization of API request lifecycle
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Configuration - dynamically detect current port
const getCurrentPort = async () => {
  // Use the current window location port first
  const windowPort = window.location.port;
  if (windowPort) {
    return windowPort;
  }
  
  try {
    // Try to read the port from the .gati/last-port.txt file via API
    const response = await fetch('/playground/api/port');
    if (response.ok) {
      const data = await response.json();
      return data.port || '3000';
    }
  } catch (error) {
    console.warn('Failed to get port from API:', error);
  }
  
  // Fallback to default
  return '3000';
};

const CONFIG = {
  WS_URL: 'ws://localhost:8080',
  API_BASE: 'http://localhost:3000', // Will be updated dynamically
};

// Application state
const state = {
  mode: 'go', // 'go' or 'debug'
  viewMode: 'block', // 'block' or 'outline'
  selectedRoute: null,
  ws: null,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  nodes: new Map(), // nodeId -> mesh
  particles: [], // Active request particles
  routes: [],
  instances: [],
  playgroundId: `playground_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, // Unique ID for this playground instance
};

/**
 * Initialize Three.js scene
 */
function initScene() {
  const container = document.getElementById('canvas-container');
  
  // Scene
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x0a0e27);
  state.scene.fog = new THREE.Fog(0x0a0e27, 10, 50);

  // Camera
  state.camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  state.camera.position.set(0, 10, 20);

  // Renderer
  state.renderer = new THREE.WebGLRenderer({ antialias: true });
  state.renderer.setSize(container.clientWidth, container.clientHeight);
  state.renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(state.renderer.domElement);

  // Controls
  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.05;

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  state.scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  state.scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x667eea, 2, 50);
  pointLight.position.set(0, 5, 0);
  state.scene.add(pointLight);

  // Grid helper
  const gridHelper = new THREE.GridHelper(50, 50, 0x2a3050, 0x1a1f3a);
  state.scene.add(gridHelper);

  // Resize handler
  window.addEventListener('resize', () => {
    state.camera.aspect = container.clientWidth / container.clientHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(container.clientWidth, container.clientHeight);
  });
  
  // Click handler for debug mode
  state.renderer.domElement.addEventListener('click', onCanvasClick);
}

/**
 * Handle canvas clicks for breakpoint setting
 */
function onCanvasClick(event) {
  if (state.mode !== 'debug') return;
  
  const rect = state.renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, state.camera);
  
  const intersects = raycaster.intersectObjects(Array.from(state.nodes.values()));
  
  if (intersects.length > 0) {
    const node = intersects[0].object;
    if (node.userData) {
      toggleBreakpoint(node.userData.nodeId, node.userData.nodeType, node);
    }
  }
}

/**
 * Toggle breakpoint on a node
 */
function toggleBreakpoint(nodeId, nodeType, node) {
  const breakpointId = `bp_${nodeId}`;
  
  // Check if breakpoint already exists
  const hasBreakpoint = node.userData.hasBreakpoint;
  
  if (hasBreakpoint) {
    // Remove breakpoint
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: 'breakpoint:remove',
        payload: breakpointId
      }));
    }
    
    node.userData.hasBreakpoint = false;
    node.material.color.setHex(getNodeColor(nodeType));
    console.log('Breakpoint removed:', nodeId);
  } else {
    // Set breakpoint
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: 'breakpoint:set',
        payload: {
          id: breakpointId,
          nodeId: nodeId,
          nodeType: nodeType,
          enabled: true
        }
      }));
    }
    
    node.userData.hasBreakpoint = true;
    node.material.color.setHex(0xff6b6b); // Light red for breakpoint
    console.log('Breakpoint set:', nodeId);
  }
}

/**
 * Get default color for node type
 */
function getNodeColor(nodeType) {
  const colors = {
    middleware: 0x3b82f6,
    handler: 0x22c55e,
    module: 0xf59e0b,
  };
  return colors[nodeType] || 0x8b5cf6;
}

/**
 * Create a node (middleware/handler/module) in the scene
 */
function createNode(type, name, position) {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  
  // Color based on type
  const colors = {
    middleware: 0x3b82f6,
    handler: 0x22c55e,
    module: 0xf59e0b,
  };

  const material = new THREE.MeshStandardMaterial({
    color: colors[type] || 0x8b5cf6,
    emissive: colors[type] || 0x8b5cf6,
    emissiveIntensity: 0.2,
    metalness: 0.5,
    roughness: 0.5,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);

  // Add label
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  context.fillStyle = '#ffffff';
  context.font = '24px Arial';
  context.textAlign = 'center';
  context.fillText(name, 128, 40);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(0, 2, 0);
  sprite.scale.set(4, 1, 1);
  mesh.add(sprite);

  state.scene.add(mesh);
  return mesh;
}

/**
 * Create a request particle
 */
function createPacket() {
  const geometry = new THREE.SphereGeometry(0.4, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x667eea,
    emissiveIntensity: 1.5,
    metalness: 0.8,
    roughness: 0.2,
  });

  const particle = new THREE.Mesh(geometry, material);
  
  // Start position based on view mode
  if (state.viewMode === 'outline') {
    particle.position.set(-16, 0, 0.5);
  } else {
    particle.position.set(-16, 2, -3);
  }

  // Add glow effect
  const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x667eea,
    transparent: true,
    opacity: 0.4,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  particle.add(glow);

  // Add trail effect
  const trailGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const trailMaterial = new THREE.MeshBasicMaterial({
    color: 0x667eea,
    transparent: true,
    opacity: 0.6,
  });
  const trail = new THREE.Mesh(trailGeometry, trailMaterial);
  trail.position.set(-0.5, 0, 0);
  particle.add(trail);

  state.scene.add(particle);
  return particle;
}

/**
 * Animate particle through nodes
 */
async function animatePacket(particle, nodes) {
  for (const node of nodes) {
    await animateToPosition(particle, node.position);
    
    // Node activation effect
    node.material.emissiveIntensity = 1;
    await new Promise(resolve => setTimeout(resolve, 200));
    node.material.emissiveIntensity = 0.2;
  }

  // Remove particle
  state.scene.remove(particle);
}

/**
 * Animate mesh to position
 */
function animateToPosition(mesh, target) {
  return new Promise(resolve => {
    const start = mesh.position.clone();
    const end = target.clone();
    const duration = 1000; // ms
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      mesh.position.lerpVectors(start, end, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    animate();
  });
}

/**
 * Render loop
 */
function animate() {
  requestAnimationFrame(animate);

  // No auto-rotation - user controls only
  
  // Update controls
  if (state.controls) {
    state.controls.update();
  }

  // Render
  if (state.renderer && state.scene && state.camera) {
    state.renderer.render(state.scene, state.camera);
  }
}

/**
 * Initialize WebSocket connection
 */
function initWebSocket() {
  // WebSocket disabled for now - will be implemented in future versions
  console.log('WebSocket disabled - using HTTP-only mode');
  updateConnectionStatus(false);
  return;
  
  try {
    const ws = new WebSocket(CONFIG.WS_URL);
    state.ws = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      updateConnectionStatus(false);
      
      // Reconnect after 3 seconds
      setTimeout(initWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateConnectionStatus(false);
    };
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    updateConnectionStatus(false);
  }
}

/**
 * Handle WebSocket message
 */
function handleWebSocketMessage(message) {
  if (message.type === 'event') {
    const event = message.payload;
    
    switch (event.type) {
      case 'request:start':
        handleRequestStart(event);
        break;
      case 'middleware:enter':
      case 'handler:enter':
      case 'module:call':
        handleNodeEnter(event);
        break;
      case 'middleware:exit':
      case 'handler:exit':
        handleNodeExit(event);
        break;
      case 'request:end':
        handleRequestEnd(event);
        break;
      case 'error:thrown':
        handleError(event);
        break;
      case 'breakpoint:hit':
        handleBreakpoint(event);
        break;
    }
  }
}

/**
 * Handle request start event
 */
function handleRequestStart(event) {
  console.log('Request started:', event.traceId);
  
  if (state.mode === 'go') {
    const packet = createPacket();
    state.particles.push({ packet, traceId: event.traceId });
    
    // Animate packet through nodes
    const nodes = Array.from(state.nodes.values());
    if (nodes.length > 0) {
      animatePacket(packet, nodes);
    }
  }

  updateStats();
}

/**
 * Handle node entry
 */
function handleNodeEnter(event) {
  if (state.nodes.has(event.nodeId)) {
    const node = state.nodes.get(event.nodeId);
    node.material.emissiveIntensity = 1;
    
    // In debug mode, check for breakpoints
    if (state.mode === 'debug') {
      // Pause animation and highlight node
      node.material.color.setHex(0xff0000); // Red for breakpoint
    }
  }
}

/**
 * Handle node exit
 */
function handleNodeExit(event) {
  if (state.nodes.has(event.nodeId)) {
    const node = state.nodes.get(event.nodeId);
    node.material.emissiveIntensity = 0.2;
    
    // Reset color
    const colors = {
      middleware: 0x3b82f6,
      handler: 0x22c55e,
      module: 0xf59e0b,
    };
    node.material.color.setHex(colors[event.nodeType] || 0x8b5cf6);
  }
}

/**
 * Handle error events
 */
function handleError(event) {
  console.error('Request error:', event.data.error);
  
  if (event.nodeId && state.nodes.has(event.nodeId)) {
    const node = state.nodes.get(event.nodeId);
    node.material.color.setHex(0xff0000); // Red for error
    node.material.emissiveIntensity = 1;
    
    // Flash effect
    setTimeout(() => {
      node.material.emissiveIntensity = 0.2;
    }, 1000);
  }
}

/**
 * Handle breakpoint hit
 */
function handleBreakpoint(event) {
  console.log('Breakpoint hit:', event.nodeId);
  
  if (state.nodes.has(event.nodeId)) {
    const node = state.nodes.get(event.nodeId);
    node.material.color.setHex(0xffff00); // Yellow for breakpoint
    node.material.emissiveIntensity = 1;
  }
  
  // Show debug controls
  showDebugControls(event.traceId);
}

/**
 * Show debug controls
 */
function showDebugControls(traceId) {
  // This would show step/resume buttons in the UI
  console.log('Debug controls for trace:', traceId);
}

/**
 * Handle request end
 */
function handleRequestEnd(event) {
  console.log('Request ended:', event.traceId, `${event.duration}ms`);
  
  // Remove particle for this trace
  state.particles = state.particles.filter(p => p.traceId !== event.traceId);
  
  updateStats();
}

/**
 * Update connection status UI
 */
function updateConnectionStatus(connected) {
  const status = document.getElementById('ws-status');
  if (connected) {
    status.classList.remove('disconnected');
    status.querySelector('span:last-child').textContent = 'Connected';
  } else {
    status.classList.add('disconnected');
    status.querySelector('span:last-child').textContent = 'HTTP Mode';
  }
}

/**
 * Update stats display
 */
function updateStats() {
  // This would pull from actual state
  document.getElementById('request-count').textContent = '0';
  document.getElementById('avg-response').textContent = '0ms';
  document.getElementById('active-traces').textContent = state.particles.length;
}

/**
 * Load routes from API
 */
async function loadRoutes() {
  // Set default routes first to avoid loading issues
  state.routes = [
    { id: '1', method: 'GET', path: '/hello', handlerName: 'hello' },
    { id: '2', method: 'GET', path: '/users/:id', handlerName: 'getUser' },
    { id: '3', method: 'GET', path: '/playground', handlerName: 'playground' }
  ];
  
  // Get the correct port and set API base
  const currentPort = await getCurrentPort();
  CONFIG.API_BASE = `http://localhost:${currentPort}`;
  console.log('Using API base:', CONFIG.API_BASE);
  
  // Try to load routes from API
  try {
    const response = await fetch(`${CONFIG.API_BASE}/playground/api/routes`);
    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        state.routes = data.routes;
        console.log('Loaded routes from API:', state.routes);
      }
    }
  } catch (error) {
    console.warn('Failed to load routes from API, using defaults:', error);
  }
  
  renderRoutes();
  
  // Load instances for dropdown
  try {
    await loadInstances();
  } catch (error) {
    console.warn('Failed to load instances:', error);
  }
  
  // Always build visualization and hide loading
  buildVisualization();
}

/**
 * Load instances from API
 */
async function loadInstances() {
  // Always set the current instance based on detected port
  state.instances = [{
    id: 'local',
    baseUrl: CONFIG.API_BASE,
    region: 'local',
    health: 'healthy'
  }];
  
  try {
    const response = await fetch(`${CONFIG.API_BASE}/playground/api/instances`);
    if (response.ok) {
      const data = await response.json();
      if (data.instances && data.instances.length > 0) {
        // Update instances from API but ensure baseUrl uses correct port
        state.instances = data.instances.map(instance => ({
          ...instance,
          baseUrl: instance.baseUrl.replace(/localhost:\d+/, `localhost:${CONFIG.API_BASE.split(':')[2]}`)
        }));
        console.log('Loaded instances from API:', state.instances);
      }
    }
  } catch (error) {
    console.warn('Failed to load instances from API, using default:', error);
  }
  
  console.log('Loaded instances:', state.instances);
  renderInstances();
}

/**
 * Render instances in dropdown
 */
function renderInstances() {
  const select = document.getElementById('instance-select');
  select.innerHTML = '';
  
  state.instances.forEach(instance => {
    const option = document.createElement('option');
    option.value = instance.baseUrl;
    option.textContent = `${instance.id} (${instance.region}) - ${instance.health}`;
    select.appendChild(option);
  });
  
  // Add localhost as fallback
  if (state.instances.length === 0) {
    const option = document.createElement('option');
    option.value = CONFIG.API_BASE;
    option.textContent = `${CONFIG.API_BASE.replace('http://', '')} (local)`;
    select.appendChild(option);
  }
}

/**
 * Render routes in sidebar
 */
function renderRoutes() {
  const container = document.getElementById('route-list');
  container.innerHTML = '';

  state.routes.forEach((route, index) => {
    const item = document.createElement('div');
    item.className = 'route-item';
    item.dataset.routeId = route.id;
    item.innerHTML = `
      <span class="route-method ${route.method.toLowerCase()}">${route.method}</span>
      <span class="route-path">${route.path}</span>
    `;
    item.onclick = () => selectRoute(route);
    container.appendChild(item);
  });
}

/**
 * Select a route
 */
function selectRoute(route) {
  state.selectedRoute = route;
  
  // Update UI
  document.querySelectorAll('.route-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.routeId === route.id);
  });

  // Update request builder
  document.getElementById('method-select').value = route.method;
  document.getElementById('path-input').value = route.path;
}

/**
 * Build 3D visualization from routes
 */
function buildVisualization() {
  if (state.viewMode === 'outline') {
    buildOutlineView();
  } else {
    buildBlockView();
  }
  
  // Hide loading overlay
  document.getElementById('loading').classList.add('hidden');
}

/**
 * Build block view (3D cubes)
 */
function buildBlockView() {
  // Clear existing nodes
  state.nodes.forEach(node => state.scene.remove(node));
  state.nodes.clear();
  
  // Create nodes in a more organized layout
  const middleware1 = createNode('middleware', 'Trace', { x: -12, y: 2, z: -3 });
  const middleware2 = createNode('middleware', 'Instrumentation', { x: -8, y: 2, z: -3 });
  const middleware3 = createNode('middleware', 'CORS', { x: -4, y: 2, z: -3 });
  const middleware4 = createNode('middleware', 'Auth', { x: 0, y: 2, z: -3 });
  const handler = createNode('handler', 'Handler', { x: 4, y: 2, z: 0 });
  const module1 = createNode('module', 'Database', { x: 8, y: 2, z: 3 });
  const module2 = createNode('module', 'Cache', { x: 12, y: 2, z: 3 });

  state.nodes.set('middleware_trace', middleware1);
  state.nodes.set('middleware_instrumentation', middleware2);
  state.nodes.set('middleware_cors', middleware3);
  state.nodes.set('middleware_auth', middleware4);
  state.nodes.set('handler_main', handler);
  state.nodes.set('module_database', module1);
  state.nodes.set('module_cache', module2);
  
  // Add metadata for interactions
  const nodes = [middleware1, middleware2, middleware3, middleware4, handler, module1, module2];
  const nodeIds = ['middleware_trace', 'middleware_instrumentation', 'middleware_cors', 'middleware_auth', 'handler_main', 'module_database', 'module_cache'];
  const nodeTypes = ['middleware', 'middleware', 'middleware', 'middleware', 'handler', 'module', 'module'];
  
  nodes.forEach((node, index) => {
    node.userData = { 
      nodeId: nodeIds[index],
      nodeType: nodeTypes[index]
    };
  });
}

/**
 * Build outline view (2.5D flowchart)
 */
function buildOutlineView() {
  // Clear existing nodes
  state.nodes.forEach(node => state.scene.remove(node));
  state.nodes.clear();
  
  // Create flat, card-like nodes
  const middleware1 = createOutlineNode('middleware', 'Trace', { x: -12, y: 0, z: 0 });
  const middleware2 = createOutlineNode('middleware', 'Instrumentation', { x: -8, y: 0, z: 0 });
  const middleware3 = createOutlineNode('middleware', 'CORS', { x: -4, y: 0, z: 0 });
  const middleware4 = createOutlineNode('middleware', 'Auth', { x: 0, y: 0, z: 0 });
  const handler = createOutlineNode('handler', 'Handler', { x: 4, y: 0, z: 0 });
  const module1 = createOutlineNode('module', 'Database', { x: 8, y: 0, z: 0 });
  const module2 = createOutlineNode('module', 'Cache', { x: 12, y: 0, z: 0 });

  state.nodes.set('middleware_trace', middleware1);
  state.nodes.set('middleware_instrumentation', middleware2);
  state.nodes.set('middleware_cors', middleware3);
  state.nodes.set('middleware_auth', middleware4);
  state.nodes.set('handler_main', handler);
  state.nodes.set('module_database', module1);
  state.nodes.set('module_cache', module2);
  
  // Add connecting lines
  createConnectionLines();
  
  // Set camera for 2.5D view
  state.camera.position.set(0, 15, 10);
  state.camera.lookAt(0, 0, 0);
}

/**
 * Create outline node (flat card)
 */
function createOutlineNode(type, name, position) {
  const geometry = new THREE.PlaneGeometry(3, 1.5);
  
  const colors = {
    middleware: 0x3b82f6,
    handler: 0x22c55e,
    module: 0xf59e0b,
  };

  const material = new THREE.MeshBasicMaterial({
    color: colors[type] || 0x8b5cf6,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  
  // Add border
  const borderGeometry = new THREE.EdgesGeometry(geometry);
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const border = new THREE.LineSegments(borderGeometry, borderMaterial);
  mesh.add(border);

  // Add text label
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  context.fillStyle = '#ffffff';
  context.font = 'bold 24px Arial';
  context.textAlign = 'center';
  context.fillText(name, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(0, 0, 0.1);
  sprite.scale.set(2.5, 1.25, 1);
  mesh.add(sprite);

  state.scene.add(mesh);
  return mesh;
}

/**
 * Create connection lines between nodes
 */
function createConnectionLines() {
  const points = [
    new THREE.Vector3(-12, 0, 0),
    new THREE.Vector3(-8, 0, 0),
    new THREE.Vector3(-4, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(4, 0, 0),
    new THREE.Vector3(8, 0, 0),
    new THREE.Vector3(12, 0, 0),
  ];
  
  for (let i = 0; i < points.length - 1; i++) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      points[i],
      points[i + 1]
    ]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0x667eea,
      transparent: true,
      opacity: 0.6
    });
    const line = new THREE.Line(geometry, material);
    state.scene.add(line);
  }
}

/**
 * Send request
 */
async function sendRequest() {
  const instance = document.getElementById('instance-select').value;
  const method = document.getElementById('method-select').value;
  const path = document.getElementById('path-input').value;
  
  let headers = {};
  let body = null;

  try {
    headers = JSON.parse(document.getElementById('headers-input').value || '{}');
  } catch (e) {
    alert('Invalid headers JSON');
    return;
  }

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = document.getElementById('body-input').value || null;
      if (body) JSON.parse(body); // Validate
    } catch (e) {
      alert('Invalid body JSON');
      return;
    }
  }

  const url = instance + path;
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Add playground headers for request tracking
  headers['x-gati-playground'] = 'true';
  headers['x-gati-playground-id'] = state.playgroundId;
  headers['x-trace-id'] = traceId;
  
  // Subscribe to this trace for real-time updates
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify({
      type: 'subscribe',
      traceId: traceId
    }));
  }

  try {
    console.log('Sending request:', { method, url, headers, body });
    
    // Trigger particle animation since WebSocket is disabled
    if (state.mode === 'go') {
      const packet = createPacket();
      state.particles.push({ packet, traceId });
      
      // Animate packet through nodes
      const nodes = Array.from(state.nodes.values());
      if (nodes.length > 0) {
        animatePacket(packet, nodes);
      }
    }
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body && ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
      mode: 'cors',
    });

    const duration = Date.now() - startTime;
    let responseData;
    
    try {
      responseData = await response.text();
    } catch (e) {
      responseData = 'Failed to read response body';
    }
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData,
      duration: `${duration}ms`
    });
    
    // Show response in UI
    showResponse({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData,
      duration
    });
    
  } catch (error) {
    console.error('Request failed:', error);
    
    // More detailed error message
    let errorMessage = 'Request failed: ';
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage += 'Network error - check if server is running on ' + url;
    } else {
      errorMessage += error.message;
    }
    
    alert(errorMessage);
  } finally {
    // Unsubscribe from trace after a delay
    setTimeout(() => {
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify({
          type: 'unsubscribe',
          traceId: traceId
        }));
      }
    }, 5000);
  }
}

/**
 * Show response in UI
 */
function showResponse(response) {
  console.log('Response received:', response);
  
  // Update stats with response info
  const statusElement = document.querySelector('.stat-value');
  if (statusElement) {
    statusElement.textContent = `${response.status} (${response.duration}ms)`;
  }
  
  // Show success/error visual feedback
  if (response.status >= 200 && response.status < 300) {
    console.log('✅ Request successful');
  } else {
    console.log('❌ Request failed with status:', response.status);
  }
}

/**
 * Initialize UI event handlers
 */
function initUI() {
  // Mode toggle (go/debug)
  document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      state.mode = mode;
      
      document.querySelectorAll('.mode-btn[data-mode]').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
    });
  });
  
  // View mode toggle (block/outline)
  document.querySelectorAll('.mode-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      state.viewMode = view;
      
      document.querySelectorAll('.mode-btn[data-view]').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      
      // Rebuild visualization with new view
      buildVisualization();
    });
  });

  // Send request button
  document.getElementById('send-request').addEventListener('click', sendRequest);

  // Route search
  document.getElementById('route-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.route-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? 'block' : 'none';
    });
  });
}

/**
 * Initialize application
 */
async function init() {
  console.log('Initializing Gati Playground...');
  
  initScene();
  initUI();
  initWebSocket();
  
  await loadRoutes();
  
  animate();
  
  console.log('Gati Playground initialized');
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
