import React, { useRef, useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    Platform,
    PermissionsAndroid,
    ActivityIndicator,
    useColorScheme,
} from 'react-native';
import { WebView } from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';

const DEFAULT_WIDGET_ORIGIN = 'https://connect.geophrase.com';
const DEFAULT_API_BASE = 'https://api.geophrase.com';

const safeCall = (fn, payload) => {
    if (typeof fn !== 'function') return;
    try {
        fn(payload);
    } catch (err) {
        console.error('Geophrase: merchant callback threw an error', err);
    }
};

const GeophraseConnect = ({
                              visible,
                              mode = 'client',
                              theme,
                              apiKey,
                              orderId,
                              phone,
                              onSuccess,
                              onError,
                              onClose,
                              _endpoints,
                          }) => {
    const webviewRef = useRef(null);
    const watchIdRef = useRef(null);

    const widgetOrigin = _endpoints?.widgetOrigin || DEFAULT_WIDGET_ORIGIN;
    const apiBase = _endpoints?.apiBase || DEFAULT_API_BASE;

    // Resolve theme against OS preference so the modal background matches the
    // widget's first paint (prevents a white flash on dark-OS when theme is
    // 'system' or unspecified).
    const systemScheme = useColorScheme();
    const resolvedTheme =
        theme === 'light' ? 'light' :
            theme === 'dark' ? 'dark' :
                systemScheme === 'dark' ? 'dark' : 'light';
    const backgroundColor = resolvedTheme === 'dark' ? '#121212' : '#ffffff';
    const spinnerColor = resolvedTheme === 'dark' ? '#ffffff' : '#000000';

    // Validation — runs when the widget opens
    useEffect(() => {
        if (!visible) return;

        if (!['client', 'server'].includes(mode)) {
            console.error(`Geophrase Error: Invalid mode '${mode}'. Expected 'client' or 'server'.`);
        }
        if (mode === 'client' && !apiKey) {
            console.error("Geophrase Error: 'apiKey' is required when mode is 'client'.");
        }
        if (mode === 'server' && apiKey) {
            console.warn("Geophrase Warning: 'apiKey' is ignored when mode is 'server'. Ensure you are not exposing a secret key in your frontend.");
        }
        if (theme && !['light', 'dark', 'system'].includes(theme)) {
            console.warn(`Geophrase Warning: Invalid theme '${theme}'. Falling back to default.`);
        }
    }, [visible, mode, apiKey, theme]);

    // Stop watching location when the widget closes or unmounts
    useEffect(() => {
        if (!visible) stopLocationWatch();
        return () => stopLocationWatch();
    }, [visible]);

    const stopLocationWatch = () => {
        if (watchIdRef.current !== null) {
            Geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    const getSource = () => {
        if (!visible) return { html: '' };

        let url = `${widgetOrigin}?platform=mobile`;
        if (orderId) url += `&order-id=${encodeURIComponent(orderId)}`;
        if (phone)   url += `&phone=${encodeURIComponent(phone)}`;
        if (theme)   url += `&theme=${encodeURIComponent(theme)}`;
        return { uri: url };
    };

    const injectMessageToWeb = (data) => {
        if (!webviewRef.current) return;
        const script = `window.postMessage(${JSON.stringify(data)}, '*'); true;`;
        webviewRef.current.injectJavaScript(script);
    };

    const handleLocationRequest = async () => {
        stopLocationWatch();

        const startWatching = () => {
            watchIdRef.current = Geolocation.watchPosition(
                (position) => {
                    injectMessageToWeb({
                        type: 'GEOPHRASE_LOCATION_RESULT',
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                () => {
                    injectMessageToWeb({ type: 'GEOPHRASE_LOCATION_DENIED' });
                    stopLocationWatch();
                },
                { enableHighAccuracy: true, distanceFilter: 10, timeout: 30000 }
            );
        };

        if (Platform.OS === 'ios') {
            Geolocation.requestAuthorization(
                () => startWatching(),
                () => injectMessageToWeb({ type: 'GEOPHRASE_LOCATION_DENIED' })
            );
        } else if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                startWatching();
            } else {
                injectMessageToWeb({ type: 'GEOPHRASE_LOCATION_DENIED' });
            }
        }
    };

    const handleTokenResolution = async (token) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const bundleId = DeviceInfo.getBundleId();
            const headers = {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            };

            if (Platform.OS === 'ios') {
                headers['X-iOS-Bundle-Identifier'] = bundleId;
            } else if (Platform.OS === 'android') {
                headers['X-Android-Package'] = bundleId;
            }

            const response = await fetch(`${apiBase}/business/resolve/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ token }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                safeCall(onError, {
                    type: 'API_ERROR',
                    status: response.status,
                    message: errorData.message || `Geophrase API error (${response.status})`,
                });
                return;
            }

            const responseData = await response.json();
            safeCall(onSuccess, responseData);
        } catch (error) {
            safeCall(onError, {
                type: 'NETWORK_ERROR',
                message: error.name === 'AbortError' ? 'Geophrase API request timed out' : error.message,
            });
        } finally {
            clearTimeout(timeoutId);
        }
    };

    const handleClose = () => {
        stopLocationWatch();
        safeCall(onClose);
    };

    const onMessage = (event) => {
        let data;
        try {
            data = JSON.parse(event.nativeEvent.data);
        } catch {
            return;
        }

        if (data?.type === 'GEOPHRASE_CLOSE_WIDGET') {
            handleClose();
            return;
        }

        if (data?.type === 'GEOPHRASE_REQUEST_LOCATION') {
            handleLocationRequest();
            return;
        }

        if (data?.type === 'GEOPHRASE_RESOLUTION_TOKEN') {
            stopLocationWatch();

            if (mode === 'server') {
                // Hand the raw token to the merchant for backend exchange
                safeCall(onSuccess, { token: data.token });
            } else {
                handleTokenResolution(data.token);
            }
        }
    };

    // Restrict WebView navigation to the Geophrase widget origin
    const onShouldStartLoadWithRequest = (request) => {
        try {
            if (request.url === 'about:blank' || !request.url.startsWith('http')) {
                return true;
            }
            const url = new URL(request.url);
            return url.origin === widgetOrigin;
        } catch {
            return false;
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <View style={[styles.webviewContainer, { backgroundColor }]}>
                    <WebView
                        ref={webviewRef}
                        source={getSource()}
                        onMessage={onMessage}
                        javaScriptEnabled
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                        startInLoadingState
                        renderLoading={() => (
                            <View style={[styles.loadingContainer, { backgroundColor }]}>
                                <ActivityIndicator size="large" color={spinnerColor} />
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
    },
});

export default GeophraseConnect;