import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    SectionList,
    SafeAreaView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import countriesData from '../constants/countries.json';

interface Country {
    name: string;
    code: string;
    dial_code: string;
    flag: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (country: Country) => void;
}

export default function CountryPickerModal({ visible, onClose, onSelect }: Props) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = useMemo(() => {
        const filtered = countriesData.filter((country: Country) =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.dial_code.includes(searchQuery)
        );

        // Group by first letter
        const groups: { [key: string]: Country[] } = {};
        filtered.forEach(country => {
            const firstLetter = country.name[0].toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(country);
        });

        return Object.keys(groups)
            .sort()
            .map(letter => ({
                title: letter,
                data: groups[letter],
            }));
    }, [searchQuery]);

    const renderItem = ({ item }: { item: Country }) => (
        <TouchableOpacity
            style={styles.countryItem}
            onPress={() => {
                onSelect(item);
                onClose();
            }}
        >
            <Image
                source={{ uri: item.flag }}
                style={styles.flag}
                contentFit="contain"
            />
            <Text style={styles.countryName}>
                {item.name} <Text style={styles.dialCode}>({item.dial_code})</Text>
            </Text>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pick your country code</Text>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={20} color="#999" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter country name to filter"
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={false}
                        />
                        <TouchableOpacity>
                            <Ionicons name="mic-outline" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                </View>

                <SectionList
                    sections={filteredCountries}
                    keyExtractor={(item) => item.code}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={true}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </View>
        </Modal>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: Platform.OS === 'ios' ? 0 : 25, // Manual adjustment for status bar on Android
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        paddingHorizontal: 8,
    },
    listContent: {
        paddingBottom: 20,
    },
    sectionHeader: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    flag: {
        width: 28,
        height: 20,
        borderRadius: 2,
        marginRight: 16,
    },
    countryName: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    dialCode: {
        color: '#666',
        fontWeight: '400',
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 60,
    },
});
