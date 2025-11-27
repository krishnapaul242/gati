#!/usr/bin/env node

import { KubernetesDeploymentTarget } from './kubernetes-target.js';
import { OperatorController } from './operator-controller.js';
import pino from 'pino';

const logger = pino({ name: 'gati-operator' });

async function main() {
  logger.info('Starting Gati Operator');

  const target = new KubernetesDeploymentTarget();
  const controller = new OperatorController(target);

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down');
    await controller.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down');
    await controller.stop();
    process.exit(0);
  });

  await controller.start();
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
