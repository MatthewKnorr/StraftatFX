# StrafatFX

StrafatFX is a lightweight, browser-based gradient text generator built for creating styled usernames, tags, and short text effects. It focuses on speed, simplicity, and giving users full control over how their text looks before copying it anywhere.

## Features

- Per-letter and stepped gradient text generation  
- Custom color selection with live gradient preview  
- Real-time formatted output and visual preview  
- Text styling options (bold, italic, underline, superscript)  
- Copy-ready output for quick use  
- Save and manage usernames and quips using localStorage  
- Toggleable remove mode for quick cleanup  
- Clean, responsive interface  

## How It Works

StrafatFX generates gradients by interpolating between two selected colors and applying them across visible characters in the text. Users can control how the gradient is distributed using different modes, including per-letter and custom step-based gradients.

The app builds a formatted output string using color tags and optional style tags, then renders both a preview and a copyable version of the result.

## Tech Stack

- HTML  
- CSS  
- JavaScript (ES Modules)  
- localStorage for persistence  
- Pickr (color picker library)  

## Project Structure

- `main.mjs` – App initialization and event handling  
- `gradientEngine.mjs` – Core gradient logic and color distribution  
- `gradient.mjs` – Color math and interpolation helpers  
- `render.mjs` – Output rendering and preview display  
- `formatter.mjs` – Text styling (bold, italic, etc.)  
- `saved.mjs` – Saved usernames and quips system  
- `storage.mjs` – localStorage utilities  
- `state.mjs` – Global state management  
- `styles.css` – UI styling  

## Usage

1. Enter your text  
2. Pick two colors for the gradient  
3. Choose a gradient mode  
4. Apply optional styles  
5. Copy the generated output  

You can also save frequently used usernames or quips and reuse them instantly.

## Goals

StrafatFX was built to provide a fast, no-friction way to generate styled text without relying on heavy frameworks or complex workflows. The focus is on usability, performance, and clean output.

## Future Improvements

- Multi-color gradients (more than two colors)  
- Expanded formatting options  
- Preset themes  
- Export/share options  
- Profile system for saved data  


## Usage Notice

The name "StrafatFX" may not be used for redistributed versions without permission.

## License

This project is licensed under the MIT License. See the LICENSE file for details.