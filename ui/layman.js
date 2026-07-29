// Layman Mode Javascript
// Simplified physics simulation of WaveHash for educational purposes

const GRID_SIZE = 16;
const CELL_SIZE = 400 / GRID_SIZE;
const PADDING = 0;

const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
const fluidContainer = document.getElementById('fluidContainer');

const hashInput = document.getElementById('rawInput');
const hashBtn = document.getElementById('hashBtn');
const hashOutput = document.getElementById('hashOutput');

class WaveGridEngine {
    constructor(size) {
        this.size = size;
        this.grid = new Uint32Array(size * size);
        this.nextGrid = new Uint32Array(size * size);
    }
    
    injectEnergy(x, y, value) {
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
            this.grid[y * this.size + x] ^= value;
        }
    }
    
    getState(x, y) {
        return this.grid[y * this.size + x];
    }
    
    step() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const idx = y * this.size + x;
                let val = this.grid[idx];
                
                const left = x > 0 ? this.grid[idx - 1] : this.grid[y * this.size + (this.size - 1)];
                const right = x < this.size - 1 ? this.grid[idx + 1] : this.grid[y * this.size];
                const top = y > 0 ? this.grid[(y - 1) * this.size + x] : this.grid[(this.size - 1) * this.size + x];
                const bottom = y < this.size - 1 ? this.grid[(y + 1) * this.size + x] : this.grid[x];
                
                const neighborSum = (left + right + top + bottom) >>> 0;
                let newVal = (val + neighborSum + 0x9E3779B9) >>> 0;
                newVal ^= (newVal >>> 13);
                newVal = (newVal * 0x5bd1e995) >>> 0;
                newVal ^= (newVal >>> 15);
                
                this.nextGrid[idx] = newVal;
            }
        }
        
        for (let i = 0; i < this.size * this.size; i++) {
            this.grid[i] = this.nextGrid[i];
        }
    }
    
    extractHash() {
        let hashStr = "0x";
        for (let i = 0; i < 20; i++) {
            const val = this.grid[(i * 13) % (this.size * this.size)];
            hashStr += val.toString(16).padStart(8, '0').slice(0, 2);
        }
        return hashStr;
    }
}

const engine = new WaveGridEngine(GRID_SIZE);
let animationId;
let isPropagating = false;
let propagationSteps = 0;
const MAX_STEPS = 64;

// Smooth transition state for rendering
let displayNodes = new Float32Array(GRID_SIZE * GRID_SIZE);

// Draw static grid wireframe on background canvas
function drawStaticWireframe() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    bgCtx.lineWidth = 1;
    
    bgCtx.beginPath();
    for (let i = 0; i <= GRID_SIZE; i++) {
        bgCtx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        bgCtx.lineTo(PADDING + i * CELL_SIZE, PADDING + GRID_SIZE * CELL_SIZE);
        bgCtx.moveTo(PADDING, PADDING + i * CELL_SIZE);
        bgCtx.lineTo(PADDING + GRID_SIZE * CELL_SIZE, PADDING + i * CELL_SIZE);
    }
    bgCtx.stroke();
}

function updateDisplayNodes() {
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const val = engine.grid[i];
        const targetSize = val > 0 ? (val % (CELL_SIZE * 0.8)) : 2;
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
        }
    }
}

function renderLoop(time) {
    drawGrid(time);
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

function stepPropagation() {
    if (propagationSteps < MAX_STEPS) {
        engine.step();
        propagationSteps++;
        
        // Randomly inject some noise from the message occasionally
        if (propagationSteps % 10 === 0) {
           const msg = hashInput.value;
           if (msg) engine.injectEnergy(propagationSteps % GRID_SIZE, (propagationSteps * 3) % GRID_SIZE, msg.charCodeAt(0) * 100);
        }
        
        setTimeout(stepPropagation, 50);
    } else {
        isPropagating = false;
        hashOutput.textContent = engine.extractHash();
        hashBtn.disabled = false;
        hashBtn.textContent = 'Extract Digital DNA!';
    }
}

function startHashing() {
    const msg = hashInput.value;
    if (!msg) return;
    
    hashBtn.disabled = true;
    hashBtn.textContent = 'Centrifuge Spinning...';
    
    // Reset Grid
    engine.grid.fill(0);
    displayNodes.fill(0);
    hashOutput.textContent = '0x0000000000000000000000000000000000000000';
    
    // Inject and Propagate
    absorbMessage(msg);
    isPropagating = true;
    propagationSteps = 0;
    stepPropagation();
}

hashBtn.addEventListener('click', startHashing);
hashInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startHashing();
});

// Initialize
drawStaticWireframe();
renderLoop(0);
