import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Gati Framework',
  description: 'The Backend That Builds, Scales, and Evolves Itself — Zero-Ops, Infinite Evolution',
  base: '/gati/',
  
  // Ignore dead links during development
  ignoreDeadLinks: [
    // Localhost URLs
    /^http:\/\/localhost/,
    // Planned features
    /\/guide\/logging/,
    /\/guide\/docker/,
    /\/guide\/cors/,
    /\/guide\/building/,
    /\/guide\/environment/,
    // Legacy architecture links
    /\.\/architecture/,
  ],
  
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/gati/gati.png' }],
    ['meta', { name: 'theme-color', content: '#2d5a3d' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Gati | Motion in Code' }],
    ['meta', { property: 'og:description', content: 'Next-gen TypeScript framework for cloud-native, versioned APIs' }],
    ['meta', { property: 'og:site_name', content: 'Gati' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: '/gati.png', width: 24, height: 24 },
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/onboarding/quick-start' },
      { text: 'Vision', link: '/vision/why-gati' },
      { 
        text: 'Guides', 
        items: [
          { text: 'Core Concepts', link: '/guides/handlers' },
          { text: 'Timescape Versioning', link: '/architecture/timescape' },
          { text: 'Type System', link: '/architecture/type-system' },
          { text: 'Deployment', link: '/guides/deployment' },
        ]
      },
      { text: 'API Reference', link: '/api-reference/handler' },
      {
        text: 'More',
        items: [
          { text: 'Examples', link: '/examples/hello-world' },
          { text: 'Architecture', link: '/architecture/overview' },
          { text: 'Roadmap', link: '/architecture/milestones' },
          { text: 'Contributing', link: '/contributing/' }
        ]
      }
    ],

    sidebar: {
      '/vision/': [
        {
          text: 'Vision & Mission',
          items: [
            { text: 'Why Gati?', link: '/vision/why-gati' },
            { text: 'Core Philosophy', link: '/vision/philosophy' },
            { text: 'Feature Registry', link: '/vision/features' },
          ]
        }
      ],
      '/onboarding/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'What is Gati?', link: '/onboarding/what-is-gati' },
            { text: 'Quick Start', link: '/onboarding/quick-start' },
            { text: 'Installation', link: '/onboarding/getting-started' },
            { text: 'GatiC CLI', link: '/guides/gatic' }
          ]
        }
      ],
      '/guides/': [
        {
          text: 'Fundamentals',
          items: [
            { text: 'Handlers', link: '/guides/handlers' },
            { text: 'Modules & Plugins', link: '/guides/modules' },
            { text: 'Context (gctx/lctx)', link: '/guides/context' },
            { text: 'Middleware', link: '/guides/middleware' },
            { text: 'Error Handling', link: '/guides/error-handling' }
          ]
        },
        {
          text: 'Routing & Manifests',
          items: [
            { text: 'File-Based Routing', link: '/guides/file-based-routing' },
            { text: 'Manifest System', link: '/guides/manifest-system' },
            { text: 'Hot Reloading', link: '/guides/hot-reloading' }
          ]
        },
        {
          text: 'Development',
          items: [
            { text: 'GatiC CLI', link: '/guides/gatic' },
            { text: 'Development Server', link: '/guides/development-server' },
            { text: 'Configuration', link: '/guides/configuration' },
            { text: 'TypeScript Config', link: '/guides/typescript-config' }
          ]
        },
        {
          text: 'Deployment',
          items: [
            { text: 'Deployment Overview', link: '/guides/deployment' },
            { text: 'Local Kubernetes', link: '/guides/kubernetes' },
            { text: 'AWS EKS', link: '/guides/aws-eks-deployment' },
            { text: 'HPA & Ingress', link: '/guides/hpa-ingress' }
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
          text: 'Architecture Deep Dive',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Design Decisions', link: '/architecture/design-decisions' }
          ]
        },
        {
          text: 'Core Systems (Planned)',
          items: [
            { text: 'Timescape Versioning', link: '/architecture/timescape' },
            { text: 'Type System (Branded Types)', link: '/architecture/type-system' }
          ]
        },
        {
          text: 'Roadmap & Planning',
          items: [
            { text: 'Milestones', link: '/architecture/milestones' },
            { text: 'Roadmap', link: '/architecture/roadmap' }
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
            { text: 'CI/CD Pipeline', link: '/contributing/ci-cd' },
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
