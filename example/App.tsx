import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { GeophraseConnect, GeophraseAddress, GeophraseError } from '@geophrase/react-native';

export default function App() {
    const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
    const [addressData, setAddressData] = useState<GeophraseAddress | null>(null);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={() => setIsWidgetOpen(true)}
            >
                <Text style={styles.buttonText}>Select Delivery Address</Text>
            </TouchableOpacity>

            {/* Ultra-minimal data dump */}
            {addressData && (
                <Text style={styles.rawText}>
                    {JSON.stringify(addressData, null, 2)}
                </Text>
            )}

            <GeophraseConnect
                visible={isWidgetOpen}
                apiKey="YOUR_API_KEY"
                phone="9999999999"
                onSuccess={(address: GeophraseAddress) => {
                    setAddressData(address);
                    setIsWidgetOpen(false);
                }}
                onError={(error: GeophraseError) => {
                    console.error("Geophrase Error:", error);
                }}
                onClose={() => setIsWidgetOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    button: { backgroundColor: '#000', padding: 15, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    rawText: { marginTop: 20, fontSize: 12, color: '#333' }
});