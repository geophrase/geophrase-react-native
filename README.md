# @geophrase/react-native

![npm version](https://img.shields.io/npm/v/@geophrase/react-native)
![license](https://img.shields.io/npm/l/@geophrase/react-native)

The official React Native SDK for **Geophrase Connect**.

Seamlessly integrate highly accurate, backend-less address and location selection into your React Native applications. This SDK handles the complex WebView bridging, native GPS permissions, and secure token resolution out of the box.

## 🧠 How It Works

1. You open the Geophrase modal using the `visible` prop.
2. The user selects their precise location on the map.
3. The SDK automatically resolves the token securely.
4. You receive the final address object in `onSuccess`.

---

## 🚀 Installation

Install the package via npm or yarn:

~~~bash
npm install @geophrase/react-native
~~~

### Peer Dependencies
Because this SDK uses native device features, you must ensure the following peer dependencies are installed in your app:

~~~bash
npm install react-native-webview react-native-device-info @react-native-community/geolocation
~~~

**For iOS:** 1. Install the CocoaPods:
~~~bash
npx pod-install
~~~
2. Add the location privacy key to your `ios/AppName/Info.plist` file:
~~~xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to accurately place the delivery pin.</string>
~~~

**For Android:** Ensure your `AndroidManifest.xml` includes location permissions:
~~~xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
~~~

---

## 💻 Quick Start

The SDK is completely headless regarding your UI. You control the button, the layout, and the state; the SDK simply renders an invisible wrapper and the popup modal when requested.

~~~javascript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { GeophraseConnect } from '@geophrase/react-native';

export default function App() {
    const [isWidgetOpen, setIsWidgetOpen] = useState(false);
    const [addressData, setAddressData] = useState(null);

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.button} 
                onPress={() => setIsWidgetOpen(true)}
            >
                <Text style={styles.buttonText}>Select Exact Delivery Location</Text>
            </TouchableOpacity>

            <GeophraseConnect 
                visible={isWidgetOpen}
                mode="client"       // 'client' (default) or 'server'
                theme="system"      // 'light', 'dark', or 'system'
                apiKey="YOUR_API_KEY" // Required for client mode
                orderId="ORD-12345" 
                phone="9999999999"  
                onSuccess={(result) => {
                    // Result is Address (Client mode) or Token (Server mode)
                    console.log("Success:", result);
                    setAddressData(result);
                    setIsWidgetOpen(false);
                }}
                onError={(error) => {
                    console.error("Geophrase Error:", error.message);
                }}
                onClose={() => setIsWidgetOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    button: { backgroundColor: '#000', padding: 15, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold' }
});
~~~

---

## ⚙️ API Reference

### `GeophraseConnect` Props

| Prop | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `visible` | `boolean` | **Yes** | Controls the visibility of the Geophrase map modal. |
| `mode` | `string` | No | `'client'` (default) or `'server'`. Determines architectural flow. |
| `theme` | `string` | No | `'light'`, `'dark'`, or `'system'`. Controls WebView background. |
| `apiKey` | `string` | **Cond.** | Your API Key. **Required if `mode` is `'client'`.** Omit for server mode. |
| `orderId` | `string` | No | Your internal tracking ID for the order/session. |
| `phone` | `string` | No | Prefills the user's phone number in the widget. |
| `onSuccess` | `function` | **Yes** | Returns an `Address` (`client`) or `Token` (`server`). |
| `onError` | `function` | No | Callback fired if network or validation errors occur. |
| `onClose` | `function` | No | Callback fired when the user manually closes the widget. |

---

## 📦 Data Structures

### 1. Client Mode Payload (Default)
When `mode="client"`, the SDK resolves the full geographic data directly:
~~~json
{
  "phrase": "eid-hiu-sac",
  "address_type": "OFFICE",
  "contact_full_name": "Rohan",
  "contact_mobile_num": "9999999999",
  "address_line_one": "Floor 99",
  "address_line_two": "GTB Building",
  "city": "Delhi",
  "state": "Delhi",
  "postal_code": 110007,
  "latitude": 16.241303391104953,
  "longitude": 99.7836155238037
}
~~~

### 2. Server Mode Payload (Token Exchange Flow)
When `mode="server"`, the SDK safely halts before exposing API logic to the frontend and returns a secure token:
~~~json
{
  "token": "gphr_tok_5f8a9b2c1d4e..."
}
~~~
*You must then pass this token to your backend server, where you can securely exchange it for the full address object using your API Key.*

---

## 🔒 Security Note

**The Client-Side Flow (`mode="client"`):**
The `apiKey` used in the frontend configuration is your Geophrase API Key. Because React Native code can be reverse-engineered, you **must** actively protect your keys from unauthorized use. In your Geophrase Business Dashboard, generate a uniquely restricted API Key specifically bound to your app's Bundle Identifier (`com.yourapp.bundle`) or Android Package Name.

**The Server-Side Flow (`mode="server"`):**
While we use strict bundle/package restrictions to protect your API keys in client mode, the absolute best practice—if your mobile app communicates with a backend—is to keep your API keys entirely out of the application binary. By using Server Mode, you omit the `apiKey` prop completely. The SDK returns a secure token to the app, which you then safely resolve from your own backend server.

---

## 📚 Full Documentation

For advanced configurations, server-side token resolution, and detailed API responses, please visit the official documentation at **[business.geophrase.com/docs](https://business.geophrase.com/docs)**.