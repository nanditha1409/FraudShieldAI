import base64
import os
import sys

def file_to_base64(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return

    with open(file_path, "rb") as audio_file:
        encoded_string = base64.b64encode(audio_file.read()).decode('utf-8')
        
    print("\n=== COPY BELOW THIS LINE ===\n")
    print(encoded_string)
    print("\n=== END OF BASE64 ===\n")
    print(f"Success! Copied {len(encoded_string)} chars.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_base64.py <path_to_audio_file>")
        print("Example: python generate_base64.py sample.wav.mp3")
    else:
        file_to_base64(sys.argv[1])
