import React from 'react';
import { View } from 'react-native';

// This screen is now handled by a popup in the main TabLayout.
// Navigation to this screen is intercepted in app/(tabs)/_layout.tsx.
export default function CenterScreen() {
    return <View style={{ flex: 1, backgroundColor: '#FFF' }} />;
}
