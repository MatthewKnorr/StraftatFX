const animations = [
  { duration: 420, frames: [
    { transform: "translateY(0)" }, { transform: "translateY(-3px)", offset: .3 },
    { transform: "translateY(1px)", offset: .65 }, { transform: "translateY(0)" }
  ] },
  { duration: 560, frames: [
    { textShadow: "0 0 0 transparent", opacity: 1 },
    { textShadow: "0 0 9px currentColor", opacity: .8, offset: .35 },
    { textShadow: "0 0 3px currentColor", opacity: 1, offset: .65 },
    { textShadow: "0 0 0 transparent", opacity: 1 }
  ] },
  { duration: 460, frames: [
    { transform: "rotate(0deg)" }, { transform: "rotate(-4deg)", offset: .25 },
    { transform: "rotate(3deg)", offset: .5 }, { transform: "rotate(-1deg)", offset: .75 },
    { transform: "rotate(0deg)" }
  ] },
  { duration: 400, frames: [
    { transform: "scale(1)" }, { transform: "scale(1.07)", offset: .4 },
    { transform: "scale(.98)", offset: .7 }, { transform: "scale(1)" }
  ] },
  { duration: 580, frames: [
    { transform: "translateX(0)", textShadow: "0 0 transparent" },
    { transform: "translateX(-2px)", textShadow: "3px 0 #80dfff, -3px 0 #df9dff", offset: .25 },
    { transform: "translateX(2px)", textShadow: "-2px 0 #80dfff, 2px 0 #df9dff", offset: .5 },
    { transform: "translateX(0)", textShadow: "0 0 transparent" }
  ] },
  { duration: 620, frames: [
    { transform: "perspective(180px) rotateX(0deg)" },
    { transform: "perspective(180px) rotateX(-22deg) translateY(-2px)", offset: .3 },
    { transform: "perspective(180px) rotateX(12deg)", offset: .6 },
    { transform: "perspective(180px) rotateX(0deg)" }
  ] },
  { duration: 520, frames: [
    { transform: "skewX(0deg) translateX(0)" },
    { transform: "skewX(-10deg) translateX(3px)", offset: .25 },
    { transform: "skewX(6deg) translateX(-2px)", offset: .6 },
    { transform: "skewX(0deg) translateX(0)" }
  ] },
  { duration: 600, frames: [
    { transform: "translate(0, 0) rotate(0deg)" },
    { transform: "translate(2px, -3px) rotate(3deg)", offset: .25 },
    { transform: "translate(-2px, -2px) rotate(-3deg)", offset: .6 },
    { transform: "translate(0, 0) rotate(0deg)" }
  ] },
  { duration: 540, frames: [
    { transform: "scale(1, 1)" },
    { transform: "scale(1.1, .88)", offset: .2 },
    { transform: "scale(.96, 1.12)", offset: .45 },
    { transform: "scale(1.02, .97)", offset: .7 },
    { transform: "scale(1, 1)" }
  ] },
  { duration: 640, frames: [
    { transform: "translateY(0)", filter: "blur(0px)", textShadow: "0 0 transparent" },
    { transform: "translateY(-2px)", filter: "blur(.5px)", textShadow: "0 3px 8px currentColor", offset: .3 },
    { transform: "translateY(1px)", filter: "blur(0px)", textShadow: "0 0 3px currentColor", offset: .65 },
    { transform: "translateY(0)", filter: "blur(0px)", textShadow: "0 0 transparent" }
  ] }
];

export function createRandomFxFeedback({
  now = () => performance.now(), random = Math.random,
  reducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
} = {}) {
  let lastPlayed = -Infinity;
  let previous = -1;
  let animation;
  return button => {
    if (reducedMotion()) { animation?.cancel(); return false; }
    const time = now();
    if (time - lastPlayed < 750) return false;
    const label = button?.querySelector(".randomfx-label");
    if (!label?.animate) return false;
    const choices = animations.map((_, index) => index).filter(index => index !== previous);
    previous = choices[Math.floor(random() * choices.length)];
    lastPlayed = time;
    animation?.cancel();
    const { frames, duration } = animations[previous];
    animation = label.animate(frames, { duration, easing: "ease-out" });
    return true;
  };
}

export function bindRandomFxHover(button, play = createRandomFxFeedback()) {
  button?.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch" || button.matches?.(":disabled")) return;
    play(button);
  });
}
