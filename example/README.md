# Geophrase React Native Example

A minimal, bare React Native application demonstrating how to integrate the `@geophrase/react-native` SDK.

This example is configured to use `mode="server"`, so you only need your public **Key ID** — no secret API key. On completion it returns a secure `requestId` that your backend can exchange for the full address.

## 🚀 How to Run

### 1. Install Dependencies
Make sure you navigate into the `example` directory from the root of the repository before installing the node modules:

```bash
cd example
npm install
```

### 2. Add Your Key ID
The widget will not load without it. Create a key in your [Geophrase dashboard](https://geophrase.com/docs/api-keys), copy its 8-character **Key ID**, and replace the placeholder `apiKeyId` in `App.tsx`:

```tsx
apiKeyId="YOUR_API_KEY_ID"   // ← replace with your Key ID
```

### 3. Install iOS Pods
If you are testing on iOS, you must install the native CocoaPods for the Webview and Geolocation modules:

```bash
npx pod-install
```

### 4. Start the App
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
3. Add `apiKey="YOUR_API_KEY"` (your **secret** key) to the `<GeophraseConnect />` props. Your `apiKeyId` stays as-is — it is required in both modes.
4. Reload the app.