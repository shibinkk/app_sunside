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
    PanResponder,
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

    const [stackIndex, setStackIndex] = useState(0);
    const swipeAnim = useRef(new Animated.Value(0)).current;

    const trips = useMemo(() => [
        { id: 1, operator: 'BUSY TRAVEL', time: '2 min ago', user: 'Sarah', message: 'Hey, fancy a trip to Kochi?', icon: 'person', from: 'Kochi', to: 'Bangalore' },
        { id: 2, operator: 'SUNSIDE', time: '15 min ago', user: 'System', message: 'Your booking for Trivandrum is confirmed 🎉', icon: 'notifications', from: 'Trivandrum', to: 'Chennai' },
        { id: 3, operator: 'VOLVO EXPRESS', time: '1h ago', user: 'Driver', message: 'I am arriving at the pickup point soon.', icon: 'bus', from: 'Calicut', to: 'Mangalore' },
        { id: 4, operator: 'METRO LINK', time: '2h ago', user: 'Office', message: 'Check your updated schedule for tomorrow.', icon: 'calendar', from: 'Ernakulam', to: 'Aluva' },
    ], []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy < 0) swipeAnim.setValue(gesture.dy);
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy < -50) {
                    Animated.timing(swipeAnim, {
                        toValue: -200,
                        duration: 250,
                        useNativeDriver: true,
                    }).start(() => {
                        setStackIndex((prev) => (prev + 1) % trips.length);
                        swipeAnim.setValue(0);
                    });
                } else {
                    Animated.spring(swipeAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const shakeAnim = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const isFormValid = source.trim().length > 0 && destination.trim().length > 0;


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
                tripDate: selectedDate.toISOString(),
                t: Date.now().toString(), // Force re-trigger in HomeScreen
            }
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#FAFAFA' }}
        >
            <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
                <View style={styles.compactHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.compactHeaderTitle}>Start your journey</Text>
                    <TouchableOpacity style={styles.notificationBtn}>
                        <Ionicons name="notifications-outline" size={22} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.contentView}>



                    <View style={styles.mainFormContainer}>
                        <Animated.View style={[
                            styles.routeSection,
                            { transform: [{ translateX: shakeAnim }] }
                        ]}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.outsideLabel}>From</Text>
                                <View style={styles.inputPill}>
                                    <Ionicons name="location" size={18} color="#000" style={styles.inputIcon} />
                                    <View style={styles.inputTextWrapper}>
                                        <TextInput
                                            style={styles.locationInput}
                                            value={source}
                                            placeholder="Enter source"
                                            placeholderTextColor="#999"
                                            onChangeText={(text) => searchPlaces(text, 'source')}
                                            onFocus={() => setActiveField('source')}
                                            onBlur={() => setActiveField(null)}
                                        />
                                    </View>
                                    {source.length > 0 && (
                                        <TouchableOpacity onPress={() => searchPlaces('', 'source')} style={styles.clearBtnInside}>
                                            <Ionicons name="close-circle" size={16} color="#CCC" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.outsideLabel}>To</Text>
                                <View style={styles.inputPill}>
                                    <Ionicons name="map" size={18} color="#000" style={styles.inputIcon} />
                                    <View style={styles.inputTextWrapper}>
                                        <TextInput
                                            style={styles.locationInput}
                                            value={destination}
                                            placeholder="Enter destination"
                                            placeholderTextColor="#999"
                                            onChangeText={(text) => searchPlaces(text, 'destination')}
                                            onFocus={() => setActiveField('destination')}
                                            onBlur={() => setActiveField(null)}
                                        />
                                    </View>
                                    {destination.length > 0 && (
                                        <TouchableOpacity onPress={() => searchPlaces('', 'destination')} style={styles.clearBtnInside}>
                                            <Ionicons name="close-circle" size={16} color="#CCC" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity onPress={handleSwap} style={styles.swapBtnBlackCompact} activeOpacity={0.8}>
                                <Ionicons name="swap-vertical" size={17} color="#FFF" />
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
                                style={styles.selectionPill}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.selectionLabelInside}>Departure</Text>
                                <Text style={styles.selectionValueTextInside}>
                                    {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.selectionPill}
                                onPress={() => setShowTimePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.selectionLabelInside}>Time</Text>
                                <Text style={styles.selectionValueTextInside}>
                                    {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.findBtnBottom, { marginTop: 20 }, !isFormValid && styles.findButtonDisabled]}
                            onPress={handleFind}
                            disabled={!isFormValid}
                        >
                            <Text style={[styles.findBtnTextNew, !isFormValid && styles.findButtonTextDisabled]}>Find My Trip</Text>
                            <Ionicons name="arrow-forward" size={20} color={isFormValid ? "#FFF" : "#AAA"} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Upcoming Trips Section */}
                    <View style={styles.upcomingSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
                            <TouchableOpacity style={styles.seeAllBtn}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.stackedContainer} {...panResponder.panHandlers}>
                            {trips.map((_, index) => {
                                const actualIndex = (index + stackIndex) % trips.length;
                                const item = trips[actualIndex];
                                const isTop = index === 0;

                                // Visible cards (only top 3 for stacking effect)
                                if (index > 2) return null;

                                const scale = 1 - (index * 0.05);
                                const translateY = index * 12;
                                const opacity = 1 - (index * 0.3);

                                return (
                                    <Animated.View
                                        key={item.id}
                                        style={[
                                            styles.upcomingCard,
                                            styles.stackedCard,
                                            {
                                                zIndex: trips.length - index,
                                                opacity,
                                                transform: [
                                                    { scale },
                                                    { translateY: isTop ? Animated.add(translateY, swipeAnim) : translateY }
                                                ],
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                            }
                                        ]}
                                    >
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.operatorText}>{item.operator}</Text>
                                            <Text style={styles.priceText}>{item.time}</Text>
                                        </View>

                                        <View style={styles.notificationMain}>
                                            <View style={styles.avatarCircle}>
                                                <Ionicons name={item.icon as any} size={20} color="#666" />
                                            </View>
                                            <View style={styles.notificationTextContent}>
                                                <Text style={styles.senderName}>{item.user}</Text>
                                                <Text style={styles.messageText} numberOfLines={2}>
                                                    {item.message}
                                                </Text>
                                            </View>
                                        </View>

                                        {isTop && (
                                            <Text style={styles.moreNotifications}>
                                                {trips.length - 1} more notifications
                                            </Text>
                                        )}
                                    </Animated.View>
                                );
                            })}
                        </View>
                    </View>
                </View>
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

    backBtnCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 25,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    compactHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },

    contentView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    mainFormContainer: {
        backgroundColor: '#FFF',
        borderRadius: 35,
        padding: 18,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.08,
        shadowRadius: 25,
        elevation: 12,
    },

    routeSection: {
        width: '100%',
    },
    inputPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 48, // Reduced from 55
        marginBottom: 2,
        borderWidth: 1.5,
        borderColor: '#E8EBF5',
    },
    inputTextWrapper: {
        flex: 1,
        marginLeft: 10,
        height: '100%',
    },
    inputLabelInside: {
        position: 'absolute',
        left: 0,
        color: '#999',
        fontWeight: '600',
    },
    inputIcon: {
        width: 20,
    },
    locationInput: {
        fontSize: 15,
        color: '#000',
        fontWeight: '500',
        padding: 0,
        height: '100%',
    },
    inputWrapper: {
        marginBottom: 4,
    },
    outsideLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        marginBottom: 2,
        marginLeft: 4,
    },
    clearBtnInside: {
        padding: 4,
    },
    swapBtnBlackCompact: {
        position: 'absolute',
        right: 20,
        top: 80,
        marginTop: -16,
        backgroundColor: '#000',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    selectionPill: {
        backgroundColor: '#FFF',
        borderRadius: 18,
        paddingHorizontal: 15,
        paddingVertical: 10,
        width: '48.5%',
        borderWidth: 1.5,
        borderColor: '#E8EBF5',
    },
    selectionLabelInside: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
        marginBottom: 2,
    },
    selectionValueTextInside: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    selectionLabel: {
        fontSize: 10, // Reduced from 11
        fontWeight: '700',
        color: '#999',
        marginBottom: 6, // Reduced from 12
        letterSpacing: 0.5,
    },
    selectionValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectionValueText: {
        fontSize: 14, // Reduced from 15
        fontWeight: '700',
        color: '#1A1D1D',
        marginLeft: 8,
    },

    findBtnBottom: {
        backgroundColor: '#000',
        height: 52,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12, // Reduced
        width: '100%',
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
        fontWeight: '500',
        color: '#1A1D1D',
    },
    suggestionSubtitle: {
        fontSize: 13,
        color: '#999',
    },
    upcomingSection: {
        marginTop: 20, // Reduced
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1D1D',
    },
    seeAllBtn: {
        backgroundColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    seeAllText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    upcomingCard: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 18,
        height: 140, // Consistent height for stack
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    stackedContainer: {
        height: 180,
        marginTop: 10,
        paddingHorizontal: 0,
    },
    stackedCard: {
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    notificationMain: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationTextContent: {
        flex: 1,
    },
    senderName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    moreNotifications: {
        fontSize: 12,
        color: '#999',
        marginTop: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    operatorText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#999',
        letterSpacing: 1,
    },
    priceText: {
        fontSize: 11,
        color: '#999',
    },
    routeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cityBlock: {
        flex: 1,
    },
    cityLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1D1D',
    },
    timeLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    pathIconContainer: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    busIconPath: {
        position: 'absolute',
        top: -15,
        backgroundColor: '#FFF',
        paddingHorizontal: 5,
    },
    dashedLine: {
        height: 1,
        width: '80%',
        borderWidth: 1,
        borderColor: '#EEE',
        borderStyle: 'dashed',
        borderRadius: 1,
    },
});
