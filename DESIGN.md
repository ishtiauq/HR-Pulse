# HR Pulse Design System (DESIGN.md)

This file contains the structured design rules and styling tokens for the **HR Pulse** web application. It is formatted to be imported directly into **Google Stitch** (`stitch.withgoogle.com`) or other AI design systems to maintain visual consistency and support seamless UI iteration.

## Visual Theme: Neon Key-Lime High-Contrast Minimalist Light Theme
Inspired by avant-garde design aesthetics combining a clean light warm gray backdrop, solid black/charcoal highlights, pure white cards, and vibrant neon key-lime green accents.

### 1. Color Palette

```json
{
  "theme": "Light / High-Contrast",
  "colors": {
    "background": {
      "primary": "#f0f2f1",       /* Warm light gray background */
      "secondary": "#ffffff",     /* Pure white for layout cards */
      "tertiary": "#0e0f11"       /* Contrast black for active tags/footers */
    },
    "text": {
      "primary": "#0e0f11",       /* Charcoal black */
      "secondary": "#4b5563",     /* Slate gray */
      "muted": "#8c95a5"          /* Muted gray */
    },
    "accents": {
      "primary": "#a8ff35",       /* Bright Neon Key-Lime */
      "primaryGlow": "rgba(168, 255, 53, 0.18)",
      "info": "#0284c7",          /* Sky blue */
      "infoGlow": "rgba(2, 132, 199, 0.08)",
      "success": "#16a34a",       /* Forest green */
      "successGlow": "rgba(22, 163, 74, 0.08)",
      "warning": "#e28a05",       /* Amber */
      "warningGlow": "rgba(226, 138, 5, 0.08)",
      "danger": "#e11d48",        /* Rose red */
      "dangerGlow": "rgba(225, 29, 72, 0.08)"
    },
    "borders": {
      "default": "rgba(0, 0, 0, 0.06)",
      "glass": "rgba(0, 0, 0, 0.05)"
    }
  }
}
```

### 2. Typography
- **Primary Font Family**: `Google Sans`, `Plus Jakarta Sans`, sans-serif (used for body, labels, and forms).
- **Secondary/Display Font Family**: `Google Sans`, `Plus Jakarta Sans`, `Outfit`, sans-serif (used for headings, cards, and primary totals).
- **Scale (Larger)**:
  - Main Title: `2.2rem` (Bold, 700)
  - Section Title: `1.6rem` (Semi-Bold, 600)
  - Subheadings: `1.3rem` (Medium, 500)
  - Body Text: `1rem` (Regular, 400)
  - Caption/Muted Details: `0.8rem` (Regular, 400)

### 3. Component Styling

#### Cards (.glass-card)
- Background: `#ffffff`
- Border: `1px solid rgba(0, 0, 0, 0.05)`
- Border Radius: `18px`
- Box Shadow: `0 10px 30px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.01)`

#### Buttons (.btn)
- **Primary Buttons**:
  - Background: `#a8ff35` (Neon Key-Lime)
  - Color: `#0e0f11` (Charcoal black)
  - Font Weight: `700`
- **Secondary Buttons**:
  - Background: `#0e0f11` (Charcoal black)
  - Color: `#ffffff`

### 4. Layout & Spacing Scale
- Page Padding: `48px`
- Grid gaps: `24px`
- Row height padding: `16px`
