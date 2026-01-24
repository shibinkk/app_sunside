import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Animated,
    Platform,
    ScrollView,
    Keyboard,
    FlatList,
    KeyboardAvoidingView,
    ImageBackground,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, G, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TimePickerModal, DatePickerModal } from 'react-native-paper-dates';
import { en, registerTranslation } from 'react-native-paper-dates';

registerTranslation('en', en);

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 50; // Reduced padding for wider list
const DATE_LIST_WIDTH = width - CONTAINER_PADDING;
const ITEM_WIDTH = DATE_LIST_WIDTH / 5;



export default function CenterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [sourceCoords, setSourceCoords] = useState<{ latitude: number, longitude: number } | null>(null);
    const [destCoords, setDestCoords] = useState<{ latitude: number, longitude: number } | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [activeField, setActiveField] = useState<'source' | 'destination' | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const sourceAnim = useRef(new Animated.Value(0)).current;
    const destAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const isFormValid = source.trim().length > 0 && destination.trim().length > 0;

    useEffect(() => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(today);

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        setTimeout(() => {
            centerDate(today);
        }, 500);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        Animated.timing(sourceAnim, {
            toValue: source.length > 0 ? 1 : 0,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }, [source]);

    useEffect(() => {
        Animated.timing(destAnim, {
            toValue: destination.length > 0 ? 1 : 0,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }, [destination]);


    const searchPlaces = async (query: string, field: 'source' | 'destination') => {
        if (field === 'source') setSource(query);
        else setDestination(query);


        if (query.trim().length === 0) {
            setSuggestions([]);
            return;
        }

        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            // Prioritize Kerala/India by using a location bias
            // Kerala approx center: 10.8505° N, 76.2711° E
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

                const scoreA = idxA !== -1 ? idxA : 999;
                const scoreB = idxB !== -1 ? idxB : 999;

                return scoreA - scoreB;
            });

            setSuggestions(features.slice(0, 5));
        } catch (error) {
            console.error('Error searching places:', error);
        }
    };

    const handleSelectSuggestion = (feature: any) => {
        const props = feature.properties;
        const [lon, lat] = feature.geometry.coordinates;
        const coords = { latitude: lat, longitude: lon };
        const name = props.name || props.city || props.street || '';
        const subtitle = [props.city, props.state, props.country].filter(Boolean).join(', ');
        const fullAddress = name + (subtitle ? (name ? ', ' : '') + subtitle : '');

        if (activeField === 'source') {
            setSource(fullAddress);
            setSourceCoords(coords);
        } else {
            setDestination(fullAddress);
            setDestCoords(coords);
        }

        setSuggestions([]);
        setActiveField(null);
        Keyboard.dismiss();
    };

    const handleSwap = () => {
        const tempSource = source;
        const tempSourceCoords = sourceCoords;

        setSource(destination);
        setSourceCoords(destCoords);

        setDestination(tempSource);
        setDestCoords(tempSourceCoords);
    };

    const days = useMemo(() => {
        const year = currentMonth.getFullYear();
        const monthIndex = currentMonth.getMonth();
        const date = new Date(year, monthIndex, 1);
        const daysArray = [];
        while (date.getMonth() === monthIndex) {
            daysArray.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return daysArray;
    }, [currentMonth]);

    const centerDate = (dateToCenter: Date) => {
        const index = days.findIndex(d => d.toDateString() === dateToCenter.toDateString());
        if (index !== -1 && flatListRef.current) {
            flatListRef.current.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5
            });
        }
    };

    const handleDateSelect = (item: Date) => {
        setSelectedDate(item);
        centerDate(item);
    };

    const changeMonth = (offset: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        setCurrentMonth(newMonth);
        setTimeout(() => centerDate(selectedDate), 100);
    };

    const onDateConfirm = (params: any) => {
        setShowDatePicker(false);
        setSelectedDate(params.date);
    };

    const handleFind = () => {
        if (!isFormValid) return;

        // Navigate to home tab with route info
        router.push({
            pathname: '/(tabs)',
            params: {
                routeSource: JSON.stringify(sourceCoords),
                routeDest: JSON.stringify(destCoords),
                sourceName: source,
                destName: destination,
                tripDate: selectedDate.toISOString()
            }
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#FAFAFA' }}
        >
            <View style={styles.container}>
                <ImageBackground
                    source={require('../../assets/images/adventure_illustration.png')}
                    style={[styles.headerBg, { paddingTop: insets.top }]}
                    imageStyle={styles.headerImage}
                    resizeMode="contain"
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.circleBackButton}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.pageTitleHeader}>Find Your Trip</Text>
                        <View style={{ width: 45 }} />
                    </View>

                    {/* Gradient Overlay for mixing effect */}
                    <View style={styles.gradientOverlay}>
                        <Svg height="120" width="100%">
                            <Defs>
                                <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor="#FAFAF8" stopOpacity="0" />
                                    <Stop offset="1" stopColor="#FAFAF8" stopOpacity="1" />
                                </SvgLinearGradient>
                            </Defs>
                            <Rect x="0" y="0" width="100%" height="120" fill="url(#grad)" />
                        </Svg>
                    </View>
                </ImageBackground>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[
                        styles.routeCard,
                        { transform: [{ translateX: shakeAnim }] }
                    ]}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>FROM</Text>
                            <View style={styles.inputPill}>
                                <Ionicons name="locate" size={20} color="#000" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Enter source place"
                                    style={styles.locationInput}
                                    value={source}
                                    onChangeText={(text) => searchPlaces(text, 'source')}
                                    onFocus={() => setActiveField('source')}
                                    placeholderTextColor="#999"
                                />
                                {source.length > 0 && (
                                    <TouchableOpacity onPress={() => searchPlaces('', 'source')} style={styles.clearBtn}>
                                        <Ionicons name="close-circle" size={18} color="#CCC" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>TO</Text>
                            <View style={styles.inputPill}>
                                <Ionicons name="map" size={18} color="#000" style={styles.inputIcon} />
                                <TextInput
                                    placeholder="City, Station..."
                                    style={styles.locationInput}
                                    value={destination}
                                    onChangeText={(text) => searchPlaces(text, 'destination')}
                                    onFocus={() => setActiveField('destination')}
                                    placeholderTextColor="#999"
                                />
                                {destination.length > 0 && (
                                    <TouchableOpacity onPress={() => searchPlaces('', 'destination')} style={styles.clearBtn}>
                                        <Ionicons name="close-circle" size={18} color="#CCC" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleSwap} style={styles.swapBtnBlack} activeOpacity={0.8}>
                            <Ionicons name="swap-vertical" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>

                    {activeField && suggestions.length > 0 && (
                        <View style={styles.suggestionsWrapper}>
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectSuggestion(item)}
                                >
                                    <View style={styles.locIconBg}>
                                        <Ionicons name="location" size={16} color="#666" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                                            {item.properties.name || item.properties.city || item.properties.street}
                                        </Text>
                                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                                            {[item.properties.city, item.properties.state, item.properties.country].filter(Boolean).join(', ')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity
                            style={styles.selectionCard}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.selectionLabel}>DATE</Text>
                            <View style={styles.selectionValueRow}>
                                <Ionicons name="calendar-outline" size={20} color="#000" />
                                <Text style={styles.selectionValueText}>
                                    {selectedDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.selectionCard}
                            onPress={() => setShowTimePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.selectionLabel}>TIME</Text>
                            <View style={styles.selectionValueRow}>
                                <Ionicons name="time-outline" size={20} color="#000" />
                                <Text style={styles.selectionValueText}>
                                    {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.findBtnBottom, { marginTop: 25 }, !isFormValid && styles.findButtonDisabled]}
                        onPress={handleFind}
                        disabled={!isFormValid}
                    >
                        <Text style={[styles.findBtnTextNew, !isFormValid && styles.findButtonTextDisabled]}>Find My Trip</Text>
                        <Ionicons name="arrow-forward" size={22} color={isFormValid ? "#FFF" : "#AAA"} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                </ScrollView>
            </View >



            <DatePickerModal
                locale="en"
                mode="single"
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                date={selectedDate}
                onConfirm={onDateConfirm}
            />

            <TimePickerModal
                visible={showTimePicker}
                onDismiss={() => setShowTimePicker(false)}
                onConfirm={({ hours, minutes }: { hours: number, minutes: number }) => {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    setShowTimePicker(false);
                    setSelectedDate(newDate);
                }}
                hours={selectedDate.getHours()}
                minutes={selectedDate.getMinutes()}
            />

        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF8',
    },
    headerBg: {
        height: 320,
        width: '100%',
        justifyContent: 'flex-start',
        backgroundColor: '#FFFFFF', // Match illustration background
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    headerImage: {
        opacity: 1,
        marginTop: 20, // Add some space for the back button and title
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
    },
    circleBackButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pageTitleHeader: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1D1D',
        fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'serif',
    },
    content: {
        flex: 1,
        marginTop: -60, // Increased from -30 to move it upward
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40, // Reduced as button is now inside
    },
    routeCard: {
        backgroundColor: '#FFF',
        borderRadius: 25, // Slightly smaller radius for compact look
        padding: 15, // Reduced from 20
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        width: '100%',
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#999', // Neutral grey
        marginBottom: 4,
        marginLeft: 5,
        letterSpacing: 0.5,
    },
    inputPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 48, // Reduced from 58
        borderWidth: 1,
        borderColor: '#E8EDED',
    },
    inputIcon: {
        marginRight: 12,
    },
    locationInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1D1D',
        fontWeight: '600',
    },
    clearBtn: {
        padding: 5,
    },
    swapBtnBlack: {
        position: 'absolute',
        right: 15,
        top: '46%',
        backgroundColor: '#000', // Changed from teal to black
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 100,
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    selectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 20,
        width: '48%',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    selectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#999', // Neutral grey
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    selectionValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectionValueText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1D1D',
        marginLeft: 8,
    },

    findBtnBottom: {
        backgroundColor: '#000', // Changed from teal to black
        height: 65,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    findBtnTextNew: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    findButtonDisabled: {
        backgroundColor: '#F0F0F0', // Neutral light grey
        shadowOpacity: 0,
        elevation: 0,
    },
    findButtonTextDisabled: {
        color: '#AAA',
    },
    suggestionsWrapper: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        marginTop: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        zIndex: 999,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5'
    },
    locIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5', // Neutral
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    suggestionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1D1D',
    },
    suggestionSubtitle: {
        fontSize: 13,
        color: '#999',
    },
});
