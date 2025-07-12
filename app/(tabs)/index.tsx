import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, ScrollView, Text, View } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    setDeviceInfo(`isDevice: ${Constants.isDevice}`);

    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          console.log('Expo Push Token:', token);
        } else {
          setErrorMessage('❌ Could not get push token. Check permissions or device.');
        }
      })
      .catch(err => {
        console.error('Error getting push token:', err);
        setErrorMessage('❌ Error: ' + err?.message);
      });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>Push Notification Debug</Text>

      <Text style={{ marginBottom: 5 }}>{deviceInfo}</Text>
      <Text style={{ marginBottom: 5 }}>Permission Status: {permissionStatus}</Text>

      <Text style={{ marginTop: 10, marginBottom: 10 }}>Expo Push Token:</Text>
      <Text selectable style={{ marginBottom: 20 }}>
        {expoPushToken || 'No token yet'}
      </Text>

      {errorMessage ? (
        <Text style={{ color: 'red', marginBottom: 20 }}>{errorMessage}</Text>
      ) : null}

      <Button
        title="Trigger Local Notification"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Hey!',
              body: 'This is a local notification.',
              data: { someData: 'demo' },
            },
            trigger: null,
          });
        }}
      />

      {notification && (
        <View style={{ marginTop: 30 }}>
          <Text>Last Notification:</Text>
          <Text>{JSON.stringify(notification, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );

  async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    console.log('--- Starting push token registration ---');
    console.log('Constants.isDevice:', Constants.isDevice);

    if (!Constants.isDevice) {
      Alert.alert('Error', 'Must use physical device for Push Notifications');
      console.log('❌ Not a physical device');
      setErrorMessage('❌ Not a physical device');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Existing permission status:', existingStatus);
      setPermissionStatus(existingStatus);

      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('Requested permission status:', status);
        setPermissionStatus(status);
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Error', 'Failed to get push token for push notifications!');
        console.log('❌ Permissions not granted');
        setErrorMessage('❌ Permissions not granted');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      console.log('✅ Got Expo Push Token:', tokenData.data);
      return tokenData.data;

    } catch (err) {
      console.error('❌ Error in permission flow:', err);
      setErrorMessage('❌ ' + (err as Error)?.message);
    }
  }
}
