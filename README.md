# StraftatFX

StraftatFX is a lightweight, browser-based gradient text generator built for creating styled usernames, tags, and chat text specifically for Strafat. It focuses on speed, simplicity, and giving users full control over how their text looks before copying it anywhere.

## Features

- Per-letter and stepped gradient text generation  
- Custom color selection with live gradient preview  
- Real-time formatted output and visual preview  
- Text styling options (bold, italic, underline, superscript)  
- Copy-ready output for quick use  
- Save and manage usernames and quips using localStorage  
- Toggleable remove mode for quick cleanup  
- Integrated guide view explaining usage directly in the app  
- GitHub link for quick access to source code  
- Output-based character counter (accurate to final formatted text)  
- Steam-safe indicator (warns when output exceeds ~32 characters)  
- Unified gradient-driven UI (buttons, input glow, and controls)  
- Clean, responsive interface  

## How It Works

StraftatFX generates gradients by interpolating between two selected colors and applying them across visible characters in the text.

Depending on the selected mode, the gradient is either:
- Applied per letter (smooth transition)
- Distributed in stepped segments (1/2, 1/3, 1/4)
- Fully controlled using a custom step slider

The app builds a formatted output string using color tags and optional style tags, then renders both:
- A visual preview for readability
- A raw output string for copying and pasting into Strafat

The character counter reflects the **final formatted output length**, including all color and style tags.

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
- `guide.mjs` – Guide view logic and live examples  
- `styles.css` – UI styling  

## Usage

1. Enter your text  
2. Pick two colors for the gradient  
3. Choose a gradient mode  
4. Apply optional styles  
5. Copy the generated output  

Saved usernames and quips can be reused instantly, and remove mode allows quick cleanup.

## Interface Notes

- The preview shows how your text will look visually  
- The output shows the actual formatted string used in-game  
- The character counter reflects the true output length  
- Output turns yellow when exceeding Steam-safe limits (~32 characters)  
- Output turns red when approaching the maximum limit (500 characters)  

## Goals

StraftatFX was built to provide a fast, no-friction way to generate styled text without relying on heavy frameworks or complex workflows. The focus is on usability, performance, and clean output.

## Future Improvements

- Multi-color gradients (more than two colors)  
- Expanded formatting options  
- Preset themes  
- Export/share options  
- Profile system for saved data  

## Usage Notice

The name "StraftatFX" may not be used for redistributed versions without permission.

## License

This project is licensed under the MIT License. See the LICENSE file for details.