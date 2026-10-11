import type { AppTheme } from '../theme.types';
import { lightTheme } from './light.theme';

export const corporateTheme: AppTheme = {
  ...lightTheme,
  name: 'Corporate',
  colors: {
    ...lightTheme.colors,
    primary: '#1956a5',
    secondary: '#475569',
    accent: '#6345b5',
    background: '#f0f4fa',
    surfaceMuted: '#e8eff9',
    hover: '#e3edfc',
    selected: '#cedff8',
    focus: '#1956a5',
  },
  navigation: {
    sidebarBackground: '#152e54',
    sidebarText: '#e0eafa',
    sidebarActiveBackground: '#285895',
    sidebarActiveText: '#ffffff',
    sidebarHoverBackground: '#213f69',
    headerBackground: '#ffffff',
    headerText: '#152e54',
  },
};
