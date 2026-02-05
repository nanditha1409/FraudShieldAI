from pydub import AudioSegment
import base64
import os
import sys

def create_short_sample(input_file, duration_sec=5):
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found.")
        return

    print(f"Loading {input_file}...")
    audio = AudioSegment.from_file(input_file)
    
    # Trim to X seconds
    short_audio = audio[:duration_sec * 1000]
    
    output_filename = "short_test_sample.mp3"
    short_audio.export(output_filename, format="mp3")
    print(f"Created {output_filename} ({duration_sec} seconds)")
    
    # Convert to Base64
    with open(output_filename, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode('utf-8')
        
    print(f"\n=== COPY THIS SHORT STRING ({len(encoded_string)} chars) ===\n")
    print(encoded_string)
    print("\n=== END ===\n")

if __name__ == "__main__":
    target_file = "sample.wav.mp3"
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        
    create_short_sample(target_file)
