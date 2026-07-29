#include "wavecrypt/grid/grid_2d.hpp"
#include <iostream>
#include <string>
#include <vector>
#include <iomanip>

using namespace wavecrypt::grid;

// A highly rudimentary way to absorb a message into the Grid Engine
// This is NOT secure (we need a proper Message Schedule/Diffusion engine), 
// but it works for our cryptanalysis test!
void absorb_message(Grid2D& grid, const std::string& message) {
    if (message.empty()) return;
    
    std::size_t idx = 0;
    for (std::size_t y = 0; y < grid.height(); ++y) {
        for (std::size_t x = 0; x < grid.width(); ++x) {
            uint32_t val = static_cast<uint32_t>(message[idx % message.length()]);
            // XOR shift to add some quick entropy so the same char doesn't just equal itself
            val ^= (val << 8) | (static_cast<uint32_t>(idx) * 0x9E3779B9);
            grid.inject_energy(x, y, val);
            idx++;
        }
    }
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: wavehash_cli <message>\n";
        return 1;
    }

    std::string message = argv[1];
    
    // 16x16 Grid = 256 cells
    Grid2D grid(16, 16);
    
    // 1. Absorb the message
    absorb_message(grid, message);
    
    // 2. Propagate for 25 rounds (Avalanche)
    for (int i = 0; i < 25; ++i) {
        grid.propagate();
    }
    
    // 3. Collapse to 32 bytes (256-bit hash)
    auto hash_bytes = grid.collapse_to_bytes(32);
    
    // 4. Output Hex String
    for (uint8_t b : hash_bytes) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') << (int)b;
    }
    std::cout << "\n";
    
    return 0;
}
