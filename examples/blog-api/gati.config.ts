import type { GatiConfig } from '@gati-framework/core';

export default {
  name: 'blog-api',
  version: '1.0.0',
  
  modules: {
    database: './src/modules/database.ts',
    auth: './src/modules/auth.ts'
  },

  middleware: {
    cors: true,
    bodyParser: true,
    logging: true
  },

  server: {
    port: 3000,
    host: '0.0.0.0'
  }
} satisfies GatiConfig;