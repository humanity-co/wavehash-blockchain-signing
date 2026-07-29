// WaveCrypt UI Engine - Enhanced Fluid & Particle Version

class GridEngine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.size = width * height;
        this.state = new Uint32Array(this.size);
        this.momentum = new Uint32Array(this.size);
        this.chaos_register = 0;
    }
    reset() {
        this.state.fill(0);
        this.momentum.fill(0);
        this.chaos_register = 0;
    }
    rotl32(val, amount) {
        return ((val << amount) | (val >>> (32 - amount))) >>> 0;
    }
    getState(x, y) { return this.state[y * this.width + x]; }
    
    // Phase 2: Chaos Engine Propagation
    propagate() {
        const nextState = new Uint32Array(this.size);
        
        // 1. Entropy Accumulation
        let round_entropy = 0;
        for (let i = 0; i < this.size; i++) {
            round_entropy = (round_entropy + this.state[i]) >>> 0;
        }
        this.chaos_register = (this.chaos_register ^ round_entropy) >>> 0;
        
        // 2. Dynamic Frequency Modulation
        const r1 = 1 + (this.chaos_register % 31);
        const r2 = 1 + ((this.chaos_register >>> 5) % 31);

        for (let y = 0; y < this.height; ++y) {
            for (let x = 0; x < this.width; ++x) {
                const left  = (x === 0) ? this.width - 1 : x - 1;
                const right = (x === this.width - 1) ? 0 : x + 1;
                const up    = (y === 0) ? this.height - 1 : y - 1;
                const down  = (y === this.height - 1) ? 0 : y + 1;

                const current_idx = y * this.width + x;
                const right_idx = y * this.width + right;
                const left_idx  = y * this.width + left;
                const down_idx  = down * this.width + x;
                const up_idx    = up * this.width + x;

                // Diffusion Step
                let sum = 0;
                sum = (sum + this.state[right_idx]) >>> 0;
                sum = (sum + this.state[left_idx]) >>> 0;
                sum = (sum + this.state[down_idx]) >>> 0;
                sum = (sum + this.state[up_idx]) >>> 0;

                const current = this.state[current_idx];
                const prev = this.momentum[current_idx];

                // Dynamic Rotation Update
                let next = ((current ^ this.rotl32(prev, r1)) + this.rotl32(sum, r2)) >>> 0;
                
                // 3. Non-Linear Substitution (Keccak-style)
                // next ^= (~right & down)
                const right_val = this.state[right_idx];
                const down_val = this.state[down_idx];
                
                next = (next ^ ((~right_val) & down_val)) >>> 0;
                
                nextState[current_idx] = next;
            }
        }
        
        this.momentum.set(this.state);
        this.state.set(nextState);
    }
    
    injectEnergy(x, y, value) {
        const idx = y * this.width + x;
        this.state[idx] = (this.state[idx] ^ value) >>> 0;
    }
    
    collapseToHex() {
        const bytes = new Uint8Array(32);
        for (let i = 0; i < this.size; i++) {
            let val = this.state[i];
            val = (val ^ this.chaos_register) >>> 0;
            
            const bIndex = (i * 4) % 32;
            bytes[bIndex] ^= ((val >>> 24) & 0xFF);
            bytes[(bIndex+1)%32] += ((val >>> 16) & 0xFF);
            bytes[(bIndex+2)%32] ^= ((val >>> 8) & 0xFF);
            bytes[(bIndex+3)%32] += (val & 0xFF);
        }
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Setup Grid Constants and Initialization
const CELL_SIZE = 25;
const GRID_SIZE = 16;
const PADDING = 50;

// Setup Foregrond Canvas (Fluid)
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 500;
canvas.height = 500;

// Setup Background Canvas (Rubik's / Geometric)
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
bgCanvas.width = 500;
bgCanvas.height = 500;

// View Mode State
let currentViewMode = 'fluid'; // 'fluid', 'rubik', 'ripple'

// Pre-render the static background grid
function drawBackgroundGrid() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    bgCtx.lineWidth = 1;
    
    // Draw Rubik's style rigid grid
    for (let i = 0; i <= GRID_SIZE; i++) {
        const offset = PADDING + i * CELL_SIZE;
        bgCtx.beginPath();
        bgCtx.moveTo(offset, PADDING);
        bgCtx.lineTo(offset, bgCanvas.height - PADDING);
        bgCtx.stroke();
        
        bgCtx.beginPath();
        bgCtx.moveTo(PADDING, offset);
        bgCtx.lineTo(bgCanvas.width - PADDING, offset);
        bgCtx.stroke();
    }
}
drawBackgroundGrid();

