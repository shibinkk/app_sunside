import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import LottieView from 'lottie-react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G, Line, Text as SvgText, Rect } from 'react-native-svg';

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

// --- Overview Graph Component ---
const OverviewGraph = ({ data, activeTab }: { data: number[], activeTab: string }) => {
    const graphWidth = width - 48; // Wider
    const graphHeight = 240; // Increased spacing between Y-values
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 40;
    const paddingBottom = 40; // Space for X-axis labels

    // Calculate standardized Humidity scales
    const minVal = activeTab === 'Humidity' ? 0 : Math.min(...data);
    const maxVal = activeTab === 'Humidity' ? 100 : Math.max(...data, 1);
    const range = maxVal - minVal;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (graphWidth - paddingLeft - paddingRight) + paddingLeft;
        // Map data to the inner height (graphHeight - top - bottom)
        const innerHeight = graphHeight - paddingTop - paddingBottom;
        const y = graphHeight - paddingBottom - ((val - minVal) / (range || 1)) * innerHeight;
        return { x, y };
    });

    // Create SVG Path
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cp1x = curr.x + (next.x - curr.x) / 2;
        const cp1y = curr.y;
        const cp2x = curr.x + (next.x - curr.x) / 2;
        const cp2y = next.y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    // Fill path
    const fillD = `${d} L ${points[points.length - 1].x} ${graphHeight - paddingBottom} L ${points[0].x} ${graphHeight - paddingBottom} Z`;

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const midIndex = Math.floor(data.length / 2);
    const activePoint = points[midIndex];

    return (
        <View style={{ height: 280, marginTop: 0, alignItems: 'center' }}>
            <Svg width={graphWidth} height={graphHeight} style={{ overflow: 'visible' }}>
                <Defs>
                    <SvgLinearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <Stop offset="50%" stopColor="#3B82F6" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
                        <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </SvgLinearGradient>
                </Defs>

                {/* Y Axis Grid Lines & Standardized Labels */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p, i) => {
                    const y = paddingTop + (1 - p) * (graphHeight - paddingTop - paddingBottom);
                    return (
                        <G key={i}>
                            <Line x1={paddingLeft} y1={y} x2={graphWidth - paddingRight} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            <SvgText x="0" y={y + 4} fill="#94A3B8" fontSize="10" fontWeight="700">
                                {(() => {
                                    // Map data range based on standardized 0-1 steps
                                    if (activeTab === 'Humidity') return `${Math.round(p * 100)}%`;
                                    const val = minVal + p * (maxVal - minVal);
                                    if (activeTab === 'Rainfall') return val.toFixed(1);
                                    if (activeTab === 'Pressure') return Math.round(val).toString();
                                    return '';
                                })()}
                            </SvgText>
                        </G>
                    );
                })}

                {/* Area Fill */}
                <Path d={fillD} fill="url(#fillGrad)" />

                {/* Line */}
                <Path d={d} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />

                {/* Highlight active point vertical divider */}
                <Line
                    x1={activePoint.x}
                    y1={paddingTop}
                    x2={activePoint.x}
                    y2={graphHeight - paddingBottom}
                    stroke="#3B82F6"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.2"
                />

                {/* Active circle marker */}
                <Circle cx={activePoint.x} cy={activePoint.y} r="5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" />

                {/* X Axis Labels */}
                {labels.map((l, i) => (
                    <SvgText
                        key={i}
                        x={(i / (labels.length - 1)) * (graphWidth - paddingLeft - paddingRight) + paddingLeft}
                        y={graphHeight - 5}
                        fill="#94A3B8"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                    >
                        {l}
                    </SvgText>
                ))}
            </Svg>

            {/* --- Premium Light Tooltip (Floating View) --- */}
            <View
                style={[
                    styles.graphTooltip,
                    {
                        left: activePoint.x - 45,
                        top: activePoint.y - 45
                    }
                ]}
            >
                <Ionicons
                    name={activeTab === 'Humidity' ? 'water' : activeTab === 'Rainfall' ? 'umbrella' : 'speedometer'}
                    size={10}
                    color="#3B82F6"
                    style={{ marginRight: 4 }}
                />
                <Text style={styles.graphTooltipText}>
                    Avg {Math.round(data[midIndex])}{activeTab === 'Humidity' ? '%' : activeTab === 'Pressure' ? ' hPa' : 'mm'}
                </Text>
                {/* Tooltip Arrow */}
                <View style={styles.tooltipArrow} />
            </View>
        </View>
    );
};

