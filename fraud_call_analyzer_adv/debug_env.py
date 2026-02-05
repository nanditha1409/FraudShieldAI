import sys
import os

print("=== DEBUG INFO ===")
print(f"Python Executable: {sys.executable}")
print(f"Current Working Dir: {os.getcwd()}")
print(f"Sys Path: {sys.path}")

print("\n=== INSTALLED PACKAGES (via importlib) ===")
import importlib.util
spec = importlib.util.find_spec("speech_recognition")
print(f"speech_recognition spec: {spec}")

try:
    import speech_recognition
    print(f"Successfully imported speech_recognition from: {speech_recognition.__file__}")
except ImportError as e:
    print(f"IMPORT ERROR: {e}")

try:
    import fastapi
    print(f"Successfully imported fastapi")
except:
    print("Could not import fastapi")

print("\n=== PIP LIST ===")
# Run pip list from within python to be sure
import subprocess
subprocess.run([sys.executable, "-m", "pip", "list"])
