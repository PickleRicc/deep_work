# Capacitor Mobile App Setup Guide

## ✅ Completed Setup

The following has been completed:

1. ✅ Capacitor core and plugins installed
2. ✅ iOS and Android native projects generated
3. ✅ Native push notifications API wrapper created
4. ✅ Haptics and status bar utilities added
5. ✅ Configuration files created

## 📱 Current Architecture

This app uses **Capacitor with Next.js dev server approach** because the app has API routes that can't be statically exported.

### Development Workflow

```bash
# 1. Start Next.js dev server
npm run dev

# 2. Get your machine's IP address (required for mobile testing)
# Windows: ipconfig
# Mac/Linux: ifconfig

# 3. Update capacitor.config.ts with your IP:
# server: {
#   url: 'http://YOUR-IP:3000',
#   cleartext: true
# }

# 4. Sync changes to native projects
npx cap sync

# 5. Run on device/simulator
npx cap run ios --livereload --external
npx cap run android --livereload --external
```

### Production Deployment

For production, you'll need to:
1. Deploy the Next.js app to a server (Vercel, AWS, etc.)
2. Update `capacitor.config.ts` to point to the production URL
3. Build and submit to app stores

## 🎨 Next Steps: App Icons

### Required Icon Sizes

#### iOS
- App Store: 1024x1024px (PNG, no transparency)
- Device icons: Multiple sizes generated from 1024x1024

#### Android
- Play Store: 512x512px (PNG, 32-bit with transparency)
- Adaptive icons: 432x432px foreground + 108x108px background

### Creating Icons

1. **Design a 1024x1024px icon** with your app's logo
2. **Use a tool to generate all sizes:**
   - [Icon Kitchen](https://icon.kitchen/)
   - [App Icon Generator](https://appicon.co/)
   - [Figma/Sketch export scripts]

3. **Place icons in:**
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Android: `android/app/src/main/res/mipmap-*/`

## 🏗️ Building for App Stores

### iOS Build (Requires macOS)

#### Prerequisites
- macOS computer
- Xcode installed
- Apple Developer Account ($99/year)
- Code signing certificates configured

#### Steps
```bash
# 1. Open iOS project in Xcode
npx cap open ios

# 2. In Xcode:
# - Select your development team
# - Update bundle identifier (com.deepwork.app)
# - Configure app version and build number
# - Product > Archive
# - Distribute App > App Store Connect
```

### Android Build

#### Prerequisites
- Android Studio installed
- Google Play Developer Account ($25 one-time)
- Signing keystore generated

#### Steps
```bash
# 1. Generate signing key (one-time)
keytool -genkey -v -keystore deep-work-release.keystore -alias deep-work -keyalg RSA -keysize 2048 -validity 10000

# 2. Configure signing in android/app/build.gradle

# 3. Open Android project
npx cap open android

# 4. In Android Studio:
# - Build > Generate Signed Bundle/APK
# - Select Android App Bundle (.aab)
# - Upload to Play Console
```

## 📦 Native Features Integration

### Using Native APIs in Your App

```typescript
import { 
  isNative, 
  initPushNotifications, 
  hapticsImpact, 
  initStatusBar 
} from '@/lib/capacitor';

// In your app initialization (e.g., app/layout.tsx)
useEffect(() => {
  if (isNative()) {
    // Initialize native features
    initStatusBar();
    initPushNotifications({
      onRegistered: (token) => console.log('Push token:', token),
      onNotificationReceived: (notification) => console.log('Notification:', notification)
    });
  }
}, []);

// Add haptics to button clicks
const handleTaskComplete = async () => {
  await hapticsImpact('medium');
  // ... rest of your logic
};
```

## 🔧 Troubleshooting

### CocoaPods Warning (iOS)
If you see CocoaPods warnings, install it:
```bash
sudo gem install cocoapods
cd ios/App
pod install
```

### Build Errors
- Clean build folders: `npx cap sync`
- Reinstall dependencies: `npm install`
- Check Xcode/Android Studio console for specific errors

### Live Reload Not Working
- Ensure your mobile device is on the same network
- Check firewall settings allow port 3000
- Use your machine's actual IP, not localhost

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

## 🎯 Testing Checklist

Before submitting to stores:

### Functionality
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] API calls succeed
- [ ] Push notifications work
- [ ] Haptic feedback on key actions
- [ ] Status bar styled correctly
- [ ] Offline mode (if applicable)

### Performance
- [ ] App loads in < 3 seconds
- [ ] Smooth scrolling and animations
- [ ] No memory leaks
- [ ] Battery usage reasonable

### Design
- [ ] App icons look good on all sizes
- [ ] Splash screen displays correctly
- [ ] Safe areas respected (notch, home indicator)
- [ ] Dark/light mode support (if applicable)

### Store Requirements
- [ ] App description written
- [ ] Screenshots prepared (multiple device sizes)
- [ ] Privacy policy URL provided
- [ ] App category selected
- [ ] Age rating completed
- [ ] Keywords/tags added

## 🚀 Deployment Checklist

1. Update app version in:
   - `capacitor.config.ts`
   - `ios/App/App.xcodeproj/project.pbxproj` (CFBundleShortVersionString)
   - `android/app/build.gradle` (versionName and versionCode)

2. Build for production:
   - iOS: Archive in Xcode
   - Android: Generate signed bundle

3. Upload to stores:
   - iOS: Upload to App Store Connect, submit for review
   - Android: Upload to Play Console, roll out to production

4. Monitor:
   - Check for crash reports
   - Monitor user reviews
   - Track download numbers

Good luck with your app submission! 🎉



