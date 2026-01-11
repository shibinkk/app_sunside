import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Animated,
    Modal,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    FlatList
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
// Calculate width to fit exactly 7 items
const CONTAINER_PADDING = 40;
const DATE_LIST_WIDTH = width - CONTAINER_PADDING;
const ITEM_WIDTH = DATE_LIST_WIDTH / 6;

interface TripPlannerPopupProps {
    visible: boolean;
    onClose: () => void;
}

const WHEEL_ITEM_HEIGHT = 42;
const WHEEL_VISIBLE_ITEMS = 3;

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

    // One empty string on each side to center the selection in a 3-item visible list
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

interface TimePickerModalProps {
    visible: boolean;
    initialDate: Date;
    onClose: () => void;
    onSave: (date: Date) => void;
}

const TimePickerModal = ({ visible, initialDate, onClose, onSave }: TimePickerModalProps) => {
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ["AM", "PM"];

    const getInitialHour = () => {
        let h = initialDate.getHours();
        const period = h >= 12 ? "PM" : "AM";
        h = h % 12;
        h = h ? h : 12; // 0 should be 12
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
                        {/* Highlights the selection area */}
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

export default function TripPlannerPopup({ visible, onClose }: TripPlannerPopupProps) {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const openAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const lineAnim = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            const today = new Date();
            setSelectedDate(today);
            setCurrentMonth(today);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.spring(openAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 50,
                    useNativeDriver: true,
                    restSpeedThreshold: 0.001,
                    restDisplacementThreshold: 0.001,
                }),
                Animated.timing(lineAnim, {
                    toValue: 1,
                    duration: 700,
                    delay: 350,
                    useNativeDriver: false,
                })
            ]).start();

            setTimeout(() => {
                centerDate(today);
            }, 500);
        }
    }, [visible]);

    const handleClose = () => {
        Keyboard.dismiss();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(openAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(lineAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: false,
            })
        ]).start(() => {
            onClose();
        });
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

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={handleClose}
                >
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    </Animated.View>
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalContent}
                >
                    <Animated.View
                        style={[
                            styles.popup,
                            {
                                opacity: openAnim.interpolate({
                                    inputRange: [0, 0.2, 1],
                                    outputRange: [0, 1, 1]
                                }),
                                borderTopLeftRadius: openAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [100, 40]
                                }),
                                borderTopRightRadius: openAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [100, 40]
                                }),
                                transform: [
                                    {
                                        translateY: openAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [height * 0.35, 0]
                                        })
                                    },
                                    {
                                        scale: openAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.01, 1]
                                        })
                                    }
                                ]
                            }
                        ]}
                    >
                        <Animated.View style={[
                            styles.popupInner,
                            {
                                borderTopLeftRadius: openAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [100, 40]
                                }),
                                borderTopRightRadius: openAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [100, 40]
                                }),
                            }
                        ]}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={handleClose}
                                style={styles.handleContainer}
                            >
                                <View style={styles.handle} />
                            </TouchableOpacity>

                            <View style={styles.content}>
                                <Text style={[styles.label, { marginTop: 10 }]}>Date</Text>
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
                                        getItemLayout={(data, index) => (
                                            { length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index }
                                        )}
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

                                <View
                                    style={styles.scrollForm}
                                >
                                    <View style={styles.formContainer}>
                                        <Text style={[styles.label, { marginTop: 12 }]}>Choose Route</Text>
                                        <View style={styles.locationContainer}>
                                            <View style={styles.iconsColumn}>
                                                <View style={styles.donutIcon} />
                                                <View style={styles.lineTrack}>
                                                    <Animated.View
                                                        style={[
                                                            styles.activeLine,
                                                            {
                                                                height: lineAnim.interpolate({
                                                                    inputRange: [0, 1],
                                                                    outputRange: ['0%', '100%']
                                                                })
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                                <View style={styles.squareIcon} />
                                            </View>

                                            <View style={styles.inputsColumn}>
                                                <TextInput
                                                    placeholder="Enter source place"
                                                    style={styles.locationInput}
                                                    value={source}
                                                    onChangeText={setSource}
                                                    placeholderTextColor="#999"
                                                />
                                                <View style={styles.locationSeparator} />
                                                <TextInput
                                                    placeholder="Enter destination"
                                                    style={styles.locationInput}
                                                    value={destination}
                                                    onChangeText={setDestination}
                                                    placeholderTextColor="#999"
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { marginTop: 12 }]}>Time</Text>
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                style={styles.inputContainer}
                                                onPress={() => setShowTimePicker(true)}
                                            >
                                                <Ionicons name="time-sharp" size={18} color="#000000ff" style={styles.inputIcon} />
                                                <Text style={styles.inputText}>
                                                    {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            style={styles.findButton}
                                            onPress={handleClose}
                                        >
                                            <Text style={styles.findButtonText}>Search Rides</Text>
                                            <MaterialIcons name="search" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>

                        <TimePickerModal
                            visible={showTimePicker}
                            initialDate={selectedDate}
                            onClose={() => setShowTimePicker(false)}
                            onSave={onTimeSave}
                        />

                        {/* Extra bottom to cover gaps on some devices */}
                        <View style={styles.bottomFill} />
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    overlay: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        flex: 1,
        width: '100%',
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    popup: {
        backgroundColor: '#ffffffff',
        height: height * 0.76,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
        overflow: 'hidden',
    },
    popupInner: {
        flex: 1,
        backgroundColor: '#ffffffff',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        overflow: 'hidden',
    },
    handleContainer: {
        width: '100%',
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handle: {
        width: 45,
        height: 5,
        backgroundColor: '#E5E5E5',
        borderRadius: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
        textAlign: 'center',
        marginVertical: 10,
    },
    datePickerContainer: {
        backgroundColor: '#ffffffff',
        borderRadius: 30,
        paddingVertical: 15,
        paddingHorizontal: ITEM_WIDTH / 2,
        borderWidth: 1.5,
        borderColor: '#000000ff',
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
        // No extra padding
    },
    dayPill: {
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 100, // Matching height
        borderRadius: 30,
        paddingVertical: 12,
        paddingBottom: 10,
        backgroundColor: 'transparent', // Transparent to avoid cutting
    },
    dayPillSelected: {
        backgroundColor: '#edededff',
        shadowColor: '#000000ff',
        //
    },
    dayNameText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        marginTop: 2, // Fine-tuned position
    },
    dayNameTextSelected: {
        fontSize: 13,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4, // Fine-tuned position
    },
    dateCircle: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2, // Fine-tuned position
    },
    dateCircleSelected: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -2, // Moved further up as requested
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
    scrollForm: {
        flex: 1,
    },
    formContainer: {
        paddingTop: 5,
    },
    locationContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 30,
        padding: 15,
        borderWidth: 1.5,
        borderColor: '#000000ff',
    },
    iconsColumn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginRight: 15,
        width: 24,
    },
    donutIcon: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 3,
        borderColor: '#000',
        backgroundColor: 'transparent',
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
        width: 12,
        height: 12,
        backgroundColor: '#000',
        borderRadius: 2,
    },
    inputsColumn: {
        flex: 1,
        gap: 0,
    },
    locationInput: {
        height: 48,
        fontSize: 15,
        color: '#000',
        fontWeight: '700',
    },
    locationSeparator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        width: '100%',
    },
    bottomFill: {
        height: 100,
        backgroundColor: '#ffffffff',
        position: 'absolute',
        bottom: -100,
        left: 0,
        right: 0,
    },
    inputGroup: {
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: '#AAA',
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 20,
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 30,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#000000ff',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#000',
        fontWeight: '700',
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
        marginBottom: 10,
    },
    findButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        marginRight: 10,
    },
    // Custom Time Picker Styles
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 12,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    tpSaveText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
});
