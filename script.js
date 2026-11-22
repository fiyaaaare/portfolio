// ---- Living scene ----

const scene = document.getElementById("scene");

function addElement(className, styles, parent = scene) {
  const element = document.createElement("div");
  element.className = `px ${className}`;
  element.style.cssText = styles;
  parent.appendChild(element);
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

// Water glints
for (let i = 0; i < 22; i += 1) {
  addElement(
    "glint",
    `left:${random(3, 95)}%;` +
      `top:${random(86, 98)}%;` +
      `width:${random(10, 26)}px;` +
      `animation-delay:-${random(0, 5)}s;` +
      `animation-duration:${random(4, 8)}s`
  );
}

// Fireflies
for (let i = 0; i < 14; i += 1) {
  addElement(
    "fly",
    `left:${random(4, 96)}%;` +
      `top:${random(40, 80)}%;` +
      `--dx:${random(-40, 40)}px;` +
      `--dy:${random(-30, 30)}px;` +
      `animation-duration:${random(5, 10)}s,${random(2, 4)}s;` +
      `animation-delay:-${random(0, 6)}s,-${random(0, 3)}s`
  );
}

// Falling leaves from the right trees
for (let i = 0; i < 7; i += 1) {
  addElement(
    "leaf",
    `left:${random(72, 92)}%;` +
      `top:${random(25, 45)}%;` +
      `animation-duration:${random(9, 16)}s;` +
      `animation-delay:-${random(0, 14)}s`
  );
}

// Fishing line reaches down into the lake
const line = document.getElementById("line");
const workSection = document.getElementById("work");

function sizeLine() {
  const top = line.getBoundingClientRect().top + scrollY;
  const workTop = workSection.getBoundingClientRect().top + scrollY;
  line.style.height = `${Math.max(60, workTop - top + 70)}px`;
}

// Bubbles
const lake = document.getElementById("lake");

for (let i = 0; i < 16; i += 1) {
  const bubble = document.createElement("div");
  const size = random(6, 20);

  bubble.className = "bubble";
  bubble.style.cssText =
    `left:${random(0, 100)}%;` +
    `width:${size}px;` +
    `height:${size}px;` +
    `animation-duration:${random(14, 30)}s;` +
    `animation-delay:-${random(0, 20)}s`;

  lake.appendChild(bubble);
}

lake.style.overflow = "hidden";

// Depth meter
const depthElement = document.getElementById("d");

function updateDepth() {
  const depth = Math.max(
    0,
    Math.round((scrollY + innerHeight * 0.5 - lake.offsetTop) / 40)
  );
  depthElement.textContent = `${depth}m`;
}

window.addEventListener("scroll", updateDepth, { passive: true });
window.addEventListener("resize", () => {
  sizeLine();
  updateDepth();
});
window.addEventListener("load", () => {
  sizeLine();
  updateDepth();
});

sizeLine();
updateDepth();

// Cursor water ripples
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let lastRipple = 0;

  window.addEventListener("pointermove", (event) => {
    if (
      event.pointerType === "touch" ||
      performance.now() - lastRipple < 55
    ) {
      return;
    }

    lastRipple = performance.now();

    const ripple = document.createElement("span");
    ripple.className = "cursor-ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener("animationend", () => ripple.remove());
  });
}

// Fish swimming behind the project and about sections
const fishTypes = ["🐟", "🐠", "🐡"];

for (let i = 0; i < 7; i += 1) {
  const fish = document.createElement("span");

  fish.className = `lake-fish${i % 2 ? " reverse" : ""}`;
  fish.textContent = fishTypes[i % fishTypes.length];
  fish.style.top = `${18 + i * 11}%`;
  fish.style.setProperty("--duration", `${18 + i * 3}s`);
  fish.style.animationDelay = `-${random(0, 18)}s`;

  lake.appendChild(fish);
}

// Reveal projects and deeper content as it enters the viewport
const revealElements = document.querySelectorAll(
  ".card,.sec h2,.sec .sub,.about,.floor"
);

revealElements.forEach((element) => element.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealElements.forEach((element) => revealObserver.observe(element));

// Generated river and underwater ambience
const soundToggle = document.getElementById("sound-toggle");

let audioContext;
let masterGain;
let surfaceGain;
let underwaterGain;
let underwaterDepth = 0;

function createNoiseSource(seconds) {
  const buffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * seconds,
    audioContext.sampleRate
  );
  const data = buffer.getChannelData(0);
  let previous = 0;

  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    previous = (previous + 0.02 * white) / 1.02;
    data[i] = previous * 3.5;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();

  return source;
}

