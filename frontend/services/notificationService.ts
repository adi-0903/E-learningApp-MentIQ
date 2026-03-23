import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
const isAndroid = Platform.OS === 'android';

// Handle notification behavior when app is in foreground
if (!(isExpoGo && isAndroid)) {
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

export async function registerForPushNotificationsAsync() {
  let token;

  if (isExpoGo && isAndroid) {
    console.log('Push notifications are disabled in Expo Go on Android.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
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
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
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
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) => {
  // Notification received while app is running
  let subscription: Notifications.Subscription | null = null;
  try {
    subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
      if (onNotificationReceived) onNotificationReceived(notification);
    });
  } catch (e) {
    console.warn('Could not add notification received listener:', e);
  }

  // Notification tapped/interacted with
  let responseSubscription: Notifications.Subscription | null = null;
  try {
    responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Tapped:', response);
      if (onNotificationResponse) onNotificationResponse(response);
    });
  } catch (e) {
    console.warn('Could not add notification response listener:', e);
  }

  return () => {
    if (subscription) subscription.remove();
    if (responseSubscription) responseSubscription.remove();
  };
};
