import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileImageContainer}>
                    <Ionicons name="person" size={60} color="#000" />
                </View>
                <Text style={styles.name}>{user?.name || 'User Name'}</Text>
                <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
            </View>

            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="person-outline" size={24} color="#000" />
                    <Text style={styles.menuText}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={20} color="#AAA" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                    <Text style={[styles.menuText, { color: '#FF3B30' }]}>Sign Out</Text>
                    <Ionicons name="chevron-forward" size={20} color="#AAA" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: 80,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginBottom: 5,
    },
    email: {
        fontSize: 14,
        color: '#666',
    },
    menuContainer: {
        paddingHorizontal: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        marginLeft: 15,
        fontWeight: '500',
    },
});
