import type * as NotificationsType from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
const isAndroid = Platform.OS === 'android';

// Only import notifications if we are not in Expo Go on Android, 
// to avoid the SDK 53 "removed from Expo Go" error
let Notifications: typeof NotificationsType | null = null;
if (!(isExpoGo && isAndroid)) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    console.warn('Notifications module failed to load:', e);
  }
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (isExpoGo && isAndroid) {
    console.log('Push notifications are disabled in Expo Go on Android.');
    return null;
  }

  if (Platform.OS === 'android' && Notifications) {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice && Notifications) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted' && Notifications) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    // Get the token for this device
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        throw new Error('EAS project ID not found in app.json');
      }
      
      if (Notifications) {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })).data;
      }
      console.log('Push Token Generated:', token);
    } catch (e) {
      console.error('Error fetching push token:', e);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  return token;
}

/**
 * Hook or setup to listen for notifications
 */
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: NotificationsType.Notification) => void,
  onNotificationResponse?: (response: NotificationsType.NotificationResponse) => void
) => {
  // Notification received while app is running
  let subscription: any = null;
  try {
    if (Notifications) {
      subscription = Notifications.addNotificationReceivedListener((notification: any) => {
        console.log('Notification Received:', notification);
        if (onNotificationReceived) onNotificationReceived(notification);
      });
    }
  } catch (e) {
    console.warn('Could not add notification received listener:', e);
  }

  // Notification tapped/interacted with
  let responseSubscription: any = null;
  try {
    if (Notifications) {
      responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log('Notification Tapped:', response);
        if (onNotificationResponse) onNotificationResponse(response);
      });
    }
  } catch (e) {
    console.warn('Could not add notification response listener:', e);
  }

  return () => {
    if (subscription) subscription.remove();
    if (responseSubscription) responseSubscription.remove();
  };
};
