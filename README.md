# StraftatFX

StraftatFX v4 is a lightweight browser-based text generator for creating gradient usernames, tags, and chat text for Straftat. It gives you a live visual preview, the exact formatted output string, and local tools for saving palettes and reusable clipboard entries.

## Current Features

- One to four color gradients with editable color handles and per-slot locks
- Smooth per-letter gradients, stepped modes, single-color mode, and custom step count
- Preset palette browser with built-in presets, favorites, and user-created gradients
- Up to 7 wider recent gradient swatches in a centered, responsive row; hover or keyboard-focus to smoothly preview, click to apply
- Color temperature control for cooler, mixed, or warmer Clean-generated colors
- Shuffle, Inverse, and Rotate controls for unlocked colors
- Advanced text effects with style toggles, small-caps/uppercase, alignment, spacing, and layout controls
- Gradient Controls with resettable intensity modes and color temperature
- Real-time visual preview and formatted output preview
- Manual copy, optional auto copy, and saved clipboard entries
- Remove mode for cleaning up saved clipboard items and user-created gradients
- Lightweight feedback link to a Google Form
- Output character counter, Steam-length indicator, and 500-character app limit warning
- Dark and light theme buttons
- Integrated in-app guide and header logo easter egg

## Usage

1. Type text in the main input.
2. Choose a color count. All one-to-four-color choices are available at any text length.
3. Adjust the gradient handles, shuffle colors, inverse or rotate colors, or open the preset palette browser.
4. Open Advanced Controls for exactly four tabs: Text Effects, Styles, Spacing, and Gradient Control.
5. Use Text Effects for selection styling, Styles for whole-message effects, and Spacing for spacing and layout.
6. Use Gradient Control for intensity modes, custom steps, temperature, or reset the gradient controls to defaults.
7. Copy the generated output, enable Auto Copy, save the palette, or save the output to the in-app clipboard.

## Selection formatting and styles

Highlight a word or phrase in the main text input and open **Advanced Controls > Text Effects**. The Selection styling panel applies colors, gradients, text effects, Shambles, font, and size only to that range. The Styles and Spacing tabs style the whole message. Selection overrides remain attached to existing characters when text before them changes; newly typed replacement text inherits the whole-message formatting. **Clear selection style** removes the selected overrides. Selected Shambles changes only when toggled or rerolled, not when colors shuffle.

The Styles tab provides Title, H1, H2, and Liberation Sans SDF (`LiberationSans SDF`). Percentage size is available only in selection styling. The browser loads the bundled Liberation Sans regular, bold, italic, and bold-italic faces. Named style sizes and game rendering remain approximate.


Scoped formatting uses closing tags in copied output to stop effects at selection boundaries. The output display hides closing tags while preserving their formatting boundaries. The existing 500-character output limit still applies, including all style tags.

## Interface Notes

- The large preview shows the visual result.
- The output preview shows the generated formatting string in a readable form.
- The copied text retains the scoped closing tags needed for selection boundaries.
- The total counter reflects the final formatted output length.
- The Steam indicator compares formatted output length against 32; it is not verified game enforcement.
- Above 500 output characters, the live editor clears its preview and copyable output until the text or formatting is reduced.
- The editor flows from User Input to Gradient Editor, Previous Gradients, then Gradient Controls.
- **&#xff0b; Save to Arsenal** saves formatted text below the editor in a strict three-column grid; click an entry to copy it. **Save Gradient** stores the palette under User Created.
- Browser storage keeps saved gradients, favorites, recent gradients, clipboard items, and UI preferences.
- Main-gradient changes replace selected-text color overrides while preserving styles and effects. Hover previews render text and output together without triggering Auto Copy.
- The Feedback link opens a Google Form in a new tab.

## Tech Stack

- HTML
- CSS
- JavaScript ES modules
- localStorage for persistence
- Pickr for color picking
- Font Awesome icons

## Project Structure

- `index.html` - App markup and control layout
- `styles/styles.css` - Responsive dark glass/light theme styling
- `js/main.mjs` - The only app entry point; initialization, UI logic, presets, effects, and event handling
- `js/selectionEditor.mjs` - Selection controls
- `js/selectionModel.mjs` - Selection ranges, overrides, and output composition
- `js/gradient.mjs` - Color math, interpolation, gradient generation, and count-specific clean harmonies
- `js/render.mjs` - Formatted output rendering and visual preview
- `js/formatter.mjs` - Text effect tag generation and value clamping
- `js/saved.mjs` - Saved clipboard rendering
- `js/state.mjs` - Shared state and localStorage helpers
- `js/guide.mjs` - In-app guide modal and live example
- `js/floating.mjs` - Floating background assets
- `js/logoAudio.mjs` - Header logo audio easter egg
- `gradients/` - Preset catalogs: `anime.json` (series/franchises), `anime_characters.json` (characters), `superpowered.json`, `video-games.json`, `movies-tv.json`, `vibes.json`, and `brands.json`. Each file contains an array of presets with `name` and `colors` fields.
- `js/presetOrder.mjs` - Shuffles preset order when the drawer or a category opens, keeping the order stable during other updates.

## Usage Notice

The name "StraftatFX" may not be used for redistributed versions without permission.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
