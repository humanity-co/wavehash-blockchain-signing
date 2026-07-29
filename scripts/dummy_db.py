import json
import os
import subprocess
import getpass
import sys

# Path to our compiled C++ CLI tool
CLI_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'build', 'tools', 'wavehash_cli'))
DB_PATH = 'dummy_db.json'

def wavehash(message):
    """Calls the C++ WaveCrypt engine to hash a message."""
    if not os.path.exists(CLI_PATH):
        print(f"Error: Could not find {CLI_PATH}. Did you compile it?")
        sys.exit(1)
        
    result = subprocess.run([CLI_PATH, message], capture_output=True, text=True)
    if result.returncode != 0:
        print("Hashing failed!")
        sys.exit(1)
    return result.stdout.strip()

def load_db():
    if os.path.exists(DB_PATH):
        with open(DB_PATH, 'r') as f:
            return json.load(f)
    return {}

def save_db(db):
    with open(DB_PATH, 'w') as f:
        json.dump(db, f, indent=4)

def register(db):
    print("\n--- Register New User ---")
    username = input("Username: ").strip()
    if username in db:
        print("Username already exists.")
        return
        
    password = getpass.getpass("Password: ")
    print("Hashing password using WaveCrypt Grid Engine...")
    hash_hex = wavehash(password)
    
    db[username] = hash_hex
    save_db(db)
    print(f"User {username} registered successfully! Hash: {hash_hex}")

def login(db):
    print("\n--- Login ---")
    username = input("Username: ").strip()
    if username not in db:
        print("User not found.")
        return
        
    password = getpass.getpass("Password: ")
    hash_hex = wavehash(password)
    
    if hash_hex == db[username]:
        print("Login SUCCESS! Access Granted.")
    else:
        print("Login FAILED! Incorrect Password.")

if __name__ == "__main__":
    db = load_db()
    while True:
        print("\nWaveCrypt Dummy Database")
        print("1. Register")
        print("2. Login")
        print("3. Exit")
        choice = input("Select an option: ")
        
        if choice == '1':
            register(db)
        elif choice == '2':
            login(db)
        elif choice == '3':
            break
        else:
            print("Invalid choice.")
