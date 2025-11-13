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
      { text: 'Getting Started', link: '/onboarding/quick-start' },
      { text: 'Guides', link: '/guides/handlers' },
      { text: 'API', link: '/api-reference/handler' },
      {
        text: 'More',
        items: [
          { text: 'Examples', link: '/examples/hello-world' },
          { text: 'Architecture', link: '/architecture/overview' },
          { text: 'Changelog', link: '/changelog/' },
          { text: 'Contributing', link: '/contributing/' }
        ]
      }
    ],

    sidebar: {
      '/onboarding/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'What is Gati?', link: '/onboarding/what-is-gati' },
            { text: 'Quick Start', link: '/onboarding/quick-start' },
            { text: 'Getting Started', link: '/onboarding/getting-started' },
            { text: 'GatiC CLI', link: '/onboarding/gatic' }
          ]
        }
      ],
      '/guides/': [
        {
          text: 'Core Concepts',
          items: [
            { text: 'Handlers', link: '/guides/handlers' },
            { text: 'File-Based Routing', link: '/guides/file-based-routing' },
            { text: 'Manifest System', link: '/guides/manifest-system' },
            { text: 'Hot Reloading', link: '/guides/hot-reloading' },
            { text: 'Modules', link: '/guides/modules' },
            { text: 'Context', link: '/guides/context' },
            { text: 'Middleware', link: '/guides/middleware' },
            { text: 'Error Handling', link: '/guides/error-handling' }
          ]
        },
        {
          text: 'Development',
          items: [
            { text: 'Development Server', link: '/guides/development-server' },
            { text: 'Configuration', link: '/guides/configuration' },
            { text: 'TypeScript Config', link: '/guides/typescript-config' }
          ]
        },
        {
          text: 'Deployment',
          items: [
            { text: 'Deployment Guide', link: '/guides/deployment' },
            { text: 'Kubernetes', link: '/guides/kubernetes' }
          ]
        }
      ],
      '/api-reference/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Handler', link: '/api-reference/handler' },
            { text: 'Request', link: '/api-reference/request' },
            { text: 'Response', link: '/api-reference/response' },
            { text: 'Context', link: '/api-reference/context' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Hello World', link: '/examples/hello-world' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Design Decisions', link: '/architecture/design-decisions' },
            { text: 'Milestones', link: '/architecture/milestones' },
            { text: 'Roadmap', link: '/architecture/roadmap' },
            { text: 'MVP Roadmap', link: '/architecture/mvp-roadmap' }
          ]
        }
      ],
      '/changelog/': [
        {
          text: 'Changelog',
          items: [
            { text: 'Overview', link: '/changelog/' },
            { text: 'Current State', link: '/changelog/current-state' },
            { text: 'MVP Completion', link: '/changelog/mvp-completion' }
          ]
        }
      ],
      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Contributing Guide', link: '/contributing/' },
            { text: 'Agentic Development', link: '/contributing/agentic-development' },
            { text: 'Release Guide', link: '/contributing/release-guide' },
            { text: 'Codebase Structure', link: '/contributing/codebase-structure' }
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