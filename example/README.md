# Geophrase React Native Example

A minimal, bare React Native application demonstrating how to integrate the `@geophrase/react-native` SDK.

This example is configured to use `mode="server"`, meaning you can run it immediately without needing to generate a Geophrase API key. It will return a secure token upon completion.

## 🚀 How to Run

### 1. Install Dependencies
Navigate to this directory and install the node modules:

```bash
npm install
```

### 2. Install iOS Pods
If you are testing on iOS, you must install the native CocoaPods for the Webview and Geolocation modules:

```bash
cd ios
bundle exec pod install
cd ..
```

*Note: You must also add the following location permission to your `ios/AppName/Info.plist`:*

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to accurately place the delivery pin.</string>
```

### 3. Start the App
Start the Metro bundler and boot up your preferred emulator:

**For iOS:**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

## ⚙️ Testing Client Mode
If you want to test the full address resolution directly in the app:
1. Open `App.tsx`.
2. Change `mode="server"` to `mode="client"`.
3. Add `apiKey="YOUR_API_KEY"` to the `<GeophraseConnect />` props.
4. Reload the app.