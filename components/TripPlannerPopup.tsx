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
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
// Calculate width to fit exactly 7 items
const CONTAINER_PADDING = 40;
const DATE_LIST_WIDTH = width - CONTAINER_PADDING;
const ITEM_WIDTH = DATE_LIST_WIDTH / 5.6;

interface TripPlannerPopupProps {
    visible: boolean;
    onClose: () => void;
}

export default function TripPlannerPopup({ visible, onClose }: TripPlannerPopupProps) {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (visible) {
            const today = new Date();
            setSelectedDate(today);
            setCurrentMonth(today);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 9,
                    tension: 60,
                    useNativeDriver: true,
                })
            ]).start();

            setTimeout(() => {
                centerDate(today);
            }, 500);
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const handleClose = () => {
        Keyboard.dismiss();
        onClose();
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

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(selectedDate);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setSelectedDate(newDate);
        }
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
                            { transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        {/* Wrapper to ensure handle and content are within rounded view */}
                        <View style={styles.popupInner}>
                            <View style={styles.handle} />

                            <View style={styles.content}>
                                <Text style={styles.sectionTitle}>Find your perfect side</Text>

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

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    style={styles.scrollForm}
                                >
                                    <View style={styles.formContainer}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Starting Point</Text>
                                            <View style={styles.inputContainer}>
                                                <Ionicons name="location-sharp" size={18} color="#000000ff" style={styles.inputIcon} />
                                                <TextInput
                                                    placeholder="Enter source place"
                                                    style={styles.input}
                                                    value={source}
                                                    onChangeText={setSource}
                                                    placeholderTextColor="#999"
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Destination</Text>
                                            <View style={styles.inputContainer}>
                                                <Ionicons name="navigate-sharp" size={18} color="#000000ff" style={styles.inputIcon} />
                                                <TextInput
                                                    placeholder="Enter destination"
                                                    style={styles.input}
                                                    value={destination}
                                                    onChangeText={setDestination}
                                                    placeholderTextColor="#999"
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Time</Text>
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
                                </ScrollView>
                            </View>
                        </View>

                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onTimeChange}
                            />
                        )}
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        justifyContent: 'flex-end',
    },
    popup: {
        backgroundColor: 'transparent', // Crucial: background of the animated view itself should be transparent
        height: height * 0.72,
        width: '100%',
    },
    popupInner: {
        flex: 1,
        backgroundColor: '#ffffffff',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingBottom: Platform.OS === 'ios' ? 35 : 15,
        overflow: 'hidden', // Ensures contents don't bleed out of rounded corners
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 20,
    },
    handle: {
        width: 45,
        height: 5,
        backgroundColor: '#E5E5E5',
        borderRadius: 10,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 5,
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
        marginBottom: 10,
        borderWidth: 1,
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
        gap: 12,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: '#AAA',
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#F5F5F5',
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
        fontSize: 14,
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
        marginTop: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    findButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        marginRight: 10,
    },
});
