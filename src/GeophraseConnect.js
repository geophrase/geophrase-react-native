import React, { useRef, useEffect } from 'react';
import { Modal, StyleSheet, View, Platform, PermissionsAndroid, ActivityIndicator } from 'react-native';
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

    // 1. Memory Cleanup: Clear the GPS watch when unmounted
    useEffect(() => {
        if (!visible) {
            stopLocationWatch();
        }
        return () => stopLocationWatch();
    }, [visible]);

    // Helper to kill GPS hardware aggressively
    const stopLocationWatch = () => {
        if (watchIdRef.current !== null) {
            Geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    // 2. Build the target URL (FIXED: URL Encoding)
    const buildUrl = () => {
        let url = `${WIDGET_ORIGIN}?api-key=${encodeURIComponent(apiKey)}&platform=mobile`;
        if (orderId) url += `&order-id=${encodeURIComponent(orderId)}`;
        if (phone) url += `&phone=${encodeURIComponent(phone)}`;
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
            hasPermission = true;
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

        stopLocationWatch();

        watchIdRef.current = Geolocation.watchPosition(
            (position) => {
                injectMessageToWeb({
                    type: 'GEOPHRASE_LOCATION_RESULT',
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                injectMessageToWeb({ type: 'GEOPHRASE_LOCATION_DENIED' });
                stopLocationWatch();
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

    // 5. Resolve Token with Native Headers (FIXED: AbortController Timeout)
    const handleTokenResolution = async (token) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second network timeout

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
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

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
            clearTimeout(timeoutId);
            if (onError) onError({
                type: 'NETWORK_ERROR',
                message: error.name === 'AbortError' ? 'Geophrase API request timed out' : error.message
            });
        }
    };

    // Helper to safely close and cleanup
    const handleClose = () => {
        stopLocationWatch();
        if (onClose) onClose();
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
            handleClose();
        } else if (data?.type === 'GEOPHRASE_REQUEST_LOCATION') {
            handleLocationRequest();
        } else if (data?.type === 'GEOPHRASE_RESOLUTION_TOKEN') {
            handleClose(); // Hide modal during resolution and kill GPS
            handleTokenResolution(data.token);
        }
    };

    // 7. Security: Lock navigation to Geophrase domain
    const onShouldStartLoadWithRequest = (request) => {
        return request.url.startsWith(WIDGET_ORIGIN);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
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
                        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#000000" />
                            </View>
                        )}
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
        justifyContent: 'flex-end', // Optional: push to bottom like a bottom sheet
    },
    webviewContainer: {
        width: '100%',
        height: '90%', // Leave a little room at the top for context
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    }
});

export default GeophraseConnect;