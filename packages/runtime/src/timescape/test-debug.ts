console.log('DEBUG: Hello from test-debug.ts');
process.stdout.write('DEBUG: stdout write test\n');
try {
    throw new Error('Test Error');
} catch (e) {
    console.error('DEBUG: Caught error:', e);
}
