import { parts } from "./gradientEngine.mjs";
import { state } from "./state.mjs";

export function initGuide({ depth, onOpen } = {}) {
  const mount = document.getElementById("guideMount");
  const fallbackGuideColors = ["#ACDAA6", "#FFFFFF"];

  function updateGuideExample() {
    const el = document.getElementById("guideExample");
    if (!el) return;

    const text = "Your Gradient Text";
    const input = document.getElementById("textInput");
    const useFallbackColors = !input || !input.value.trim();
    const originalMode = state.mode;
    const originalColors = [...state.colors];
    state.mode = 5;
    state.colors = useFallbackColors ? fallbackGuideColors : originalColors;

    const styledParts = parts(text, depth);

    state.mode = originalMode;
    state.colors = originalColors;
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
    <h2 class="fx-title">StraftatFX</h2>
    <h3 class="guide-subtitle">How to Use</h3>

    <p>
      StraftatFX lets you generate gradient-colored text for use in Straftat usernames and chat.
    </p>

    <div class="guide-logo-demo" aria-hidden="true">
      <span class="guide-logo-tooltip">Click the header logo for a small easter egg</span>
    </div>

    <h3>Overview</h3>
    <p>
      Your text is blended between two selected colors to create a gradient.
    </p>
    <p>
      Depending on the mode, this gradient is applied either smoothly across each character or in stepped color groups.
    </p>

    <h3>Example</h3>
    <p>
      <span id="guideExample" class="guide-gradient">Your Gradient Text</span>
    </p>
    <p>This updates live based on your selected colors, and shows a fallback gradient before you start typing.</p>

    <h3>Usage</h3>
    <ul>
      <li><b>Enter text</b><br>Type the username or message you want to style.</li>
      <li><b>Select colors</b><br>Pick from the available color stops for your current text length. These define the full range of the gradient.</li>
      <li>
        <b>Choose mode</b>
        <ul>
          <li><b>Per Letter</b> -> each character shifts gradually (smooth gradient)</li>
          <li><b>1/2, 1/3, 1/4</b> -> colors are grouped into larger steps</li>
          <li><b>1</b> -> single solid color (no gradient)</li>
          <li><b>Custom</b> -> manually control how many color steps are used</li>
        </ul>
      </li>
      <li><b>Optional styles</b><br>Apply bold, italic, underline, or superscript formatting to the final result.</li>
      <li><b>Copy output</b><br>The generated text is ready to paste directly into Straftat.</li>
      <li><b>Auto Copy</b><br>Turn on Auto Copy if you want StraftatFX to copy the output automatically whenever you make a change.</li>
      <li><b>Color limits</b><br>Higher color counts unlock only when you have enough visible text entered. This keeps extra color stops from appearing before the gradient has enough characters to spread across.</li>
    </ul>

    <h3>Controls</h3>
    <ul>
      <li><b>Shuffle</b> -> generates a random color combination</li>
      <li><b>Swap</b> -> switches your start and end colors</li>
      <li><b>Auto Copy</b> -> toggles automatic copying on or off</li>
      <li><b>Logo</b> -> the main StraftatFX logo can be clicked on the page for an extra effect</li>
      <li><b>GitHub</b> -> view the project source code</li>
    </ul>

    <h3>Preview vs Output</h3>
    <p>
      The preview shows how your gradient will look visually.
    </p>
    <p>
      The output is the actual formatted text that gets copied and used in-game.
    </p>
    <p>
      You don't need to understand the formatting - just copy and paste.
    </p>

    <h3>Limits</h3>
    <ul>
      <li>Max output: 500 characters (app limit)</li>
      <li>Steam text may be limited to about 32 characters depending on platform</li>
      <li>Not all platforms support colored text formatting</li>
      <li>Higher color counts need enough entered text before they become available</li>
    </ul>

    <h3>Tip</h3>
    <p>
      Short text with "Per Letter" usually produces the cleanest and smoothest gradients.
    </p>
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
