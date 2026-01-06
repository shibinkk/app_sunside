import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Dimensions, Text, Alert, Linking, Platform, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Custom Uber-like Silver/Grey theme
const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

export default function HomeScreen() {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [destination, setDestination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [heading, setHeading] = useState(0);
  const mapRef = useRef<MapView>(null);

  const getLocation = async () => {
    try {
      // 1. Check if location services are enabled
      let enabled = await Location.hasServicesEnabledAsync();

      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'For a better experience, please turn on device location and accuracy.',
          [
            { text: 'No, thanks', style: 'cancel' },
            {
              text: 'Turn on',
              onPress: async () => {
                if (Platform.OS === 'android') {
                  // This often triggers the system accuracy dialog
                  try {
                    await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                  } catch (e) {
                    Linking.openSettings();
                  }
                } else {
                  Linking.openSettings();
                }
              }
            },
          ]
        );
        return;
      }

      // 2. Request permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert(
          'Permission Denied',
          'We need location permission to show your position on the map.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // 3. Get current position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);

      // Animate to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      setErrorMsg('Error getting location: ' + error.message);

      if (error.message.includes('unsatisfied device settings')) {
        Alert.alert(
          'Location Error',
          'Location request failed. Please ensure GPS is turned on and try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const getRoute = async (destCoords: { latitude: number, longitude: number }) => {
    if (!location) return;

    try {
      const startLoc = `${location.coords.longitude},${location.coords.latitude}`;
      const endLoc = `${destCoords.longitude},${destCoords.latitude}`;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLoc};${endLoc}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((coord: any) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coords);
        setDestination(destCoords);

        // Fit map to show the whole route
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const searchPlaces = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error searching places:', error);
    }
  };

  const handleSelectPlace = (feature: any) => {
    const [lon, lat] = feature.geometry.coordinates;
    const destCoords = { latitude: lat, longitude: lon };

    setSuggestions([]);
    setSearchQuery(feature.properties.name || feature.properties.city || 'Selected Place');

    // Set destination marker only
    setDestination(destCoords);
    setRouteCoordinates([]); // Clear any existing routes

    // Animate to found place
    mapRef.current?.animateToRegion({
      ...destCoords,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const resetOrientation = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({
        heading: 0,
        pitch: 0,
      }, { duration: 1000 });
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapStyle}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={async () => {
          if (mapRef.current) {
            const camera = await mapRef.current.getCamera();
            setHeading(camera.heading || 0);
          }
        }}
      >
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#000"
            strokeWidth={4}
          />
        )}
        {destination && (
          <Marker coordinate={destination} title="Destination" />
        )}
      </MapView>

      {/* Header Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TouchableOpacity style={styles.searchIcon}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#000000ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="11" cy="11" r="8" />
              <Path d="M21 21l-4.35-4.35" />
            </Svg>
          </TouchableOpacity>

          <TextInput
            placeholder="Search here"
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={searchPlaces}
          />
          <TouchableOpacity style={styles.voiceButton}>
            <MaterialIcons name="mic-none" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => handleSelectPlace(item)}
                >
                  <Ionicons name="location-sharp" size={20} color="#666" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>
                      {item.properties.name || item.properties.city || item.properties.street}
                    </Text>
                    <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                      {[item.properties.city, item.properties.state, item.properties.country]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Floating Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity style={styles.floatingButton} onPress={resetOrientation}>
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width="44" height="44" viewBox="0 0 100 100">
              {/* Outer Dial Circle */}
              <Circle cx="50" cy="50" r="45" stroke="#000" strokeWidth="2" fill="none" />
              <Circle cx="50" cy="50" r="40" stroke="#F0F0F0" strokeWidth="1" fill="none" />

              {/* Cardinal Points */}
              <SvgText x="50" y="18" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">N</SvgText>
              <SvgText x="50" y="90" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">S</SvgText>
              <SvgText x="85" y="55" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">E</SvgText>
              <SvgText x="15" y="55" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">W</SvgText>

              {/* Rotating Needle Group */}
              <G transform={`rotate(${-heading}, 50, 50)`}>
                {/* Top Needle (Red) */}
                <Path d="M50 20 L60 50 L40 50 Z" fill="#FF0000" />
                {/* Bottom Needle (Black) */}
                <Path d="M50 80 L60 50 L40 50 Z" fill="#000000" />
                {/* Center Pivot */}
                <Circle cx="50" cy="50" r="5" fill="#FFF" stroke="#000" strokeWidth="1" />
              </G>
            </Svg>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={getLocation}>
          <Ionicons name="locate" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton}>
          <Ionicons name="cloud-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 55,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 10,
    padding: 10,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  voiceButton: {
    width: 38,
    height: 38,
    backgroundColor: '#101010ff',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 120, // Space for Bottom Tab Bar
    right: 20,
    gap: 15,
  },
  floatingButton: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});
