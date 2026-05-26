/* ==========================================================================
   1. VIEW ROUTING & SPA TRANSITION
   ========================================================================== */
function revealSurprise() {
    const landing = document.getElementById("landingView");
    const surprise = document.getElementById("surpriseView");
    const wrapper = document.querySelector(".app-wrapper");
    if (!landing || !surprise) return;

    // Play music immediately on user click
    playMusicOnInteraction();

    // Scale down and fade out landing card
    landing.style.opacity = "0";
    landing.style.transform = "translateY(-30px) scale(0.95)";

    setTimeout(() => {
        landing.classList.remove("active");
        
        // Add surprise-active layout class to wrapper
        if (wrapper) {
            wrapper.classList.add("surprise-active");
        }
        
        // Show surprise section
        surprise.style.display = "block";
        
        // Force reflow to allow transition
        surprise.offsetHeight;
        surprise.classList.add("active");
        
        // Set hash link
        window.location.hash = "surprise";
    }, 600);
}

function handleDirectLinking() {
    if (window.location.hash === "#surprise") {
        const landing = document.getElementById("landingView");
        const surprise = document.getElementById("surpriseView");
        const wrapper = document.querySelector(".app-wrapper");
        if (landing && surprise) {
            landing.classList.remove("active");
            landing.style.display = "none";
            if (wrapper) {
                wrapper.classList.add("surprise-active");
            }
            surprise.style.display = "block";
            surprise.classList.add("active");
        }
    }
}

/* ==========================================================================
   2. CANVAS PARTICLE SYSTEM (HEARTS, SPARKLES, CONFETTI)
   ========================================================================== */
let canvas, ctx;
let particles = [];
let confetti = [];
let mouse = { x: null, y: null };
let canvasInitialized = false;

function initCanvas() {
    canvas = document.getElementById("canvas-particles");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "canvas-particles";
        document.body.insertBefore(canvas, document.body.firstChild);
    }
    ctx = canvas.getContext("2d");
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // Mouse and Touch Move Trails
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (Math.random() < 0.4) {
            spawnTrailParticle(mouse.x, mouse.y);
        }
    });

    window.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            if (Math.random() < 0.4) {
                spawnTrailParticle(mouse.x, mouse.y);
            }
        }
    }, { passive: true });

    // Click Explode
    window.addEventListener("click", (e) => {
        if (e.target.closest("button, .candle, .photo-frame, .lightbox-close, .music-control-btn")) {
            return;
        }
        spawnBurst(e.clientX, e.clientY);
    });

    canvasInitialized = true;
    animateParticles();
}

function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

// Particle Class
class Particle {
    constructor(x, y, type = "heart") {
        this.x = x;
        this.y = y;
        this.type = type; // "heart", "sparkle", "smoke", "confetti"
        this.size = Math.random() * 10 + 6;
        
        if (type === "heart") {
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = -Math.random() * 1.5 - 0.6; // floats up
            this.alpha = 1;
            this.decay = Math.random() * 0.007 + 0.004;
            this.color = `hsl(${335 + Math.random() * 25}, 100%, ${72 + Math.random() * 12}%)`;
        } else if (type === "sparkle") {
            this.vx = (Math.random() - 0.5) * 2.5;
            this.vy = (Math.random() - 0.5) * 2.5;
            this.alpha = 1;
            this.decay = Math.random() * 0.02 + 0.015;
            this.color = `hsl(${45 + Math.random() * 15}, 100%, 75%)`; // Gold sparkles
            this.size = Math.random() * 6 + 4;
        } else if (type === "smoke") {
            this.vx = (Math.random() - 0.5) * 1.2;
            this.vy = -Math.random() * 1.2 - 0.6;
            this.alpha = 0.85;
            this.decay = 0.018;
            this.color = "rgba(230, 230, 230, 0.4)";
            this.size = Math.random() * 12 + 8;
        } else if (type === "confetti") {
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = -Math.random() * 12 - 6; // Explodes upwards
            this.gravity = 0.28;
            this.alpha = 1;
            this.decay = Math.random() * 0.005 + 0.002;
            this.color = `hsl(${Math.random() * 360}, 95%, 65%)`;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.25;
            this.width = Math.random() * 8 + 6;
            this.height = Math.random() * 12 + 8;
            this.isCircle = Math.random() > 0.5;
        }
    }

