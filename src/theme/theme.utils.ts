import { createTheme } from '@mui/material/styles';
import { defaultTheme, isThemeName, themes, themeStorageKey, type ThemeName } from './theme.config';
import type { AppTheme } from './theme.types';

export function readTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(themeStorageKey);
    return isThemeName(saved) ? saved : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

/** Flatten the typed configuration, keeping CSS and MUI backed by the same values. */
export function themeVariables(theme: AppTheme): Record<string, string> {
  const variables: Record<string, string> = {};
  const kebab = (key: string) => key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
  const visit = (value: object, prefix = '') => {
    Object.entries(value).forEach(([key, token]) => {
      const path = prefix ? `${prefix}-${kebab(key)}` : kebab(key);
      if (typeof token === 'object') visit(token, path);
      else variables[`--${path}`] = String(token);
    });
  };
  visit({
    color: theme.colors,
    typography: {
      ...theme.typography,
      headingFontFamily: theme.typography.headingFontFamily ?? theme.typography.fontFamily,
    },
    navigation: theme.navigation,
    borderRadius: theme.borderRadius,
    shadow: theme.shadow,
    spacing: theme.spacing,
    layout: theme.layout,
  });
  return variables;
}

export function applyTheme(name: ThemeName) {
  const root = document.documentElement;
  Object.entries(themeVariables(themes[name])).forEach(([key, value]) =>
    root.style.setProperty(key, value),
  );
  root.dataset.theme = name;
  root.style.colorScheme = themes[name].mode;
}

export function createMuiTheme(theme: AppTheme) {
  const { colors: c, typography: t } = theme;
  // Every elevation uses the configured shadow scale, including portal surfaces.
  const shadows = createTheme().shadows;
  for (let elevation = 1; elevation < shadows.length; elevation++) {
    shadows[elevation] =
      elevation <= 3 ? theme.shadow.sm : elevation <= 8 ? theme.shadow.md : theme.shadow.lg;
  }
  return createTheme({
    shadows,
    palette: {
      mode: theme.mode,
      primary: { main: c.primary, contrastText: c.onPrimary },
      secondary: { main: c.secondary },
      background: { default: c.background, paper: c.surface },
      text: { primary: c.textPrimary, secondary: c.textSecondary },
      divider: c.border,
      success: { main: c.success },
      warning: { main: c.warning },
      error: { main: c.error },
      info: { main: c.info },
      action: {
        hover: c.hover,
        selected: c.selected,
        disabled: c.textSecondary,
        disabledBackground: c.surfaceMuted,
      },
    },
    spacing: theme.spacing.unit,
    typography: {
      fontFamily: t.fontFamily,
      fontWeightRegular: t.fontWeight.normal,
      fontWeightMedium: t.fontWeight.medium,
      fontWeightBold: t.fontWeight.bold,
      body1: { fontSize: t.fontSize.md, lineHeight: t.lineHeight.body },
      body2: { fontSize: t.fontSize.sm, lineHeight: t.lineHeight.body },
      subtitle1: { fontSize: t.fontSize.lg, lineHeight: t.lineHeight.body },
      subtitle2: { fontSize: t.fontSize.md, fontWeight: t.fontWeight.medium },
      caption: { fontSize: t.fontSize.xs },
      overline: { fontSize: t.fontSize.xs },
      button: { fontSize: t.fontSize.sm, fontWeight: t.fontWeight.semibold, textTransform: 'none' },
      ...Object.fromEntries(
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((heading, i) => [
          heading,
          {
            fontFamily: t.headingFontFamily ?? t.fontFamily,
            fontWeight: t.fontWeight.bold,
            lineHeight: t.lineHeight.heading,
            fontSize: i === 0 ? t.fontSize.h1 : i === 1 ? t.fontSize.h2 : t.fontSize.lg,
          },
        ]),
      ),
    },
    components: {
      MuiButton: { styleOverrides: { root: { borderRadius: theme.borderRadius.md } } },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none', borderRadius: theme.borderRadius.lg } },
      },
      MuiDrawer: { styleOverrides: { paper: { borderRadius: 0 } } },
      MuiAppBar: { styleOverrides: { root: { borderRadius: 0 } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: theme.borderRadius.md } } },
      MuiBackdrop: { styleOverrides: { root: { backgroundColor: c.overlay } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: c.border, fontSize: t.fontSize.sm },
          head: { backgroundColor: c.surfaceMuted, fontWeight: t.fontWeight.semibold },
        },
      },
      MuiTooltip: { styleOverrides: { tooltip: { background: c.textPrimary, color: c.surface } } },
    },
  });
}
