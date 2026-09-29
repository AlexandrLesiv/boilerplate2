import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 120,
    tabWidth: 2,
    useTabs: false,
    endOfLine: 'lf',
    insertFinalNewline: true,
    arrowParens: 'always',
    bracketSpacing: true,
    jsxSingleQuote: false,
    sortImports: {
      order: 'asc',
      ignoreCase: true,
      newlinesBetween: true,
      customGroups: [
        {
          groupName: 'solid-js',
          elementNamePattern: ['solid-js', 'solid-js/*'],
        },
        {
          groupName: 'solidjs-ecosystem',
          elementNamePattern: ['@solidjs/*'],
        },
      ],
      groups: ['solid-js', 'solidjs-ecosystem', 'external', 'internal', ['parent', 'sibling', 'index']],
    },
    ignorePatterns: [
      'dist/**',
      'node_modules/**',
      '**/*.md',
      '**/public/**',
      '**/storybook-public/**',
      '**/settings.local.json',
    ],
  },
  lint: {
    jsPlugins: [
      'eslint-plugin-solid',
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    env: {
      browser: true,
      es2025: true,
    },
    rules: {
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'solid/reactivity': 'error',
      'solid/no-innerhtml': 'error',
      'solid/jsx-no-undef': 'error',
      'solid/no-array-handlers': 'warn',
      'solid/no-destructure': 'error',
      'solid/no-accessor-as-prop': 'error',
      'solid/no-write-in-pure-computation': 'error',
      'solid/no-module-scope-reactive-primitive': 'error',
      'solid/no-react-deps': 'error',
      'solid/no-react-specific-props': 'error',
      'solid/components-return-once': 'error',
      'solid/jsx-no-duplicate-props': 'error',
      'solid/prefer-for': 'error',
      'solid/no-unused-signal': 'warn',
      'solid/prefer-show': 'warn',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    ignorePatterns: [
      'dist/**',
      'node_modules/**',
      // oxlint's type-aware checker doesn't apply apps/fe/tsconfig.json correctly to files
      // under .storybook/ — confirmed two ways: an explicit --tsconfig override still fails
      // on decorators.tsx's `@` alias and solid JSX, and preview.tsx's side-effect
      // `.css.ts` import fails here despite `tsc --noEmit` passing clean with the identical
      // config. Neither file was covered by any project script before Vite+ either (the old
      // `oxlint src` was scoped to src/ only).
      'apps/fe/.storybook/decorators.tsx',
      'apps/fe/.storybook/preview.tsx',
      // Needs the `webworker` lib via a triple-slash reference, which oxlint's type-aware
      // checker doesn't honor — falls back to the DOM lib and conflicts on `self`. Always
      // excluded from apps/fe/tsconfig.json for the same reason; never type-checked before.
      'apps/fe/src/sw.ts',
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  // Scoped to staged files only — a real, whole-project typecheck still runs as a separate step
  // in the pre-commit hook (`.vite-hooks/pre-commit`), since type correctness for an edit in one
  // file can depend on files that aren't staged in this commit.
  staged: {
    '*.{js,ts,tsx}': 'vp check --fix',
  },
});
