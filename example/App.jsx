import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { GeophraseConnect } from '@geophrase/react-native';

export default function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [address, setAddress] = useState(null);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>

            <Button title="Select Delivery Address" onPress={() => setIsOpen(true)} />

            {address && (
                <Text style={{ marginTop: 20 }}>Result: {address.phrase}</Text>
            )}

            <GeophraseConnect
                visible={isOpen}
                apiKey="YOUR_PUBLIC_API_KEY"
                onSuccess={(data) => {
                    setAddress(data);
                    setIsOpen(false);
                }}
                onClose={() => setIsOpen(false)}
            />
        </View>
    );
}