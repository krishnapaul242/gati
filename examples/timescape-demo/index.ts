import { createGlobalContext } from '@gati-framework/runtime/global-context';
import { createLocalContext } from '@gati-framework/runtime/local-context';
import { executeHandler } from '@gati-framework/runtime/handler-engine';
import type { Handler, Request, Response } from '@gati-framework/runtime/types/index';
import type { TSV } from '@gati-framework/runtime/timescape/types';

async function runDemo() {
    console.log('🚀 Starting Timescape Demo Application...\n');

    // 1. Initialize Global Context (with Timescape)
    console.log('📦 Initializing Global Context...');
    const gctx = createGlobalContext();

    // Ensure Timescape is ready
    if (!gctx.timescape) {
        console.error('❌ Timescape not initialized!');
        process.exit(1);
    }
    console.log('✅ Timescape System Online\n');

    // 2. Register a Module Version
    const moduleVersion: TSV = `tsv:${Date.now()}-demo-v1`;
    console.log(`📝 Registering module "user-service" version: ${moduleVersion}`);

    gctx.timescape.registry.register({
        id: 'user-service',
        type: 'module',
        version: moduleVersion,
        hash: 'hash-v1',
        meta: { author: 'DemoUser' }
    });

    // Persist to Timeline
    await gctx.timescape.timeline.append({
        id: `change-${Date.now()}`,
        timestamp: Date.now(),
        type: 'module',
        actor: 'DemoUser',
        artifactId: 'user-service',
        version: moduleVersion,
        payload: { action: 'register', version: moduleVersion },
        parents: []
    });

    // 3. Simulate a Request
    console.log('\n⚡ Simulating Incoming Request...');

    // Create Local Context (injecting registry for resolution)
    const lctx = createLocalContext(
        { requestId: 'req-1', client: { ip: '127.0.0.1', userAgent: 'curl', region: 'local' } },
        undefined,
        gctx.timescape.registry
    );

    // Define a Handler that uses versioned logic
    const handler: Handler = async (req, res, g, l) => {
        console.log('  ▶ Handler executing...');

        const resolvedState = l.timescape.resolvedState;
        if (!resolvedState) {
            console.error('  ❌ No resolved version state found!');
            return;
        }

        const currentVersion = resolvedState.modules['user-service'];
        console.log(`  🔍 Resolved "user-service" to: ${currentVersion}`);

        if (currentVersion === moduleVersion) {
            console.log('  ✅ Version match! Executing v1 logic.');
            res.json({ message: 'Hello from v1', version: currentVersion });
        } else {
            console.log('  ⚠️ Version mismatch.');
            res.json({ message: 'Version mismatch', version: currentVersion });
        }
    };

    // Execute Handler
    const req = { method: 'GET', path: '/users' } as Request;
    const res = {
        isSent: () => false,
        status: (code: number) => ({ json: (body: any) => console.log('  📤 Response:', body) }),
        json: (body: any) => console.log('  📤 Response:', body),
    } as unknown as Response;

    await executeHandler(handler, req, res, gctx, lctx);

    // 4. Make a Change (Evolution)
    console.log('\n🔄 Evolving System State...');
    const newVersion: TSV = `tsv:${Date.now()}-demo-v2`;
    console.log(`📝 Updating "user-service" to version: ${newVersion}`);

    gctx.timescape.registry.register({
        id: 'user-service',
        type: 'module',
        version: newVersion,
        hash: 'hash-v2',
        meta: { author: 'DemoUser', message: 'Upgraded to v2' }
    });

    // Persist to Timeline
    await gctx.timescape.timeline.append({
        id: `change-${Date.now()}`,
        timestamp: Date.now(),
        type: 'module',
        actor: 'DemoUser',
        artifactId: 'user-service',
        version: newVersion,
        payload: { action: 'update', version: newVersion },
        message: 'Upgraded to v2',
        parents: [moduleVersion]
    });

    // 5. Simulate Another Request (should see new version)
    console.log('\n⚡ Simulating Second Request...');
    const lctx2 = createLocalContext(
        { requestId: 'req-2', client: { ip: '127.0.0.1', userAgent: 'curl', region: 'local' } },
        undefined,
        gctx.timescape.registry
    );

    await executeHandler(handler, req, res, gctx, lctx2);

    console.log('\n✨ Demo Complete. Check history with "gati ts log"');
}

runDemo().catch(console.error);
