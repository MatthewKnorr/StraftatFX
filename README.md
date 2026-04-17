# StraftatFX

StraftatFX is a lightweight, browser-based gradient text generator built for creating styled usernames, tags, and chat text for Straftat. It focuses on speed, simplicity, and giving users clear control over how their text looks before copying it anywhere.

## Features

- Smooth per-letter and stepped gradient text generation
- Support for 1 to 4 color gradients depending on entered text length
- Custom color selection with live gradient preview
- Preset gradients with favorites
- Real-time formatted output and visual preview
- Text styling options: bold, italic, underline, and superscript
- Manual copy and optional auto copy
- Saved gradients and clipboard history using localStorage
- Toggleable remove mode for quick cleanup
- Integrated in-app guide with live example preview
- Output-based character counter based on the final formatted text
- Steam-safe indicator that warns when output exceeds about 32 characters
- Responsive interface with gradient-driven UI accents

## How It Works

StraftatFX generates gradients by interpolating between your selected colors and applying them across visible characters in the text.

Depending on the selected mode, the gradient is either:

- Applied per letter for a smooth transition
- Distributed in stepped segments with `1/2`, `1/3`, or `1/4`
- Controlled manually with the custom steps slider

The app builds a formatted output string using color tags and optional style tags, then renders both:

- A visual preview for readability
- A raw output string for copying and pasting into Straftat

The character counter reflects the final formatted output length, including color and style tags.

## Tech Stack

- HTML
- CSS
- JavaScript (ES modules)
- localStorage for persistence
- Pickr for color picking

## Project Structure

- `js/main.mjs` - App initialization, UI logic, presets, and event handling
- `js/gradientEngine.mjs` - Core gradient logic and color distribution
- `js/gradient.mjs` - Color math and interpolation helpers
- `js/render.mjs` - Output rendering and preview display
- `js/formatter.mjs` - Text styling helpers
- `js/saved.mjs` - Saved gradients and clipboard rendering
- `js/storage.mjs` - localStorage utilities
- `js/state.mjs` - Shared app state
- `js/guide.mjs` - Guide modal logic and live example rendering
- `styles/styles.css` - App styling
- `gradients.json` - Preset gradient catalog

## Usage

1. Enter your text.
2. Choose your available color count.
3. Pick your colors.
4. Choose a gradient intensity mode.
5. Apply optional styles.
6. Copy the generated output or turn on auto copy.

Saved gradients and clipboard entries can be reused instantly, and remove mode allows quick cleanup.

## Interface Notes

- The preview shows how your text will look visually
- The output shows the actual formatted string used in-game
- The character counter reflects the true output length
- The Steam indicator warns when output goes beyond about 32 characters
- The app limit is 500 output characters
- Higher color counts unlock only when enough visible text has been entered

## Release Notes

- The guide includes a fallback gradient example so first-time visitors still see a proper gradient before typing
- The header logo includes a small easter egg

## Usage Notice

The name "StraftatFX" may not be used for redistributed versions without permission.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
