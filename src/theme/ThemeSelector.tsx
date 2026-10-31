import { useId } from 'react';
import { isThemeName, themes } from './theme.config';
import { useTheme } from './theme.provider';

export function ThemeSelector() {
  const id = useId();
  const { themeName, setTheme } = useTheme();
  return (
    <div className="theme-selector">
      <label htmlFor={id}>Theme</label>
      <select
        id={id}
        value={themeName}
        onChange={(event) => {
          if (isThemeName(event.target.value)) setTheme(event.target.value);
        }}
      >
        {Object.entries(themes).map(([name, theme]) => (
          <option key={name} value={name}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
}
