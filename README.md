# WaveCrypt Engine Visualizer
*An interactive, real-time cryptographic hashing visualization and educational tool.*

WaveCrypt is an advanced HTML5 Canvas-based engine that visualizes exactly how data is scrambled during a hashing algorithm. By treating raw data as "energy" injected into a simulated physics grid, it demonstrates the one-way, chaotic diffusion of information that makes cryptographic hashing secure.

---

## Features

### 1. The Professional Dashboard (`index.html`)
Designed with a classic laboratory aesthetic, the Pro dashboard features a 4-stage pipeline:
* **Stage 1: Input:** Inject raw text data into the system.
* **Stage 2: Toroidal Fluid Dynamics:** Watch the data propagate through a 16x16 grid in real-time.
* **Stage 3: Hash Output:** See the final computed hexadecimal hash signature.
* **Stage 4: Cryptanalysis (Decryption):** Simulates an "Eavesdropper" attack using an in-memory Rainbow Table to instantly decrypt known hashes back into raw text.

### 2. Six Mathematical Rendering Modes
Experience the physics simulation through six entirely distinct rendering paradigms built purely in Canvas 2D (No WebGL):
* **Fluid:** Organic, merging metaballs that visualize raw energy diffusion.
* **Rubik's:** Crisp, rigid geometric blocks highlighting mathematical structure.
* **Ripple:** Pulse rings mimicking water drops on a pond.
* **Vector Flow:** A clean, rotational flow-field showing the exact angle of energy propagation.
* **3D Topo:** A retro-synthwave solid 3D isometric heightmap that renders depth and occlusion dynamically.
* **Matrix:** "Hacker Green" ASCII terminal rain where characters change based on node energy.

### 3. Layman's Educational Mode (`layman.html`)
A fully separate, vertical infographic layout designed to explain cryptography to non-technical users. It uses a **"Digital DNA Centrifuge"** analogy with simple, animated steps to explain how one-way hashing works.

---

## Installation and Execution

WaveCrypt is a pure frontend application with no heavy dependencies.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/humanity-co/wavehash-blockchain-signing.git
   cd wavehash-blockchain-signing
   ```

2. **Run a local web server:**
   ```bash
   python3 -m http.server 8080 --directory ui
   ```

3. **View the app:**
   Open your browser and navigate to `http://localhost:8080`

---

## Technical Stack
* **Languages:** Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3
* **Host Space:** [Humanity Co](https://github.com/humanity-co)
* **License:** Proprietary and confidential.
