# Global theme

The application uses React 19, MUI 9 and plain CSS. `theme.config.ts` is the
registry and default selection; configurations in `themes/` are the source of
visual values for both CSS and MUI. Routing and API behavior are independent of
the theme.

Edit a theme's colors, typography, navigation, radii, shadows, spacing or layout
to change its appearance across the application. `blue` is the Corporate theme.
Light provides shared defaults; Dark and Corporate override those defaults.
Font families must be installed locally or loaded separately when using a web font.

To add a theme, create a typed `AppTheme` configuration (spreading an existing
theme is supported), then import and register it in `themes` in
`theme.config.ts`. Its key automatically becomes a valid `ThemeName` and an
option in every `ThemeSelector`. Set `defaultTheme` to change the initial choice
for users without a saved preference.

```tsx
const { theme, themeName, setTheme, toggleTheme } = useTheme();
setTheme('blue');
```

`toggleTheme` cycles through the registry. Selection persists under
`finova.theme` in localStorage and synchronizes across tabs. Missing, invalid,
or inaccessible storage falls back to the configured default; switching still
works for the current session when storage is blocked.

`main.tsx` applies tokens before mounting React to minimize startup flashing.
The provider updates CSS tokens before paint and supplies the matching MUI
theme, including components rendered into portals. Selectors appear in the
authenticated header and authentication layout.

For plain CSS, use semantic tokens such as `var(--color-primary)`,
`var(--color-surface)`, `var(--typography-font-size-sm)`,
`var(--border-radius-md)` and `var(--spacing-lg)`. Token names are generated
from configuration paths in kebab case. MUI components consume the equivalent
palette and typography; navigation consumes dedicated navigation tokens.
Keep structural dimensions and responsive breakpoints in component CSS when
they describe layout rather than a theme preference.

Validation: `npm run build`, `npm test -- src/theme/theme.test.tsx`, and
`npm run test:e2e -- tests/theme.spec.ts`. Theme tests cover persistence,
unavailable storage, cross-tab changes, configuration propagation, and WCAG AA
contrast for key text/navigation/status combinations. Browser tests check
computed styles and refresh persistence on desktop and mobile.
