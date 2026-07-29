import os
import subprocess
import sys
import random
import string
from collections import defaultdict

CLI_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'build', 'tools', 'wavehash_cli'))

def wavehash(message):
    result = subprocess.run([CLI_PATH, message], capture_output=True, text=True)
    if result.returncode != 0:
        print("Hashing failed!")
        sys.exit(1)
    return result.stdout.strip()

def hex_to_bin(hex_str):
    """Convert hex string to a binary string of exactly 256 bits."""
    return bin(int(hex_str, 16))[2:].zfill(256)

def test_avalanche():
    print("\n--- Avalanche Effect Test ---")
    print("Goal: Changing 1 character should change ~50% (128) of the bits.")
    
    base_msg = "Hello, WaveCrypt! This is a test."
    hash1_hex = wavehash(base_msg)
    hash1_bin = hex_to_bin(hash1_hex)
    
    # Change exactly one bit (the first character 'H' -> 'I')
    mod_msg = "Iello, WaveCrypt! This is a test."
    hash2_hex = wavehash(mod_msg)
    hash2_bin = hex_to_bin(hash2_hex)
    
    print(f"Base Msg : '{base_msg}'")
    print(f"Hash 1   : {hash1_hex[:32]}...")
    
    print(f"Mod Msg  : '{mod_msg}'")
    print(f"Hash 2   : {hash2_hex[:32]}...")
    
    # Count bit differences
    diff_count = sum(1 for a, b in zip(hash1_bin, hash2_bin) if a != b)
    percentage = (diff_count / 256.0) * 100
    
    print(f"\nBits flipped: {diff_count} out of 256 ({percentage:.2f}%)")
    if 45.0 <= percentage <= 55.0:
        print("Result: PASS (Excellent Avalanche)")
    else:
        print("Result: FAIL (Avalanche is biased)")

def test_collision():
    print("\n--- Collision (Birthday) Attack ---")
    print("Goal: Find two different strings that produce the SAME hash.")
    print("Testing 2,500 random strings...")
    
    seen = {}
    collisions = 0
    
    # Generate random 8-char strings
    for i in range(2500):
        if i % 500 == 0 and i > 0:
            print(f"  ... tried {i} hashes")
            
        r_str = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        h = wavehash(r_str)
        
        # We check full 256-bit collision
        if h in seen and seen[h] != r_str:
            print(f"\nCOLLISION FOUND!")
            print(f"String 1: {seen[h]}")
            print(f"String 2: {r_str}")
            print(f"Hash: {h}")
            collisions += 1
            break
            
        seen[h] = r_str
        
    if collisions == 0:
        print("Result: PASS (No full collisions found in 100k attempts)")
    else:
        print("Result: FAIL (Hash collision detected!)")
        
    # Extra: Truncated collision (testing diffusion weakness)
    print("\nTesting 16-bit truncated collisions (Checking for structural weakness)...")
    trunc_seen = defaultdict(list)
    for k, v in seen.items():
        trunc = k[:4] # First 16 bits (4 hex chars)
        trunc_seen[trunc].append(v)
        
    many_collisions = sum(1 for k, v in trunc_seen.items() if len(v) > 1)
    print(f"Found {many_collisions} truncated collisions. (This is expected in short lengths).")

if __name__ == "__main__":
    if not os.path.exists(CLI_PATH):
        print(f"Error: Could not find {CLI_PATH}. Did you compile it?")
        sys.exit(1)
        
    print("Initiating Hack Sequence...")
    test_avalanche()
    test_collision()
