export interface AppTheme {
  name: string;
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    onPrimary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceMuted: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    successSurface: string;
    warningSurface: string;
    errorSurface: string;
    infoSurface: string;
    hover: string;
    selected: string;
    focus: string;
    overlay: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily?: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      h1: string;
      h2: string;
      display: string;
    };
    fontWeight: { normal: number; medium: number; semibold: number; bold: number };
    lineHeight: { body: number; heading: number };
  };
  navigation: {
    sidebarBackground: string;
    sidebarText: string;
    sidebarActiveBackground: string;
    sidebarActiveText: string;
    sidebarHoverBackground: string;
    headerBackground: string;
    headerText: string;
  };
  borderRadius: { sm: string; md: string; lg: string };
  shadow: { sm: string; md: string; lg: string };
  spacing: { unit: number; xs: string; sm: string; md: string; lg: string; xl: string };
  layout: { sidebarWidth: string; pageMaxWidth: string; pagePadding: string };
}
