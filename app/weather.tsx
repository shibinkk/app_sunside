import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

// Weather icon mapping to Lottie files
const getWeatherLottieSource = (code: number) => {
    // Map weather codes to Lottie animation files
    if (code === 0) return require('../assets/lottie/weather/clear-day.json');
    if (code >= 1 && code <= 2) return require('../assets/lottie/weather/partly-cloudy-day.json');
    if (code === 3) return require('../assets/lottie/weather/cloudy.json');
    if (code === 45 || code === 48) return require('../assets/lottie/weather/fog.json');
    if (code >= 51 && code <= 55) return require('../assets/lottie/weather/drizzle.json');
    if (code >= 61 && code <= 65) return require('../assets/lottie/weather/rain.json');
    if (code >= 80 && code <= 82) return require('../assets/lottie/weather/extreme-rain.json');
    if (code >= 95) return require('../assets/lottie/weather/thunderstorms.json');
    return require('../assets/lottie/weather/overcast.json');
};

// Humidity and Wind Lottie sources
const humidityLottieSource = require('../assets/lottie/weather/humidity.json');
const windLottieSource = require('../assets/lottie/weather/wind.json');

export default function WeatherScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [weatherData, setWeatherData] = useState<any>(null);
    const [locationName, setLocationName] = useState({ city: 'Loading...', country: '' });

    const conditionMap: Record<number, string> = {
        0: 'Sunny',
        1: 'Clear',
        2: 'Partly Cloudy',
        3: 'Cloudy',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Drizzle',
        61: 'Rainy',
        80: 'Showers',
        95: 'Stormy'
    };

    const getWeatherCondition = (code: number) => conditionMap[code] || 'Cloudy';

    const fetchWeather = async () => {
        try {
            setLoading(true);
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationName({ city: 'Permission', country: 'Denied' });
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocode.length > 0) {
                setLocationName({
                    city: geocode[0].city || geocode[0].region || 'Unknown',
                    country: geocode[0].country || ''
                });
            }

            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`
            );
            const data = await response.json();
            setWeatherData(data);
        } catch (error) {
            console.error('Error fetching weather:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFB800" />
                <Text style={{ marginTop: 10, color: '#64748B', fontWeight: '600' }}>Fetching Weather...</Text>
            </View>
        );
    }

    const current = weatherData?.current;
    const hourly = weatherData?.hourly;

    const nextHours = hourly?.time.slice(0, 12).map((time: string, index: number) => {
        const date = new Date(time);
        return {
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            temp: `${Math.round(hourly.temperature_2m[index])}°`,
            weatherCode: hourly.weather_code[index],
        };
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="chevron-back" size={20} color="#0B132B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={fetchWeather} style={styles.headerBtn}>
                    <Ionicons name="reload" size={20} color="#0B132B" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <View style={styles.todayCard}>
                    <View style={styles.cardTopRow}>
                        <Text style={styles.cardTodayLabel}>Today</Text>
                        <Text style={styles.cardDateLabel}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })}</Text>
                    </View>

                    <View style={styles.mainWeatherRow}>
                        <View>
                            <Text style={styles.itConditionText}>It's {getWeatherCondition(current.weather_code)}</Text>
                            <View style={styles.tempContainer}>
                                <Text style={styles.bigTempText}>{Math.round(current.temperature_2m)}</Text>
                                <View style={styles.degWrap}>
                                    <Text style={styles.degText}>O</Text>
                                    <Text style={styles.cText}>C</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.iconWrap}>
                            <LottieView 
                                source={getWeatherLottieSource(current.weather_code)} 
                                autoPlay 
                                loop 
                                style={{ width: 100, height: 100 }} 
                            />
                        </View>
                    </View>

                    <View style={styles.locationContainer}>
                        <Ionicons name="location" size={14} color="#FFB800" />
                        <Text style={styles.locationText}>{locationName.city}, {locationName.country}</Text>
                    </View>
                </View>

                <View style={styles.miniStatsRow}>
                    <View style={styles.miniStatItem}>
                        <LottieView 
                            source={getWeatherLottieSource(current.weather_code)} 
                            autoPlay 
                            loop 
                            style={{ width: 26, height: 26 }} 
                        />
                        <Text style={styles.miniStatText}>{getWeatherCondition(current.weather_code)}</Text>
                    </View>
                    <View style={styles.miniStatItem}>
                        <LottieView 
                            source={windLottieSource} 
                            autoPlay 
                            loop 
                            style={{ width: 26, height: 26 }} 
                        />
                        <Text style={styles.miniStatText}>{Math.round(current.wind_speed_10m)}km/h</Text>
                    </View>
                    <View style={styles.miniStatItem}>
                        <LottieView 
                            source={humidityLottieSource} 
                            autoPlay 
                            loop 
                            style={{ width: 26, height: 26 }} 
                        />
                        <Text style={styles.miniStatText}>{current.relative_humidity_2m}%</Text>
                    </View>
                </View>

                <View style={styles.hourlyHeader}>
                    <Text style={styles.hourlyTitle}>Today</Text>
                    <TouchableOpacity style={styles.next15Btn}>
                        <Text style={styles.next15Text}>Next 15 days</Text>
                        <Ionicons name="chevron-forward" size={12} color="#FFB800" />
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyList}>
                    {nextHours.map((item: any, index: number) => (
                        <View key={index} style={styles.hourCard}>
                            <Text style={styles.hourTime}>{item.time}</Text>
                            <View style={{ marginVertical: 6 }}>
                                <LottieView 
                                    source={getWeatherLottieSource(item.weatherCode)} 
                                    autoPlay 
                                    loop 
                                    style={{ width: 28, height: 28 }} 
                                />
                            </View>
                            <Text style={styles.hourTemp}>{item.temp}</Text>
                        </View>
                    ))}
                </ScrollView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 18,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    todayCard: {
        margin: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTodayLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    cardDateLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    mainWeatherRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itConditionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    tempContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bigTempText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -2,
    },
    degWrap: {
        flexDirection: 'row',
        marginTop: 8,
        marginLeft: 2,
    },
    degText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFB800',
        lineHeight: 14,
    },
    cText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        marginLeft: -2,
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    locationText: {
        color: '#64748B',
        marginLeft: 4,
        fontSize: 11,
        fontWeight: '600',
    },
    miniStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        marginVertical: 10,
    },
    miniStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    miniStatText: {
        color: '#0F172A',
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '700',
    },
    hourlyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 8,
    },
    hourlyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    next15Btn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    next15Text: {
        fontSize: 11,
        color: '#FFB800',
        fontWeight: '700',
        marginRight: 3,
    },
    hourlyList: {
        paddingHorizontal: 10,
        marginTop: 12,
    },
    hourCard: {
        backgroundColor: '#F8FAFC',
        width: 60,
        borderRadius: 30,
        paddingVertical: 12,
        alignItems: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    hourTime: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '700',
    },
    hourTemp: {
        color: '#0F172A',
        fontSize: 13,
        fontWeight: '800',
    },
});
