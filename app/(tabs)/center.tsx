import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CenterScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add New Item</Text>
            <Text style={styles.subtitle}>This screen is a placeholder for your center action.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
