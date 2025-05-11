# NVIDIA LLM Text Generator

A full-stack application that uses NVIDIA's LLM API to generate text based on user prompts.

## Features
- Modern React frontend with Material-UI
- Django backend with REST API
- Integration with NVIDIA's LLM API
- Real-time text generation
- Error handling and loading states

## Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

## Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On Unix or MacOS
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the Django server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Usage
1. Open your browser and navigate to `http://localhost:3000`
2. Enter your prompt in the text field
3. Click "Generate Text" to get a response from the NVIDIA LLM
4. The generated text will appear below the input field

## API Endpoints
- `POST /api/generate/`: Generate text based on the provided prompt
  - Request body: `{ "prompt": "your prompt here" }`
  - Response: Generated text from the NVIDIA LLM

## Error Handling
The application includes comprehensive error handling for:
- API connection issues
- Invalid prompts
- Server errors
- Network problems

## Security
The NVIDIA API key is stored in the Django settings. In a production environment, it should be stored in environment variables. 