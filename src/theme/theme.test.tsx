import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { ThemeProvider, useTheme } from './theme.provider';
import { ThemeSelector } from './ThemeSelector';
import { defaultTheme, themes, themeStorageKey } from './theme.config';
import { createMuiTheme, readTheme, themeVariables } from './theme.utils';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
function Probe() {
  const { themeName, toggleTheme } = useTheme();
  const mui = useMuiTheme();
  return (
    <>
      <ThemeSelector />
      <output>
        {themeName}:{mui.palette.primary.main}
      </output>
      <button onClick={toggleTheme}>Cycle theme</button>
    </>
  );
}
describe('global theme', () => {
  it('switches CSS and MUI together, persists selection and restores it after remount', () => {
    const mounted = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('combobox').getAttribute('id')).toBeTruthy();
    for (const name of ['dark', 'blue', 'light'] as const) {
      fireEvent.change(screen.getByLabelText('Theme'), { target: { value: name } });
      expect(document.documentElement.dataset.theme).toBe(name);
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe(
        themes[name].colors.primary,
      );
      expect(screen.getByRole('status').textContent).toBe(`${name}:${themes[name].colors.primary}`);
      expect(localStorage.getItem(themeStorageKey)).toBe(name);
    }
    fireEvent.click(screen.getByText('Cycle theme'));
    mounted.unmount();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect((screen.getByLabelText('Theme') as HTMLSelectElement).value).toBe('dark');
  });
  it('rejects unknown and prototype names, and survives unavailable storage', () => {
    for (const name of ['missing', '__proto__', 'constructor']) {
      localStorage.setItem(themeStorageKey, name);
      expect(readTheme()).toBe(defaultTheme);
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'blue' } });
    expect(document.documentElement.dataset.theme).toBe('blue');
  });
  it('synchronizes changes and preference clearing from another tab', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    act(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: themeStorageKey, newValue: 'dark' })),
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
    expect(document.documentElement.dataset.theme).toBe(defaultTheme);
  });
  it('propagates customized font, heading, spacing and shape configuration', () => {
    const custom = {
      ...themes.blue,
      typography: {
        ...themes.blue.typography,
        fontFamily: 'serif',
        headingFontFamily: 'monospace',
      },
      spacing: { ...themes.blue.spacing, unit: 10 },
      borderRadius: { ...themes.blue.borderRadius, md: '15px' },
    };
    const css = themeVariables(custom);
    const mui = createMuiTheme(custom);
    expect(css['--typography-font-family']).toBe('serif');
    expect(css['--typography-heading-font-family']).toBe('monospace');
    expect(mui.typography.fontFamily).toBe('serif');
    expect(mui.typography.h1.fontFamily).toBe('monospace');
    expect(mui.spacing(2)).toBe('20px');
    expect(css['--border-radius-md']).toBe('15px');
    expect(mui.typography.caption.fontSize).toBe(custom.typography.fontSize.xs);
    expect(mui.typography.h3.fontSize).toBe(custom.typography.fontSize.lg);
    expect(mui.shadows[1]).toBe(custom.shadow.sm);
    expect(mui.shadows[8]).toBe(custom.shadow.md);
    expect(mui.shadows[24]).toBe(custom.shadow.lg);
    expect(mui.components?.MuiBackdrop?.styleOverrides?.root).toEqual({
      backgroundColor: custom.colors.overlay,
    });
  });
  it('maintains WCAG AA contrast for normal text and key navigation/status pairs', () => {
    const luminance = (hex: string) => {
      const channels = hex
        .slice(1)
        .match(/../g)!
        .map((part) => parseInt(part, 16) / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    Object.values(themes).forEach(({ colors: c, navigation: n }) => {
      const pairs = [
        [c.textPrimary, c.background],
        [c.textPrimary, c.surface],
        [c.textSecondary, c.surface],
        [c.primary, c.surface],
        [c.onPrimary, c.primary],
        [n.sidebarText, n.sidebarBackground],
        [n.sidebarActiveText, n.sidebarActiveBackground],
        [n.headerText, n.headerBackground],
        [c.success, c.successSurface],
        [c.error, c.errorSurface],
        [c.warning, c.warningSurface],
        [c.info, c.infoSurface],
      ];
      pairs.forEach(([fg, bg]) => {
        const a = luminance(fg),
          b = luminance(bg);
        expect(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          `${fg} on ${bg}`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
