import pickle
import numpy as np
import librosa
import sys

def extract_features(file_path):
    audio, sample_rate = librosa.load(file_path, res_type='kaiser_fast')
    mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
    mfccs_mean = np.mean(mfccs.T, axis=0)
    return mfccs_mean

# Usage: python predict.py path_to_audio.wav
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py path_to_audio.wav")
        exit(1)
    audio_path = sys.argv[1]
    features = extract_features(audio_path).reshape(1, -1)
    with open("speech_model.pkl", "rb") as f:
        model = pickle.load(f)
    prediction = model.predict(features)
    print("Predicted label:", prediction[0]) 