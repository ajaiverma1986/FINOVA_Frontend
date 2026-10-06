import { lightTheme } from './themes/light.theme';
import { darkTheme } from './themes/dark.theme';
import { corporateTheme } from './themes/blue.theme';
import type { AppTheme } from './theme.types';

export const themes = { light: lightTheme, dark: darkTheme, blue: corporateTheme } satisfies Record<
  string,
  AppTheme
>;
export type ThemeName = keyof typeof themes;
export const defaultTheme: ThemeName = 'light';
export const themeStorageKey = 'finova.theme';
export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && Object.hasOwn(themes, value);
}
