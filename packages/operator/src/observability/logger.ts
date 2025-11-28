import pino from 'pino';

export function createOperatorLogger(name: string = 'gati-operator'): pino.Logger {
  return pino({
    name,
    level: process.env['LOG_LEVEL'] || 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
