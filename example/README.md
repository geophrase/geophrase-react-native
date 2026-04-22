# Geophrase React Native Example

A minimal, bare React Native application demonstrating how to integrate the `@geophrase/react-native` SDK.

This example is configured to use `mode="server"`, meaning you can run it immediately without needing to generate a Geophrase API key. It will return a secure token upon completion.

## 🚀 How to Run

### 1. Install Dependencies
Make sure you navigate into the `example` directory from the root of the repository before installing the node modules:

```bash
cd example
npm install
```

### 2. Install iOS Pods
If you are testing on iOS, you must install the native CocoaPods for the Webview and Geolocation modules:

```bash
npx pod-install
```

### 3. Start the App
You will need two terminal windows to run the app.

**Terminal 1: Start the Metro Bundler**
Leave this terminal open and running in the background:
```bash
npm start
```

**Terminal 2: Boot the Emulator**
In a new terminal window, build and launch the app:

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