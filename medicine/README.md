# Medicine Price Tracker

A web application that tracks and compares medicine prices across different online platforms.

## Features

- Search for medicine prices across multiple platforms
- Real-time price comparison
- Historical price tracking
- Responsive web interface

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start the development server:
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

## Project Structure

- `medtrack/` - Django project root
  - `pricecompare/` - Main Django app
  - `frontend/` - React frontend application

## API Endpoints

- `GET /api/search/?medicine=<name>` - Search medicine prices across platforms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 