// Get UI Elements
const hashBtn = document.getElementById('hashBtn');
const resetBtn = document.getElementById('resetBtn');
const messageInput = document.getElementById('messageInput');
const hashOutput = document.getElementById('hashOutput');
const roundCount = document.getElementById('roundCount');
const gridStatus = document.getElementById('gridStatus');
let engine = new GridEngine(GRID_SIZE, GRID_SIZE);
let animationId = null;
let currentRound = 0;
const MAX_ROUNDS = 25;

// Variables for fluid interpolation rendering
let renderTime = 0;
let isPropagating = false;

// We store the 'visual size' of each node to animate it smoothly
let displayNodes = new Float32Array(GRID_SIZE * GRID_SIZE);

function updateDisplayNodes() {
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        let val = engine.state[i];
        let targetSize = val === 0 ? 2 : 2 + ((val % 100) / 100) * (CELL_SIZE / 1.5);
        // Smoothly interpolate current visual size to target size
        displayNodes[i] += (targetSize - displayNodes[i]) * 0.15;
    }
}

function drawGrid(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateDisplayNodes();

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const idx = y * GRID_SIZE + x;
            const val = engine.getState(x, y);
            const cx = PADDING + x * CELL_SIZE + CELL_SIZE / 2;
            const cy = PADDING + y * CELL_SIZE + CELL_SIZE / 2;
            
            let nodeSize = displayNodes[idx];
            if (val > 0 && isPropagating) {
                nodeSize += Math.sin(time * 0.005 + idx) * 10;
            }
            if (nodeSize < 2) nodeSize = 2;

            if (currentViewMode === 'fluid') {
                // Fluid Metaball rendering (uses CSS filter contrast on container)
                ctx.beginPath();
                ctx.arc(cx, cy, nodeSize * 1.5, 0, Math.PI * 2);
                if (val === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                } else {
                    const hue = 190 + (val % 130);
                    ctx.fillStyle = `hsla(${hue}, 100%, 70%, 1)`;
                }
                ctx.fill();
                
            } else if (currentViewMode === 'rubik') {
                // Sharp geometric rendering (No CSS filter)
                
                if (val > 0) {
                    const hue = 190 + (val % 130);
                    ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`;
                    ctx.fillRect(PADDING + x * CELL_SIZE + 2, PADDING + y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                } else {
                    ctx.fillStyle = 'rgba(255,255,255,0.02)';
                    ctx.fillRect(PADDING + x * CELL_SIZE + 2, PADDING + y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                }
                
            } else if (currentViewMode === 'ripple') {
                // Original simple concentric rings effect
                
                if (val > 0) {
                    const hue = 220 + (val % 40);
                    // Add size based on nodeSize, which pulses when isPropagating is true
                    const rippleSize = (nodeSize * 2) % (CELL_SIZE * 1.5);
                    
                    ctx.beginPath();
                    ctx.arc(cx, cy, rippleSize, 0, Math.PI * 2);
                    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${(1 - (rippleSize/(CELL_SIZE*1.5)))})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${hue}, 100%, 80%, 1)`;
                    ctx.fill();
                }
            } else if (currentViewMode === 'vector') {
                // Clean Vector Flow Field (Static until state changes)
                const angle = (val / 255) * Math.PI * 2;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angle);
                
                const length = val > 0 ? CELL_SIZE / 1.5 : CELL_SIZE / 3;
                
                // Draw a sleek vector line
                ctx.beginPath();
                ctx.moveTo(-length/2, 0);
                ctx.lineTo(length/2, 0);
                ctx.lineWidth = 2;
                ctx.strokeStyle = val > 0 ? `hsla(${190 + (val%60)}, 100%, 65%, 0.8)` : 'rgba(255,255,255,0.05)';
                ctx.stroke();
                
                // Add a glowing direction head (dot)
                ctx.beginPath();
                ctx.arc(length/2, 0, val > 0 ? 2.5 : 1.5, 0, Math.PI*2);
                ctx.fillStyle = val > 0 ? '#fff' : 'rgba(255,255,255,0.1)';
                ctx.fill();
                
                ctx.restore();
            } else if (currentViewMode === 'topo') {
                // 3D Topographic Solid Mesh (Synthwave style)
                const scale = 14;
                const offsetX = canvas.width / 2;
                const offsetY = canvas.height / 5;
                
                // Use smoothed visual node size for height to prevent jagged jumping
                const pval = displayNodes[idx] || 0; 
                
                const project = (px, py, h) => {
                    const ix = (px - py) * scale + offsetX;
                    const iy = (px + py) * (scale * 0.5) - (h * 1.5) + offsetY;
                    return { x: ix, y: iy };
                };
                
                const p0 = project(x, y, pval);
                
                if (x < GRID_SIZE - 1 && y < GRID_SIZE - 1) {
                    const pvalRight = displayNodes[y * GRID_SIZE + (x + 1)] || 0;
                    const pvalBottom = displayNodes[(y + 1) * GRID_SIZE + x] || 0;
                    const pvalBottomRight = displayNodes[(y + 1) * GRID_SIZE + (x + 1)] || 0;
                    
                    const p1 = project(x + 1, y, pvalRight);
                    const p2 = project(x + 1, y + 1, pvalBottomRight);
                    const p3 = project(x, y + 1, pvalBottom);
                    
                    // Draw solid polygon quad (painter's algorithm handles occlusion)
                    ctx.beginPath();
                    ctx.moveTo(p0.x, p0.y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    
                    // Solid fill for depth occlusion
                    const hue = 180 + ((val % 80) || 0);
                    ctx.fillStyle = val > 0 ? `hsla(${hue}, 80%, 15%, 0.95)` : `rgba(5, 10, 20, 0.95)`;
                    ctx.fill();
                    
                    // Crisp wireframe border on top
                    ctx.strokeStyle = val > 0 ? `hsla(${hue}, 100%, 65%, 0.9)` : `rgba(0, 240, 255, 0.15)`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            } else if (currentViewMode === 'matrix') {
                // Matrix ASCII Terminal
                ctx.font = '16px "Space Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (val > 0) {
                    ctx.fillStyle = `rgba(0, 255, 0, ${0.6 + (nodeSize/CELL_SIZE)})`;
                    const char = (val % 16).toString(16).toUpperCase();
                    // Optional: Matrix rain effect by slightly translating Y over time based on val
                    const dropOffset = isPropagating ? (time * 0.05 * (val % 5)) % CELL_SIZE : 0;
                    ctx.fillText(char, cx, cy + dropOffset - CELL_SIZE/2);
                } else {
                    ctx.fillStyle = 'rgba(0, 40, 0, 0.4)';
                    ctx.fillText('0', cx, cy);
                }
            }
        }
    }
}

