import { state } from "./state.mjs";
import { parts } from "./gradient.mjs";

export function initGuide({ depth, onOpen } = {}) {
  const mount = document.getElementById("guideMount");

  function updateGuideExample() {
    const el = document.getElementById("guideExample");
    if (!el) return;

    const text = "Your Gradient Text";
    const originalMode = state.mode;
    let styledParts;
    try {
      state.mode = 5;
      styledParts = parts(text, depth);
    } finally {
      state.mode = originalMode;
    }
    el.innerHTML = "";

    styledParts.forEach(({ ch, hex }) => {
      const span = document.createElement("span");
      span.textContent = ch;
      if (hex) span.style.color = hex;
      el.appendChild(span);
    });
  }

  if (!mount) {
    return { updateGuideExample };
  }

  mount.innerHTML = `
    <h2 class="fx-title">StraftatFX <small>v.4</small></h2>
    <p class="guide-subtitle">Your guide to gradient text</p>
    <p>Create colored usernames and messages, preview their appearance, and copy the generated TextMeshPro (TMP) formatting into Straftat.</p>
    <nav class="guide-nav" aria-label="Guide sections">
      <span class="guide-nav-title">Jump to</span>
      <a href="#guide-start">Quick start</a><a href="#guide-colors">Colors</a><a href="#guide-advanced">Advanced Controls</a><a href="#guide-saved">Saving</a><a href="#guide-output">Output &amp; limits</a><a href="#guide-other">Other controls</a>
    </nav>

    <h3 id="guide-start">Quick start</h3>
    <ol>
      <li><b>User Input:</b> type your name or message.</li>
      <li><b>Gradient Editor:</b> choose 1 to 4 colors. Click a color handle to open its picker, then choose a color or enter a hex value.</li>
      <li><b>Previous Gradients:</b> hover or focus a saved history swatch to preview it; click to restore it.</li>
      <li><b>Gradient Controls:</b> try Shuffle, Inverse, Rotate, Preset &amp; Saved Gradients, or Advanced Controls.</li>
      <li>Check the large preview, then press <b>Copy</b> below it. Paste the copied output into the game.</li>
    </ol>
    <p class="guide-note">Start with a short message and Per Letter for a smooth gradient. You do not need to write formatting tags yourself.</p>
    <p><span id="guideExample" class="guide-gradient">Your Gradient Text</span></p>
    <p>This example uses your active gradient and updates when you change its colors.</p>

    <h3 id="guide-colors">Colors, history, and presets</h3>
    <ul>
      <li><b>1 Color to 4 Colors:</b> all four choices are available regardless of text length. More stops define more colors along the gradient; they do not add text.</li>
      <li><b>Color handles:</b> open the picker to edit colors. Their positions are fixed; they are not draggable gradient stops.</li>
      <li><b>Lock icon:</b> keep a color in its slot during shuffling, inversing, rotating, or applying presets and history. You can still edit that color manually.</li>
      <li><b>Shuffle:</b> generate new unlocked colors using the selected Clean or Random generator.</li>
      <li>Changing the main gradient replaces earlier selection colors while keeping text styles and effects. Preset and history previews show the same colors in the text and output; hovering does not trigger Auto Copy.</li>
      <li><b>Inverse:</b> reverse the order of unlocked colors. <b>Rotate:</b> move the last unlocked color to the first unlocked slot. Both need at least two unlocked colors.</li>
      <li><b>Previous Gradients:</b> keeps up to 7 recent palettes in browser storage. Hovering or keyboard focus previews a palette without committing it; leaving restores the current view. Click to apply. The row is hidden until history exists.</li>
      <li><b>Preset &amp; Saved Gradients:</b> click a category to apply a random preset and color its active button. Hover a preset to preview, or click one to apply it. Presets fit your selected color count and preserve locked slots. If your input is empty, applying a preset also fills it with the preset name.</li>
      <li><b>Save Favorite / Remove Favorite:</b> manage the selected preset in the Favorites category. Your own saved palettes appear under Saved Gradients, with a Remove control on each card. Apply random applies a random gradient from the category you are viewing.</li>
    </ul>

    <h3 id="guide-advanced">Advanced Controls: four tabs</h3>
    <p>Open <b>Advanced Controls</b> from the toolbar. Switching tabs keeps your settings. Wide windows can show both drawers together. In smaller windows, only one stays open; the editor fits the remaining space where possible. Close the drawer with its close button, Escape, or the toolbar button.</p>
    <h4>Text Effects</h4>
    <p><b>Selection styling</b> changes only highlighted text. Highlight a word or phrase in User Input, then open this tab. The selection status shows the range being edited; controls are disabled when nothing is selected.</p>
    <ul>
      <li>Apply Bold, Italic, Underline, Strike, Sup or Sub, named Style, Font, Scale, Case, Rotation, Letter spacing, or Vertical offset to the selection.</li>
      <li>The selection gradient uses the same color picker and generator as the main editor. Choose 1 to 4 colors, edit or lock a color stop, and use Shuffle, Inverse, or Rotate. Changes apply only to the highlighted text. Use main gradient copies the main palette while keeping locked selection colors.</li>
      <li><b>RandomFx</b> toggles random effects for the selected characters. <b>Reroll FX</b> generates a new selection effect pattern.</li>
      <li><b>Clear selection style</b> removes that range's overrides and restores whole-message formatting. Selected effects otherwise override corresponding whole-message settings.</li>
      <li>Formatting follows existing characters as you edit. Newly typed replacement text inherits whole-message settings.</li>
    </ul>
    <p>The floating <b>Text Effects</b> control stays at the bottom of Advanced Controls across its tabs. Press Reset to clear all effects, or open it to remove individual effects. It clears whole-message and selected-text effects while preserving your colors. Use <b>Clear selection style</b> in the last Text Effects tab to reset only a selected range.</p>
    <h4>Styles</h4>
    <p>These controls apply to the whole message, except where selected-text overrides take precedence.</p>
    <ul>
      <li><b>Style:</b> Normal, Title, H1, or H2. Named styles use the game's style sheet; browser sizes are approximations.</li>
      <li><b>Font:</b> Default or Liberation Sans SDF. The browser uses bundled Liberation Sans faces, while copied text references the game's <code>LiberationSans SDF</code> asset.</li>
      <li><b>Bold, Italic, Underline, Strikethrough:</b> toggle each effect independently.</li>
      <li><b>Sup / Sub:</b> superscript or subscript; only one can be active.</li>
      <li><b>Case:</b> Small Case applies small caps; Uppercase applies capitals. Click the active case option again to turn it off.</li>
      <li><b>Align:</b> Left, Center, or Right.</li>
      <li><b>RandomFx:</b> RandomFx mixes character effects such as emphasis, rotation, and vertical offsets. Click it again to turn it off. Reroll turns it on and generates a fresh pattern. RandomFx adds only effects that fit in the remaining 500-character output budget. Color changes preserve the pattern where it still fits. Clear FX removes random effects, including selected random effects, while keeping your colors and other styling.</li>
    </ul>
    <p><b>Clean harmonies:</b> 1 color uses Monochromatic; 2 uses Complementary, Analogous Pair, Split Pair, or Near Complementary; 3 uses Analogous, Triadic, Split Complementary, or Wide Analogous; 4 uses Rectangle, Square, Double Complementary, or Analogous Four. Changing the color count generates a matching palette. Locked colors stay unchanged.</p><h4>Layout</h4><p><b>Scale:</b> under Scale &amp; Spacing, use 1.00 for normal size, 0.50 for half size, or 2.00 for double size. Adjust in 0.01 steps, from 0.01 to 3.00.</p>
    <ul>
      <li><b>Letter spacing:</b> -80 to 80 px, adjusting gaps between letters.</li>
      <li><b>Fixed width:</b> 0 to 80 px, setting a character cell width.</li>
      <li><b>Position:</b> -500 to 500 px, adjusting horizontal position.</li>
      <li><b>Width:</b> 1 to 100%, setting the text area width.</li>
      <li><b>Rotate:</b> -360 to 360 degrees, rotating characters.</li>
      <li><b>Vertical offset:</b> -5 to 5 em, raising or lowering characters.</li>
    </ul>
    <p>Blank fields use the default. Layout effects are browser approximations, so check their appearance in-game.</p>
    <h4>Gradient Control</h4>
    <ul>
      <li><b>Intensity 1:</b> one solid color. <b>1/2, 1/3, 1/4:</b> two, three, or four color groups. <b>Per Letter:</b> a color for each non-space character. <b>Custom:</b> use the Steps slider to choose the number of groups.</li>
      <li>Very short input automatically uses one or two steps. As you type more text, the automatic short-text mode returns to Per Letter.</li>
      <li><b>Temperature:</b> affects every unlocked color on the next Clean shuffle. Fully Cool or Hot keeps generated hues in that temperature range; intermediate positions mix temperatures. Balanced preserves the original harmonies. Named presets keep their original colors. Random uses the full RGB range, so its temperature slider is disabled.</li>
      <li><b>Color Generator:</b> Clean creates coordinated palettes; Random includes unrestricted colors, grays, black, and white. Selecting a generator also shuffles unlocked colors.</li>
      <li><b>Reset:</b> restores Per Letter, Balanced temperature, and Clean generation; unlocks all colors. It keeps the palette and saved items.</li>
    </ul>

    <h3 id="guide-saved">Save and reuse</h3>
    <ul>
      <li><b>Save to Phrases:</b> saves the current formatted output, including its colors and effects. Duplicate entries are not added.</li>
      <li><b>Phrases:</b> remains below the editor in three columns. Click an item to copy its saved output, or focus it and press Enter or Space. A copy icon appears on hover or focus; <b>&#10003; COPIED</b> briefly confirms a successful copy.</li>
      <li><b>Save Color Gradient:</b> saves only the current palette in Preset &amp; Saved Gradients &gt; Saved Gradients. It does not save the message or text effects.</li>
      <li><b>Remove:</b> use the compact control in the Phrases header to reveal a trash button on each saved item. Remove as many items as needed; click <b>Done</b> to exit, or pause briefly after a removal and the mode closes automatically. Phrase copying is disabled during removal mode.</li>
    </ul>
    <p>Saved text, palettes, favorites, history, and supported preferences stay in this browser's local storage. They are not account-synced; clearing site data removes them. Saving a palette or text entry does not change existing saved entries.</p>

    <h3 id="guide-output">Preview, copying, and limits</h3>
    <p>The large preview approximates the copied result. Output and copies omit closing tags and repeated active tags. Effects remain active until replaced by a different value; styles such as bold and subscript continue through the remaining text. <b>Copy</b> copies the generated output.</p>
    <ul>
      <li><b>Auto Copy:</b> copies the current output when enabled, then copies changed, nonempty output automatically.</li>
      <li><b>500-character app cutoff:</b> the live editor counts the complete output string, including color and style tags. Above 500, it shows a warning and clears the preview and copyable output. Shorten your message or reduce formatting to restore it. This is an app rule, not a verified game limit.</li>
      <li><b>Steam Limit indicator:</b> compares formatted output length against 32. It is an app indicator, not a guarantee that a particular game or Steam field will accept or render the text.</li>
      <li>Spaces are preserved and do not consume a gradient color step. More per-letter colors and effects can make short-looking messages use many output characters.</li>
      <li>Game fields and other platforms may render or accept TMP tags differently. Named styles, layout, and SDF rasterization can differ from the browser preview.</li>
    </ul>
    <p class="guide-note">If copying fails, check your browser's clipboard permission and try Copy again. If the preview disappears with a length warning, simplify effects or shorten the input.</p>

    <h3 id="guide-other">Other controls</h3>
    <ul>
      <li><b>Theme buttons:</b> switch between dark and light mode; the choice is remembered.</li>
      <li><b>Guide:</b> opens this guide. Close it with the corner close button or by clicking the backdrop.</li>
      <li><b>Feedback:</b> opens the feedback form in a new tab. <b>GitHub:</b> opens the project source.</li>
      <li><b>Logo:</b> click the header logo for the audio easter egg.</li>
    </ul>
  `;

  const guideView = document.getElementById("guideView");
  const openGuide = document.getElementById("openGuide");
  const closeGuide = document.getElementById("closeGuide");

  if (!guideView || !openGuide || !closeGuide) {
    updateGuideExample();
    return { updateGuideExample };
  }

  openGuide.onclick = () => {
    guideView.classList.remove("hidden");
    updateGuideExample();
    onOpen?.();
  };

  closeGuide.onclick = () => {
    guideView.classList.add("hidden");
  };

  guideView.addEventListener("click", e => {
    if (e.target === guideView) {
      guideView.classList.add("hidden");
    }
  });

  updateGuideExample();

  return { updateGuideExample };
}
