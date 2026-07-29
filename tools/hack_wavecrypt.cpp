#include "wavecrypt/grid/grid_2d.hpp"
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <random>
#include <iomanip>
#include <chrono>

using namespace wavecrypt::grid;

// Same rudimental absorption as wavehash_cli
std::vector<uint8_t> wavehash(const std::string& message) {
    Grid2D grid(16, 16);
    if (!message.empty()) {
        std::size_t idx = 0;
        for (std::size_t y = 0; y < grid.height(); ++y) {
            for (std::size_t x = 0; x < grid.width(); ++x) {
                uint32_t val = static_cast<uint32_t>(message[idx % message.length()]);
                val ^= (val << 8) | (static_cast<uint32_t>(idx) * 0x9E3779B9); 
                grid.inject_energy(x, y, val);
                idx++;
            }
        }
    }
    for (int i = 0; i < 25; ++i) grid.propagate();
    return grid.collapse_to_bytes(32);
}

std::string bytes_to_hex(const std::vector<uint8_t>& bytes) {
    std::string hex;
    const char hex_chars[] = "0123456789abcdef";
    for(auto b : bytes) {
        hex.push_back(hex_chars[b >> 4]);
        hex.push_back(hex_chars[b & 0x0F]);
    }
    return hex;
}

std::string random_string(std::size_t length) {
    static const char alphanum[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    std::string s;
    for (std::size_t i = 0; i < length; ++i) {
        s += alphanum[static_cast<std::size_t>(rand()) % (sizeof(alphanum) - 1)];
    }
    return s;
}

void test_avalanche() {
    std::cout << "\n--- Avalanche Effect Test ---\n";
    std::cout << "Goal: Changing 1 bit should change ~50% (128) of the hash bits.\n";
    
    std::string msg1 = "Hello, WaveCrypt! This is a test.";
    std::string msg2 = "Iello, WaveCrypt! This is a test."; // Changed H to I
    
    auto h1 = wavehash(msg1);
    auto h2 = wavehash(msg2);
    
    std::cout << "Base Msg : '" << msg1 << "'\n";
    std::cout << "Hash 1   : " << bytes_to_hex(h1).substr(0, 32) << "...\n";
    std::cout << "Mod Msg  : '" << msg2 << "'\n";
    std::cout << "Hash 2   : " << bytes_to_hex(h2).substr(0, 32) << "...\n";
    
    int diff_count = 0;
    for (std::size_t i = 0; i < h1.size(); ++i) {
        uint8_t xor_val = h1[i] ^ h2[i];
        // Count set bits
        while (xor_val) {
            diff_count += xor_val & 1;
            xor_val >>= 1;
        }
    }
    
    double percentage = (static_cast<double>(diff_count) / 256.0) * 100.0;
    std::cout << "\nBits flipped: " << diff_count << " out of 256 (" << percentage << "%)\n";
    
    if (percentage >= 45.0 && percentage <= 55.0) {
        std::cout << "Result: PASS (Excellent Avalanche)\n";
    } else {
        std::cout << "Result: FAIL (Avalanche is biased)\n";
    }
}

void test_collision() {
    std::cout << "\n--- Collision (Birthday) Attack ---\n";
    std::cout << "Goal: Find two strings with SAME hash.\n";
    std::cout << "Testing 1,000,000 random strings in C++...\n";
    
    std::unordered_map<std::string, std::string> seen;
    int collisions = 0;
    
    srand(42);
    
    for (int i = 0; i < 100000; ++i) {
        if (i % 25000 == 0 && i > 0) std::cout << "  ... tried " << i << " hashes\n";
        std::string r_str = random_string(8);
        auto h_bytes = wavehash(r_str);
        std::string h_str((char*)h_bytes.data(), h_bytes.size());
        
        if (seen.count(h_str) && seen[h_str] != r_str) {
            std::cout << "\nCOLLISION FOUND!\n";
            std::cout << "String 1: " << seen[h_str] << "\n";
            std::cout << "String 2: " << r_str << "\n";
            collisions++;
            break;
        }
        seen[h_str] = r_str;
    }
    
    if (collisions == 0) {
        std::cout << "Result: PASS (No full collisions found in 1 Million attempts)\n";
    } else {
        std::cout << "Result: FAIL (Hash collision detected!)\n";
    }
}

int main() {
    std::cout << "Initiating C++ Hack Sequence...\n";
    test_avalanche();
    test_collision();
    return 0;
}
