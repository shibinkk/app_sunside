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
    Modal,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const CONTAINER_PADDING = 40;
const DATE_LIST_WIDTH = width - CONTAINER_PADDING;
const ITEM_WIDTH = DATE_LIST_WIDTH / 6;

const WHEEL_ITEM_HEIGHT = 42;

const WheelPicker = ({
    data,
    selectedValue,
    onValueChange,
    visible
}: {
    data: string[],
    selectedValue: string,
    onValueChange: (val: string) => void,
    visible: boolean
}) => {
    const listRef = useRef<FlatList>(null);
    const paddingData = ["", ...data, ""];

    useEffect(() => {
        if (visible) {
            const index = data.indexOf(selectedValue);
            if (index !== -1 && listRef.current) {
                setTimeout(() => {
                    listRef.current?.scrollToOffset({
                        offset: index * WHEEL_ITEM_HEIGHT,
                        animated: false
                    });
                }, 50);
            }
        }
    }, [visible, data, selectedValue]);

    const handleMomentumScrollEnd = (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / WHEEL_ITEM_HEIGHT);
        if (index >= 0 && index < data.length) {
            onValueChange(data[index]);
            Haptics.selectionAsync();
        }
    };

    const lastHapticIndex = useRef(-1);
    const handleScroll = (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / WHEEL_ITEM_HEIGHT);
        if (index !== lastHapticIndex.current && index >= 0 && index < data.length) {
            lastHapticIndex.current = index;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <View style={styles.wheelWrapper}>
            <FlatList
                ref={listRef}
                data={paddingData}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item, index }) => {
                    const realIndex = index - 1;
                    const isSelected = data[realIndex] === selectedValue;
                    return (
                        <View style={[styles.wheelItem, { height: WHEEL_ITEM_HEIGHT }]}>
                            <Text style={[
                                styles.wheelItemText,
                                isSelected ? styles.wheelItemTextActive : styles.wheelItemTextInactive
                            ]}>
                                {item}
                            </Text>
                        </View>
                    );
                }}
                showsVerticalScrollIndicator={false}
                snapToInterval={WHEEL_ITEM_HEIGHT}
                decelerationRate={Platform.OS === 'ios' ? 0.985 : 'fast'}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                onScroll={handleScroll}
                scrollEventThrottle={32}
                getItemLayout={(_, index) => ({
                    length: WHEEL_ITEM_HEIGHT,
                    offset: WHEEL_ITEM_HEIGHT * index,
                    index
                })}
            />
        </View>
    );
};

