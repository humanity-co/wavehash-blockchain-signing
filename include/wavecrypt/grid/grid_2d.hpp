#pragma once

#include <cstdint>
#include <vector>
#include <cstddef>
#include <stdexcept>
#include <bit>

namespace wavecrypt {
namespace grid {

// A deterministic 2D grid for wave propagation.
// Operates strictly on uint32_t to guarantee bit-exact cross-platform determinism.
class Grid2D {
public:
    Grid2D(std::size_t width, std::size_t height)
        : width_(width), height_(height), state_(width * height, 0), momentum_(width * height, 0), chaos_register_(0) {
        if (width_ == 0 || height_ == 0) {
            throw std::invalid_argument("Grid dimensions must be > 0");
        }
    }

    // Accessors
    std::size_t width() const { return width_; }
    std::size_t height() const { return height_; }
    
    // Direct state access
    uint32_t get_state(std::size_t x, std::size_t y) const {
        return state_[y * width_ + x];
    }
    
    void set_state(std::size_t x, std::size_t y, uint32_t value) {
        state_[y * width_ + x] = value;
    }

    // Inject energy (message bytes) into the grid at a specific point
    void inject_energy(std::size_t x, std::size_t y, uint32_t energy) {
        state_[y * width_ + x] ^= energy;
    }

    // Phase 2: Chaos Engine Propagation
    void propagate() {
        std::vector<uint32_t> next_state(state_.size(), 0);

        // 1. Entropy Accumulation (Chaos Register update)
        uint32_t round_entropy = 0;
        for (uint32_t val : state_) {
            round_entropy += val;
        }
        chaos_register_ ^= round_entropy;

        // 2. Dynamic Frequency Modulation
        uint32_t r1 = 1 + (chaos_register_ % 31);
        uint32_t r2 = 1 + ((chaos_register_ >> 5) % 31);

        for (std::size_t y = 0; y < height_; ++y) {
            for (std::size_t x = 0; x < width_; ++x) {
                // Wrap-around boundary conditions
                std::size_t left  = (x == 0) ? width_ - 1 : x - 1;
                std::size_t right = (x == width_ - 1) ? 0 : x + 1;
                std::size_t up    = (y == 0) ? height_ - 1 : y - 1;
                std::size_t down  = (y == height_ - 1) ? 0 : y + 1;

                // Neighbor indices
                std::size_t right_idx = y * width_ + right;
                std::size_t left_idx  = y * width_ + left;
                std::size_t down_idx  = down * width_ + x;
                std::size_t up_idx    = up * width_ + x;
                std::size_t current_idx = y * width_ + x;

                // Diffusion Step (Linear)
                uint32_t sum = state_[right_idx] + state_[left_idx] + state_[down_idx] + state_[up_idx];

                // Momentum Step
                uint32_t current = state_[current_idx];
                uint32_t prev    = momentum_[current_idx];

                // Dynamic Rotation Update
                uint32_t next = (current ^ std::rotl(prev, static_cast<int>(r1))) + std::rotl(sum, static_cast<int>(r2));

                // 3. Non-Linear Substitution (Keccak-style S-Box)
                // u = u ^ (~right & down)
                next ^= (~state_[right_idx] & state_[down_idx]);

                next_state[current_idx] = next;
            }
        }

        // Update momentum and state
        momentum_ = std::move(state_);
        state_ = std::move(next_state);
    }

    // Collapse the grid state into a dense output buffer
    std::vector<uint8_t> collapse_to_bytes(std::size_t output_size_bytes) const {
        std::vector<uint8_t> output(output_size_bytes, 0);
        if (state_.empty()) return output;

        for (std::size_t i = 0; i < state_.size(); ++i) {
            uint32_t val = state_[i];
            // Mix chaos register into collapse for ultimate diffusion
            val ^= chaos_register_;
            
            std::size_t out_idx = (i * 4) % output_size_bytes;
            
            output[out_idx]     ^= static_cast<uint8_t>((val >> 24) & 0xFF);
            output[(out_idx+1) % output_size_bytes] += static_cast<uint8_t>((val >> 16) & 0xFF);
            output[(out_idx+2) % output_size_bytes] ^= static_cast<uint8_t>((val >> 8) & 0xFF);
            output[(out_idx+3) % output_size_bytes] += static_cast<uint8_t>(val & 0xFF);
        }
        return output;
    }

private:
    std::size_t width_;
    std::size_t height_;
    std::vector<uint32_t> state_;     // Current state u^(t)
    std::vector<uint32_t> momentum_;  // Previous state u^(t-1)
    uint32_t chaos_register_;         // Global entropy accumulator
};

} // namespace grid
} // namespace wavecrypt