function initAmbient() {
  if (audioContext) {
    return;
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  masterGain = audioContext.createGain();
  masterGain.gain.value = 0;

  surfaceGain = audioContext.createGain();
  surfaceGain.gain.value = 0.9;

  underwaterGain = audioContext.createGain();
  underwaterGain.gain.value = 0;

  masterGain.connect(audioContext.destination);
  surfaceGain.connect(masterGain);
  underwaterGain.connect(masterGain);

  // River layer
  const river = audioContext.createBiquadFilter();
  river.type = "bandpass";
  river.frequency.value = 900;
  river.Q.value = 0.55;
  createNoiseSource(4).connect(river).connect(surfaceGain);

  [1108, 1479, 1760].forEach((frequency, index) => {
    const shimmer = audioContext.createOscillator();
    const shimmerGain = audioContext.createGain();
    const shimmerPan = audioContext.createStereoPanner();

    shimmer.type = "sine";
    shimmer.frequency.value = frequency;
    shimmerGain.gain.value = 0.0025 / (index + 1);
    shimmerPan.pan.value = (index - 1) * 0.45;

    shimmer.connect(shimmerGain).connect(shimmerPan).connect(surfaceGain);
    shimmer.start();
  });

  // Underwater layer
  const underwaterMuffler = audioContext.createBiquadFilter();
  underwaterMuffler.type = "lowpass";
  underwaterMuffler.frequency.value = 220;
  underwaterMuffler.Q.value = 0.7;
  createNoiseSource(5).connect(underwaterMuffler).connect(underwaterGain);

  [55, 82.4, 110].forEach((frequency, index) => {
    const drone = audioContext.createOscillator();
    const droneGain = audioContext.createGain();

    drone.type = index === 0 ? "sine" : index === 1 ? "triangle" : "sine";
    drone.frequency.value = frequency;
    droneGain.gain.value = index === 0 ? 0.035 : 0.018;

    drone.connect(droneGain).connect(underwaterGain);
    drone.start();

    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();

    lfo.frequency.value = 0.035 + index * 0.018;
    lfoGain.gain.value = index === 0 ? 7 : 3;
    lfo.connect(lfoGain).connect(drone.frequency);
    lfo.start();
  });
}

function playBubble() {
  if (
    !audioContext ||
    soundToggle.getAttribute("aria-pressed") !== "true" ||
    underwaterDepth < 0.25
  ) {
    return;
  }

  const now = audioContext.currentTime;
  const bubble = audioContext.createOscillator();
  const bubbleGain = audioContext.createGain();

  bubble.type = "sine";
  bubble.frequency.setValueAtTime(280 + random(80, 220), now);
  bubble.frequency.exponentialRampToValueAtTime(
    520 + random(80, 180),
    now + 0.09
  );

  bubbleGain.gain.setValueAtTime(0.0001, now);
  bubbleGain.gain.exponentialRampToValueAtTime(
    0.018 * underwaterDepth,
    now + 0.025
  );
  bubbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  bubble.connect(bubbleGain).connect(underwaterGain);
  bubble.start(now);
  bubble.stop(now + 0.2);
}

function scheduleBubble() {
  if (
    audioContext &&
    soundToggle.getAttribute("aria-pressed") === "true"
  ) {
    playBubble();
  }

  window.setTimeout(scheduleBubble, random(1200, 3600));
}

scheduleBubble();

function updateAmbient() {
  if (
    !audioContext ||
    soundToggle.getAttribute("aria-pressed") !== "true"
  ) {
    return;
  }

  const lakeTop = lake.getBoundingClientRect().top + scrollY;
  const position =
    (scrollY + innerHeight * 0.5 - lakeTop) / (innerHeight * 0.7);

  underwaterDepth = Math.max(0, Math.min(1, position));

  const now = audioContext.currentTime;
  masterGain.gain.setTargetAtTime(0.16, now, 0.3);
  surfaceGain.gain.setTargetAtTime(
    1 - underwaterDepth * 0.82,
    now,
    0.35
  );
  underwaterGain.gain.setTargetAtTime(
    0.12 + underwaterDepth * 0.88,
    now,
    0.35
  );
}

soundToggle.addEventListener("click", () => {
  initAmbient();
  audioContext.resume();

  const turningOn =
    soundToggle.getAttribute("aria-pressed") !== "true";

  soundToggle.setAttribute("aria-pressed", String(turningOn));
  soundToggle.querySelector(".sound-label").textContent =
    turningOn ? "Sound on" : "Sound off";
  soundToggle.setAttribute(
    "aria-label",
    turningOn
      ? "Turn ambient lake sound off"
      : "Turn ambient lake sound on"
  );

  const now = audioContext.currentTime;
  masterGain.gain.setTargetAtTime(turningOn ? 0.16 : 0, now, 0.25);

  if (turningOn) {
    updateAmbient();
  }
});

window.addEventListener("scroll", updateAmbient, { passive: true });

// Secret cat
const cat = document.getElementById("easter-cat");

cat.addEventListener("click", () => {
  if (!audioContext) {
    initAmbient();
  }

  audioContext.resume();

  const now = audioContext.currentTime;
  const meow = audioContext.createOscillator();
  const meowGain = audioContext.createGain();

  meow.type = "triangle";
  meow.frequency.setValueAtTime(520, now);
  meow.frequency.exponentialRampToValueAtTime(780, now + 0.12);
  meow.frequency.exponentialRampToValueAtTime(430, now + 0.32);

  meowGain.gain.setValueAtTime(0.0001, now);
  meowGain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
  meowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

  meow.connect(meowGain).connect(audioContext.destination);
  meow.start(now);
  meow.stop(now + 0.4);

  const rect = cat.getBoundingClientRect();

  for (let i = 0; i < 10; i += 1) {
    const heart = document.createElement("span");

    heart.className = "heart-pop";
    heart.textContent = ["♡", "♥", "🐟︎"][i % 3];
    heart.style.left =
      `${rect.left + rect.width / 2 + random(-12, 12)}px`;
    heart.style.top = `${rect.top + random(-5, 8)}px`;
    heart.style.setProperty("--drift", `${random(-70, 70)}px`);
    heart.style.setProperty("--turn", `${random(-35, 35)}deg`);
    heart.style.animationDelay = `${i * 0.07}s`;

    document.body.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }
});
