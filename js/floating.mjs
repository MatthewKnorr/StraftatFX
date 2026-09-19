const assets = [
    "./assets/pngs/floating/Ae86.png",
    "./assets/pngs/floating/AK.png",
    "./assets/pngs/floating/AR.png",
    "./assets/pngs/floating/Barrel.png",
    "./assets/pngs/floating/Fg42.png",
    "./assets/pngs/floating/Flamberge.png",
    "./assets/pngs/floating/GlandGrenade.png",
    "./assets/pngs/floating/Grenade.png",
    "./assets/pngs/floating/Katana.png",
    "./assets/pngs/floating/M2000.png",
    "./assets/pngs/floating/Nizeh.png",
    "./assets/pngs/floating/Pig.png",
    "./assets/pngs/floating/QCW05.png",
    "./assets/pngs/floating/SawedOff.png",
    "./assets/pngs/floating/Shotgun.png",
    "./assets/pngs/floating/Silenzio.png",
    "./assets/pngs/floating/Stungrenade.png",
    "./assets/pngs/floating/AboubiHeadWeapon.png"
];

let loadedAssets = [];

// track how many of each are active
const usage = new Map();

function getAvailableAsset() {
    const shuffled = [...loadedAssets].sort(() => Math.random() - 0.5);

    for (const src of shuffled) {
        const count = usage.get(src) || 0;
        if (count < 3) {
            usage.set(src, count + 1);
            return src;
        }
    }

    return null; // nothing available right now
}

function releaseAsset(src) {
    const count = usage.get(src) || 0;
    usage.set(src, Math.max(0, count - 1));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function getSpawnPosition(items, fromLeft) {
    const x = fromLeft ? -70 : window.innerWidth + 70;
    const minYGap = Math.min(180, Math.max(104, window.innerHeight * 0.16));
    const minScreenDistance = Math.min(260, Math.max(170, window.innerWidth * 0.16));

    for (let attempt = 0; attempt < 18; attempt++) {
        const y = 48 + Math.random() * Math.max(1, window.innerHeight - 96);
        const candidate = { x, y };
        const spaced = items.every(item => {
            const nearSpawnSide = fromLeft ? item.x < 300 : item.x > window.innerWidth - 300;
            return Math.abs(item.y - y) >= minYGap && (!nearSpawnSide || distance(candidate, item) >= minScreenDistance);
        });

        if (spaced) return candidate;
    }

    return null;
}

function spawnItem(container, items) {
    const src = getAvailableAsset();
    if (!src) return null;

    const el = document.createElement("div");
    el.className = "floating-item";

    const img = document.createElement("img");
    img.alt = "";
    el.style.visibility = "hidden";
    img.onload = () => { el.style.visibility = "visible"; };
    img.onerror = () => { el.remove(); };
    img.src = src;
    el.appendChild(img);

    container.appendChild(el);

    const size = 42;
    el.style.width = size + "px";
    el.style.height = size + "px";

    const fromLeft = Math.random() > 0.5;

    const position = getSpawnPosition(items, fromLeft);
    if (!position) {
        el.remove();
        releaseAsset(src);
        return null;
    }

    let x = position.x;
    let y = position.y;

    const speed = 0.1 + Math.random() * 0.16;

    const speedX = fromLeft ? speed : -speed;
    const speedY = (Math.random() - 0.5) * 0.08;

    const rotBase = (Math.random() - 0.5) * 12;
    const rotPhase = Math.random() * Math.PI * 2;
    const rotDriftSpeed = 0.006 + Math.random() * 0.01;
    const rotAmplitude = 3 + Math.random() * 6;

    return {
        el,
        src,
        x,
        y,
        speedX,
        speedY,
        rotBase,
        rotPhase,
        rotDriftSpeed,
        rotAmplitude
    };
}

export async function initFloating() {
    const container = document.getElementById("floating-bg");
    if (!container) return;

    container.innerHTML = "";
    usage.clear();

    // Resolve against the served page, never a filesystem module URL.
    loadedAssets = (await Promise.all(assets.map(async path => {
        const src = new URL(path, window.location.href).href;
        const img = new Image();
        img.src = src;
        try {
            await img.decode();
            return src;
        } catch {
            console.warn(`Unable to load floating image: ${src}`);
            return null;
        }
    }))).filter(Boolean);
    if (!loadedAssets.length) return;

    const items = [];

    // SPAWN LOOP (this fixes your problem)
    function spawnLoop() {
        if (items.length < 12) {
            const newItem = spawnItem(container, items);
            if (newItem) items.push(newItem);
        }

        // RANDOM INTERVAL (staggered spawning)
        const delay = 900 + Math.random() * 1700;
        setTimeout(spawnLoop, delay);
    }

    spawnLoop();

    function animate() {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            item.x += item.speedX;
            item.y += item.speedY;
            item.rotPhase += item.rotDriftSpeed;
            const rot = item.rotBase + Math.sin(item.rotPhase) * item.rotAmplitude;

            item.y += Math.sin(item.x * 0.014) * 0.16;

            item.el.style.transform = `
                translate(${item.x}px, ${item.y}px)
                rotate(${rot}deg)
            `;

            // REMOVE when off screen
            if (
                !item.el.isConnected ||
                item.x < -120 ||
                item.x > window.innerWidth + 120 ||
                item.y < -120 ||
                item.y > window.innerHeight + 120
            ) {
                releaseAsset(item.src);
                item.el.remove();
                items.splice(i, 1);
                i--;
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}
