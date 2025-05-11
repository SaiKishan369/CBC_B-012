import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import * as XLSX from 'xlsx';
import './App.css';

// Define libraries outside of component to prevent unnecessary reloads
const libraries: ("places")[] = ["places"];

interface Therapist {
  name: string;
  address: string;
  lat: number;
  lng: number;
  qualifications?: string;
  phone?: string;
  email?: string;
  kmcRegistration?: string;
}

const App: React.FC = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLng | null>(null);
  const [destination, setDestination] = useState<string>('');
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [showSetDestination, setShowSetDestination] = useState(false);
  const [destinationLocation, setDestinationLocation] = useState<google.maps.LatLng | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [currentZoom, setCurrentZoom] = useState(11);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [accuracyCircle, setAccuracyCircle] = useState<google.maps.Circle | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<google.maps.Marker | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const center = {
    lat: 12.9791,  // Bangalore latitude
    lng: 77.5913   // Bangalore longitude
  };

  useEffect(() => {
    // Load Excel file
    const loadData = async () => {
      try {
        console.log('Starting to load Excel file...');
        const response = await fetch('/cleaned_dataset_203.xlsx');
        console.log('Excel file fetched:', response);
        const arrayBuffer = await response.arrayBuffer();
        console.log('Array buffer created');
        const workbook = XLSX.read(arrayBuffer);
        console.log('Workbook read:', workbook.SheetNames);
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);
        console.log('Raw data from Excel:', data);
        
        const therapistsData = data.map((row: any) => {
          // Log the raw row data
          console.log('Processing row:', row);
          
          // Extract coordinates from the address using Google Maps Geocoding
          const address = row.Address || '';
          const name = row.Name || '';
          console.log(`Processing therapist: ${name}, Address: ${address}`);
          
          return {
            name: name,
            address: address,
            qualifications: row['Qualification(s)'] || '',
            phone: row.Phone || '',
            email: row.Email || '',
            kmcRegistration: row['KMC Registration Details'] || '',
            lat: 0,
            lng: 0
          };
        });
        
        console.log('Initial therapists data:', therapistsData);
        
        // Geocode addresses to get coordinates
        const geocoder = new google.maps.Geocoder();
        const geocodedTherapists = await Promise.all(
          therapistsData.map(async (therapist) => {
            if (!therapist.address) {
              console.log(`Skipping geocoding for ${therapist.name} - no address`);
              return therapist;
            }
            
            try {
              const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ 
                  address: therapist.address,
                  region: 'IN' // Specify India as the region
                }, (results, status) => {
                  if (status === google.maps.GeocoderStatus.OK && results) {
                    resolve(results);
                  } else {
                    console.error(`Geocoding failed for ${therapist.name}: ${status}`);
                    reject(new Error(`Geocoding failed: ${status}`));
                  }
                });
              });
              
              if (result && result[0] && result[0].geometry && result[0].geometry.location) {
                const location = result[0].geometry.location;
                console.log(`Successfully geocoded ${therapist.name}:`, {
                  address: therapist.address,
                  lat: location.lat(),
                  lng: location.lng()
                });
                
                return {
                  ...therapist,
                  lat: location.lat(),
                  lng: location.lng()
                };
              }
            } catch (error) {
              console.error(`Error geocoding address for ${therapist.name}:`, error);
            }
            
            return therapist;
          })
        );
        
        // Filter out therapists with invalid coordinates
        const validTherapists = geocodedTherapists.filter(t => t.lat !== 0 && t.lng !== 0);
        console.log(`Found ${validTherapists.length} valid locations out of ${geocodedTherapists.length} total`);
        console.log('Final geocoded therapists data:', validTherapists);
        
        setTherapists(validTherapists);
      } catch (error) {
        console.error('Error loading Excel file:', error);
      }
    };

    loadData();
  }, []);

  // Get current location immediately when app loads
  useEffect(() => {
    handleSetCurrentLocation();
  }, []);

  // Add a new function to center map on current location
  const centerMapOnCurrentLocation = useCallback(() => {
    if (map && currentLocation) {
      map.setCenter(currentLocation);
      map.setZoom(15);
    }
  }, [map, currentLocation]);

  // Update the handleSetCurrentLocation function
  const handleSetCurrentLocation = () => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      // Clear any existing watch
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      // Clear previous markers and routes
      if (accuracyCircle) {
        accuracyCircle.setMap(null);
      }
      if (destinationMarker) {
        destinationMarker.setMap(null);
      }
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      setDirections(null);

      // Get fresh position with better error handling
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const location = new google.maps.LatLng(pos.lat, pos.lng);
          setCurrentLocation(location);
          
          if (map) {
            map.setCenter(pos);
            map.setZoom(15);
            
            // Add new accuracy circle
            const circle = new google.maps.Circle({
              strokeColor: '#4285F4',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#4285F4',
              fillOpacity: 0.1,
              map: map,
              center: pos,
              radius: position.coords.accuracy
            });
            
            setAccuracyCircle(circle);

            // If we have a destination, update directions
            if (destinationLocation) {
              const directionsService = new google.maps.DirectionsService();
              directionsService.route(
                {
                  origin: location,
                  destination: destinationLocation,
                  travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK) {
                    const renderer = new google.maps.DirectionsRenderer({
                      map: map,
                      directions: result,
                      suppressMarkers: true,
                      preserveViewport: true
                    });
                    setDirectionsRenderer(renderer);
                    setDirections(result);
                  }
                }
              );
            }
          }

          console.log('Location updated successfully:', {
            position: pos,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Error getting location: ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }
          alert(errorMessage);
        },
        options
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Update the handleMarkerClick function
  const handleMarkerClick = (therapist: Therapist) => {
    console.log('Clicked marker:', therapist);
    setSelectedTherapist(therapist);
    setDestination(therapist.address);
    
    if (map && currentLocation) {
      // Keep the map centered on current location
      centerMapOnCurrentLocation();
      
      // Clear previous routes and markers
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      if (destinationMarker) {
        destinationMarker.setMap(null);
      }
      setDirections(null);
      
      // If we have current location, show directions immediately
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: currentLocation,
          destination: { lat: therapist.lat, lng: therapist.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            const renderer = new google.maps.DirectionsRenderer({
              map: map,
              directions: result,
              suppressMarkers: true,
              preserveViewport: true
            });
            setDirectionsRenderer(renderer);
            setDirections(result);
            
            // Set destination location and marker
            const location = new google.maps.LatLng(therapist.lat, therapist.lng);
            setDestinationLocation(location);
            
            // Add destination marker
            const marker = new google.maps.Marker({
              position: { lat: therapist.lat, lng: therapist.lng },
              map: map,
              title: therapist.name,
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }
            });
            
            setDestinationMarker(marker);
          }
        }
      );
    }
  };

  // Update the handleSetDestination function
  const handleSetDestination = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        setDestinationLocation(location);
        setDestination(selectedTherapist?.address || place.formatted_address || '');
        
        if (map && currentLocation) {
          // Keep the map centered on current location
          centerMapOnCurrentLocation();
          
          // Clear previous destination marker
          if (destinationMarker) {
            destinationMarker.setMap(null);
          }

          // Add destination marker
          const marker = new google.maps.Marker({
            position: { lat: location.lat(), lng: location.lng() },
            map: map,
            title: selectedTherapist?.name || 'Destination',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          });
          
          setDestinationMarker(marker);

          // Show directions without changing the map center
          const directionsService = new google.maps.DirectionsService();
          directionsService.route(
            {
              origin: currentLocation,
              destination: location,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK) {
                const renderer = new google.maps.DirectionsRenderer({
                  map: map,
                  directions: result,
                  suppressMarkers: true,
                  preserveViewport: true
                });
                setDirectionsRenderer(renderer);
                setDirections(result);
              }
            }
          );
        }
        console.log('Destination set:', selectedTherapist?.address || place.formatted_address);
      } else {
        console.error('No location found for the selected place');
        alert('Could not find location for the selected address. Please try another address.');
      }
    }
  };

  // Update the handleToggleMarkers function
  const handleToggleMarkers = () => {
    if (map) {
      const newShowMarkers = !showMarkers;
      setShowMarkers(newShowMarkers);
      setShowLocationOptions(newShowMarkers);
      
      // If hiding markers, clear any selected therapist
      if (!newShowMarkers) {
        setSelectedTherapist(null);
        setShowLocationOptions(false);
        setShowSetDestination(false);
      }

      // Always center on current location
      centerMapOnCurrentLocation();
    }
  };

  // Add a new effect to center map on current location when it changes
  useEffect(() => {
    if (currentLocation) {
      centerMapOnCurrentLocation();
    }
  }, [currentLocation, centerMapOnCurrentLocation]);

  // Update the onMapLoad function
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Get current location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const location = new google.maps.LatLng(pos.lat, pos.lng);
          setCurrentLocation(location);
          map.setCenter(pos);
          map.setZoom(15);
        },
        (error) => {
          console.error('Error getting initial location:', error);
          // Fallback to Bangalore center if location access fails
          map.setCenter(center);
          map.setZoom(11);
        }
      );
    }
  }, []);

  // Add effect to handle map bounds when therapists data changes
  useEffect(() => {
    if (map && therapists.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      // Always include Bangalore center
      bounds.extend(center);
      therapists.forEach(therapist => {
        if (therapist.lat !== 0 && therapist.lng !== 0) {
          bounds.extend({ lat: therapist.lat, lng: therapist.lng });
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    }
  }, [map, therapists]);

  const onDestinationSelect = () => {
    if (autocomplete && currentLocation) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: currentLocation,
            destination: place.geometry.location!,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              setDirections(result);
            }
          }
        );
      }
    }
  };

  return (
    <div className="app">
      <div className="controls">
        <div className="toggle-group">
          <button onClick={handleToggleMarkers}>
            {showMarkers ? 'Hide Markers' : 'Show Markers'}
          </button>
        </div>
        
        {showLocationOptions && (
          <div className="location-controls">
            <div className="location-input-group">
              <input
                type="text"
                placeholder="Enter destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => {
                  if (!autocomplete) {
                    const input = document.getElementById('destination-input') as HTMLInputElement;
                    const newAutocomplete = new google.maps.places.Autocomplete(input, {
                      types: ['address'],
                      componentRestrictions: { country: 'in' }
                    });
                    setAutocomplete(newAutocomplete);
                  }
                }}
                id="destination-input"
              />
              <button onClick={handleSetDestination}>Set Destination</button>
            </div>
            <button onClick={handleSetCurrentLocation}>Refresh Current Location</button>
          </div>
        )}

        <div className="info">
          {therapists.length > 0 && (
            <p>Found {therapists.length} therapist locations</p>
          )}
          {currentLocation && (
            <p>Current Location: {currentLocation.lat().toFixed(4)}, {currentLocation.lng().toFixed(4)}</p>
          )}
          {destination && (
            <p>Destination: {destination}</p>
          )}
        </div>
      </div>

      <LoadScript
        googleMapsApiKey="AIzaSyCzfl-DyH7Md1I9DU8yWVOqeFl_MY_6paY"
        libraries={libraries}
        onError={(error) => console.error('Error loading Google Maps:', error)}
        onLoad={() => console.log('Google Maps loaded successfully')}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={11}
          onLoad={onMapLoad}
          options={{
            minZoom: 8,
            maxZoom: 18,
            gestureHandling: 'greedy',
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          }}
        >
          {showMarkers && therapists.map((therapist, index) => (
            therapist.lat !== 0 && therapist.lng !== 0 && (
              <Marker
                key={`therapist-${index}`}
                position={{ lat: therapist.lat, lng: therapist.lng }}
                title={therapist.name}
                label={{
                  text: (index + 1).toString(),
                  color: 'white',
                  fontWeight: 'bold'
                }}
                onClick={() => handleMarkerClick(therapist)}
                animation={google.maps.Animation.DROP}
              />
            )
          ))}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }}
              animation={google.maps.Animation.BOUNCE}
            />
          )}
          {directions && <DirectionsRenderer directions={directions} />}
          
          {selectedTherapist && (
            <InfoWindow
              position={{ lat: selectedTherapist.lat, lng: selectedTherapist.lng }}
              onCloseClick={() => setSelectedTherapist(null)}
            >
              <div className="info-window">
                <h3>{selectedTherapist.name}</h3>
                <p><strong>Address:</strong> {selectedTherapist.address}</p>
                {selectedTherapist.qualifications && (
                  <p><strong>Qualifications:</strong> {selectedTherapist.qualifications}</p>
                )}
                {selectedTherapist.kmcRegistration && (
                  <p><strong>KMC Registration:</strong> {selectedTherapist.kmcRegistration}</p>
                )}
                {selectedTherapist.phone && (
                  <p><strong>Phone:</strong> {selectedTherapist.phone}</p>
                )}
                {selectedTherapist.email && (
                  <p><strong>Email:</strong> {selectedTherapist.email}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default App; 