function renderLoop(time) {
    drawGrid(time);
    // Keep rendering for smoothness even if not propagating
    animationId = requestAnimationFrame(renderLoop);
}

function absorbMessage(msg) {
    if (!msg) return;
    let idx = 0;
    for (let y = 0; y < GRID_SIZE; ++y) {
        for (let x = 0; x < GRID_SIZE; ++x) {
            let val = msg.charCodeAt(idx % msg.length) >>> 0;
            val ^= (val << 8) | ((idx * 0x9E3779B9) >>> 0);
            engine.injectEnergy(x, y, val >>> 0);
            idx++;
        }
    }
}

const telemetryLog = document.getElementById('telemetryLog');
const copyBtn = document.getElementById('copyBtn');
const decryptBtn = document.getElementById('decryptBtn');
const decryptInput = document.getElementById('decryptInput');
const decryptResult = document.getElementById('decryptResult');
const viewBtns = document.querySelectorAll('.view-btn');
const fluidContainer = document.getElementById('fluidContainer');
const gridCanvas = document.getElementById('gridCanvas');

// View Toggle Logic
viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentViewMode = btn.dataset.mode;
        
        const canvasWrapper = document.querySelector('.canvas-wrapper');
        
        if (currentViewMode === 'fluid') {
            fluidContainer.style.filter = 'contrast(30)';
            gridCanvas.style.filter = 'blur(8px)';
            canvasWrapper.style.background = '#000';
        } else {
            fluidContainer.style.filter = 'none';
            gridCanvas.style.filter = 'none';
            // Matrix has a very dark green background, others are black
            if (currentViewMode === 'matrix') {
                canvasWrapper.style.background = '#010501';
            } else if (currentViewMode === 'topo') {
                canvasWrapper.style.background = '#020610';
            } else {
                canvasWrapper.style.background = '#000';
            }
        }
        
        drawGrid(0); // force a frame update
    });
});

// RAINBOW TABLE FOR SIMULATED DECRYPTION
const rainbowTable = new Map();
let currentPayload = '';
let currentHash = '';

