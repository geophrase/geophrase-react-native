import React, { useRef, useEffect } from 'react';
import { Modal, StyleSheet, View, Platform, PermissionsAndroid, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';

const API_BASE = 'https://api.geophrase.com';
const WIDGET_ORIGIN = 'https://connect.geophrase.com';

const GeophraseConnect = ({
                              visible,
                              mode = 'client', // Default to client flow
                              theme,
                              apiKey,
                              orderId,
                              phone,
                              onSuccess,
                              onError,
                              onClose,
                          }) => {
    const webviewRef = useRef(null);
    const watchIdRef = useRef(null);

    // 1. Strict Validation Warnings
    useEffect(() => {
        if (visible) {
            if (!['client', 'server'].includes(mode)) {
                console.error(`Geophrase Error: Invalid mode '${mode}'. Expected 'client' or 'server'.`);
            }
            if (mode === 'client' && !apiKey) {
                console.error("Geophrase Error: 'apiKey' is required when mode is 'client'.");
            }
            if (mode === 'server' && apiKey) {
                console.warn("Geophrase Warning: 'apiKey' is ignored when mode is 'server'. Ensure you are not exposing a secure key in your frontend.");
            }
        }
    }, [visible, mode, apiKey]);

    // 2. Memory Cleanup: Clear the GPS watch when unmounted or hidden
    useEffect(() => {
        if (!visible) {
            stopLocationWatch();
        }
        return () => stopLocationWatch();
    }, [visible]);

    const stopLocationWatch = () => {
        if (watchIdRef.current !== null) {
            Geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    // 3. Prevent eager loading and build secure URL
    const getSource = () => {
        if (!visible) {
            return { html: '' };
        }

        // API Key is intentionally omitted from the URL query params for security
        let url = `${WIDGET_ORIGIN}?platform=mobile`;
        if (orderId) url += `&order-id=${encodeURIComponent(orderId)}`;
        if (phone) url += `&phone=${encodeURIComponent(phone)}`;
        if (theme) url += `&theme=${encodeURIComponent(theme)}`;
        return { uri: url };
    };

    // 4. Handle GPS Native Permissions and Progressive Coordinates
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

    const injectMessageToWeb = (data) => {
        if (webviewRef.current) {
            const script = `window.postMessage(${JSON.stringify(data)}, '*'); true;`;
            webviewRef.current?.injectJavaScript(script);
        }
    };

    // 5. Resolve Token with Native Headers (Client Mode Only)
    const handleTokenResolution = async (token) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const bundleId = DeviceInfo.getBundleId();
            const headers = {
                "X-API-Key": apiKey,
                "Content-Type": "application/json"
            };

            // Inject native bundle identifiers for dashboard tracking/restrictions
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
                message: error.name === 'AbortError' ? 'Geophrase API request timed out' : error.message
            });
        } finally {
            clearTimeout(timeoutId);
        }
    };

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
            handleClose();

            // Route based on architectural mode
            if (mode === 'server') {
                if (onSuccess) onSuccess({ token: data.token });
            } else {
                handleTokenResolution(data.token);
            }
        }
    };

    const onShouldStartLoadWithRequest = (request) => {
        try {
            if (request.url === 'about:blank' || !request.url.startsWith('http')) {
                return true;
            }
            const url = new URL(request.url);
            return url.origin === WIDGET_ORIGIN;
        } catch {
            return false;
        }
    };

    // 7. Render dynamic background based on theme prop to prevent flash
    const modalBackgroundColor = theme === 'dark' ? '#121212' : '#ffffff';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <View style={[styles.webviewContainer, { backgroundColor: modalBackgroundColor }]}>
                    <WebView
                        ref={webviewRef}
                        source={getSource()}
                        onMessage={onMessage}
                        javaScriptEnabled={true}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={[styles.loadingContainer, { backgroundColor: modalBackgroundColor }]}>
                                <ActivityIndicator size="large" color={theme === 'dark' ? '#ffffff' : '#000000'} />
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
        justifyContent: 'flex-end',
    },
    webviewContainer: {
        width: '100%',
        height: '90%',
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
    }
});

export default GeophraseConnect;