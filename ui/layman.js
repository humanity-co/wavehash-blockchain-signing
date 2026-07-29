// Educational Slow-Motion Hashing Engine
const GRID_SIZE = 8; // Smaller grid for easier readability
const CELL_SIZE = 400 / GRID_SIZE;

const canvas = document.getElementById('slowGridCanvas');
const ctx = canvas.getContext('2d');

const rawInput = document.getElementById('rawInput');
const startBtn = document.getElementById('startBtn');
const stepMathBtn = document.getElementById('stepMathBtn');

const charDisplay = document.getElementById('charDisplay');
const charExplainer = document.getElementById('charExplainer');
const coordDisplay = document.getElementById('coordDisplay');
const hashOutput = document.getElementById('hashOutput');
const conversionBox = document.getElementById('conversionBox');

let grid = new Uint32Array(GRID_SIZE * GRID_SIZE);
let nextGrid = new Uint32Array(GRID_SIZE * GRID_SIZE);

let currentMsg = "";
let charIdx = 0;
let rippleSteps = 0;
let dropInterval;
const MAX_RIPPLES = 5;

// Draw the grid with numbers explicitly shown inside
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const val = grid[y * GRID_SIZE + x];
            
            // Draw Cell Border
            ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Draw Background Color based on value
            if (val > 0) {
                const intensity = Math.min(val / 200, 1);
                ctx.fillStyle = `rgba(255, 170, 0, ${intensity * 0.5})`;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
            
            // Draw Number
            if (val > 0) {
                ctx.fillStyle = '#fff';
                ctx.font = '14px "Space Mono", monospace';
                ctx.fillText(val, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
            }
        }
    }
}

function extractHash() {
    let hashStr = "0x";
    for (let i = 0; i < 20; i++) {
        const val = grid[(i * 7) % (GRID_SIZE * GRID_SIZE)];
        hashStr += val.toString(16).padStart(8, '0').slice(0, 2);
    }
    return hashStr;
}

// ---------------------------------------------------------
// STATE MACHINE LOGIC
// ---------------------------------------------------------

function resetState() {
    clearInterval(dropInterval);
    grid.fill(0);
    charIdx = 0;
    rippleSteps = 0;
    currentMsg = rawInput.value;
    
    if (currentMsg.length === 0) return;
    
    conversionBox.style.display = 'flex';
    charDisplay.innerHTML = 'Waiting...';
    charExplainer.innerText = '';
    coordDisplay.innerText = 'Grid Target: (X: ?, Y: ?)';
    hashOutput.innerText = '0x...';
    
    startBtn.disabled = true;
    rawInput.disabled = true;
    stepMathBtn.disabled = true;
    
    drawGrid();

    // Start auto-drop
    dropInterval = setInterval(() => {
        dropNextLetter();
    }, 1500);
    
    dropNextLetter(); // Drop first one immediately
}

// Add enter key support
rawInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') resetState();
});

function dropNextLetter() {
    if (charIdx >= currentMsg.length) {
        clearInterval(dropInterval);
        stepMathBtn.disabled = false;
        charExplainer.innerText = "All letters are in the pool! Now, watch them ripple.";
        return;
    }
    
    const char = currentMsg[charIdx];
    const ascii = char.charCodeAt(0);
    
    // STEP 1: UI Update Conversion
    charDisplay.innerHTML = `"${char}" &rarr; <span>${ascii}</span>`;
    charExplainer.innerText = `The letter "${char}" is secretly the number ${ascii}.`;
    
    // STEP 2: UI Update Mapping
    const targetX = (charIdx * 3) % GRID_SIZE;
    const targetY = (ascii) % GRID_SIZE;
    coordDisplay.innerText = `Grid Target: (X: ${targetX}, Y: ${targetY})`;
    
    // STEP 3: Math Update & Draw
    grid[targetY * GRID_SIZE + targetX] += ascii;
    drawGrid();
    
    // Highlight dropped cell
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(targetX * CELL_SIZE, targetY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    
    charIdx++;
}

function stepMathRipple() {
    if (rippleSteps >= MAX_RIPPLES) return;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const idx = y * GRID_SIZE + x;
            let val = grid[idx];
            
            const left = x > 0 ? grid[idx - 1] : grid[y * GRID_SIZE + (GRID_SIZE - 1)];
            const right = x < GRID_SIZE - 1 ? grid[idx + 1] : grid[y * GRID_SIZE];
            const top = y > 0 ? grid[(y - 1) * GRID_SIZE + x] : grid[(GRID_SIZE - 1) * GRID_SIZE + x];
            const bottom = y < GRID_SIZE - 1 ? grid[(y + 1) * GRID_SIZE + x] : grid[x];
            
            // Simple visual neighbor addition for educational purposes
            // (Much simpler than the actual pro hash so numbers don't instantly blow up to billions)
            let neighborSum = (left + right + top + bottom);
            let newVal = val;
            if (neighborSum > 0) {
                 newVal = (val + Math.floor(neighborSum / 2)) % 999;
            }
            
            nextGrid[idx] = newVal;
        }
    }
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        grid[i] = nextGrid[i];
    }
    
    drawGrid();
    rippleSteps++;
    
    stepMathBtn.textContent = `Step the Math (Ripple ${rippleSteps}/${MAX_RIPPLES})`;
    
    if (rippleSteps >= MAX_RIPPLES) {
        stepMathBtn.disabled = true;
        stepMathBtn.textContent = 'Ripples Settled';
        hashOutput.innerText = extractHash();
        startBtn.disabled = false;
        startBtn.textContent = 'Start Over';
    }
}

// EVENT LISTENERS
startBtn.addEventListener('click', resetState);
stepMathBtn.addEventListener('click', stepMathRipple);

// INIT
drawGrid();
