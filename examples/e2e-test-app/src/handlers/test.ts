import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (_req, res) => {
  res.json({
    message: 'E2E test successful!',
    timestamp: Date.now(),
    packages: {
      core: '@gati-framework/core@0.4.5',
      runtime: '@gati-framework/runtime@2.0.5',
      types: '@gati-framework/types@1.0.1',
      contracts: '@gati-framework/contracts@1.1.0',
    },
  });
};
