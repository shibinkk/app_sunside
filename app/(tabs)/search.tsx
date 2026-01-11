import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Keyboard,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const SEARCH_HISTORY_KEY = 'sunside_search_history';

export default function SearchScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        loadHistory();
        // Auto focus with a small delay for smoother transition
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const loadHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Error loading history:', e);
        }
    };

    const addToHistory = async (item: any) => {
        try {
            const newHistory = [item, ...history.filter(h =>
                (h.properties.osm_id !== item.properties.osm_id)
            )].slice(0, 10);
            setHistory(newHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    };

    const removeFromHistory = async (osmId: any) => {
        try {
            const newHistory = history.filter(h => h.properties.osm_id !== osmId);
            setHistory(newHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Error removing history:', e);
        }
    };

    const clearHistory = async () => {
        try {
            setHistory([]);
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (e) {
            console.error('Error clearing history:', e);
        }
    };

    const searchPlaces = async (text: string) => {
        setQuery(text);
        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=8`);
            const data = await response.json();
            setSuggestions(data.features || []);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        addToHistory(item);
        Keyboard.dismiss();
        router.push({
            pathname: '/',
            params: { selectedPlace: JSON.stringify(item) }
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            {/* Search Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        placeholder="Search here"
                        placeholderTextColor="#999"
                        style={styles.input}
                        value={query}
                        onChangeText={searchPlaces}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.voiceBtn}>
                    <MaterialIcons name="mic-none" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {loading && (
                    <ActivityIndicator color="#000" style={{ marginVertical: 20 }} />
                )}

                {/* Suggestions List */}
                {query.length >= 3 && suggestions.length > 0 && (
                    <View style={styles.section}>
                        {suggestions.map((item, index) => (
                            <TouchableOpacity
                                key={`sug-${index}`}
                                style={styles.listItem}
                                onPress={() => handleSelect(item)}
                            >
                                <View style={styles.locIconBg}>
                                    <Ionicons name="location-outline" size={20} color="#666" />
                                </View>
                                <View style={styles.itemTextContainer}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>
                                        {item.properties.name || item.properties.city || item.properties.street}
                                    </Text>
                                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                                        {[item.properties.city, item.properties.state, item.properties.country].filter(Boolean).join(', ')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* History Section */}
                {query.length < 3 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Searches</Text>
                            {history.length > 0 && (
                                <TouchableOpacity onPress={clearHistory}>
                                    <Text style={styles.clearAllText}>Clear all</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {history.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={48} color="#EEE" />
                                <Text style={styles.emptyText}>Find your next destination</Text>
                            </View>
                        ) : (
                            history.map((item, index) => (
                                <TouchableOpacity
                                    key={`hist-${index}`}
                                    style={styles.listItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <View style={styles.historyIconBg}>
                                        <Ionicons name="time-outline" size={20} color="#666" />
                                    </View>
                                    <View style={styles.itemTextContainer}>
                                        <Text style={styles.itemTitle} numberOfLines={1}>
                                            {item.properties.name || item.properties.city || item.properties.street}
                                        </Text>
                                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                                            {[item.properties.city, item.properties.state, item.properties.country].filter(Boolean).join(', ')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeFromHistory(item.properties.osm_id)}
                                        style={styles.removeBtn}
                                    >
                                        <Ionicons name="close" size={20} color="#CCC" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
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
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        height: 50,
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    clearBtn: {
        padding: 5,
    },
    voiceBtn: {
        width: 38,
        height: 38,
        backgroundColor: '#101010',
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    content: {
        flex: 1,
    },
    section: {
        paddingTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#999',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    clearAllText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA',
    },
    locIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    historyIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    removeBtn: {
        padding: 5,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 15,
        color: '#CCC',
        marginTop: 10,
        fontWeight: '500',
    }
});
