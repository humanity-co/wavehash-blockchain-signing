# Grid Engine & Mathematics Specification

## Introduction
The Grid Engine is the foundational spatial architecture of the WaveCrypt framework. It models a deterministic, closed physical system where information (the message) is injected as energy (waves) and propagates through spatial dimensions over time.

To ensure **100% cross-platform determinism**, we strictly forbid standard IEEE 754 floating-point operations. All spatial energy values are represented as `uint32_t` or `uint64_t` fixed-point integers.

## Spatial Representation
We define a grid $G$ of size $N \times M$.
For performance and SIMD alignment, $N$ and $M$ should be multiples of 4 or 8 (e.g., $8 \times 8$, $16 \times 16$).
Let $G_{i,j}^{(t)}$ represent the energy state of the cell at row $i$, column $j$, at time step $t$.

### Memory Layout
For SIMD optimization, the grid is strictly flattened into a 1D array using row-major order:
$Index(i, j) = i \times M + j$
Data is 32-byte or 64-byte aligned (AVX2/AVX-512 friendly).

## Discrete Wave Equation (Integer Diffusion)
Classical wave propagation in 2D is modeled by the wave equation:
$\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u$

In our discrete, deterministic integer grid, we approximate this using a combination of neighboring diffusion (Laplacian) and momentum (previous state).

Let:
- $u_{i,j}^{(t)}$ be the current state of cell $(i,j)$
- $u_{i,j}^{(t-1)}$ be the momentum (previous state)
- $c$ be the propagation speed scalar

The standard discrete approximation is:
$u_{i,j}^{(t+1)} = 2u_{i,j}^{(t)} - u_{i,j}^{(t-1)} + c^2 \left( u_{i+1,j}^{(t)} + u_{i-1,j}^{(t)} + u_{i,j+1}^{(t)} + u_{i,j-1}^{(t)} - 4u_{i,j}^{(t)} \right)$

### Cryptographic Non-Linearity
The pure linear wave equation is not secure for cryptography. We introduce chaos and non-linearity through bitwise operations and modular arithmetic during propagation:

1. **Diffusion Step (Linear):**
   $D_{i,j} = \left( u_{i+1,j}^{(t)} + u_{i-1,j}^{(t)} + u_{i,j+1}^{(t)} + u_{i,j-1}^{(t)} \right) \pmod{2^{32}}$

2. **Momentum & Non-Linear Step:**
   We use bitwise rotations to simulate non-linear momentum and frequency shifting:
   $u_{i,j}^{(t+1)} = \left( u_{i,j}^{(t)} \oplus ROTL(u_{i,j}^{(t-1)}, 7) \right) + ROTL(D_{i,j}, 11) \pmod{2^{32}}$

This guarantees rapid avalanche. Boundary conditions are implemented as "toroidal" (wrap-around) or "reflective" to ensure no energy is lost.

## Toroidal Boundary Conditions (Wrap-around)
If $i+1 \ge N$, it wraps to $0$.
If $j-1 < 0$, it wraps to $M-1$.
This provides infinite propagation space within a finite memory grid, ensuring uniform diffusion.

## Tensor Reduction (Hash Output)
After all rounds are complete, the final grid $G^{(T)}$ must be collapsed into the desired hash size (e.g., 256 bits).
We define a reduction tree, combining cells using alternating XOR and Modular Addition.
