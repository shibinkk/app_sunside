import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Dimensions, Text, Alert, Linking, Platform, ScrollView, Animated, Keyboard } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Text as SvgText, Rect } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { analyzeSunExposure } from '../../utils/sunPath';

const { width, height } = Dimensions.get('window');
const AnimatedG = Animated.createAnimatedComponent(G);

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
  const [sunStats, setSunStats] = useState<any>(null);
  const [source, setSource] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [boundary, setBoundary] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [markerTracksViewChanges, setMarkerTracksViewChanges] = useState(true);
  const animatedHeading = useRef(new Animated.Value(0)).current;
  const locateScale = useRef(new Animated.Value(1)).current;
  const weatherScale = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);
  const loadingSpin = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (isLocating) {
      Animated.loop(
        Animated.timing(loadingSpin, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingSpin.setValue(0);
    }
  }, [isLocating]);

  useEffect(() => {
    if (source || destination) {
      setMarkerTracksViewChanges(true); // Allow render
      const timer = setTimeout(() => {
        setMarkerTracksViewChanges(false); // Stop updates (freeze)
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [source, destination]);

  const spin = loadingSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setBoundary(null);
    setSource(null);
    setDestination(null);
    setRouteCoordinates([]);
  };

  const getLocation = async () => {
    // Trigger animation
    Animated.sequence([
      Animated.timing(locateScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(locateScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      setIsLocating(true);

      // 1. Request permissions (usually fast if already granted)
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        setErrorMsg('Permission to access location was denied');
        Alert.alert('Permission Denied', 'We need location permission to show your position.');
        return;
      }

      // 2. Try to get last known position first (instant)
      let lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown && mapRef.current) {
        setLocation(lastKnown);
        mapRef.current.animateToRegion({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          latitudeDelta: 0.010,
          longitudeDelta: 0.010,
        }, 600); // Faster animation for instant feel
      }

      // 3. Get fresh high-accuracy position in background
      let freshLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balanced is faster than High
      });

      setLocation(freshLocation);
      if (mapRef.current && !lastKnown) { // Only animate if we didn't already
        mapRef.current.animateToRegion({
          latitude: freshLocation.coords.latitude,
          longitude: freshLocation.coords.longitude,
          latitudeDelta: 0.15, // Reduced zoom (increased delta)
          longitudeDelta: 0.15,
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
    } finally {
      setIsLocating(false);
    }
  };

  const getRoute = async (start: { latitude: number, longitude: number }, end: { latitude: number, longitude: number }) => {
    try {
      const startLoc = `${start.longitude},${start.latitude}`;
      const endLoc = `${end.longitude},${end.latitude}`;

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

        // Calculate Sun Exposure
        const tripDate = params.tripDate ? new Date(params.tripDate as string) : new Date();
        const analysis = analyzeSunExposure(coords, tripDate);
        setSunStats(analysis);

        setSource(start);
        setDestination(end);

        // Fit map to show the whole route
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 150, right: 80, bottom: 150, left: 80 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert("Route Error", "Could not calculate the route. Please try again.");
    }
  };

  const searchPlaces = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Prioritize Kerala/India by using a location bias
      const biasLon = 76.2711;
      const biasLat = 10.8505;

      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=15&lat=${biasLat}&lon=${biasLon}`);
      const data = await response.json();

      let features = data.features || [];

      // Sort to prioritize cities and major places
      features.sort((a: any, b: any) => {
        const priorityOrder = ['city', 'town', 'municipality', 'village', 'state', 'district'];
        const typeA = a.properties.osm_value;
        const typeB = b.properties.osm_value;

        const idxA = priorityOrder.indexOf(typeA);
        const idxB = priorityOrder.indexOf(typeB);

        // Calculate score: lower index is better. -1 means not in list (lowest priority)
        const scoreA = idxA !== -1 ? idxA : 999;
        const scoreB = idxB !== -1 ? idxB : 999;

        return scoreA - scoreB;
      });

      setSuggestions(features.slice(0, 5));
    } catch (error) {
      console.error('Error searching places:', error);
    }
  };

  const handleSelectPlace = async (feature: any) => {
    const [lon, lat] = feature.geometry.coordinates;
    const destCoords = { latitude: lat, longitude: lon };

    setSuggestions([]);

    // Reset current selection states
    setBoundary(null);
    setSource(null);
    setDestination(null);
    setRouteCoordinates([]);

    const osmId = feature.properties.osm_id;
    const osmType = feature.properties.osm_type;
    const name = feature.properties.name;
    const city = feature.properties.city;
    const state = feature.properties.state;
    const country = feature.properties.country;

    // Choose the best display name: prefer city name if it's a city search
    const displayName = name || city || 'Selected Place';
    setSearchQuery(displayName);

    const isPlace = feature.properties.osm_key === 'place' ||
      ['city', 'town', 'village', 'state', 'country', 'administrative'].includes(feature.properties.osm_value);

    const tryFetchBoundary = async (id: any, type: string, queryName?: string) => {
      let url = '';
      try {
        if (id && type && type !== 'N' && type !== 'node') {
          const typeChar = type.charAt(0).toUpperCase();
          url = `https://nominatim.openstreetmap.org/lookup?osm_ids=${typeChar}${id}&format=json&polygon_geojson=1`;
        } else if (queryName) {
          url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryName)}&format=json&polygon_geojson=1&limit=3`;
        } else {
          return false;
        }

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (!response.ok) {
          console.warn(`Nominatim search failed status: ${response.status}`);
          return false;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Nominatim returned non-JSON response');
          return false;
        }

        const data = await response.json();
        let results = Array.isArray(data) ? data : [data];

        if (results.length === 0) return false;

        // Find the result that is a boundary/polygon
        const bestResult = results.find((r: any) =>
          r.geojson && (r.geojson.type === 'Polygon' || r.geojson.type === 'MultiPolygon')
        ) || results[0];

        if (bestResult && bestResult.geojson && (bestResult.geojson.type === 'Polygon' || bestResult.geojson.type === 'MultiPolygon')) {
          setBoundary(bestResult.geojson);
          if (bestResult.boundingbox && mapRef.current) {
            const bbox = bestResult.boundingbox;
            mapRef.current.fitToCoordinates([
              { latitude: parseFloat(bbox[0]), longitude: parseFloat(bbox[2]) },
              { latitude: parseFloat(bbox[1]), longitude: parseFloat(bbox[3]) }
            ], {
              edgePadding: { top: 100, right: 100, bottom: 120, left: 100 },
              animated: true,
            });
          }
          return true;
        }
        return false;
      } catch (error: any) {
        console.warn('Nominatim error suppressed:', error.message || error);
        return false;
      }
    };

    let boundaryFound = false;
    // 1. Try direct ID lookup if it's a relation/way
    if (osmId && (osmType === 'R' || osmType === 'relation' || osmType === 'W' || osmType === 'way')) {
      boundaryFound = await tryFetchBoundary(osmId, osmType);
    }

    // 2. If no boundary and it's a place name, try searching for the boundary specifically
    if (!boundaryFound && isPlace && (name || city)) {
      const searchTerms = [name, city, state, country].filter(Boolean).join(', ');
      boundaryFound = await tryFetchBoundary(null, 'N', searchTerms);
    }

    if (!boundaryFound) {
      // Fallback to marker
      setDestination(destCoords);
      mapRef.current?.animateToRegion({
        ...destCoords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }

    // Hide keyboard
    Keyboard.dismiss();
  };

  const handleWeatherPress = () => {
    Animated.sequence([
      Animated.timing(weatherScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(weatherScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Optional: Add weather logic here later
    Alert.alert("Weather", "Checking daily forecast...");
  };

  const updateHeading = async () => {
    if (mapRef.current) {
      const camera = await mapRef.current.getCamera();
      const newHeading = camera.heading || 0;

      Animated.spring(animatedHeading, {
        toValue: -newHeading,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    }
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

  useEffect(() => {
    if (params.selectedPlace) {
      try {
        const feature = JSON.parse(params.selectedPlace as string);
        handleSelectPlace(feature);
      } catch (e) {
        console.error("Error parsing selected place:", e);
      }
    }
  }, [params.selectedPlace]);

  useEffect(() => {
    if (params.routeSource && params.routeDest) {
      try {
        const start = JSON.parse(params.routeSource as string);
        const end = JSON.parse(params.routeDest as string);
        if (start && end) {
          getRoute(start, end);
        }
      } catch (e) {
        console.error("Error parsing route params:", e);
      }
    }
  }, [params.routeSource, params.routeDest]);

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
        showsCompass={false}
        onRegionChange={updateHeading}
      >
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#000"
            strokeWidth={4}
          />
        )}
        {source && (
          <Marker
            coordinate={source}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={markerTracksViewChanges}
          >
            <View style={{
              width: 20,
              height: 20,
              backgroundColor: '#FFFFFF',
              borderWidth: 5,
              borderColor: '#000000',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 5
            }} />
          </Marker>
        )}

        {destination && (
          <Marker
            coordinate={destination}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={markerTracksViewChanges}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              borderWidth: 5,
              borderColor: '#000000',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 5
            }} />
          </Marker>
        )}

        {boundary && boundary.type === 'Polygon' && (
          <Polygon
            coordinates={boundary.coordinates[0].map((coord: any) => ({
              latitude: coord[1],
              longitude: coord[0],
            }))}
            strokeColor="#ff4444"
            fillColor="rgba(255, 68, 68, 0.08)"
            strokeWidth={2}
            lineDashPattern={[5, 5]}
          />
        )}

        {boundary && boundary.type === 'MultiPolygon' && (
          boundary.coordinates.map((polygon: any, index: number) => (
            <Polygon
              key={index}
              coordinates={polygon[0].map((coord: any) => ({
                latitude: coord[1],
                longitude: coord[0],
              }))}
              strokeColor="#ff4444"
              fillColor="rgba(255, 68, 68, 0.08)"
              strokeWidth={2}
              lineDashPattern={[5, 5]}
            />
          ))
        )}
      </MapView>

      {/* Header Search Bar Trigger */}
      <View style={styles.searchContainer}>
        {/* ... existing search bar ... */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => router.push('/search')}
        >
          <View style={styles.searchIcon}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#000000ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="11" cy="11" r="8" />
              <Path d="M21 21l-4.35-4.35" />
            </Svg>
          </View>
          <Text style={[styles.searchInput, { color: searchQuery ? '#000' : '#999' }]}>
            {searchQuery || "Search here"}
          </Text>
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={(e) => {
              if (searchQuery.length > 0) {
                e.stopPropagation();
                clearSearch();
                setSunStats(null); // Clear stats on reset
              }
            }}
          >
            {searchQuery.length > 0 ? (
              <Ionicons name="close" size={24} color="#FFF" />
            ) : (
              <MaterialIcons name="mic-none" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Sun Stats Bottom Sheet */}
      {sunStats && (
        <Animated.View style={styles.sunStatsCard}>
          <View style={styles.sunStatsHeader}>
            <View>
              <Text style={styles.sunStatsTitle}>Trip Analysis</Text>
              <Text style={styles.sunStatsSubtitle}>Best side to avoid sun</Text>
            </View>
            <View style={styles.bestSideBadge}>
              <Text style={styles.bestSideText}>{sunStats.bestSide === 'Left' ? 'LEFT' : sunStats.bestSide === 'Right' ? 'RIGHT' : 'ANY'}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="resize" size={20} color="#666" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{sunStats.totalDistance} km</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="sunny" size={20} color="#FFA500" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.statLabel}>Sun Exposure</Text>
                <Text style={styles.statValue}>{sunStats.sunExposurePercentage}%</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Floating Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity style={styles.floatingButton} onPress={resetOrientation}>
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            {/* Background Dial */}
            <Svg width="44" height="44" viewBox="0 0 100 100" pointerEvents="none">
              <Circle cx="50" cy="50" r="45" stroke="#000" strokeWidth="2" fill="none" />
              <Circle cx="50" cy="50" r="40" stroke="#F0F0F0" strokeWidth="1" fill="none" />
              <SvgText x="50" y="18" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">N</SvgText>
              <SvgText x="50" y="90" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">S</SvgText>
              <SvgText x="85" y="55" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">E</SvgText>
              <SvgText x="15" y="55" fill="#000" fontSize="12" fontWeight="bold" textAnchor="middle">W</SvgText>
            </Svg>

            {/* Rotating Needle */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{
                  rotate: animatedHeading.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg']
                  })
                }]
              }}
            >
              <Svg width="44" height="44" viewBox="0 0 100 100">
                <Path d="M50 20 L60 50 L40 50 Z" fill="#FF0000" />
                <Path d="M50 80 L60 50 L40 50 Z" fill="#000000" />
                <Circle cx="50" cy="50" r="5" fill="#FFF" stroke="#000" strokeWidth="1" />
              </Svg>
            </Animated.View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={getLocation}>
          <Animated.View style={{ transform: [{ scale: locateScale }] }}>
            {isLocating ? (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Svg width="28" height="28" viewBox="0 0 24 24">
                  {/* Rotating Gradient-like Dash */}
                  <Circle cx="12" cy="12" r="9" stroke="#E0E0E0" strokeWidth="2" fill="none" />
                  <Path
                    d="M12 3 A9 9 0 0 1 21 12"
                    stroke="#FF0000"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Circle cx="12" cy="12" r="3" fill="#FF0000" />
                </Svg>
              </Animated.View>
            ) : (
              <Svg width="30" height="30" viewBox="0 0 24 24">
                {/* Outer Ring */}
                <Circle cx="12" cy="12" r="8" stroke="#000" strokeWidth="1.5" fill="none" />

                {/* Crosshairs */}
                <Path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

                {/* Red Center Stroke Circle */}
                <Circle cx="12" cy="12" r="3.5" stroke="#FF0000" strokeWidth="1.5" fill="none" />
              </Svg>
            )}
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={handleWeatherPress}>
          <Animated.View style={{ transform: [{ scale: weatherScale }] }}>
            <Svg width="32" height="32" viewBox="418 21 700 700">
              <Path d="M951.67623,202.67175c18.92595,22.92704 27.906,52.46677 24.94001,82.04813c-2.93042,30.60986 -18.01756,56.77238 -41.57581,76.16102c-1.91258,-2.04856 -3.72937,-4.46841 -5.80337,-6.65869c-6.55308,-6.95804 -14.02551,-12.98878 -22.20934,-17.92562c-11.407,-6.85215 -24.03161,-11.43273 -37.17607,-13.48922c-5.47503,-0.80853 -10.00062,-0.99268 -15.50577,-1.33032c-1.96456,-5.52675 -3.06995,-9.10974 -5.52154,-14.68876c-13.53301,-30.81699 -36.24305,-56.70809 -65.03283,-74.14119c-4.80469,-2.89265 -12.44127,-7.11372 -17.61533,-9.1278c20.08334,-37.349 52.51494,-58.71094 94.98274,-61.23779c5.39296,-0.12943 10.13743,-0.06539 15.53584,0.44764c29.27681,2.92276 56.21968,17.2755 74.98147,39.9426z" fill="#f90d0d" />
              <Path d="M607.80038,586.60892h29.97563l17.50918,-0.00273c6.46471,0.00547 14.33087,-0.75244 19.5777,3.63635c3.13372,2.64038 5.07146,6.42995 5.37572,10.51776c0.7445,9.79542 -6.33392,15.87514 -15.56705,16.62485c-15.99143,0.30097 -33.00071,0.04104 -49.07504,0.04104h-15.43682c-6.67511,-0.00273 -13.13599,0.85915 -18.60829,-3.58982c-3.16792,-2.54188 -5.16312,-6.26305 -5.52511,-10.30709c-0.38798,-4.32586 1.02715,-8.61888 3.91132,-11.86394c3.46589,-3.87439 7.23794,-4.66239 12.08394,-5.01262c5.00797,-0.17784 10.68877,-0.0438 15.77883,-0.0438z" fill="#000000" />
              <Path d="M666.42077,532.81349c6.8661,0.43232 16.08884,-0.79895 22.77325,0.52807c2.03926,0.41043 3.97288,1.23127 5.68162,2.41875c3.38844,2.31751 5.65726,5.94566 6.26141,10.0061c0.63971,4.05771 -0.36937,8.20025 -2.80236,11.50552c-2.69374,3.6254 -6.18371,5.51882 -10.61682,6.22747c-4.63942,0.22984 -24.82618,0.46241 -28.53586,-0.29277c-2.13803,-0.42957 -4.16113,-1.30789 -5.93662,-2.57472c-3.40843,-2.4297 -5.5035,-5.9265 -6.1142,-10.0745c-0.58444,-4.2 0.53847,-8.45744 3.11702,-11.82291c2.86529,-3.76221 6.40479,-5.20963 10.91067,-5.73224c1.52759,-0.1368 3.74278,-0.28453 5.26189,-0.18877z" fill="#000000" />
              <Path d="M998.04301,149.62789c1.08899,3.18242 1.05068,7.14736 -0.53354,10.16643c-2.00834,3.82514 -21.21884,23.07587 -24.95916,25.72557c-1.75661,1.24358 -3.60624,1.82036 -5.63647,2.43764c-3.30254,0.32697 -6.61601,-0.48156 -9.39593,-2.29235c-2.99608,-1.97057 -5.0783,-5.05969 -5.77875,-8.57674c-0.62383,-3.11374 -0.05473,-7.79229 2.28468,-10.46604c7.11673,-8.13485 16.14602,-17.29794 24.42289,-24.25762c1.04521,-0.88076 3.87712,-1.48655 5.16586,-1.71118c2.6267,-0.13572 4.76909,0.03857 7.2371,1.13522c3.38189,1.50022 5.98942,4.34034 7.19332,7.83907z" fill="#f90d0d" />
              <Path d="M752.6366,142.20117c5.80311,4.99702 25.08339,22.04872 26.89745,28.43298c1.01512,3.53894 0.53901,7.33835 -1.31609,10.51831c-2.41603,4.11873 -5.68026,5.66849 -10.00884,6.83709c-3.29979,0.11629 -6.40806,-0.29442 -9.09771,-2.39113c-4.40547,-3.63525 -8.91165,-8.05523 -12.83391,-12.22648c-4.35294,-4.62984 -12.31677,-10.63049 -13.3286,-16.99368c-0.60661,-3.70804 0.32232,-7.50334 2.57254,-10.51229c2.44913,-3.27024 5.38666,-4.64571 9.28732,-5.23645c2.15882,-0.05008 6.3473,0.2966 7.82784,1.57165z" fill="#f90d0d" />
              <Path d="M988.15457,376.75987c3.31621,2.75256 9.2646,8.98278 10.30161,13.09249c0.8701,3.58162 0.2271,7.36572 -1.7785,10.46031c-2.26828,3.48585 -5.26983,5.2753 -9.21535,6.17276c-2.74436,0.60196 -6.03321,-0.07662 -8.47933,-1.40364c-3.37914,-1.83323 -21.59371,-20.1244 -24.45845,-23.77714c-1.2176,-1.5514 -2.19713,-3.18761 -2.68963,-5.11661c-0.88377,-3.61718 -0.25721,-7.43959 1.73746,-10.58617c2.18071,-3.46889 4.95791,-5.1497 8.82136,-6.05701c11.64232,-1.6354 17.73571,10.54974 25.76083,17.21501z" fill="#f90d0d" />
              <Path d="M1024.70681,259.9306c3.37367,-0.00519 9.47255,-0.171 12.54798,0.50864c2.10684,0.44982 4.08234,1.38038 5.77055,2.71918c2.77173,2.25952 4.53654,5.52375 4.90591,9.07991c0.59374,5.51635 -2.71972,11.05323 -7.5682,13.49442c-2.19166,1.10403 -3.83335,1.21786 -6.19191,1.41869c-5.39296,0.13325 -11.03216,0.04625 -16.46068,0.07716c-4.6323,-0.13736 -9.56832,0.3992 -14.12128,-0.50317c-5.71582,-1.13167 -9.98695,-5.86932 -10.5588,-11.58513c-0.38854,-3.80078 0.79622,-7.59528 3.28065,-10.49862c3.08637,-3.59038 6.44637,-4.36389 10.84885,-4.67115z" fill="#f90d0d" />
              <Path d="M656.53287,249.0711c31.1943,-12.20461 65.96776,-11.46693 96.61622,2.04992c32.22392,14.33332 57.42113,40.8956 70.03752,73.82873c3.74579,9.72265 6.35882,19.84421 7.79257,30.16469c5.89366,-1.30296 10.47125,-2.36322 16.51541,-2.86721c15.97365,-1.19049 31.90625,2.80619 45.42831,11.39606c16.20622,10.312 27.62417,26.67144 31.71471,45.44144c9.31933,43.25034 -21.66758,86.43773 -64.02592,95.43966c-8.44102,1.79217 -19.36647,2.01382 -28.10573,2.39413l-25.7335,1.22307c-58.3402,2.60481 -116.75948,2.91673 -175.12348,0.93577l-31.61758,-1.19843c-9.03805,-0.32014 -22.72839,-0.70865 -31.36832,-2.1342c-13.01586,-2.14515 -25.41938,-7.05927 -36.37274,-14.4113c-20.83981,-13.8504 -36.68097,-36.56319 -41.99216,-61.19948c-0.42636,-1.97823 -1.64157,-10.34812 -2.29818,-11.39059v-18.4827c1.19124,-2.75531 1.34674,-6.88141 2.02344,-9.88846c0.67868,-3.01524 1.43532,-5.85262 2.40179,-8.78852c7.70207,-23.21788 24.70957,-42.1898 46.95147,-52.37429c14.147,-6.46114 28.2866,-8.82354 43.75461,-8.02321c14.52076,-33.15229 39.44977,-58.84995 73.40156,-72.11508z" fill="#000000" />
              <Path d="M823.32341,651.38182l-0.51167,-0.19153c-1.52404,-0.54996 -4.15074,-1.04795 -5.73224,-1.37354c-18.0586,-3.69928 -34.0979,-17.12557 -41.22011,-34.0897c-1.45017,-3.45576 -2.82371,-6.97718 -2.49263,-10.8461c0.39126,-5.37654 3.70748,-10.40285 8.63255,-12.63827c3.78683,-1.7101 8.09626,-1.8469 11.9816,-0.37759c8.94721,3.40925 8.18383,10.1347 12.81613,16.69872c13.1308,18.60856 41.62232,14.92297 49.98673,-6.09889c2.71427,-6.78292 2.45432,-15.30329 -0.53354,-21.94941c-3.16572,-7.07022 -9.0594,-12.5562 -16.3403,-15.20479c-7.18513,-2.6185 -28.60372,-1.67999 -37.43601,-1.67999l-56.12229,0.01095c-6.13718,0 -16.09293,0.71413 -22.00468,-0.61563c-13.55873,-3.05081 -15.24912,-23.10405 -2.63901,-28.63654c5.69912,-2.50085 18.3976,-1.5596 25.26069,-1.55413l34.1633,-0.00547l32.35771,-0.01095c13.05143,-0.0082 24.63357,-0.79347 37.12409,4.05223c14.80804,5.68026 26.71851,17.06812 33.05544,31.60802c6.25211,14.39216 6.55035,30.67498 0.82906,45.28603c-5.88546,14.85457 -17.47033,26.7404 -32.16893,33.00346c-2.56103,1.11088 -4.54748,1.81954 -7.21522,2.53094c-2.10684,0.56091 -6.78839,1.22852 -8.55048,2.08222z" fill="#000000" />
              <Path d="M866.0183,91.01819c10.59984,2.62715 13.98447,7.46066 13.34967,18.60319c-0.44052,7.70371 0.63205,16.54074 -0.13955,24.13959c-0.14502,1.56343 -0.52261,3.09649 -1.1273,4.54666c-3.15477,7.41935 -11.42617,10.11281 -18.60856,6.56868c-3.1329,-1.5585 -5.48598,-4.33871 -6.50382,-7.68612c-1.40638,-4.6914 -0.57185,-27.38383 -0.56365,-33.59361c0,-1.37184 1.00143,-4.39478 1.76481,-5.64525c2.79909,-4.58688 6.25211,-5.61397 10.97743,-6.93314z" fill="#f90d0d" />
            </Svg>
          </Animated.View>
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
    bottom: 240, // Increase bottom margin to clear the new card
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
  sunStatsCard: {
    position: 'absolute',
    bottom: 95, // Above Tab Bar
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  sunStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sunStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  sunStatsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  bestSideBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bestSideText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 15,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});
