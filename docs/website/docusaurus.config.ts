// docusaurus.config.ts
import type { Config } from '@docusaurus/types';
import type { Options as ClassicOptions, ThemeConfig as ClassicThemeConfig } from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

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
          exclude: [
            '.docusaurus/**',
            'build/**',
            '**/node_modules/**',
            'website/**',            
          ],
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies ClassicOptions,
    ],
  ],
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      hideOnScroll: true,
      title: process.env.APP_TITLE ?? '{{APP_TITLE}}',
      items: [{ to: '/', label: 'Docs', position: 'left' }],
    },
    footer: { style: 'dark', copyright: `© ${new Date().getFullYear()}` },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.nightOwl,
    },
  } satisfies ClassicThemeConfig,
};

export default config;
