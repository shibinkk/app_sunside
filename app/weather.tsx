import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, PanResponder } from 'react-native';
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

const humidityLottieSource = require('../assets/lottie/weather/humidity.json');
const windLottieSource = require('../assets/lottie/weather/wind.json');

// --- Overview Graph Component ---
const OverviewGraph = ({ data, activeTab }: { data: number[], activeTab: string }) => {
    const getCurrentDayIndex = () => (new Date().getDay() + 6) % 7;
    const [activeIndex, setActiveIndex] = useState(getCurrentDayIndex());
    const graphWidth = width - 48;
    const graphHeight = 240;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 40;
    const paddingBottom = 40;

    useEffect(() => {
        setActiveIndex(getCurrentDayIndex());
    }, [activeTab]);

    const minVal = activeTab === 'Humidity' ? 0 : Math.min(...data);
    const maxVal = activeTab === 'Humidity' ? 100 : Math.max(...data, 1);
    const range = maxVal - minVal;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (graphWidth - paddingLeft - paddingRight) + paddingLeft;
        const innerHeight = graphHeight - paddingTop - paddingBottom;
        const y = graphHeight - paddingBottom - ((val - minVal) / (range || 1)) * innerHeight;
        return { x, y };
    });

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt) => {
            const touchX = evt.nativeEvent.locationX;
            const step = (graphWidth - paddingLeft - paddingRight) / (data.length - 1);
            const index = Math.round((touchX - paddingLeft) / step);
            if (index >= 0 && index < data.length) {
                setActiveIndex(index);
            }
        },
    });

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

    const fillD = `${d} L ${points[points.length - 1].x} ${graphHeight - paddingBottom} L ${points[0].x} ${graphHeight - paddingBottom} Z`;
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activePoint = points[activeIndex];

    return (
        <View style={{ height: 280, marginTop: 0, alignItems: 'center' }} {...panResponder.panHandlers}>
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

                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p, i) => {
                    const y = paddingTop + (1 - p) * (graphHeight - paddingTop - paddingBottom);
                    return (
                        <G key={i}>
                            <Line x1={paddingLeft} y1={y} x2={graphWidth - paddingRight} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                            <SvgText x="0" y={y + 4} fill="#94A3B8" fontSize="10" fontWeight="700">
                                {activeTab === 'Humidity' ? `${Math.round(p * 100)}%` : Math.round(minVal + p * range).toString()}
                            </SvgText>
                        </G>
                    );
                })}

                <Path d={fillD} fill="url(#fillGrad)" />
                <Path d={d} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />
                <Line x1={activePoint.x} y1={paddingTop} x2={activePoint.x} y2={graphHeight - paddingBottom} stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
                <Circle cx={activePoint.x} cy={activePoint.y} r="5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" />

                {labels.map((l, i) => (
                    <SvgText key={i} x={(i / (labels.length - 1)) * (graphWidth - paddingLeft - paddingRight) + paddingLeft} y={graphHeight - 5} fill="#94A3B8" fontSize="10" fontWeight="700" textAnchor="middle">{l}</SvgText>
                ))}
            </Svg>

            <View style={[styles.graphTooltip, { left: activePoint.x - 45, top: activePoint.y - 45 }]}>
                <Ionicons name={activeTab === 'Humidity' ? 'water' : activeTab === 'Rainfall' ? 'umbrella' : 'speedometer'} size={10} color="#3B82F6" style={{ marginRight: 4 }} />
                <Text style={styles.graphTooltipText}>
                    {activeTab === 'Humidity' ? 'Humidity' : 'Avg'} {Math.round(data[activeIndex])}{activeTab === 'Humidity' ? '%' : activeTab === 'Pressure' ? ' hPa' : 'mm'}
                </Text>
                <View style={styles.tooltipArrow} />
            </View>
        </View>
    );
};

