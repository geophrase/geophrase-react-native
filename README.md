# @geophrase/react-native

![npm version](https://img.shields.io/npm/v/@geophrase/react-native)
![license](https://img.shields.io/npm/l/@geophrase/react-native)

Drop-in address selector for React Native apps serving Indian customers. Captures perfectly structured addresses and GPS coordinates to reduce Return to Origin (RTO) costs.

📖 **[Full documentation and integration guide](https://business.geophrase.com/docs)**

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

The snippet below uses `mode="server"` so you can drop it into your app and see the widget **without creating an API key first**. Switching to client mode is a two-line change — see the inline comment.

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

                // 'server' (used here): widget returns a token. Pass it to your backend to resolve the address. No apiKey needed.
                // 'client' (default):   widget resolves and returns the full address directly. Requires 'apiKey'.
                mode="server"

                // apiKey="YOUR_API_KEY"    // required when mode="client"
                theme="system"              // 'light' | 'dark' | 'system'
                orderId="ORD-98765"         // your internal reference ID
                phone="9999999999"          // prefills the phone field

                onSuccess={(result) => {
                    // server mode → { token: "..." }. POST to your backend.
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
| `mode` | `string` | `'client'` | No | `'client'` resolves the address in the app. `'server'` returns a token for your backend to exchange. |
| `apiKey` | `string` | - | **Conditional** | Your [Geophrase API key](https://business.geophrase.com/docs/api-keys). Required when `mode="client"`. |
| `theme` | `string` | `'system'` | No | `'light'`, `'dark'`, or `'system'` (follows OS preference). |
| `orderId` | `string` | - | No | Your internal reference ID for this session. |
| `phone` | `string` | - | No | Pre-fills the phone field with a 10-digit Indian mobile number. |
| `onSuccess` | `function` | - | **Yes** | Receives an `Address` object in client mode, or `{ token }` in server mode. |
| `onError` | `function` | - | No | Receives `{ type, status?, message }` on API or network errors. |
| `onClose` | `function` | - | No | Called when the user dismisses the widget without selecting an address. |

> The credential prop is named `apiKey` rather than `key` because `key` is reserved by React for list reconciliation.

TypeScript definitions (`GeophraseConnectProps`, `GeophraseAddress`, `GeophraseToken`, `GeophraseError`) ship with the package.

---

## Response payloads

### Client mode

```json
{
  "phrase": "eid-hiu-sac",
  "verified_account_mobile_num": "9999999999",
  "address_type": "OFFICE",
  "contact_full_name": "Rohan",
  "contact_mobile_num": "9999999999",
  "address_line_one": "Floor 99",
  "address_line_two": "GTB Building",
  "landmark": "Map: gphr.in/eid-hiu-sac",
  "city": "Delhi",
  "state": "Delhi",
  "postal_code": 110007,
  "latitude": 16.241303391104953,
  "longitude": 99.7836155238037,
  "digi_pin": "202-P85-M87C",
  "qr_code": "https://storage.googleapis.com/geophrase/qr-codes/eid-hiu-sac.png"
}
```

### Server mode

```json
{
  "token": "d098dc34-8995-4c07-b10c-1abcade94651"
}
```

Pass this token to your backend, where you can exchange it for the full address object using your Geophrase API key.

---

## Which mode should I use?

**Have a backend? Use `mode="server"`.** Your API key stays on your server. Combined with server IP whitelisting in the Geophrase dashboard, only requests from your own backend can use the key — the most secure configuration.

**No backend? Use `mode="client"` with strict restrictions.** The SDK automatically sends your app's Bundle Identifier (iOS) or Package Name (Android) with every request. Bind your API key to those in the Geophrase dashboard, and a key lifted from your binary is useless in a different app.