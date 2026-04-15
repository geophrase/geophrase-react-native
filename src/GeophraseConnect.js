import React, { useRef, useEffect } from 'react';
import { Modal, StyleSheet, View, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';

const API_BASE = 'https://api.geophrase.com';
const WIDGET_ORIGIN = 'https://connect.geophrase.com';

const GeophraseConnect = ({
                              visible,
                              apiKey,
                              orderId,
                              phone,
                              onSuccess,
                              onError,
                              onClose,
                          }) => {
    const webviewRef = useRef(null);
    const watchIdRef = useRef(null);

    // 1. Memory Cleanup: Clear the GPS watch when the widget unmounts
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                Geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // 2. Build the target URL with mobile query parameter
    const buildUrl = () => {
        let url = `${WIDGET_ORIGIN}?api-key=${apiKey}&platform=mobile`;
        if (orderId) url += `&order-id=${orderId}`;
        if (phone) url += `&phone=${phone}`;
        return url;
    };

    // 3. Handle GPS Native Permissions and Progressive Coordinates
    const handleLocationRequest = async () => {
        let hasPermission = false;

        if (Platform.OS === 'ios') {
            Geolocation.requestAuthorization(
                () => {},
                error => { console.log("Geophrase iOS Permission Error:", error); }
            );
            hasPermission = true; // iOS handles the prompt natively via the library
        } else if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!hasPermission) {
            injectMessageToWeb({ type: 'GEOPHRASE_LOCATION_DENIED' });
            return;
        }

        // Clear any existing watch before starting a new one
        if (watchIdRef.current !== null) {
            Geolocation.clearWatch(watchIdRef.current);
        }

        // Start progressive location streaming
        watchIdRef.current = Geolocation.watchPosition(
            (position) => {
                injectMessageToWeb({
                    type: 'GEOPHRASE_LOCATION_RESULT',
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                // This now fires if the user denies permissions OR if 30s pass
                injectMessageToWeb({ type: 'GEOPHRASE_LOCATION_DENIED' });
            },
            {
                enableHighAccuracy: true,
                distanceFilter: 10,
                timeout: 30000
            }
        );
    };

    // 4. Send data BACK to the Next.js widget
    const injectMessageToWeb = (data) => {
        if (webviewRef.current) {
            const script = `window.postMessage(${JSON.stringify(data)}, '*'); true;`;
            webviewRef.current?.injectJavaScript(script);
        }
    };

    // 5. Resolve Token with Native Headers
    const handleTokenResolution = async (token) => {
        try {
            const bundleId = DeviceInfo.getBundleId();
            const headers = {
                "X-API-Key": apiKey,
                "Content-Type": "application/json"
            };

            if (Platform.OS === 'ios') {
                headers['X-iOS-Bundle-Identifier'] = bundleId;
            } else if (Platform.OS === 'android') {
                headers['X-Android-Package'] = bundleId;
            }

            const response = await fetch(`${API_BASE}/business/resolve/`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (onError) onError({
                    type: 'API_ERROR',
                    status: response.status,
                    message: errorData.message || `Geophrase API error (${response.status})`
                });
                return;
            }

            const responseData = await response.json();
            if (onSuccess) onSuccess(responseData);

        } catch (error) {
            if (onError) onError({
                type: 'NETWORK_ERROR',
                message: error.message || 'Failed to connect to Geophrase API'
            });
        }
    };

    // 6. Intercept messages from the Next.js widget
    const onMessage = (event) => {
        let data;
        try {
            data = JSON.parse(event.nativeEvent.data);
        } catch (e) {
            return;
        }

        if (data?.type === 'GEOPHRASE_CLOSE_WIDGET') {
            if (onClose) onClose();
        }

        if (data?.type === 'GEOPHRASE_REQUEST_LOCATION') {
            handleLocationRequest();
        }

        if (data?.type === 'GEOPHRASE_RESOLUTION_TOKEN') {
            if (onClose) onClose(); // Hide modal during resolution
            handleTokenResolution(data.token);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.webviewContainer}>
                    <WebView
                        ref={webviewRef}
                        source={{ uri: buildUrl() }}
                        onMessage={onMessage}
                        javaScriptEnabled={true}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webviewContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
    }
});

export default GeophraseConnect;