'use client'

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Haptic feedback for different actions
export async function hapticsImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch (error) {
    console.error('Haptics error:', error);
  }
}

// Haptic notification feedback
export async function hapticsNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: typeMap[type] });
  } catch (error) {
    console.error('Haptics error:', error);
  }
}

// Haptic selection feedback (for pickers/toggles)
export async function hapticsSelection() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch (error) {
    console.error('Haptics error:', error);
  }
}

// Haptic vibration pattern
export async function hapticsVibrate(duration: number = 300) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Haptics.vibrate({ duration });
  } catch (error) {
    console.error('Haptics error:', error);
  }
}