export default function WeatherScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [weatherData, setWeatherData] = useState<any>(null);
    const [locationName, setLocationName] = useState({ city: 'Loading...', country: '' });
    const [activeOverviewTab, setActiveOverviewTab] = useState<'Humidity' | 'Rainfall' | 'Pressure'>('Humidity');

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

            // Updated API to fetch hourly and daily data for a week
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,relative_humidity_2m,surface_pressure,precipitation&timezone=auto&forecast_days=7`
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

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

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

                {/* --- Overview Container (Weekly Graph) --- */}
                <View style={styles.overviewContainer}>
                    <View style={styles.overviewTopRow}>
                        <Text style={styles.overviewTitle}>Overview</Text>
                        <View style={styles.tabContainer}>
                            {(['Humidity', 'Rainfall', 'Pressure'] as const).map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveOverviewTab(tab)}
                                    style={[styles.tabBtn, activeOverviewTab === tab && styles.tabBtnActive]}
                                >
                                    <Ionicons
                                        name={tab === 'Humidity' ? 'water' : tab === 'Rainfall' ? 'umbrella' : 'speedometer'}
                                        size={12}
                                        color={activeOverviewTab === tab ? '#3B82F6' : '#94A3B8'}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={[styles.tabText, activeOverviewTab === tab && styles.tabTextActive]}>
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {weatherData && (
                        <OverviewGraph
                            activeTab={activeOverviewTab}
                            data={(() => {
                                if (!weatherData.hourly) return [0, 0, 0, 0, 0, 0, 0];
                                const hourlyData = weatherData.hourly;
                                const dailyBuckets: number[][] = Array.from({ length: 7 }, () => []);

                                hourlyData.time.forEach((time: string, i: number) => {
                                    const dayIdx = Math.floor(i / 24);
                                    if (dayIdx < 7) {
                                        const val = activeOverviewTab === 'Humidity' ? hourlyData.relative_humidity_2m[i] :
                                            activeOverviewTab === 'Pressure' ? hourlyData.surface_pressure[i] :
                                                hourlyData.precipitation[i];
                                        dailyBuckets[dayIdx].push(val);
                                    }
                                });

                                return dailyBuckets.map(bucket =>
                                    bucket.length ? bucket.reduce((a, b) => a + b) / bucket.length : 0
                                );
                            })()}
                        />
                    )}
                </View>

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
        color: '#000000ff', // Changed from #0F172A to match the blue theme
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
    overviewContainer: {
        margin: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 12, // Shifting content left
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    overviewTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10, // Reduced from 20 to tighten gap
    },
    overviewTitle: {
        fontSize: 18, // Reduced from 20
        fontWeight: '800',
        color: '#1E293B',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        padding: 5, // Increased from 4
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7, // Increased from 6
        paddingVertical: 7,    // Increased from 5
        borderRadius: 16,
    },
    tabBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontSize: 10, // Increased from 9
        color: '#94A3B8',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#3B82F6',
        fontWeight: 'bold',
    },
    graphTooltip: {
        position: 'absolute',
        width: 90,
        height: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    graphTooltipText: {
        fontSize: 10,
        color: '#1E293B',
        fontWeight: 'bold',
    },
    tooltipArrow: {
        position: 'absolute',
        bottom: -5,
        left: 40,
        width: 10,
        height: 10,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '45deg' }],
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
    },
});
