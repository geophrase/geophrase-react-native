# @geophrase/react-native

![npm version](https://img.shields.io/npm/v/@geophrase/react-native)
![license](https://img.shields.io/npm/l/@geophrase/react-native)

Drop-in address selector for React Native apps serving Indian customers. Captures perfectly structured addresses and GPS coordinates to reduce Return to Origin (RTO) costs.

📖 **[Full documentation and integration guide](https://geophrase.com/docs)**

*Also building for web? See [`@geophrase/core`](https://www.npmjs.com/package/@geophrase/core) and [`@geophrase/react`](https://www.npmjs.com/package/@geophrase/react).*

---

## Install

```bash
npm install @geophrase/react-native react-native-webview react-native-device-info @react-native-community/geolocation
```

### iOS

```bash
npx pod-install
```

Add to `ios/AppName/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to accurately place the delivery pin.</string>
```

### Android

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## Quick Start

The snippet below uses `mode="server"`, so the only credential you need in the app is your public **Key ID** — no secret API key. Switching to client mode is a two-line change — see the inline comment.

```jsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { GeophraseConnect } from '@geophrase/react-native';

export default function Checkout() {
    const [visible, setVisible] = useState(false);
    const [result, setResult] = useState(null);

    return (
        <View>
            <Button title="Select Delivery Location" onPress={() => setVisible(true)} />

            <GeophraseConnect
                visible={visible}

                apiKeyId="YOUR_API_KEY_ID"     // required in both modes — your public Key ID

                // 'server' (used here): widget returns a requestId. Pass it to your backend to resolve the address. No secret key needed.
                // 'client' (default):   widget resolves and returns the full address directly. Requires 'apiKey'.
                mode="server"

                // apiKey="YOUR_API_KEY"    // secret key, required when mode="client"
                theme="system"              // 'light' | 'dark' | 'system'
                orderId="ORD-98765"         // your internal reference ID
                phone="9999999999"          // prefills the phone field

                onSuccess={(result) => {
                    // server mode → { requestId: "..." }. POST to your backend.
                    // client mode → full address object.
                    setResult(result);
                    setVisible(false);
                }}
                onError={(error) => console.error('Geophrase error:', error.message)}
                onClose={() => setVisible(false)}
            />
        </View>
    );
}
```

---

## Props

| Prop | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `visible` | `boolean` | - | **Yes** | Controls the visibility of the widget modal. |
| `apiKeyId` | `string` | - | **Yes** | Your 8-character public [Key ID](https://geophrase.com/docs/api-keys) (shown in the dashboard). Required in **both** modes; identifies your account to the widget. |
| `mode` | `string` | `'client'` | No | `'client'` resolves the address in the app. `'server'` returns a token for your backend to exchange. |
| `apiKey` | `string` | - | **Conditional** | Your secret [Geophrase API key](https://geophrase.com/docs/api-keys) (the full key string). Required when `mode="client"`. |
| `theme` | `string` | `'system'` | No | `'light'`, `'dark'`, or `'system'` (follows OS preference). |
| `orderId` | `string` | - | No | Your internal reference ID for this session. |
| `phone` | `string` | - | No | Pre-fills the phone field with a 10-digit Indian mobile number. |
| `onSuccess` | `function` | - | **Yes** | Receives an `Address` object in client mode, or `{ requestId }` in server mode. |
| `onError` | `function` | - | No | Receives `{ type, status?, message }` on API or network errors. |
| `onClose` | `function` | - | No | Called when the user dismisses the widget without selecting an address. |

> Two distinct credentials: `apiKeyId` is your **public** Key ID (safe to ship in the app, required in both modes), while `apiKey` is your **secret** key (client mode only). The secret prop is named `apiKey` rather than `key` because `key` is reserved by React for list reconciliation.

TypeScript definitions (`GeophraseConnectProps`, `GeophraseAddress`, `GeophraseRequestId`, `GeophraseError`) ship with the package.

---

## Response payloads

### Client mode

```json
{
  "short_code": "e6v9th",
  "short_link": "https://gphr.in/e6v9th",
  "qr_code": "https://storage.googleapis.com/geophrase/qr-codes/e6v9th.png",
  "captured_at": 1778485231452,
  "order_id": "ORD-8786",
  "address": {
    "city": "Dhubri",
    "state": "Assam",
    "digi_pin": "272-P83-4648",
    "landmark": "Map: gphr.in/e6v9th",
    "latitude": 26.2510677,
    "longitude": 89.7746059,
    "postal_code": 783335,
    "address_type": "HOUSE",
    "address_line_one": "sdcsdc",
    "address_line_two": "sdcdfvcsdcsdc",
    "contact_full_name": "sdcsdc",
    "verified_mobile_num": "9999999999"
  }
}
```

All fields are always present. `order_id` is an empty string when `orderId` was not supplied as a prop. `landmark` and `address_line_two` may be empty strings. No field is ever `null`.

### Server mode

```json
{
  "requestId": "6cafc00f-30ff-48f8-97c2-61e3da8f0acf"
}
```

Pass this `requestId` to your backend, where you can exchange it for the full address object using your Geophrase API key.

---

## Which mode should I use?

**Have a backend? Use `mode="server"`.** Your API key stays on your server. Combined with server IP whitelisting in the Geophrase dashboard, only requests from your own backend can use the key — the most secure configuration.

**No backend? Use `mode="client"` with strict restrictions.** The SDK automatically sends your app's Bundle Identifier (iOS) or Package Name (Android) with every request. Restrict your key to it in the Geophrase dashboard, and a key lifted from your binary is useless in a different app. A key carries only one restriction type, so create a **separate key for iOS and Android**.