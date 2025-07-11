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
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Try to get the Expo push token
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          console.log('Expo Push Token:', token);
        } else {
          setErrorMessage('Could not get push token. Check permissions or device.');
        }
      })
      .catch(err => {
        console.error('Error getting push token:', err);
        setErrorMessage('Error: ' + err?.message);
      });

    // Listen for notifications received in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for when the user taps a notification
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
      <Text style={{ fontSize: 22, marginBottom: 10 }}>Push Notification Demo</Text>

      <Text style={{ marginBottom: 10 }}>Your Expo Push Token:</Text>
      {expoPushToken ? (
        <Text selectable style={{ marginBottom: 20 }}>{expoPushToken}</Text>
      ) : errorMessage ? (
        <Text style={{ color: 'red', marginBottom: 20 }}>{errorMessage}</Text>
      ) : (
        <Text style={{ marginBottom: 20 }}>Fetching token...</Text>
      )}

      <Button
        title="Trigger Local Notification"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Hey!",
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
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Constants.isDevice) {
    Alert.alert('Error', 'Must use physical device for Push Notifications');
    console.log('Not a physical device');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Error', 'Failed to get push token for push notifications!');
    console.log('Permissions not granted');
    return;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  console.log('Got Expo Push Token:', tokenData.data);
  return tokenData.data;
}