function logTelemetry(title, message, color = "var(--accent-blue)") {
    const li = document.createElement('li');
    li.className = 'log-entry';
    li.innerHTML = `<strong style="color: ${color};">[${title}]</strong><br>${message}`;
    telemetryLog.appendChild(li);
    telemetryLog.scrollTop = telemetryLog.scrollHeight;
}

function stepPropagation() {
    if (currentRound >= MAX_ROUNDS) {
        gridStatus.textContent = "Avalanche Complete";
        
        currentHash = engine.collapseToHex();
        hashOutput.textContent = currentHash;
        
        // Save to Rainbow Table
        rainbowTable.set(currentHash, currentPayload);
        
        hashBtn.disabled = false;
        copyBtn.disabled = false;
        isPropagating = false;
        
        // Final Educational State
        logTelemetry("STAGE 3: HASH COLLAPSE", "The wave has collapsed into a 256-bit hexadecimal hash. <br><br><b>Can it be decrypted?</b><br>Mathematically, no. WaveCrypt is a <i>one-way function</i>. The Chaos Engine's non-linear substitutions destroy all algebraic relationships. However, eavesdroppers use 'Rainbow Tables' (databases of pre-calculated hashes) to look up the answer. Try copying your hash and pasting it below to simulate an attack!", "var(--accent-green)");
        return;
    }

    engine.propagate();
    currentRound++;
    roundCount.textContent = `${currentRound} / ${MAX_ROUNDS}`;
    
    // Slow down propagation steps to watch the waves evolve
    setTimeout(stepPropagation, 150);
}

hashBtn.addEventListener('click', () => {
    const msg = messageInput.value;
    if (!msg) {
        alert("Please enter a message payload.");
        return;
    }
    
    currentPayload = msg;
    
    engine.reset();
    displayNodes.fill(0);
    currentRound = 0;
    hashBtn.disabled = true;
    copyBtn.disabled = true;
    isPropagating = true;
    gridStatus.textContent = "Absorbing Energy...";
    hashOutput.textContent = "Processing...";
    decryptResult.textContent = "--";
    
    // Clear log and add init
    telemetryLog.innerHTML = '';
    logTelemetry("STAGE 1: ENERGY INJECTION", "The text payload is absorbed into the Toroidal geometric grid. Each character's bitwise value translates into initial energy pulses.");
    
    absorbMessage(msg);
    
    setTimeout(() => {
        gridStatus.textContent = "Propagating Waves...";
        logTelemetry("STAGE 2: TOROIDAL FLUID DYNAMICS", "The energy cascades across the Toroidal surface like fluid waves. Because the grid wraps around itself (Toroidal topology), the waves reflect and collide with each other, triggering the Avalanche Effect.", "var(--accent-amber)");
        stepPropagation();
    }, 1500);
});

resetBtn.addEventListener('click', () => {
    engine.reset();
    displayNodes.fill(0);
    currentRound = 0;
    isPropagating = false;
    roundCount.textContent = `0 / ${MAX_ROUNDS}`;
    gridStatus.textContent = "Idle";
    hashOutput.textContent = "--";
    hashBtn.disabled = false;
    copyBtn.disabled = true;
    messageInput.value = '';
    decryptInput.value = '';
    decryptResult.textContent = '--';
    
    telemetryLog.innerHTML = '';
    logTelemetry("SYSTEM INIT", "The physics engine is standing by. The grid combines rigid geometric structure with organic fluid mechanics to compute chaotic diffusion.", "var(--accent-blue)");
});

copyBtn.addEventListener('click', async () => {
    if (currentHash) {
        try {
            await navigator.clipboard.writeText(currentHash);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }
});

decryptBtn.addEventListener('click', () => {
    const targetHash = decryptInput.value.trim();
    if (!targetHash) return;
    
    decryptResult.style.color = "var(--text-main)";
    decryptResult.textContent = "[SYSTEM] Scanning Rainbow Table database for hash match...";
    
    setTimeout(() => {
        if (rainbowTable.has(targetHash)) {
            const original = rainbowTable.get(targetHash);
            decryptResult.style.color = "var(--accent-green)";
            decryptResult.innerHTML = `[SUCCESS] Hash matched in Rainbow Table!<br>Decrypted Payload: <span style="color:#fff; font-size:1.1rem; font-weight:bold;">${original}</span>`;
        } else {
            decryptResult.style.color = "var(--accent-red)";
            decryptResult.innerHTML = `[FAILED] Hash not found in dictionary. The algorithm remains secure.`;
        }
    }, 1200);
});

// Start the continuous smooth render loop
animationId = requestAnimationFrame(renderLoop);
