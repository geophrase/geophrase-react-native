# @geophrase/react-native

The official React Native SDK for **Geophrase Connect**.

Seamlessly integrate highly accurate, backend-less address and location selection into your React Native applications. This SDK handles the complex WebView bridging, native GPS permissions, and secure token resolution out of the box.

---

## 🚀 Installation

Install the package via npm or yarn:

```bash
npm install @geophrase/react-native
# or
yarn add @geophrase/react-native
```

### Peer Dependencies
Because this SDK uses native device features, you must ensure the following peer dependencies are installed in your app:

```bash
npm install react-native-webview react-native-device-info @react-native-community/geolocation
```

**For iOS:** 1. Install the CocoaPods:
   ```bash
   npx pod-install
   ```
2. Add the location privacy key to your `ios/AppName/Info.plist` file:
   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>We need your location to accurately place the delivery pin.</string>
   ```

**For Android:** Ensure your `AndroidManifest.xml` includes location permissions:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## 💻 Quick Start

The SDK is completely headless regarding your UI. You control the button, the layout, and the state; the SDK simply renders an invisible wrapper and the popup modal when requested.

```javascript
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
                <Text style={styles.buttonText}>Select Delivery Address</Text>
            </TouchableOpacity>

            <GeophraseConnect 
                visible={isWidgetOpen}
                apiKey="YOUR_API_KEY"
                orderId="ORD-12345" // Optional
                phone="9999999999"  // Optional
                onSuccess={(address) => {
                    console.log("Success:", address);
                    setAddressData(address);
                    setIsWidgetOpen(false);
                }}
                onError={(error) => {
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
    buttonText: { color: '#fff', fontWeight: 'bold' }
});
```

---

## 🏃 Running the Example App

Want to see it in action before integrating it into your own codebase? We have included a fully configured example app right in this repository.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/geophrase/geophrase-react-native.git
   cd geophrase-react-native/example
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install iOS Pods (Mac only):**
   ```bash
   npx pod-install
   ```

4. **Run the app:**
   ```bash
   npx react-native run-ios
   # or
   npx react-native run-android
   ```

---

## ⚙️ API Reference

### `GeophraseConnect` Props

| Prop | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `visible` | `boolean` | **Yes** | Controls the visibility of the Geophrase map modal. |
| `apiKey` | `string` | **Yes** | Your Geophrase Public API Key. |
| `orderId` | `string` | No | Your internal tracking ID for the order/session. |
| `phone` | `string` | No | Prefills the user's phone number in the widget. |
| `onSuccess` | `function` | **Yes** | Callback fired when the address is successfully resolved. Returns the address object. |
| `onError` | `function` | No | Callback fired if network or validation errors occur. |
| `onClose` | `function` | No | Callback fired when the user manually closes the widget. |

---

## 📚 Full Documentation

For advanced configurations, server-side token resolution, and detailed API responses, please visit the official documentation at **[business.geophrase.com/docs](https://business.geophrase.com/docs)**.