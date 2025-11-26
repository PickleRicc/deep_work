'use client'

import { Capacitor } from '@capacitor/core';

// Export native API utilities
export * from './push-notifications';
export * from './haptics';
export * from './status-bar';

// Check if running on native platform
export function isNative() {
  return Capacitor.isNativePlatform();
}

// Get platform (ios, android, or web)
export function getPlatform() {
  return Capacitor.getPlatform();
}

// Check if running on iOS
export function isIOS() {
  return Capacitor.getPlatform() === 'ios';
}

// Check if running on Android
export function isAndroid() {
  return Capacitor.getPlatform() === 'android';
}

// Check if running on web
export function isWeb() {
  return Capacitor.getPlatform() === 'web';
}

