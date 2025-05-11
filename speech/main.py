import numpy as np
import librosa
import glob
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import random

def extract_features(file_path):
    """
    Extract features from an audio file using librosa
    """
    try:
        # Load audio file
        audio, sample_rate = librosa.load(file_path, res_type='kaiser_fast')
        
        # Extract MFCCs
        mfccs = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
        
        # Extract spectral features
        spectral_centroid = librosa.feature.spectral_centroid(y=audio, sr=sample_rate)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sample_rate)[0]
        spectral_contrast = librosa.feature.spectral_contrast(y=audio, sr=sample_rate)[0]
        
        # Take the mean of features
        mfccs_mean = np.mean(mfccs.T, axis=0)
        centroid_mean = np.mean(spectral_centroid)
        rolloff_mean = np.mean(spectral_rolloff)
        contrast_mean = np.mean(spectral_contrast)
        
        # Combine all features
        feature = np.concatenate([mfccs_mean, [centroid_mean, rolloff_mean, contrast_mean]])
        return feature
            
    except Exception as e:
        print(f"Error extracting features from {file_path}: {str(e)}")
        return None

def load_data(data_dir):
    """
    Load audio files and extract features
    """
    features = []
    labels = []
    
    # Get all audio files in the directory
    audio_files = glob.glob(os.path.join(data_dir, "*.wav"))
    
    for audio_file in audio_files:
        # Extract label from filename (assuming format: label_filename.wav)
        label = os.path.basename(audio_file).split('_')[0]
        
        # Extract features
        feature = extract_features(audio_file)
        if feature is not None:
            features.append(feature)
            labels.append(label)
    
    return np.array(features), np.array(labels)

def train_model(X, y):
    """
    Train a neural network classifier
    """
    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Initialize the model with simplified architecture
    model = MLPClassifier(
        hidden_layer_sizes=(100, 50),  # Simpler network
        max_iter=1000,                 # Fewer iterations
        alpha=0.01,                    # L2 regularization
        learning_rate='constant',      # Constant learning rate
        random_state=42
    )
    
    # Train the model
    model.fit(X_train_scaled, y_train)
    
    # Make predictions and calculate accuracy
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nTest accuracy: {accuracy:.2f}")
    
    # Print detailed classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return model, scaler, X_test_scaled, y_test

def save_model(model, scaler, filename='speech_model.pkl'):
    """
    Save the trained model and scaler to a file
    """
    model_data = {
        'model': model,
        'scaler': scaler
    }
    with open(filename, 'wb') as f:
        pickle.dump(model_data, f)
    print(f"Model and scaler saved to {filename}")

def main():
    # Directory containing audio files
    data_dir = "audio_data"  # Change this to your audio data directory
    
    # Create data directory if it doesn't exist
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"Created directory: {data_dir}")
        print("Please add your audio files to this directory and run the script again.")
        return
    
    # Load and process data
    print("Loading and processing audio files...")
    X, y = load_data(data_dir)
    
    if len(X) == 0:
        print("No valid audio files found. Please add some .wav files to the audio_data directory.")
        return
    
    # Train model
    print("Training model...")
    model, scaler, X_test, y_test = train_model(X, y)
    
    # Save model and scaler
    save_model(model, scaler)

if __name__ == "__main__":
    main()