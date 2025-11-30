'use client'

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Set status bar style
export async function setStatusBarStyle(style: 'dark' | 'light' = 'dark') {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
  } catch (error) {
    console.error('Status bar error:', error);
  }
}

// Set status bar background color (Android only)
export async function setStatusBarColor(color: string = '#000000') {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.error('Status bar error:', error);
  }
}

// Show status bar
export async function showStatusBar() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.show();
  } catch (error) {
    console.error('Status bar error:', error);
  }
}

// Hide status bar
export async function hideStatusBar() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.hide();
  } catch (error) {
    console.error('Status bar error:', error);
  }
}

// Set status bar overlay (iOS only)
export async function setStatusBarOverlay(overlay: boolean = false) {
  if (Capacitor.getPlatform() !== 'ios') return;

  try {
    await StatusBar.setOverlaysWebView({ overlay });
  } catch (error) {
    console.error('Status bar error:', error);
  }
}

// Initialize status bar with app defaults
export async function initStatusBar() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await setStatusBarStyle('dark');
    await setStatusBarColor('#000000');
    await showStatusBar();
  } catch (error) {
    console.error('Status bar initialization error:', error);
  }
}


