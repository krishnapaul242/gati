/**
 * @module playground/ui-server
 * @description Simple UI server for playground visualization
 */

export function createPlaygroundUI(): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Gati Playground</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .blocks { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .block { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s; }
        .block.active { background: #fef3c7; border: 2px solid #f59e0b; }
        .block.error { background: #fecaca; border: 2px solid #ef4444; }
        .events { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .event { padding: 8px; margin: 5px 0; border-radius: 4px; font-family: monospace; }
        .event.enter { background: #dcfce7; }
        .event.exit { background: #dbeafe; }
        .event.error { background: #fecaca; }
        .status { margin-bottom: 20px; padding: 10px; background: white; border-radius: 8px; }
        .test-buttons { margin-bottom: 20px; }
        .test-buttons button { margin-right: 10px; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .test-buttons .primary { background: #2563eb; color: white; }
        .test-buttons .secondary { background: #6b7280; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Gati Playground</h1>
            <p>Real-time visualization of request flow through handlers</p>
        </div>
        
        <div class="status">
            <strong>WebSocket Status:</strong> <span id="ws-status">Connecting...</span>
        </div>
        
        <div class="test-buttons">
            <button class="primary" onclick="testRequest('/ping')">Test /ping</button>
            <button class="primary" onclick="testRequest('/api/hello')">Test /api/hello</button>
            <button class="primary" onclick="testRequest('/api/users/123')">Test /api/users/123</button>
            <button class="secondary" onclick="clearEvents()">Clear Events</button>
        </div>
        
        <h2>Handler Blocks</h2>
        <div class="blocks" id="blocks"></div>
        
        <h2>Event Log</h2>
        <div class="events">
            <div id="events"></div>
        </div>
    </div>

    <script>
        let ws;
        let blocks = new Map();
        
        function connect() {
            ws = new WebSocket('ws://localhost:8080');
            
            ws.onopen = () => {
                document.getElementById('ws-status').textContent = 'Connected';
                document.getElementById('ws-status').style.color = 'green';
            };
            
            ws.onclose = () => {
                document.getElementById('ws-status').textContent = 'Disconnected';
                document.getElementById('ws-status').style.color = 'red';
                setTimeout(connect, 2000);
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                
                if (message.type === 'blocks') {
                    renderBlocks(message.data);
                } else if (message.type === 'event') {
                    handleEvent(message.data);
                }
            };
        }
        
        function renderBlocks(blockData) {
            const container = document.getElementById('blocks');
            container.innerHTML = '';
            
            blockData.forEach(block => {
                blocks.set(block.id, block);
                const div = document.createElement('div');
                div.className = 'block';
                div.id = 'block-' + block.id;
                div.innerHTML = \`
                    <h3>\${block.name}</h3>
                    <p>Type: \${block.type}</p>
                    <p>Path: \${block.path}</p>
                \`;
                container.appendChild(div);
            });
        }
        
        function handleEvent(event) {
            // Animate block
            const blockEl = document.getElementById('block-' + event.blockId);
            if (blockEl) {
                blockEl.classList.remove('active', 'error');
                if (event.type === 'enter') {
                    blockEl.classList.add('active');
                } else if (event.type === 'error') {
                    blockEl.classList.add('error');
                }
                
                setTimeout(() => {
                    blockEl.classList.remove('active', 'error');
                }, 1000);
            }
            
            // Add to event log
            const eventsEl = document.getElementById('events');
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event ' + event.type;
            eventDiv.textContent = \`[\${new Date(event.timestamp).toLocaleTimeString()}] \${event.type.toUpperCase()} - \${event.blockId} (Request: \${event.requestId})\`;
            eventsEl.insertBefore(eventDiv, eventsEl.firstChild);
            
            // Keep only last 50 events
            while (eventsEl.children.length > 50) {
                eventsEl.removeChild(eventsEl.lastChild);
            }
        }
        
        function testRequest(path) {
            fetch(path, {
                headers: {
                    'x-playground-request': 'true'
                }
            }).then(response => response.json())
              .then(data => console.log('Response:', data))
              .catch(error => console.error('Error:', error));
        }
        
        function clearEvents() {
            document.getElementById('events').innerHTML = '';
        }
        
        connect();
    </script>
</body>
</html>`;
}

export function servePlaygroundUI(_req: any, res: any) {
  res.setHeader('Content-Type', 'text/html');
  res.end(createPlaygroundUI());
}