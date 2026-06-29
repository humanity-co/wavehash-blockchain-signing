import math
import struct

class WaveHash:
    def __init__(self):
        # Grid size for wave propagation
        self.GRID_SIZE = 4
        # Output size in bytes (256-bit hash)
        self.OUTPUT_SIZE = 32
        
        # Initialize the propagation grid
        self.grid = [[0.0 for _ in range(self.GRID_SIZE)] for _ in range(self.GRID_SIZE)]
        
        # Color transformation constants (arbitrary values chosen for interesting behavior)
        self.COLOR_SHIFT = 37
        self.SATURATION_FACTOR = 0.85
        self.VALUE_FACTOR = 0.7
    
    def _calculate_wave_properties(self, byte_value, position, current_sum):
        """Calculate wave properties (amplitude, frequency, phase) for a byte"""
        amplitude = byte_value / 255.0
        frequency = (position % 17) / 8.0 + 0.5
        phase = (current_sum * byte_value) % 360 / 180.0 * math.pi
        return amplitude, frequency, phase
    
    def _apply_wave_to_grid(self, amplitude, frequency, phase, center_x, center_y):
        """Apply wave effect to the grid based on wave properties"""
        for x in range(self.GRID_SIZE):
            for y in range(self.GRID_SIZE):
                # Calculate distance from center (using a non-standard formula for uniqueness)
                dx = x - center_x
                dy = y - center_y
                distance = math.sqrt(dx*dx + dy*dy + 0.01)  # Avoid division by zero
                
                # Calculate wave effect at this point
                # Using a unique formula that combines wave properties creatively
                wave_effect = amplitude * math.sin(frequency * distance + phase) / (distance * 0.8 + 0.2)
                
                # Apply effect to grid with a "color mixing" approach
                current = self.grid[x][y]
                # Non-linear combination (inspired by color blending)
                self.grid[x][y] = (current + wave_effect) % 1.0
                
                # Apply "reflection" from grid boundaries (unique to this algorithm)
                if x == 0 or x == self.GRID_SIZE-1 or y == 0 or y == self.GRID_SIZE-1:
                    reflection = wave_effect * 0.3
                    # Reflect back into adjacent cells
                    for nx in range(max(0, x-1), min(self.GRID_SIZE, x+2)):
                        for ny in range(max(0, y-1), min(self.GRID_SIZE, y+2)):
                            if nx != x or ny != y:
                                self.grid[nx][ny] = (self.grid[nx][ny] + reflection) % 1.0
    
    def _apply_color_transformation(self):
        """Apply color theory inspired transformations to the grid"""
        # Convert grid values to "color components"
        r_grid = [[0.0 for _ in range(self.GRID_SIZE)] for _ in range(self.GRID_SIZE)]
        g_grid = [[0.0 for _ in range(self.GRID_SIZE)] for _ in range(self.GRID_SIZE)]
        b_grid = [[0.0 for _ in range(self.GRID_SIZE)] for _ in range(self.GRID_SIZE)]
        
        # Split current grid into "RGB" components
        for x in range(self.GRID_SIZE):
            for y in range(self.GRID_SIZE):
                value = self.grid[x][y]
                # Create RGB from single value (inspired by HSV->RGB conversion)
                h = (value * 6 + self.COLOR_SHIFT) % 6
                c = self.VALUE_FACTOR * self.SATURATION_FACTOR
                x_comp = c * (1 - abs(h % 2 - 1))
                
                if h < 1:
                    r, g, b = c, x_comp, 0
                elif h < 2:
                    r, g, b = x_comp, c, 0
                elif h < 3:
                    r, g, b = 0, c, x_comp
                elif h < 4:
                    r, g, b = 0, x_comp, c
                elif h < 5:
                    r, g, b = x_comp, 0, c
                else:
                    r, g, b = c, 0, x_comp
                
                m = self.VALUE_FACTOR - c
                r_grid[x][y] = r + m
                g_grid[x][y] = g + m
                b_grid[x][y] = b + m
        
        # Apply interference between color channels
        # This is a creative invention for this algorithm
        for x in range(self.GRID_SIZE):
            for y in range(self.GRID_SIZE):
                # Apply interference between color channels based on neighbors
                if x > 0 and y > 0:
                    r_grid[x][y] = (r_grid[x][y] + g_grid[x-1][y-1] * 0.1) % 1.0
                    g_grid[x][y] = (g_grid[x][y] + b_grid[x-1][y-1] * 0.1) % 1.0
                    b_grid[x][y] = (b_grid[x][y] + r_grid[x-1][y-1] * 0.1) % 1.0
        
        # Combine back to main grid using luminance formula
        for x in range(self.GRID_SIZE):
            for y in range(self.GRID_SIZE):
                # Use human perception luminance formula
                self.grid[x][y] = 0.299 * r_grid[x][y] + 0.587 * g_grid[x][y] + 0.114 * b_grid[x][y]
    
    def _pad_message(self, message_bytes):
        """Pad the message for processing"""
        # Add length information at the end
        length_bytes = len(message_bytes).to_bytes(8, byteorder='big')
        padded = bytearray(message_bytes)
        
        # Add padding byte + length
        padded.append(0x80)  # Add a single '1' bit followed by zeros
        
        # Pad with zeros until we reach a "nice" length for our wave
        while (len(padded) + 8) % 16 != 0:
            padded.append(0)
            
        # Add length bytes
        padded.extend(length_bytes)
        return bytes(padded)
    
    def _collapse_grid(self):
        """Collapse the grid to a single hash value"""
        # This is a creative method unique to this algorithm
        result = bytearray(self.OUTPUT_SIZE)
        
        # Create initial raw bytes from grid values
        raw_bytes = bytearray()
        for x in range(self.GRID_SIZE):
            for y in range(self.GRID_SIZE):
                # Convert grid cell to bytes (4 bytes per cell)
                value = int(self.grid[x][y] * 4294967295)  # Convert to 32-bit int range
                raw_bytes.extend(value.to_bytes(4, byteorder='big'))
        
        # Use a wave-like folding pattern to create the final hash
        fold_size = len(raw_bytes) // 4
        for i in range(self.OUTPUT_SIZE):
            # Combine bytes in a wave pattern
            value = 0
            for j in range(4):
                idx = (i + j * fold_size) % len(raw_bytes)
                value = (value + raw_bytes[idx] * (j+1)) % 256
            result[i] = value
        
        return bytes(result)
    
    def hash(self, message):
        """Generate a hash using the WaveHash algorithm"""
        # Convert message to bytes if it's a string
        if isinstance(message, str):
            message_bytes = message.encode('utf-8')
        else:
            message_bytes = message
        
        # Pad message
        padded = self._pad_message(message_bytes)
        
        # Reset grid
        self.grid = [[0.0 for _ in range(self.GRID_SIZE)] for _ in range(self.GRID_SIZE)]
        
        # Process message in chunks
        current_sum = 0
        for i in range(0, len(padded), 2):  # Process 2 bytes at a time
            # Get byte values
            byte1 = padded[i]
            byte2 = padded[i+1] if i+1 < len(padded) else 0
            
            # Update running sum
            current_sum = (current_sum + byte1 + byte2) % 256
            
            # Calculate wave properties for these bytes
            amp1, freq1, phase1 = self._calculate_wave_properties(byte1, i, current_sum)
            amp2, freq2, phase2 = self._calculate_wave_properties(byte2, i+1, current_sum)
            
            # Apply waves to grid at different centers for interference
            center_x1 = (i % self.GRID_SIZE)
            center_y1 = ((i // self.GRID_SIZE) % self.GRID_SIZE)
            center_x2 = ((i+1) % self.GRID_SIZE)
            center_y2 = (((i+1) // self.GRID_SIZE) % self.GRID_SIZE)
            
            self._apply_wave_to_grid(amp1, freq1, phase1, center_x1, center_y1)
            self._apply_wave_to_grid(amp2, freq2, phase2, center_x2, center_y2)
            
            # Apply color transformation every 8 bytes for increased diffusion
            if i % 8 == 0:
                self._apply_color_transformation()
        
        # Apply final color transformation
        self._apply_color_transformation()
        
        # Collapse grid to final hash value
        hash_bytes = self._collapse_grid()
        
        # Convert to hexadecimal
        return ''.join(f'{b:02x}' for b in hash_bytes)


# Test program
def main():
    hasher = WaveHash()
    
    test_cases = [
        "",
        "hello",
        "Hello, world!",
        "abcdefghijklmnopqrstuvwxyz",
        "a" * 100,  # Test with a longer input
    ]
    
    print("WaveHash Test Results:")
    print("-" * 70)
    print(f"{'Input':<40} | {'Hash'}")
    print("-" * 70)
    
    for test in test_cases:
        hash_result = hasher.hash(test)
        display_input = test if len(test) < 37 else test[:34] + "..."
        print(f"{display_input:<40} | {hash_result}")
    
    # Demonstrate the avalanche effect with a single bit change
    str1 = "test string"
    # Change just one bit in the last character
    byte_array = bytearray(str1.encode())
    byte_array[-1] = byte_array[-1] ^ 1  # Flip the least significant bit
    str2 = byte_array.decode('utf-8', errors='replace')
    
    hash1 = hasher.hash(str1)
    hash2 = hasher.hash(str2)
    
    print("\nDemonstrating avalanche effect (one bit change):")
    print(f"'{str1}' -> {hash1}")
    print(f"'{str2}' -> {hash2}")
    
    # Count how many bits differ
    bin1 = ''.join(bin(int(c, 16))[2:].zfill(4) for c in hash1)
    bin2 = ''.join(bin(int(c, 16))[2:].zfill(4) for c in hash2)
    
    bit_diff = sum(1 for a, b in zip(bin1, bin2) if a != b)
    print(f"Bits different: {bit_diff} out of {len(bin1)} ({bit_diff/len(bin1)*100:.2f}%)")


if __name__ == "__main__":
    main()