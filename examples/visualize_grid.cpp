#include "wavecrypt/grid/grid_2d.hpp"
#include <iostream>
#include <vector>
#include <string>
#include <thread>
#include <chrono>
#include <iomanip>

using namespace wavecrypt::grid;

// Simple ASCII density map to visualize wave energy
const std::string DENSITY = " .:-=+*#%@";

char get_density_char(uint32_t value) {
    if (value == 0) return ' ';
    // Normalize uint32_t to 0-9 index
    double normalized = static_cast<double>(value) / 4294967295.0; // max uint32_t
    std::size_t index = static_cast<std::size_t>(normalized * static_cast<double>(DENSITY.length() - 1));
    
    // Ensure small non-zero values at least get a '.'
    if (index == 0 && value > 0) index = 1;
    
    return DENSITY[index];
}

void print_grid(const Grid2D& grid, int round) {
    std::cout << "\nWaveCrypt Grid Engine Visualizer\n";
    std::cout << "Round: " << round << "\n";
    std::cout << std::string(grid.width() * 2 + 2, '-') << "\n";
    
    for (std::size_t y = 0; y < grid.height(); ++y) {
        std::cout << "|";
        for (std::size_t x = 0; x < grid.width(); ++x) {
            uint32_t val = grid.get_state(x, y);
            char c = get_density_char(val);
            std::cout << c << c; // Print twice for aspect ratio
        }
        std::cout << "|\n";
    }
    std::cout << std::string(grid.width() * 2 + 2, '-') << "\n";
}

int main() {
    const std::size_t size = 16;
    Grid2D grid(size, size);
    
    // Inject a small amount of "energy" into the center
    grid.inject_energy(size/2, size/2, 0xFFFFFFFF);
    
    for (int round = 0; round <= 25; ++round) {
        print_grid(grid, round);
        
        // Wait 200ms to animate in terminal
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
        
        grid.propagate();
    }
    
    return 0;
}
