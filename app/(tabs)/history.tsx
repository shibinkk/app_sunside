import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SEARCH_HISTORY_KEY = 'sunside_search_history';

export default function HistoryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        loadHistory();
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

    const handleSelect = (item: any) => {
        router.push({
            pathname: '/',
            params: { selectedPlace: JSON.stringify(item) }
        });
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

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Activity</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Locations</Text>
                    {history.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBg}>
                                <Ionicons name="time-outline" size={40} color="#CCC" />
                            </View>
                            <Text style={styles.emptyText}>No recent activity yet</Text>
                            <TouchableOpacity
                                style={styles.exploreBtn}
                                onPress={() => router.push('/')}
                            >
                                <Text style={styles.exploreBtnText}>Start Exploring</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        history.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.listItem}
                                onPress={() => handleSelect(item)}
                            >
                                <View style={styles.locIconBg}>
                                    <Ionicons name="location" size={20} color="#666" />
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
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#000',
        fontFamily: 'NicoMoji'
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#999',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 15,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    locIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    itemSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    removeBtn: {
        padding: 5,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '600',
    },
    exploreBtn: {
        marginTop: 25,
        backgroundColor: '#000',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exploreBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
    }
});
