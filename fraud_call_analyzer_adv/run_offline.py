import os
import glob
import json
import argparse
from fraud_engine.rules import analyze_text
from fraud_engine.audio_processor import process_audio_file

def analyze_directory(directory_path: str, output_file: str = "report.json"):
    results = []
    
    # Supported extensions
    extensions = ['*.wav', '*.mp3', '*.ogg', '*.m4a']
    files = []
    
    for ext in extensions:
        files.extend(glob.glob(os.path.join(directory_path, ext)))
        
    print(f"Found {len(files)} audio files in {directory_path}...")
    
    for file_path in files:
        print(f"Processing {os.path.basename(file_path)}...")
        
        try:
            # Full processing with acoustics
            extract = process_audio_file(file_path)
            transcript = extract.get("text", "")
            acoustics = extract.get("acoustics", {})
            
            # Analyze
            analysis = analyze_text(transcript, acoustics)
            
            result_entry = {
                "filename": os.path.basename(file_path),
                "transcript": transcript,
                "acoustics": acoustics, # Log technical details
                "classification": analysis["label"],
                "confidence": analysis["confidence"],
                "reason": analysis["reason"]
            }
            results.append(result_entry)
            
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            results.append({
                "filename": os.path.basename(file_path),
                "error": str(e)
            })
            
    # Save report
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
        
    print(f"Analysis complete. Report saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Offline Fraud Call Analyzer (Advanced)")
    parser.add_argument("directory", help="Directory containing audio files")
    parser.add_argument("--output", default="report.json", help="Output JSON report file")
    
    args = parser.parse_args()
    
    analyze_directory(args.directory, args.output)
