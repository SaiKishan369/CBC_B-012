from flask import Flask, request, jsonify, render_template
import numpy as np
import librosa
import pickle
import os
from werkzeug.utils import secure_filename
import tempfile
import logging
import soundfile as sf
import wave
import io
import base64

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed audio extensions
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'webm', 'ogg', 'm4a', 'flac'}

# RAVDESS emotion code to name mapping
EMOTION_MAP = {
    '01': 'neutral',
    '02': 'calm',
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'fearful',
    '07': 'disgust',
    '08': 'surprised'
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Load the trained model and scaler
try:
    with open('speech_model.pkl', 'rb') as f:
        model_data = pickle.load(f)
        model = model_data['model']
        scaler = model_data['scaler']
    logger.info("Model and scaler loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise

def convert_to_wav(input_path):
    """Convert audio to WAV format using librosa"""
    try:
        logger.debug(f"Loading audio file: {input_path}")
        
        # Load audio with librosa
        try:
            # For WebM files, use specific parameters
            if input_path.endswith('.webm'):
                audio, sr = librosa.load(input_path, sr=44100, mono=True)
            else:
                # Try loading with default parameters first
                audio, sr = librosa.load(input_path, sr=None)
        except Exception as e:
            logger.error(f"Error loading with default parameters: {str(e)}")
            # Try loading with specific parameters
            audio, sr = librosa.load(input_path, sr=44100, mono=True)
        
        logger.debug(f"Audio loaded successfully. Shape: {audio.shape}, Sample rate: {sr}")
        
        # Check if audio is too short
        if len(audio) < sr * 0.5:  # Less than 0.5 seconds
            raise Exception("Audio is too short. Please record at least 2-3 seconds.")
        
        # Create output path
        wav_path = input_path.rsplit('.', 1)[0] + '.wav'
        
        # Save as WAV using soundfile
        sf.write(wav_path, audio, sr)
        logger.debug(f"Converted to WAV: {wav_path}")
        
        # Verify the WAV file was created correctly
        if not os.path.exists(wav_path):
            raise Exception("WAV file was not created")
        
        # Try to read the WAV file to verify it's valid
        with wave.open(wav_path, 'rb') as wav_file:
            logger.debug(f"WAV file verified. Channels: {wav_file.getnchannels()}, "
                        f"Sample width: {wav_file.getsampwidth()}, "
                        f"Frame rate: {wav_file.getframerate()}")
        
        return wav_path
    except Exception as e:
        logger.error(f"Error converting audio: {str(e)}", exc_info=True)
        raise Exception(f"Failed to convert audio: {str(e)}")

def extract_features(file_path):
    try:
        logger.debug(f"Loading audio file for feature extraction: {file_path}")
        audio, sample_rate = librosa.load(file_path, res_type='kaiser_fast')
        logger.debug(f"Audio loaded for features. Shape: {audio.shape}, Sample rate: {sample_rate}")
        
        # Check if audio is too short
        if len(audio) < sample_rate * 0.5:  # Less than 0.5 seconds
            raise Exception("Audio is too short. Please record at least 2-3 seconds.")
        
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
        features = np.concatenate([mfccs_mean, [centroid_mean, rolloff_mean, contrast_mean]])
        logger.debug(f"Features extracted. Shape: {features.shape}")
        
        return features
    except Exception as e:
        logger.error(f"Error in extract_features: {str(e)}")
        raise

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if the request contains audio data
        if 'audio' not in request.files and 'audio_data' not in request.form:
            logger.error("No audio data in request")
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Create a temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            input_path = None
            
            # Handle uploaded file
            if 'audio' in request.files:
                file = request.files['audio']
                if not file.filename:
                    logger.error("Empty filename")
                    return jsonify({'error': 'No file selected'}), 400
                    
                if not allowed_file(file.filename):
                    logger.error(f"Invalid file type: {file.filename}")
                    return jsonify({
                        'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
                    }), 400
                    
                filename = secure_filename(file.filename)
                input_path = os.path.join(temp_dir, filename)
                file.save(input_path)
                logger.debug(f"Saved uploaded file to: {input_path}")
            
            # Handle recorded audio
            elif 'audio_data' in request.form:
                audio_data = request.form['audio_data']
                logger.debug("Received audio data from form")
                
                try:
                    # Remove the data URL prefix if present
                    if audio_data.startswith('data:audio/webm;base64,'):
                        audio_data = audio_data.replace('data:audio/webm;base64,', '')
                    elif audio_data.startswith('data:audio/wav;base64,'):
                        audio_data = audio_data.replace('data:audio/wav;base64,', '')
                    
                    # Add padding if necessary
                    padding = len(audio_data) % 4
                    if padding:
                        audio_data += '=' * (4 - padding)
                    
                    # Decode base64 audio data
                    audio_bytes = base64.b64decode(audio_data)
                    
                    # Save as WebM file
                    input_path = os.path.join(temp_dir, 'recorded_audio.webm')
                    with open(input_path, 'wb') as f:
                        f.write(audio_bytes)
                    logger.debug(f"Saved recorded audio to: {input_path}")
                    
                    # Verify the file was created and has content
                    if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
                        raise Exception("Failed to save audio file")
                        
                except Exception as e:
                    logger.error(f"Error processing audio data: {str(e)}", exc_info=True)
                    return jsonify({'error': 'Invalid audio data format'}), 400
            
            if not input_path:
                logger.error("No valid audio input")
                return jsonify({'error': 'No valid audio input'}), 400
            
            try:
                # Convert to WAV if needed
                if not input_path.lower().endswith('.wav'):
                    wav_path = convert_to_wav(input_path)
                    if not wav_path:
                        logger.error("Failed to convert audio format")
                        return jsonify({
                            'error': 'Failed to convert audio format. Please try recording again or use a different file.'
                        }), 400
                else:
                    wav_path = input_path
                
                # Extract features
                features = extract_features(wav_path)
                logger.debug(f"Features extracted. Shape: {features.shape}")
                
                # Scale features
                features_scaled = scaler.transform(features.reshape(1, -1))
                logger.debug(f"Features scaled. Shape: {features_scaled.shape}")
                
                # Make prediction
                prediction = model.predict(features_scaled)
                logger.debug(f"Prediction made: {prediction}")
                
                # Get prediction probabilities
                probabilities = model.predict_proba(features_scaled)[0]
                logger.debug(f"Prediction probabilities: {probabilities}")
                
                emotion_code = str(prediction[0])
                emotion_name = EMOTION_MAP.get(emotion_code, 'Unknown')
                # Find the index of the predicted class in model.classes_
                class_index = list(model.classes_).index(prediction[0])
                confidence = float(probabilities[class_index])
                
                logger.info(f"Predicted emotion: {emotion_name} (code: {emotion_code}, confidence: {confidence:.2f})")
                
                return jsonify({
                    'emotion_code': emotion_code,
                    'emotion_name': emotion_name,
                    'confidence': confidence
                })
            except Exception as e:
                logger.error(f"Error processing audio: {str(e)}", exc_info=True)
                return jsonify({'error': str(e)}), 400
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error processing audio: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0') 