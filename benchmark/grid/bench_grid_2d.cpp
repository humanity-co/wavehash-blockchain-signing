#include "wavecrypt/grid/grid_2d.hpp"
#include <iostream>
#include <chrono>
#include <vector>

using namespace wavecrypt::grid;

volatile uint32_t sink = 0;

void benchmark_grid(std::size_t size, std::size_t iterations) {
    Grid2D grid(size, size);
    grid.inject_energy(size/2, size/2, 0x12345678);

    auto start = std::chrono::high_resolution_clock::now();
    for (std::size_t i = 0; i < iterations; ++i) {
        grid.propagate();
        sink = grid.get_state(0, 0); // Prevent optimization
    }
    auto end = std::chrono::high_resolution_clock::now();
    
    std::chrono::duration<double, std::milli> diff = end - start;
    
    std::size_t bytes_processed = size * size * sizeof(uint32_t) * iterations;
    double mb_processed = static_cast<double>(bytes_processed) / (1024.0 * 1024.0);
    double mb_per_sec = mb_processed / (diff.count() / 1000.0);
    
    std::cout << "Grid " << size << "x" << size << " | "
              << iterations << " iters | "
              << diff.count() << " ms | "
              << mb_per_sec << " MB/s\n";
}

int main() {
    std::cout << "Grid2D Propagation Benchmark:\n";
    std::cout << "------------------------------------------\n";
    benchmark_grid(8, 100000);
    benchmark_grid(16, 50000);
    benchmark_grid(32, 10000);
    benchmark_grid(64, 5000);
    return 0;
}