// --- Sunrise & Sunset Component ---
const SunriseSunset = ({ sunrise, sunset }: { sunrise: string, sunset: string }) => {
    const riseTime = new Date(sunrise);
    const setTime = new Date(sunset);
    const now = new Date();
    const totalDuration = setTime.getTime() - riseTime.getTime();
    const currentProgress = Math.max(0, Math.min(1, (now.getTime() - riseTime.getTime()) / totalDuration));
    const radius = 35;
    const centerX = 50;
    const centerY = 50;
    const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
    const angle = Math.PI + (currentProgress * Math.PI);
    const sunX = centerX + radius * Math.cos(angle);
    const sunY = centerY + radius * Math.sin(angle);

    return (
        <View style={styles.detailCardContent}>
            <Svg width="100" height="60" viewBox="0 0 100 60">
                <Path d={arcPath} stroke="#E2E8F0" strokeWidth="2" strokeDasharray="2 2" fill="none" />
                <Path d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${sunX} ${sunY}`} stroke="#FFB800" strokeWidth="2" fill="none" />
                <Circle cx={sunX} cy={sunY} r="4" fill="#FFB800" />
                <Line x1="0" y1={centerY} x2="100" y2={centerY} stroke="#F1F5F9" strokeWidth="1" />
            </Svg>
            <View style={styles.sunRow}>
                <View><Text style={styles.sunLabel}>Sunrise</Text><Text style={styles.sunTime}>{riseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={styles.sunLabel}>Sunset</Text><Text style={styles.sunTime}>{setTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>
            </View>
        </View>
    );
};

// --- UV Index Component ---
const UVIndex = ({ value }: { value: number }) => {
    const radius = 35;
    const centerX = 60; // Centered for 120 width
    const centerY = 60; // Moved down to provide top room
    const normalizedValue = Math.min(12, value);
    const progress = normalizedValue / 12;
    const angle = progress * Math.PI;

    const gaugePath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

    // Calculate arc point for progress
    const arcX = centerX - radius * Math.cos(angle);
    const arcY = centerY - radius * Math.sin(angle);
    const progressPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${arcX} ${arcY}`;

    // Scale markers
    const scalePoints = [0, 3, 6, 9, 12];

    return (
        <View style={styles.detailCardContent}>
            <View style={{ height: 85, width: 120, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width="120" height="85" viewBox="0 0 120 85">
                    <Path d={gaugePath} stroke="#F1F5F9" strokeWidth="6" fill="none" strokeLinecap="round" />
                    <Path d={progressPath} stroke="#3B82F6" strokeWidth="6" fill="none" strokeLinecap="round" />

                    {scalePoints.map((val, i) => {
                        const p = val / 12;
                        const a = Math.PI + (p * Math.PI);
                        const tx = centerX + (radius + 12) * Math.cos(a);
                        const ty = centerY + (radius + 12) * Math.sin(a);
                        return (
                            <SvgText key={i} x={tx} y={ty} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#94A3B8">{val}</SvgText>
                        );
                    })}

                    <SvgText x={centerX} y={centerY + 5} textAnchor="middle" fontSize="18" fontWeight="900" fill="#1E293B">{value.toFixed(1)}</SvgText>
                    <SvgText x={centerX} y={centerY + 18} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#94A3B8">UV INDEX</SvgText>
                </Svg>
            </View>
            <View style={styles.uvStatusRow}>
                <Ionicons name="sunny" size={12} color="#FFB800" style={{ marginRight: 4 }} />
                <Text style={styles.uvStatusText} numberOfLines={1}>
                    {value <= 2 ? 'Low Risk' : value <= 5 ? 'Moderate' : 'High Risk'}
                </Text>
            </View>
        </View>
    );
};

// --- Air Quality Component ---
const AirQuality = ({ aqi, pm25 }: { aqi: number, pm25: number }) => {
    const getAQIStatus = (val: number) => {
        if (val <= 50) return { label: 'Good', color: '#10B981' };
        if (val <= 100) return { label: 'Mod', color: '#F59E0B' };
        return { label: 'Poor', color: '#EF4444' };
    };
    const status = getAQIStatus(aqi);
    return (
        <View style={styles.detailCardContent}>
            <View style={styles.aqiTopRow}><Text style={styles.aqiVal}>{aqi}</Text><View style={[styles.aqiBadge, { backgroundColor: status.color }]}><Text style={styles.aqiBadgeText}>AQI</Text></View></View>
            <Text style={styles.aqiDesc}>{status.label}</Text>
            <View style={styles.aqiBarBg}><View style={[styles.aqiBarFill, { width: `${Math.min(100, (aqi / 200) * 100)}%`, backgroundColor: status.color }]} /></View>
            <Text style={styles.aqiPM}>PM 2.5: {pm25.toFixed(1)}</Text>
        </View>
    );
};

// --- Card Wrapper ---
const DetailCard = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: string }) => (
    <View style={styles.detailCard}>
        <View style={styles.detailCardHeader}>
            <Ionicons name={icon as any} size={14} color="#3B82F6" style={{ marginRight: 6 }} />
            <Text style={styles.detailCardTitle}>{title}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
            {children}
        </View>
    </View>
);

export default function WeatherScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [weatherData, setWeatherData] = useState<any>(null);
    const [locationName, setLocationName] = useState({ city: 'Loading...', country: '' });
    const [activeOverviewTab, setActiveOverviewTab] = useState<'Humidity' | 'Rainfall' | 'Pressure'>('Humidity');

    const conditionMap: Record<number, string> = {
        0: 'Sunny', 1: 'Clear', 2: 'Partly Cloudy', 3: 'Cloudy', 45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 61: 'Rainy', 80: 'Showers', 95: 'Stormy'
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
                setLocationName({ city: geocode[0].city || geocode[0].region || 'Unknown', country: geocode[0].country || '' });
            }
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,relative_humidity_2m,surface_pressure,precipitation,uv_index&daily=sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`);
            const wData = await weatherResponse.json();
            const aqiResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,pm2_5&timezone=auto`);
            const aData = await aqiResponse.json();
            setWeatherData({ ...wData, aqi: aData });
        } catch (error) {
            console.error('Error fetching weather:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWeather(); }, []);

    if (loading || !weatherData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFB800" />
                <Text style={{ marginTop: 10, color: '#64748B', fontWeight: '600' }}>Fetching Weather...</Text>
            </View>
        );
    }

    const current = weatherData.current;
    const nextHours = weatherData.hourly.time.slice(0, 12).map((time: string, index: number) => ({
        time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        temp: `${Math.round(weatherData.hourly.temperature_2m[index])}°`,
        weatherCode: weatherData.hourly.weather_code[index],
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}><Ionicons name="chevron-back" size={20} color="#0B132B" /></TouchableOpacity>
                <TouchableOpacity onPress={fetchWeather} style={styles.headerBtn}><Ionicons name="reload" size={20} color="#0B132B" /></TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.todayCard}>
                    <View style={styles.cardTopRow}><Text style={styles.cardTodayLabel}>Today</Text><Text style={styles.cardDateLabel}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })}</Text></View>
                    <View style={styles.mainWeatherRow}>
                        <View><Text style={styles.itConditionText}>It's {getWeatherCondition(current.weather_code)}</Text><View style={styles.tempContainer}><Text style={styles.bigTempText}>{Math.round(current.temperature_2m)}</Text><View style={styles.degWrap}><Text style={styles.degText}>O</Text><Text style={styles.cText}>C</Text></View></View></View>
                        <View style={styles.iconWrap}><LottieView source={getWeatherLottieSource(current.weather_code)} autoPlay loop style={{ width: 100, height: 100 }} /></View>
                    </View>
                    <View style={styles.locationContainer}><Ionicons name="location" size={14} color="#FFB800" /><Text style={styles.locationText}>{locationName.city}, {locationName.country}</Text></View>
                </View>
                <View style={styles.miniStatsRow}>
                    <View style={styles.miniStatItem}><LottieView source={getWeatherLottieSource(current.weather_code)} autoPlay loop style={{ width: 26, height: 26 }} /><Text style={styles.miniStatText}>{getWeatherCondition(current.weather_code)}</Text></View>
                    <View style={styles.miniStatItem}><LottieView source={windLottieSource} autoPlay loop style={{ width: 26, height: 26 }} /><Text style={styles.miniStatText}>{Math.round(current.wind_speed_10m)}km/h</Text></View>
                    <View style={styles.miniStatItem}><LottieView source={humidityLottieSource} autoPlay loop style={{ width: 26, height: 26 }} /><Text style={styles.miniStatText}>{current.relative_humidity_2m}%</Text></View>
                </View>
                <View style={styles.hourlyHeader}><Text style={styles.hourlyTitle}>Today</Text><TouchableOpacity style={styles.next15Btn}><Text style={styles.next15Text}>Next 15 days</Text><Ionicons name="chevron-forward" size={12} color="#FFB800" /></TouchableOpacity></View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyList}>
                    {nextHours.map((item: any, index: number) => (
                        <View key={index} style={styles.hourCard}><Text style={styles.hourTime}>{item.time}</Text><View style={{ marginVertical: 6 }}><LottieView source={getWeatherLottieSource(item.weatherCode)} autoPlay loop style={{ width: 28, height: 28 }} /></View><Text style={styles.hourTemp}>{item.temp}</Text></View>
                    ))}
                </ScrollView>
                <View style={styles.overviewContainer}>
                    <View style={styles.overviewTopRow}><Text style={styles.overviewTitle}>Overview</Text><View style={styles.tabContainer}>{(['Humidity', 'Rainfall', 'Pressure'] as const).map(tab => (<TouchableOpacity key={tab} onPress={() => setActiveOverviewTab(tab)} style={[styles.tabBtn, activeOverviewTab === tab && styles.tabBtnActive]}><Ionicons name={tab === 'Humidity' ? 'water' : tab === 'Rainfall' ? 'umbrella' : 'speedometer'} size={12} color={activeOverviewTab === tab ? '#3B82F6' : '#94A3B8'} style={{ marginRight: 4 }} /><Text style={[styles.tabText, activeOverviewTab === tab && styles.tabTextActive]}>{tab}</Text></TouchableOpacity>))}</View></View>
                    <OverviewGraph activeTab={activeOverviewTab} data={(() => {
                        const dailyBuckets: number[][] = Array.from({ length: 7 }, () => []);
                        weatherData.hourly.time.forEach((t: any, i: any) => { const dIdx = Math.floor(i / 24); if (dIdx < 7) dailyBuckets[dIdx].push(activeOverviewTab === 'Humidity' ? weatherData.hourly.relative_humidity_2m[i] : activeOverviewTab === 'Pressure' ? weatherData.hourly.surface_pressure[i] : weatherData.hourly.precipitation[i]); });
                        return dailyBuckets.map(b => b.length ? b.reduce((a, b) => a + b) / b.length : 0);
                    })()} />
                </View>
                <View style={styles.detailsRow}>
                    <DetailCard title="UV Index" icon="shield-outline">
                        <UVIndex value={weatherData.hourly.uv_index[new Date().getHours()]} />
                    </DetailCard>

                    <DetailCard title="Air Quality" icon="leaf-outline">
                        <AirQuality
                            aqi={weatherData.aqi.current.european_aqi}
                            pm25={weatherData.aqi.current.pm2_5}
                        />
                    </DetailCard>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 18 },
    scrollContent: { paddingBottom: 40 },
    todayCard: { margin: 12, backgroundColor: '#F8FAFC', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTodayLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    cardDateLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
    mainWeatherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itConditionText: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
    tempContainer: { flexDirection: 'row', alignItems: 'flex-start' },
    bigTempText: { fontSize: 48, fontWeight: '900', color: '#0F172A', letterSpacing: -2 },
    degWrap: { flexDirection: 'row', marginTop: 8, marginLeft: 2 },
    degText: { fontSize: 14, fontWeight: 'bold', color: '#FFB800', lineHeight: 14 },
    cText: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginLeft: -2 },
    iconWrap: { alignItems: 'center', justifyContent: 'center' },
    locationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    locationText: { color: '#64748B', marginLeft: 4, fontSize: 11, fontWeight: '600' },
    miniStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, marginVertical: 10 },
    miniStatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
    miniStatText: { color: '#000000ff', marginLeft: 6, fontSize: 14, fontWeight: '700' },
    hourlyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8 },
    hourlyTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    next15Btn: { flexDirection: 'row', alignItems: 'center' },
    next15Text: { fontSize: 11, color: '#FFB800', fontWeight: '700', marginRight: 3 },
    hourlyList: { paddingHorizontal: 10, marginTop: 12 },
    hourCard: { backgroundColor: '#F8FAFC', width: 60, borderRadius: 30, paddingVertical: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    hourTime: { color: '#64748B', fontSize: 9, fontWeight: '700' },
    hourTemp: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
    overviewContainer: { margin: 12, backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 20, paddingHorizontal: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#64748B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
    overviewTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    overviewTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 5 },
    tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 7, borderRadius: 16 },
    tabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    tabText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#3B82F6',
        fontWeight: '800',
    },
    graphTooltip: { position: 'absolute', width: 90, height: 28, backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    graphTooltipText: { fontSize: 10, color: '#1E293B', fontWeight: 'bold' },
    tooltipArrow: { position: 'absolute', bottom: -5, left: 40, width: 10, height: 10, backgroundColor: '#FFFFFF', transform: [{ rotate: '45deg' }], borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    detailsRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        justifyContent: 'center',
        gap: 12, // Tighter gap
        marginBottom: 20,
    },
    detailCard: {
        flex: 1, // Let them expand naturally with gap
        maxWidth: (width - 36) / 2, // Limit width
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        minHeight: 150,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    detailCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailCardTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailCardContent: { alignItems: 'center', justifyContent: 'center' },
    sunRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 5 },
    sunLabel: { fontSize: 7, color: '#94A3B8', fontWeight: '700' },
    sunTime: { fontSize: 8, color: '#1E293B', fontWeight: '800' },
    uvStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
        justifyContent: 'center',
    },
    uvStatusText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#3B82F6',
    },
    aqiTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 4,
    },
    aqiVal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
    },
    aqiBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    aqiBadgeText: {
        fontSize: 8,
        color: '#FFFFFF',
        fontWeight: '900',
    },
    aqiDesc: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E293B',
        alignSelf: 'flex-start',
        marginVertical: 4,
    },
    aqiBarBg: {
        height: 6,
        width: '100%',
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        marginVertical: 8,
    },
    aqiBarFill: {
        height: 6,
        borderRadius: 3,
    },
    aqiPM: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '700',
        alignSelf: 'flex-start',
        marginTop: 4,
    },
});