const TimePickerModal = ({ visible, initialDate, onClose, onSave }: any) => {
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ["AM", "PM"];

    const getInitialHour = () => {
        let h = initialDate.getHours();
        const period = h >= 12 ? "PM" : "AM";
        h = h % 12;
        h = h ? h : 12;
        return { hour: h.toString().padStart(2, '0'), period };
    };

    const initial = getInitialHour();
    const [selHour, setSelHour] = useState(initial.hour);
    const [selMinute, setSelMinute] = useState(initialDate.getMinutes().toString().padStart(2, '0'));
    const [selPeriod, setSelPeriod] = useState(initial.period);

    const handleSave = () => {
        let h = parseInt(selHour);
        if (selPeriod === "PM" && h < 12) h += 12;
        if (selPeriod === "AM" && h === 12) h = 0;
        const newDate = new Date(initialDate);
        newDate.setHours(h);
        newDate.setMinutes(parseInt(selMinute));
        onSave(newDate);
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.tpOverlay}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.tpCard}>
                    <Text style={styles.tpTitle}>Select time</Text>
                    <View style={styles.wheelsContainer}>
                        <View style={styles.selectionHighlight} />
                        <WheelPicker data={hours} selectedValue={selHour} onValueChange={setSelHour} visible={visible} />
                        <View style={styles.separator}><Text style={styles.separatorText}>:</Text></View>
                        <WheelPicker data={minutes} selectedValue={selMinute} onValueChange={setSelMinute} visible={visible} />
                        <View style={styles.separator} />
                        <WheelPicker data={periods} selectedValue={selPeriod} onValueChange={setSelPeriod} visible={visible} />
                    </View>
                    <View style={styles.tpFooter}>
                        <TouchableOpacity onPress={onClose} style={styles.tpCancelBtn}>
                            <Text style={styles.tpCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} style={styles.tpSaveBtn}>
                            <Text style={styles.tpSaveText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function CenterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [activeField, setActiveField] = useState<'source' | 'destination' | null>(null);

    const sourceAnim = useRef(new Animated.Value(0)).current;
    const destAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const [showError, setShowError] = useState(false);

    useEffect(() => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(today);

        setTimeout(() => {
            centerDate(today);
        }, 500);
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
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
            const data = await response.json();
            setSuggestions(data.features || []);
        } catch (error) {
            console.error('Error searching places:', error);
        }
    };

    const handleSelectSuggestion = (feature: any) => {
        const props = feature.properties;
        const name = props.name || props.city || props.street || '';
        const subtitle = [props.city, props.state, props.country].filter(Boolean).join(', ');
        const fullAddress = name + (subtitle ? (name ? ', ' : '') + subtitle : '');

        if (activeField === 'source') setSource(fullAddress);
        else setDestination(fullAddress);

        setSuggestions([]);
        setActiveField(null);
        setShowError(false); // Reset error on selection
        Keyboard.dismiss();
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

    const onTimeSave = (newDate: Date) => {
        setShowTimePicker(false);
        setSelectedDate(newDate);
    };

    const handleFind = () => {
        if (!source.trim() || !destination.trim()) {
            setShowError(true);
            // Shake animation
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
            ]).start();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#FFF' }}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Find your route</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Choose Route</Text>
                        <Animated.View style={[
                            styles.locationContainer,
                            showError && styles.locationContainerError,
                            { transform: [{ translateX: shakeAnim }] }
                        ]}>
                            <View style={styles.iconsColumn}>
                                <Animated.View style={[
                                    styles.donutIcon,
                                    { borderColor: sourceAnim.interpolate({ inputRange: [0, 1], outputRange: ['#CCC', '#000'] }) }
                                ]}>
                                    <Animated.View
                                        style={[
                                            styles.donutFill,
                                            {
                                                transform: [{
                                                    scale: sourceAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, 1],
                                                        extrapolate: 'clamp'
                                                    })
                                                }]
                                            }
                                        ]}
                                    />
                                </Animated.View>
                                <View style={styles.lineTrack}>
                                    <Animated.View
                                        style={[
                                            styles.activeLine,
                                            {
                                                height: sourceAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                    extrapolate: 'clamp'
                                                })
                                            }
                                        ]}
                                    />
                                </View>
                                <Animated.View style={[
                                    styles.squareIcon,
                                    { borderColor: destAnim.interpolate({ inputRange: [0, 1], outputRange: ['#CCC', '#000'] }) }
                                ]}>
                                    <Animated.View
                                        style={[
                                            styles.squareFill,
                                            {
                                                height: destAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                    extrapolate: 'clamp'
                                                })
                                            }
                                        ]}
                                    />
                                </Animated.View>
                            </View>
                            <View style={styles.inputsColumn}>
                                <View style={styles.inputWrapper}>
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
                                <View style={styles.locationSeparator} />
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        placeholder="Enter destination"
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

                        <Text style={[styles.label, { marginTop: 25 }]}>Date</Text>
                        <View style={styles.datePickerContainer}>
                            <View style={styles.monthSelector}>
                                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowBtn}>
                                    <Ionicons name="chevron-back" size={18} color="#000" />
                                </TouchableOpacity>
                                <View style={styles.monthDisplay}>
                                    <Text style={styles.monthYearText}>
                                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowBtn}>
                                    <Ionicons name="chevron-forward" size={18} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                ref={flatListRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={days}
                                keyExtractor={(item) => item.toISOString()}
                                getItemLayout={(data, index) => ({
                                    length: ITEM_WIDTH,
                                    offset: ITEM_WIDTH * index,
                                    index
                                })}
                                contentContainerStyle={styles.daysList}
                                snapToInterval={ITEM_WIDTH}
                                decelerationRate="fast"
                                renderItem={({ item }) => {
                                    const isSelected = item.toDateString() === selectedDate.toDateString();
                                    return (
                                        <TouchableOpacity
                                            activeOpacity={1}
                                            style={[styles.dayPill, { width: ITEM_WIDTH }, isSelected && styles.dayPillSelected]}
                                            onPress={() => handleDateSelect(item)}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <View style={styles.dateCircleSelected}>
                                                        <Text style={styles.dateNumberTextSelected}>
                                                            {item.getDate().toString().padStart(2, '0')}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.dayNameTextSelected}>
                                                        {item.toLocaleString('default', { weekday: 'short' })}
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Text style={styles.dayNameText}>
                                                        {item.toLocaleString('default', { weekday: 'short' })}
                                                    </Text>
                                                    <View style={styles.dateCircle}>
                                                        <Text style={styles.dateNumberText}>
                                                            {item.getDate().toString().padStart(2, '0')}
                                                        </Text>
                                                    </View>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>

                        <Text style={[styles.label, { marginTop: 25 }]}>Time</Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.inputContainer}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <View style={styles.clockIcon}>
                                <View style={[
                                    styles.clockHand,
                                    { transform: [{ rotate: `${(selectedDate.getHours() % 12) * 30 + selectedDate.getMinutes() * 0.5}deg` }] }
                                ]} />
                                <View style={[
                                    styles.clockHandShort,
                                    { transform: [{ rotate: `${selectedDate.getMinutes() * 6}deg` }] }
                                ]} />
                                <View style={styles.clockPin} />
                            </View>
                            <Text style={styles.inputText}>
                                {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.findButton}
                            onPress={handleFind}
                        >
                            <Text style={styles.findButtonText}>Find</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <TimePickerModal
                    visible={showTimePicker}
                    initialDate={selectedDate}
                    onClose={() => setShowTimePicker(false)}
                    onSave={onTimeSave}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        color: '#000',
        fontFamily: 'NicoMoji',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    formContainer: {
        paddingTop: 10,
        paddingBottom: 40,
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: '#AAA',
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    locationContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 30,
        padding: 15,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    locationContainerError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    iconsColumn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginRight: 15,
        width: 24,
    },
    donutIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    donutFill: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#000',
    },
    lineTrack: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 4,
    },
    activeLine: {
        width: '100%',
        backgroundColor: '#000',
    },
    squareIcon: {
        width: 14,
        height: 14,
        borderWidth: 2,
        borderColor: '#000',
        backgroundColor: 'transparent',
        borderRadius: 2,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    squareFill: {
        width: '100%',
        backgroundColor: '#000',
    },
    inputsColumn: {
        flex: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clearBtn: {
        padding: 5,
    },
    locationInput: {
        flex: 1,
        height: 48,
        fontSize: 15,
        color: '#000',
        fontWeight: '500',
    },
    locationSeparator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        width: '100%',
    },
    suggestionsWrapper: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginTop: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F9F9'
    },
    locIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    suggestionSubtitle: {
        fontSize: 12,
        color: '#999',
    },
    datePickerContainer: {
        backgroundColor: '#FFF',
        borderRadius: 30,
        paddingVertical: 15,
        paddingHorizontal: ITEM_WIDTH / 2,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    arrowBtn: {
        padding: 5,
    },
    monthDisplay: {
        flex: 1,
        alignItems: 'center',
    },
    monthYearText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    daysList: {
    },
    dayPill: {
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 100,
        borderRadius: 30,
        paddingVertical: 12,
        paddingBottom: 10,
    },
    dayPillSelected: {
        backgroundColor: '#ededed',
    },
    dayNameText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        marginTop: 2,
    },
    dayNameTextSelected: {
        fontSize: 13,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4,
    },
    dateCircle: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    dateCircleSelected: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -2,
    },
    dateNumberText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    dateNumberTextSelected: {
        fontSize: 19,
        fontWeight: '800',
        color: '#FFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 30,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    clockIcon: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#000',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clockHand: {
        width: 2,
        height: 6,
        backgroundColor: '#FFF',
        borderRadius: 1,
        position: 'absolute',
        bottom: '50%',
        transformOrigin: 'bottom',
    },
    clockHandShort: {
        width: 2,
        height: 8,
        backgroundColor: '#FFF',
        borderRadius: 1,
        position: 'absolute',
        bottom: '50%',
        transformOrigin: 'bottom',
    },
    clockPin: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#FFF',
        position: 'absolute',
    },
    inputText: {
        fontSize: 15,
        color: '#000',
        fontWeight: '700',
    },
    findButton: {
        backgroundColor: '#000',
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
    },
    findButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'NicoMoji'
    },
    tpOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    tpCard: {
        width: width * 0.85,
        backgroundColor: '#FFF',
        borderRadius: 30,
        padding: 24,
        alignItems: 'center',
    },
    tpTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 25,
    },
    wheelsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: WHEEL_ITEM_HEIGHT * 3,
        width: '100%',
        justifyContent: 'center',
    },
    wheelWrapper: {
        height: WHEEL_ITEM_HEIGHT * 3,
        width: 70,
    },
    wheelItem: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelItemText: {
        fontSize: 22,
        fontWeight: '600',
    },
    wheelItemTextActive: {
        color: '#111827',
    },
    wheelItemTextInactive: {
        color: '#E5E7EB',
    },
    selectionHighlight: {
        position: 'absolute',
        height: WHEEL_ITEM_HEIGHT - 2,
        width: '100%',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        top: WHEEL_ITEM_HEIGHT + 1,
    },
    separator: {
        width: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    separatorText: {
        fontSize: 24,
        fontWeight: '400',
        color: '#9CA3AF',
        marginTop: -2,
    },
    tpFooter: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'flex-end',
        marginTop: 35,
        gap: 10,
        alignItems: 'center',
    },
    tpCancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    tpCancelText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    tpSaveBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 28,
    },
    tpSaveText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
});
