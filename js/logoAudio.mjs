const sounds = [
  "./assets/audio/astur.mp3",
  "./assets/audio/auh-au-hu.mp3",
  "./assets/audio/auurrrrr.mp3",
  "./assets/audio/baurrr.mp3",
  "./assets/audio/boy.mp3"
];

let currentAudio = null;
let currentSource = null;
let audioContext = null;
let audioBoost = null;

function connectBoost(audio) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    audioBoost = audioContext.createGain();
    audioBoost.gain.value = 1.75;
    const limiter = audioContext.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    audioBoost.connect(limiter);
    limiter.connect(audioContext.destination);
  }
  currentSource = audioContext.createMediaElementSource(audio);
  currentSource.connect(audioBoost);
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(err => console.error("Audio resume failed:", err));
  }
}

function getRandomSound() {
  return sounds[Math.floor(Math.random() * sounds.length)];
}

export function initLogoAudio() {
  const logo = document.querySelector(".logo");
  if (!logo) {
    console.warn("Logo not found");
    return;
  }

  logo.addEventListener("click", () => {

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentSource?.disconnect();
    currentSource = null;

    const audio = new Audio(getRandomSound());
    currentAudio = audio;

    audio.volume = 1;
    connectBoost(audio);

    audio.play().catch(err => {
      console.error("Audio failed:", err);
    });

    audio.onended = () => {
      if (currentAudio === audio) {
        currentSource?.disconnect();
        currentSource = null;
        currentAudio = null;
      }
    };
  });
}
