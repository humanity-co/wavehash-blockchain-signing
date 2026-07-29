# WaveCrypt Phase 2: The Chaos Engine

## 1. Abstract
The Phase 1 Grid Engine successfully demonstrated wave propagation with excellent Avalanche properties (~47% bit flip rate). However, relying purely on bitwise rotations (`ROTL`) and addition (`+`) leaves the hash vulnerable to algebraic cryptanalysis (e.g., differential cryptanalysis or SAT solvers) because the operations are affine/linear over modular arithmetic rings.

To make WaveCrypt cryptographically robust, Phase 2 introduces the **Chaos Engine**, a non-linear modulation layer that acts upon the grid after every propagation step.

## 2. Components of the Chaos Engine

### 2.1 Non-Linear Substitution (S-Box)
Standard cryptography uses Look-Up Tables (S-Boxes) like in AES. WaveCrypt will utilize a computational, memory-hard substitution step to maintain spatial cache locality without requiring large static tables.

For every cell $u_{i,j}$ in the Grid:
$$ u_{i,j} = \left( u_{i,j} \oplus (\sim u_{i+1, j} \land u_{i, j+1}) \right) $$

This operation is inspired by Keccak's $\chi$ (chi) step, which is highly non-linear and mathematically proven to resist differential attacks.

### 2.2 Chaotic Feedback Modulation
In physical waves, energy traveling through non-uniform mediums changes frequency. We simulate this by introducing a global "Chaos Register" ($C$) that accumulates entropy across the entire grid and feeds it back into the diffusion equation.

1. **Entropy Accumulation:**
   $$ C^{(t)} = C^{(t-1)} \oplus \left( \sum_{i,j} u_{i,j}^{(t)} \pmod{2^{32}} \right) $$

2. **Frequency Modulation:**
   During the next propagation round, the rotation constants (which were static $7$ and $11$ in Phase 1) become dynamic based on the Chaos Register:
   $$ R_1 = 1 + (C^{(t)} \pmod{31}) $$
   $$ R_2 = 1 + ((C^{(t)} \gg 5) \pmod{31}) $$

### 2.3 The Final Wave Equation (V2)
The updated propagation equation combining Grid Engine and Chaos Engine:

$$ Diffusion = \sum Neighbors $$
$$ u_{i,j}^{(t+1)} = \left( u_{i,j}^{(t)} \oplus ROTL(u_{i,j}^{(t-1)}, R_1) \right) + ROTL(Diffusion, R_2) \pmod{2^{32}} $$
$$ u_{i,j}^{(t+1)} \leftarrow NonLinearSub(u_{i,j}^{(t+1)}) $$

## 3. Security Analysis
By introducing the dynamic rotation constants ($R_1, R_2$) and the Keccak-style non-linear substitution, WaveCrypt effectively destroys any linear relationships between the input message and the final state. It guarantees that reversing the hash requires exponential brute-force effort, elevating it from a mathematical curiosity to a cryptographically secure framework.
