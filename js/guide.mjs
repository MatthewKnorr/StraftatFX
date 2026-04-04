import { parts } from "./gradientEngine.mjs";
import { state } from "./state.mjs";

export function initGuide({ depth }) {

  const mount = document.getElementById("guideMount");

  mount.innerHTML = `
    <h2 class="fx-title">StraftatFX</h2>
<h3 class="guide-subtitle">How to Use</h3>

<p>
StraftatFX lets you generate gradient-colored text for use in Strafat usernames and chat.
</p>

<h3>Overview</h3>
<p>
Your text is blended between two selected colors to create a gradient.
</p>

<p>
Depending on the mode, this gradient is applied either smoothly across each character or in stepped color groups.
</p>

<h3>Example</h3>
<p>
<span id="guideExample" class="guide-gradient">UberMonkey</span>
</p>
<p>This updates live based on your selected colors.</p>

<h3>Usage</h3>
<ul>
  <li><b>Enter text</b><br>
  Type the username or message you want to style.</li>

  <li><b>Select colors</b><br>
  Left = starting color<br>
  Right = ending color<br>
  These define the full range of the gradient.</li>

  <li><b>Choose mode</b>
    <ul>
      <li><b>Per Letter</b> → each character shifts gradually (smooth gradient)</li>
      <li><b>1/2, 1/3, 1/4</b> → colors are grouped into larger steps</li>
      <li><b>1</b> → single solid color (no gradient)</li>
      <li><b>Custom</b> → manually control how many color steps are used</li>
    </ul>
  </li>

  <li><b>Optional styles</b><br>
  Apply bold, italic, underline, or superscript formatting to the final result.</li>

  <li><b>Copy output</b><br>
  The generated text is ready to paste directly into Strafat.</li>
</ul>

<h3>Controls</h3>
<ul>
  <li><b>Shuffle</b> → generates a random color combination</li>
  <li><b>Swap</b> → switches your start and end colors</li>
  <li><b>GitHub</b> → view the project source code</li>
</ul>

<h3>Preview vs Output</h3>
<p>
The preview shows how your gradient will look visually.
</p>

<p>
The output is the actual formatted text that gets copied and used in-game.
</p>

<p>
You don’t need to understand the formatting — just copy and paste.
</p>

<h3>Limits</h3>
<ul>
  <li>Max output: 500 characters (app limit)</li>
  <li>Usernames may be limited (~32 characters depending on platform)</li>
  <li>Not all platforms support colored text formatting</li>
</ul>

<h3>Tip</h3>
<p>
Short text with “Per Letter” usually produces the cleanest and smoothest gradients.
</p>
  `;

  const guideView = document.getElementById("guideView");
  const openGuide = document.getElementById("openGuide");
  const closeGuide = document.getElementById("closeGuide");

  openGuide.onclick = () => guideView.classList.remove("hidden");
  closeGuide.onclick = () => guideView.classList.add("hidden");

  guideView.addEventListener("click", (e) => {
    if (e.target === guideView) guideView.classList.add("hidden");
  });

  function updateGuideExample() {
    const el = document.getElementById("guideExample");
    if (!el) return;

    const text = "UberMonkey";

    const originalMode = state.mode;
    state.mode = 5;

    const styledParts = parts(text, depth);

    state.mode = originalMode;

    el.innerHTML = "";

    styledParts.forEach(({ ch, hex }) => {
      const span = document.createElement("span");
      span.textContent = ch;
      if (hex) span.style.color = hex;
      el.appendChild(span);
    });
  }

  updateGuideExample();

  return { updateGuideExample };
}