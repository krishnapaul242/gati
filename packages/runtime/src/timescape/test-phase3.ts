import { createGlobalContext } from '../global-context.js';
import { createLocalContext } from '../local-context.js';
import { executeHandler } from '../handler-engine.js';
import type { Handler, Request, Response } from '../types/index.js';
import { VersionRegistry } from './registry.js';
import type { TSV } from './types.js';

async function runTest() {
    console.log('Starting Phase 3 Verification...');

    // 1. Setup Global Context with Timescape
    console.log('Creating GlobalContext...');
    const gctx = createGlobalContext();

    if (gctx.timescape && gctx.timescape.registry) {
        console.log('✅ GlobalContext: Timescape registry initialized');
    } else {
        console.error('❌ GlobalContext: Timescape registry missing');
        return;
    }

    // 2. Register a test module version
    const testVersion: TSV = 'tsv:1234567890-test-1';
    gctx.timescape.registry.register({
        id: 'test-module',
        type: 'module',
        version: testVersion,
        hash: 'abc'
    });

    // 3. Setup Local Context
    console.log('Creating LocalContext...');
    // Manually passing registry as we are not going through app-core here
    const lctx = createLocalContext({}, undefined, gctx.timescape.registry);

    if (lctx.timescape && lctx.timescape.resolver) {
        console.log('✅ LocalContext: Timescape resolver initialized');
    } else {
        console.error('❌ LocalContext: Timescape resolver missing');
        return;
    }

    // 4. Execute Handler and check resolution
    console.log('Executing Handler...');
    const handler: Handler = async (req, res, g, l) => {
        console.log('Handler executing...');
        if (l.timescape.resolvedState) {
            console.log('✅ Handler: Resolved state present');
            const moduleVersion = l.timescape.resolvedState.modules['test-module'];
            if (moduleVersion === testVersion) {
                console.log('✅ Handler: Correct module version resolved');
            } else {
                console.error(`❌ Handler: Incorrect version resolved. Expected ${testVersion}, got ${moduleVersion}`);
            }
        } else {
            console.error('❌ Handler: Resolved state MISSING');
        }
    };

    const req = {} as Request;
    const res = {
        isSent: () => false,
        status: (code: number) => res,
        json: (body: any) => console.log('Response:', body),
    } as unknown as Response;

    await executeHandler(handler, req, res, gctx, lctx);

    console.log('Phase 3 Verification Complete.');
}

runTest();