    update() {
        if (this.type === "confetti") {
            this.vy += this.gravity;
            this.rotation += this.rotationSpeed;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (this.type === "heart") {
            drawHeart(ctx, this.x, this.y, this.size, this.color);
        } else if (this.type === "sparkle") {
            drawSparkle(ctx, this.x, this.y, this.size, this.color);
        } else if (this.type === "smoke") {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.type === "confetti") {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            if (this.isCircle) {
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        }

        ctx.restore();
    }
}

// Canvas Drawings
function drawHeart(ctx, x, y, size, color) {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 4);
    ctx.bezierCurveTo(x - size / 2, y - size, x - size, y - size / 3, x, y + size);
    ctx.bezierCurveTo(x + size, y - size / 3, x + size / 2, y - size, x, y - size / 4);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawSparkle(ctx, x, y, size, color) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
        ctx.lineTo(x + Math.cos(i * Math.PI / 2) * size, y + Math.sin(i * Math.PI / 2) * size);
        ctx.lineTo(x + Math.cos(i * Math.PI / 2 + Math.PI / 4) * (size / 3), y + Math.sin(i * Math.PI / 2 + Math.PI / 4) * (size / 3));
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function spawnTrailParticle(x, y) {
    const type = Math.random() > 0.45 ? "sparkle" : "heart";
    particles.push(new Particle(x, y, type));
}

function spawnBurst(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(x, y, "sparkle"));
        particles.push(new Particle(x, y, "heart"));
    }
}

function spawnSmoke(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, "smoke"));
    }
}

function spawnConfettiExplosion() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.7;
    
    for (let i = 0; i < 85; i++) {
        const p = new Particle(centerX - 90, centerY, "confetti");
        p.vx = -Math.random() * 9 - 1;
        confetti.push(p);
    }
    for (let i = 0; i < 85; i++) {
        const p = new Particle(centerX + 90, centerY, "confetti");
        p.vx = Math.random() * 9 + 1;
        confetti.push(p);
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ambient floating hearts
    if (Math.random() < 0.035) {
        particles.push(new Particle(Math.random() * canvas.width, canvas.height + 20, "heart"));
    }

    particles = particles.filter(p => {
        p.update();
        p.draw(ctx);
        return p.alpha > 0;
    });

    confetti = confetti.filter(c => {
        c.update();
        c.draw(ctx);
        return c.alpha > 0 && c.y < canvas.height + 20;
    });

    requestAnimationFrame(animateParticles);
}

/* ==========================================================================
   3. INTERACTIVE CAKE & CELEBRATION
   ========================================================================== */
let candlesExtinguishedCount = 0;

function extinguishCandle(element) {
    if (element.classList.contains("extinguished")) return;
    
    element.classList.add("extinguished");
    candlesExtinguishedCount++;
    
    // Sparkle smoke poof
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    spawnSmoke(x, y);
    
    // Check blowout
    const totalCandles = document.querySelectorAll(".candle").length;
    if (candlesExtinguishedCount === totalCandles) {
        triggerCelebration();
    }
}

function triggerCelebration() {
    spawnConfettiExplosion();
    
    // Continuous rain for 3.5s
    const interval = setInterval(() => {
        const randX = Math.random() * window.innerWidth;
        for(let i=0; i<12; i++) {
            const p = new Particle(randX, -10, "confetti");
            p.vy = Math.random() * 2 + 1;
            p.vx = (Math.random() - 0.5) * 3;
            confetti.push(p);
        }
    }, 150);
    setTimeout(() => clearInterval(interval), 3500);

    const instruct = document.querySelector(".cake-instruction");
    if (instruct) {
        instruct.innerHTML = "Yay! Happy Birthday Pillu! 🎂🎉💝";
        instruct.style.fontSize = "16px";
        instruct.style.fontWeight = "600";
        instruct.style.color = "var(--primary-pink)";
    }

    // Unlock memories and scroll
    const memorySection = document.getElementById("memorySection");
    if (memorySection) {
        memorySection.classList.add("unlocked");
        
        // Remove max-height restriction after transition to avoid empty scroll spacing
        setTimeout(() => {
            memorySection.style.maxHeight = "none";
        }, 1200);
        
        setTimeout(() => {
            memorySection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 1200);
    }
}

/* ==========================================================================
   4. POLAROIDS & LIGHTBOX SYSTEM
   ========================================================================== */
function setupPolaroids() {
    const frames = document.querySelectorAll(".gallery .photo-frame");
    frames.forEach((frame) => {
        frame.classList.add("polaroid");
        
        // Random rotational tilt
        const tilt = (Math.random() * 10) - 5;
        frame.style.transform = `rotate(${tilt}deg)`;

        // Lightbox open
        frame.addEventListener("click", () => {
            const img = frame.querySelector("img");
            if (img) {
                openLightbox(img.src);
            }
        });
    });
}

function openLightbox(src) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightbox.classList.add("active");
    }
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (lightbox) {
        lightbox.classList.remove("active");
    }
}

