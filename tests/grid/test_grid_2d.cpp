#include "wavecrypt/grid/grid_2d.hpp"
#include <iostream>
#include <cassert>

using namespace wavecrypt::grid;

void test_initialization() {
    Grid2D grid(8, 8);
    assert(grid.width() == 8);
    assert(grid.height() == 8);
    
    for (std::size_t y = 0; y < grid.height(); ++y) {
        for (std::size_t x = 0; x < grid.width(); ++x) {
            assert(grid.get_state(x, y) == 0);
        }
    }
    std::cout << "Initialization test passed.\n";
}

void test_energy_injection() {
    Grid2D grid(8, 8);
    grid.inject_energy(3, 4, 0xDEADBEEF);
    assert(grid.get_state(3, 4) == 0xDEADBEEF);
    
    grid.inject_energy(3, 4, 0x11111111);
    assert(grid.get_state(3, 4) == (0xDEADBEEF ^ 0x11111111));
    std::cout << "Energy injection test passed.\n";
}

void test_propagation_determinism() {
    Grid2D grid1(8, 8);
    Grid2D grid2(8, 8);
    
    grid1.inject_energy(2, 2, 0x12345678);
    grid2.inject_energy(2, 2, 0x12345678);
    
    grid1.propagate();
    grid2.propagate();
    
    for (std::size_t y = 0; y < 8; ++y) {
        for (std::size_t x = 0; x < 8; ++x) {
            assert(grid1.get_state(x, y) == grid2.get_state(x, y));
        }
    }
    
    assert(grid1.get_state(2, 2) != 0);
    assert(grid1.get_state(1, 2) != 0); // Left neighbor got energy
    std::cout << "Propagation determinism test passed.\n";
}

void test_collapse() {
    Grid2D grid(4, 4);
    grid.inject_energy(1, 1, 0xAABBCCDD);
    grid.propagate();
    
    auto output = grid.collapse_to_bytes(32);
    assert(output.size() == 32);
    
    bool has_non_zero = false;
    for (auto byte : output) {
        if (byte != 0) {
            has_non_zero = true;
            break;
        }
    }
    assert(has_non_zero);
    std::cout << "Collapse test passed.\n";
}

int main() {
    test_initialization();
    test_energy_injection();
    test_propagation_determinism();
    test_collapse();
    std::cout << "All Grid2D tests passed successfully.\n";
    return 0;
}
