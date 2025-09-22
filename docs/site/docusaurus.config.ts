import { defineConfig } from '@docusaurus/types';
import type { Config } from '@docusaurus/types';

export default defineConfig({
  title: process.env.APP_TITLE || '{{APP_TITLE}}',
  url: 'https://example.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: { path: '../', routeBasePath: '/', sidebarPath: require.resolve('./sidebars.ts'), editUrl: undefined },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
      },
    ],
  ],
  themeConfig: {
    navbar: { title: process.env.APP_TITLE || '{{APP_TITLE}}', items: [{ to: '/', label: 'Docs', position: 'left' }] },
    footer: { style: 'dark', copyright: `© ${new Date().getFullYear()}` },
  },
}) satisfies Config;