/* ==========================================================================
   5. PERSISTENT AUDIO CONTROLLER
   ========================================================================== */
let musicPlayer;

function setupMusic() {
    musicPlayer = document.getElementById("bgMusic");
    if (!musicPlayer) return;

    createMusicButton();

    // Load state
    const savedTime = localStorage.getItem("musicTime");
    if (savedTime) {
        musicPlayer.currentTime = parseFloat(savedTime);
    }

    setInterval(() => {
        if (musicPlayer && !musicPlayer.paused) {
            localStorage.setItem("musicTime", musicPlayer.currentTime);
        }
    }, 1000);

    const isMuted = localStorage.getItem("musicMuted") === "true";
    if (!isMuted) {
        const attemptPlay = () => {
            musicPlayer.play()
                .then(() => updateMusicButtonUI(true))
                .catch(() => {
                    updateMusicButtonUI(false);
                    document.addEventListener("click", playMusicOnInteraction, { once: true });
                });
        };
        
        if (document.readyState === "complete") {
            attemptPlay();
        } else {
            window.addEventListener("load", attemptPlay);
        }
    } else {
        updateMusicButtonUI(false);
    }
}

function playMusicOnInteraction() {
    if (musicPlayer && musicPlayer.paused && localStorage.getItem("musicMuted") !== "true") {
        musicPlayer.play()
            .then(() => updateMusicButtonUI(true))
            .catch(err => console.log("Audio play blocked:", err));
    }
}

function createMusicButton() {
    // Avoid creating duplicate button if it exists
    if (document.querySelector(".music-control-btn")) return;

    const btn = document.createElement("button");
    btn.className = "music-control-btn";
    btn.setAttribute("aria-label", "Toggle Background Music");
    btn.innerHTML = `
        <div class="music-waves">
            <span class="music-wave-bar"></span>
            <span class="music-wave-bar"></span>
            <span class="music-wave-bar"></span>
            <span class="music-wave-bar"></span>
        </div>
    `;
    
    btn.addEventListener("click", toggleMusic);
    document.body.appendChild(btn);
}

function toggleMusic() {
    if (!musicPlayer) return;
    
    if (musicPlayer.paused) {
        musicPlayer.play()
            .then(() => {
                localStorage.setItem("musicMuted", "false");
                updateMusicButtonUI(true);
            })
            .catch(err => console.log("Music play blocked:", err));
    } else {
        musicPlayer.pause();
        localStorage.setItem("musicMuted", "true");
        updateMusicButtonUI(false);
    }
}

function updateMusicButtonUI(isPlaying) {
    const btn = document.querySelector(".music-control-btn");
    if (!btn) return;
    
    if (isPlaying) {
        btn.classList.add("music-playing");
    } else {
        btn.classList.remove("music-playing");
    }
}

/* ==========================================================================
   6. DOM INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Check layout deep linking
    handleDirectLinking();
    
    // Canvas background particle emitter
    initCanvas();
    
    // Background dynamic mesh blobs
    if (!document.querySelector(".bg-blobs")) {
        const bgBlobs = document.createElement("div");
        bgBlobs.className = "bg-blobs";
        bgBlobs.innerHTML = `
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
            <div class="blob blob-3"></div>
            <div class="blob blob-4"></div>
        `;
        document.body.insertBefore(bgBlobs, document.body.firstChild);
    }
    
    // Music setup
    setupMusic();
    
    // Setup Polaroids tilt/lightbox handlers
    setupPolaroids();
    
    // Setup Lightbox overlay close events
    const lightbox = document.getElementById("lightbox");
    if (lightbox) {
        lightbox.addEventListener("click", (e) => {
            if (e.target.id === "lightbox" || e.target.closest(".lightbox-close")) {
                closeLightbox();
            }
        });
    }
});
