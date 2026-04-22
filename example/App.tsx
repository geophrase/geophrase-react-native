import React, { useState } from 'react';
import { View, Button, Text, ScrollView, StyleSheet } from 'react-native';
import { GeophraseConnect } from '@geophrase/react-native';

export default function App() {
    const [visible, setVisible] = useState(false);
    const [result, setResult] = useState<any>(null);

    return (
        <>
            <View style={styles.container}>
                <Button
                    title="Select Delivery Location"
                    onPress={() => setVisible(true)}
                />

                {result && (
                    <ScrollView style={styles.resultBox}>
                        <Text style={styles.bold}>Payload:</Text>
                        <Text style={styles.code}>{JSON.stringify(result, null, 2)}</Text>
                    </ScrollView>
                )}
            </View>

            {/* Placed outside the padded View so it can span the entire screen */}
            <GeophraseConnect
                visible={visible}

                // --- MODE ---
                // 'server' (used here): widget returns a short-lived token. Pass it to your
                //   backend to resolve the full address. No apiKey needed in the frontend.
                // 'client' (default):   widget resolves and returns the full address directly.
                //   Requires 'apiKey'.
                mode="server"

                // apiKey="YOUR_API_KEY"  // required when mode="client"

                // --- OPTIONAL ---
                theme="system"            // 'light' | 'dark' | 'system' (follows OS preference)
                orderId="EX-12345"        // your internal reference ID
                phone="9999999999"        // prefills the phone field in the widget

                // --- CALLBACKS ---
                onSuccess={(data) => {
                    // server mode → data is { token: "..." }. POST this to your backend.
                    // client mode → data is the full address object.
                    setResult(data);
                    setVisible(false);
                }}
                onError={(error) => console.error('Geophrase Error:', error.message)}
                onClose={() => setVisible(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, paddingTop: 60 },
    resultBox: { marginTop: 20, padding: 10, backgroundColor: '#f0f0f0' },
    bold: { fontWeight: 'bold', marginBottom: 10 },
    code: { fontFamily: 'monospace' },
});