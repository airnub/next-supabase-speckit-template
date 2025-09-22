// docusaurus.config.ts
import type { Config } from '@docusaurus/types';
import type { Options as ClassicOptions, ThemeConfig as ClassicThemeConfig } from '@docusaurus/preset-classic';

const config: Config = {
  title: process.env.APP_TITLE ?? '{{APP_TITLE}}',
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
        docs: {
          path: '../',
          routeBasePath: '/',
          // Prefer a string path to avoid ESM `require` pitfalls
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies ClassicOptions,
    ],
  ],
  themeConfig: {
    navbar: {
      title: process.env.APP_TITLE ?? '{{APP_TITLE}}',
      items: [{ to: '/', label: 'Docs', position: 'left' }],
    },
    footer: { style: 'dark', copyright: `© ${new Date().getFullYear()}` },
  } satisfies ClassicThemeConfig,
};

export default config;
