import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Gati',
  description: 'Motion in Code - Build cloud-native, versioned APIs with TypeScript',
  base: '/gati/',
  
  // Ignore dead links during development
  ignoreDeadLinks: [
    // Localhost URLs
    /^http:\/\/localhost/,
    // Guide pages to be created
    /\/guide\/logging/,
    /\/guide\/docker/,
    /\/guide\/cors/,
    /\/guide\/building/,
    /\/guide\/environment/,
    // Legacy architecture links
    /\.\/architecture/,
  ],
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/gati/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Gati | Motion in Code' }],
    ['meta', { property: 'og:description', content: 'Next-gen TypeScript framework for cloud-native, versioned APIs' }],
    ['meta', { property: 'og:site_name', content: 'Gati' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: '/logo.svg', width: 24, height: 24 },
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/handler' },
      { text: 'Examples', link: '/examples/hello-world' },
      {
        text: 'v1.3.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/krishnapaul242/gati/releases' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Gati?', link: '/guide/what-is-gati' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Handlers', link: '/guide/handlers' },
            { text: 'Modules', link: '/guide/modules' },
            { text: 'Context (gctx & lctx)', link: '/guide/context' },
            { text: 'Middleware', link: '/guide/middleware' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Request Handling', link: '/guide/request-handling' },
            { text: 'Structured Logging', link: '/guide/logging' },
            { text: 'Error Handling', link: '/guide/error-handling' },
            { text: 'CORS', link: '/guide/cors' }
          ]
        },
        {
          text: 'Deployment',
          items: [
            { text: 'Building for Production', link: '/guide/building' },
            { text: 'Docker', link: '/guide/docker' },
            { text: 'Kubernetes', link: '/guide/kubernetes' },
            { text: 'Environment Config', link: '/guide/environment' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'API Versioning', link: '/guide/versioning' },
            { text: 'TypeScript Config', link: '/guide/typescript-config' },
            { text: 'Architecture', link: '/guide/architecture' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Handler', link: '/api/handler' },
            { text: 'Request', link: '/api/request' },
            { text: 'Response', link: '/api/response' },
            { text: 'Context', link: '/api/context' },
            { text: 'Middleware', link: '/api/middleware' }
          ]
        },
        {
          text: 'Runtime',
          items: [
            { text: 'createApp', link: '/api/create-app' },
            { text: 'GatiApp', link: '/api/gati-app' },
            { text: 'Logger', link: '/api/logger' }
          ]
        },
        {
          text: 'CLI',
          items: [
            { text: 'gatic create', link: '/api/cli-create' },
            { text: 'gatic dev', link: '/api/cli-dev' },
            { text: 'gatic build', link: '/api/cli-build' },
            { text: 'gatic deploy', link: '/api/cli-deploy' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Hello World', link: '/examples/hello-world' },
            { text: 'REST API', link: '/examples/rest-api' },
            { text: 'With Database', link: '/examples/database' },
            { text: 'Authentication', link: '/examples/auth' },
            { text: 'File Upload', link: '/examples/file-upload' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/krishnapaul242/gati' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Krishna Paul'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/krishnapaul242/gati/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
