// @ts-check
const { themes: prismThemes } = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'YesBill Docs',
  tagline: 'Smart billing tracking for Indian households',
  favicon: 'img/yesbill_logo_icon_only.png',

  // On Vercel the docs live at the domain root; on GitHub Pages at /YesBill/docs/
  url: process.env.DOCS_SITE_URL || 'https://yesbill-docs.vercel.app',
  baseUrl: process.env.DOCS_BASE_URL || '/',

  organizationName: 'ishan96dev',
  projectName: 'YesBill',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    require.resolve('docusaurus-lunr-search'),
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          editUrl: 'https://github.com/ishan96dev/YesBill/edit/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',

      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },

      navbar: {
        title: '',
        logo: {
          alt: 'YesBill',
          src: 'img/yesbill_logo_black.png',
          srcDark: 'img/yesbill_logo_black.png',
          style: { height: '56px', width: '56px', objectFit: 'contain' },
        },
        items: [
          {
            href: 'https://yesbill.vercel.app',
            label: 'Launch App',
            position: 'right',
          },
          {
            href: 'https://github.com/ishan96dev/YesBill',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },

      footer: {
        style: 'light',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting Started', to: '/getting-started/creating-account' },
              { label: 'Services', to: '/services/overview' },
              { label: 'AI Features', to: '/ai-features/overview' },
            ],
          },
          {
            title: 'App',
            items: [
              { label: 'Launch App', href: 'https://yesbill.vercel.app' },
              { label: 'GitHub', href: 'https://github.com/ishan96dev/YesBill' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} YesBill. Built with Docusaurus.`,
      },

      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

module.exports = config;
