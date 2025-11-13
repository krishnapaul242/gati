/**
 * Gati Playground Demo
 */

import { createApp, createCorsMiddleware, type Handler } from '@gati-framework/runtime';
import { 
  PlaygroundEngine,
  PlaygroundWebSocketServer,
  createPlaygroundIntegration
} from '@gati-framework/playground';

// Simple UI handler
const servePlaygroundUI: Handler = (_req, res) => {
  res.header('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Gati Playground</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; overflow: hidden; }
    .container { display: flex; height: 100vh; }
    .sidebar { width: 300px; background: #1a1a1a; border-right: 1px solid #333; overflow-y: auto; }
    .main { flex: 1; position: relative; }
    .right-panel { width: 400px; background: #1a1a1a; border-left: 1px solid #333; overflow-y: auto; }
    .sidebar h3, .right-panel h3 { padding: 15px; background: #2a2a2a; margin: 0; }
    .route { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #333; }
    .route:hover { background: #2a2a2a; }
    .route.active { background: #0066cc; }
    .method { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; }
    .get { background: #28a745; }
    .post { background: #007bff; }
    .put { background: #ffc107; color: #000; }
    .delete { background: #dc3545; }
    .panel-content { padding: 15px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, textarea, select { width: 100%; padding: 8px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px; }
    button { background: #0066cc; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0052a3; }
    .response { background: #2a2a2a; padding: 10px; border-radius: 4px; margin-top: 10px; }
    #canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <h3>🚀 API Routes</h3>
      <div class="route active" onclick="selectRoute('/ping', 'GET')">
        <span class="method get">GET</span> /ping
      </div>
      <div class="route" onclick="selectRoute('/api/hello', 'GET')">
        <span class="method get">GET</span> /api/hello
      </div>
      <div class="route" onclick="selectRoute('/api/users/:id', 'GET')">
        <span class="method get">GET</span> /api/users/:id
      </div>
      <div class="route" onclick="selectRoute('/api/health', 'GET')">
        <span class="method get">GET</span> /api/health
      </div>
    </div>
    
    <div class="main">
      <canvas id="canvas"></canvas>
    </div>
    
    <div class="right-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #2a2a2a;">
        <h3 style="margin: 0;">🎯 Request</h3>
        <div>
          <button id="goMode" onclick="setMode('go')" style="margin-right: 5px; background: #28a745;">⚡ Go</button>
          <button id="debugMode" onclick="setMode('debug')" style="background: #dc3545;">🐛 Debug</button>
        </div>
      </div>
      <div class="panel-content">
        <div class="form-group">
          <label>Method & URL</label>
          <div style="display: flex; gap: 10px;">
            <select id="method" style="width: 80px;">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input id="url" value="/ping" />
          </div>
        </div>
        
        <div class="form-group">
          <label>Headers</label>
          <textarea id="headers" rows="3" placeholder='{"Content-Type": "application/json"}'></textarea>
        </div>
        
        <div class="form-group">
          <label>Body</label>
          <textarea id="body" rows="4" placeholder="Request body (JSON)"></textarea>
        </div>
        
        <button onclick="sendRequest()">Send Request</button>
        
        <div class="response" id="response" style="display: none;">
          <h4>Response:</h4>
          <pre id="responseContent"></pre>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Three.js scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), alpha: true });
    
    function resizeRenderer() {
      const main = document.querySelector('.main');
      renderer.setSize(main.clientWidth, main.clientHeight);
      camera.aspect = main.clientWidth / main.clientHeight;
      camera.updateProjectionMatrix();
    }
    
    resizeRenderer();
    window.addEventListener('resize', resizeRenderer);
    
    // Create request flow visualization
    scene.background = new THREE.Color(0x0a0a0a);
    
    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x333333, 0x333333);
    scene.add(gridHelper);
    
    // Node types: middleware (blue), handlers (green), modules (orange)
    const middlewareGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const handlerGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const moduleGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    
    const middlewareMaterial = new THREE.MeshBasicMaterial({ color: 0x007bff });
    const handlerMaterial = new THREE.MeshBasicMaterial({ color: 0x28a745 });
    const moduleMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    
    const nodes = [];
    
    // Create middleware nodes
    const corsNode = new THREE.Mesh(middlewareGeometry, middlewareMaterial);
    corsNode.position.set(-3, 0, 0);
    corsNode.userData = { type: 'middleware', name: 'CORS' };
    scene.add(corsNode);
    nodes.push(corsNode);
    
    // Create handler nodes
    const pingHandler = new THREE.Mesh(handlerGeometry, handlerMaterial);
    pingHandler.position.set(0, 0, 0);
    pingHandler.userData = { type: 'handler', name: '/ping' };
    scene.add(pingHandler);
    nodes.push(pingHandler);
    
    const helloHandler = new THREE.Mesh(handlerGeometry, handlerMaterial);
    helloHandler.position.set(3, 0, 0);
    helloHandler.userData = { type: 'handler', name: '/api/hello' };
    scene.add(helloHandler);
    nodes.push(helloHandler);
    
    camera.position.z = 5;
    
    // Request particle system
    const particles = [];
    
    function createRequestParticle() {
      const geometry = new THREE.SphereGeometry(0.05, 8, 6);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(-5, 0, 0);
      scene.add(particle);
      particles.push(particle);
      
      // Animate particle through nodes
      let nodeIndex = 0;
      const animateParticle = () => {
        if (nodeIndex < nodes.length) {
          const target = nodes[nodeIndex];
          particle.position.lerp(target.position, 0.1);
          
          if (particle.position.distanceTo(target.position) < 0.1) {
            nodeIndex++;
          }
          
          requestAnimationFrame(animateParticle);
        } else {
          scene.remove(particle);
          particles.splice(particles.indexOf(particle), 1);
        }
      };
      animateParticle();
    }
    
    function animate() {
      requestAnimationFrame(animate);
      
      nodes.forEach(node => {
        node.rotation.y += 0.005;
      });
      
      renderer.render(scene, camera);
    }
    
    animate();
    
    // Mode management
    let currentMode = 'go';
    
    function setMode(mode) {
      currentMode = mode;
      document.getElementById('goMode').style.background = mode === 'go' ? '#28a745' : '#555';
      document.getElementById('debugMode').style.background = mode === 'debug' ? '#dc3545' : '#555';
      
      if (mode === 'debug') {
        // Enable node clicking for breakpoints
        nodes.forEach(node => {
          node.userData.clickable = true;
        });
      }
    }
    
    // API interaction
    function selectRoute(path, method) {
      document.querySelectorAll('.route').forEach(r => r.classList.remove('active'));
      event.target.closest('.route').classList.add('active');
      document.getElementById('method').value = method;
      document.getElementById('url').value = path;
    }
    
    async function sendRequest() {
      const method = document.getElementById('method').value;
      const url = document.getElementById('url').value;
      const headers = document.getElementById('headers').value;
      const body = document.getElementById('body').value;
      
      // Create visual request particle
      createRequestParticle();
      
      try {
        const options = {
          method,
          headers: {
            'x-playground-request': 'true',
            ...(headers ? JSON.parse(headers) : {})
          }
        };
        
        if (body && method !== 'GET') {
          options.body = body;
        }
        
        const response = await fetch(url, options);
        const data = await response.text();
        
        document.getElementById('response').style.display = 'block';
        document.getElementById('responseContent').textContent = 
          \`Status: \${response.status}\n\n\${data}\`;
      } catch (error) {
        document.getElementById('response').style.display = 'block';
        document.getElementById('responseContent').textContent = 
          \`Error: \${error.message}\`;
      }
    }
  </script>
</body>
</html>`);
};

// Create Gati app
const app = createApp({
  port: 4000,
  logging: true,
});

// Add CORS middleware first
app.use(createCorsMiddleware({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id'],
}));

// Initialize playground
const playground = createPlaygroundIntegration({
  enabled: true,
  port: 8080
});

// Initialize playground after app creation
await playground.initialize(app.getGlobalContext());

// Add playground UI route
app.get('/playground', servePlaygroundUI);

// Add a simple ping endpoint for testing
app.get('/ping', playground.wrapHandler(async (req, res) => {
  res.json({ message: 'pong', timestamp: Date.now() });
}, '/ping'));

// Example API routes with playground wrapping
app.get('/api/hello', playground.wrapHandler(async (req, res) => {
  res.json({ message: 'Hello from Gati!', timestamp: Date.now() });
}, '/api/hello'));

app.get('/api/users/:id', playground.wrapHandler(async (req, res) => {
  const userId = req.params?.id;
  await new Promise(resolve => setTimeout(resolve, 100));
  res.json({
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
  });
}, '/api/users/:id'));

app.get('/api/health', playground.wrapHandler(async (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
}, '/api/health'));

// Start the server
await app.listen();

console.log('🚀 Gati Playground Demo running!');
console.log('🎮 Playground UI: http://localhost:4000/playground');
console.log('📡 WebSocket Server: ws://localhost:8080');
console.log('🔗 API Base: http://localhost:4000');
console.log('\n🎮 Test playground requests:');
console.log('curl -H "x-playground-request: true" http://localhost:4000/ping');
console.log('curl -H "x-playground-request: true" http://localhost:4000/api/hello');