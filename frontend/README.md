# Frontend

This directory contains the React frontend for the Talent in School Management System.

- `package.json` – npm package manifest for React, Vite, and required dependencies.
- `src/` – Source code for the React application.
- `index.html` – Frontend app entrypoint.
- `vite.config.js` – Vite configuration.

## Run the frontend

From the `frontend/` folder:

```bash
npm install && npm start
```

## Style guide

The frontend uses a **centralized, maintainable color scheme** to ensure consistency across the entire application.

### Color Scheme

All colors are defined in one place for easy maintenance:

- **Primary Brand Color**: `#1E3A8A` (deep blue from Conture logo)
- **Background**: `#FFFFFF` (white)
- **Text**: `#000000` (black)
- **Secondary Text**: `#666666` (gray for captions, helper text)
- **Border**: `#E5E5E5` (light gray)
- **Hover State**: `#0F2D6A` (darker shade of primary for interactions)

### Using the Color Scheme

**Option 1: CSS Variables (Recommended for CSS/SCSS)**

In any CSS file, use CSS custom properties defined in `src/index.css`:

```css
.my-button {
  background: var(--color-primary);
  color: white;
}

.my-button:hover {
  background: var(--color-hover);
}

.my-text {
  color: var(--color-text);
}

.my-input {
  border-color: var(--color-border);
}
```

All available variables:
- `var(--color-primary)` → `#1E3A8A`
- `var(--color-background)` → `#FFFFFF`
- `var(--color-text)` → `#000000`
- `var(--color-text-light)` → `#666666`
- `var(--color-border)` → `#E5E5E5`
- `var(--color-hover)` → `#0F2D6A`

**Option 2: JavaScript Theme Object (For React components with inline styles)**

Import the theme in your React component:

```javascript
import { colors } from '../theme.js';

export default function MyComponent() {
  return (
    <button style={{ backgroundColor: colors.primary }}>
      Click me
    </button>
  );
}
```

Available exports from `src/theme.js`:
```javascript
import { colors, theme } from './theme.js';

colors.primary        // #1E3A8A
colors.background     // #FFFFFF
colors.text           // #000000
colors.textLight      // #666666
colors.border         // #E5E5E5
colors.hover          // #0F2D6A

theme.breakpoints     // Mobile, tablet, desktop breakpoints
theme.spacing         // xs, sm, md, lg, xl, xxl
theme.borderRadius    // sm, md, lg
```

### Changing Colors Globally

To update the color scheme across the **entire application**:

1. Edit `src/index.css` (CSS variables at `:root`)
2. **OR** edit `src/theme.js` (for React components)

Changes will automatically apply to all components that reference these variables.

**Example: Change primary color from blue to another shade**

Before:
```css
--color-primary: #1E3A8A;
```

After:
```css
--color-primary: #0052CC;  /* All buttons, links, etc. update automatically */
```

### UI Approach

- White page background and strong black headings, matching the logo text style
- Blue accents (`#1E3A8A`) for buttons, links, and highlights
- Muted gray (`#666666`) for secondary text, labels, and helper text
- Clean spacing and simple form styling
- Slightly rounded corners on buttons and cards for a modern but official look
- Consistent hover states using `#0F2D6A` (darker blue)

The app should feel simple, official, and easy to use.

