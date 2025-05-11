import os
import requests
import zipfile
from tqdm import tqdm

def download_file(url, filename):
    """
    Download a file with progress bar
    """
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(filename, 'wb') as f, tqdm(
        desc=filename,
        total=total_size,
        unit='iB',
        unit_scale=True
    ) as pbar:
        for data in response.iter_content(chunk_size=1024):
            size = f.write(data)
            pbar.update(size)

def main():
    # Create audio_data directory if it doesn't exist
    if not os.path.exists('audio_data'):
        os.makedirs('audio_data')
    
    # RAVDESS dataset URL (speech only)
    url = "https://zenodo.org/record/1188976/files/Audio_Speech_Actors_01-24.zip"
    zip_file = "ravdess.zip"
    
    print("Downloading RAVDESS dataset...")
    download_file(url, zip_file)
    
    print("\nExtracting files...")
    with zipfile.ZipFile(zip_file, 'r') as zip_ref:
        zip_ref.extractall('temp')
    
    # Move WAV files to audio_data directory
    print("\nOrganizing files...")
    for root, dirs, files in os.walk('temp'):
        for file in files:
            if file.endswith('.wav'):
                # Extract emotion from filename
                # Format: modality-vocal_channel-emotion-intensity-statement-repetition-actor.wav
                parts = file.split('-')
                if len(parts) >= 3:
                    emotion = parts[2]
                    # Create emotion-based filename
                    new_name = f"{emotion}_{file}"
                    src = os.path.join(root, file)
                    dst = os.path.join('audio_data', new_name)
                    os.rename(src, dst)
    
    # Cleanup
    print("\nCleaning up...")
    os.remove(zip_file)
    import shutil
    shutil.rmtree('temp')
    
    print("\nDone! Audio files are ready in the audio_data directory.")

if __name__ == "__main__":
    main() 