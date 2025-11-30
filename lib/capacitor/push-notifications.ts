'use client'

import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface PushNotificationConfig {
  onRegistered?: (token: string) => void;
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationActionPerformed?: (notification: ActionPerformed) => void;
  onRegistrationError?: (error: any) => void;
}

export async function initPushNotifications(config: PushNotificationConfig = {}) {
  // Only run on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only available on native platforms');
    return false;
  }

  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      config.onRegistered?.(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
      config.onRegistrationError?.(error);
    });

    // Listen for foreground notifications
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      config.onNotificationReceived?.(notification);
    });

    // Listen for notification actions (tap/swipe)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
      config.onNotificationActionPerformed?.(notification);
    });

    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
}

export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Remove all listeners
    await PushNotifications.removeAllListeners();
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
  }
}

export async function getPushNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return 'denied';

  try {
    const permission = await PushNotifications.checkPermissions();
    return permission.receive;
  } catch (error) {
    console.error('Error checking push notification permission:', error);
    return 'denied';
  }
}


