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

// track how many of each are active
const usage = new Map();

function getAvailableAsset() {
    const shuffled = [...assets].sort(() => Math.random() - 0.5);

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

function spawnItem(container) {
    const src = getAvailableAsset();
    if (!src) return null;

    const el = document.createElement("div");
    el.className = "floating-item";

    const img = document.createElement("img");
    img.src = src;
    el.appendChild(img);

    container.appendChild(el);

    const size = 42;
    el.style.width = size + "px";
    el.style.height = size + "px";

    const fromLeft = Math.random() > 0.5;

    let x = fromLeft ? -60 : window.innerWidth + 60;
    let y = Math.random() * window.innerHeight;

    // SLOWER movement
    const speed = 0.08 + Math.random() * 0.12;

    const speedX = fromLeft ? speed : -speed;
    const speedY = (Math.random() - 0.5) * 0.05;

    let rot = Math.random() * 360;
    const rotSpeed = (Math.random() - 0.5) * 0.15;

    return {
        el,
        src,
        x,
        y,
        speedX,
        speedY,
        rot,
        rotSpeed
    };
}

export function initFloating() {
    const container = document.getElementById("floating-bg");
    if (!container) return;

    container.innerHTML = "";
    usage.clear();

    const items = [];

    // SPAWN LOOP (this fixes your problem)
    function spawnLoop() {
        const newItem = spawnItem(container);
        if (newItem) items.push(newItem);

        // RANDOM INTERVAL (staggered spawning)
        const delay = 800 + Math.random() * 2000;
        setTimeout(spawnLoop, delay);
    }

    spawnLoop();

    function animate() {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            item.x += item.speedX;
            item.y += item.speedY;
            item.rot += item.rotSpeed;

            // subtle wave (makes it feel natural)
            item.y += Math.sin(item.x * 0.01) * 0.15;

            item.el.style.transform = `
                translate(${item.x}px, ${item.y}px)
                rotate(${item.rot}deg)
            `;

            // REMOVE when off screen
            if (
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