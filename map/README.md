# Therapist Map Application

This application displays therapist locations on Google Maps with features for viewing locations, getting directions, and location autocomplete.

## Features

- Display therapist locations on Google Maps
- Toggle button to show/hide location markers
- Current location detection
- Destination address input with autocomplete
- Directions between current location and destination

## Setup

1. Install dependencies:
```bash
npm install
```

2. Get a Google Maps API key:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Directions API
   - Create credentials (API key)
   - Copy your API key

3. Replace the API key:
   - Open `src/App.tsx`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

4. Place your dataset:
   - Put your Excel file (`cleaned_dataset_203_with_coordinates.xlsx`) in the `public` folder
   - Make sure the Excel file has columns for:
     - name
     - address
     - lat
     - lng

5. Start the application:
```bash
npm start
```

## Usage

1. The map will automatically center on your current location
2. Use the toggle button to show/hide therapist location markers
3. Enter a destination address in the input field (autocomplete will help)
4. Click "Get Directions" to see the route from your current location to the destination

## Note

Make sure your Excel file has the correct column names and data format. The application expects:
- `name`: Therapist's name
- `address`: Full address
- `lat`: Latitude (numeric)
- `lng`: Longitude (numeric) 