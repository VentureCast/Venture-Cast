import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Alert, Button } from 'react-native';
import WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth() {
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: Constants.manifest?.extra?.googleClientId,
      redirectUri,
    },
    { useProxy: true }
  );

  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type === 'success') {
        const { authentication } = response;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: redirectUri },
        });

        if (error) Alert.alert('Login Error', error.message);
        else console.log('Auth Data:', data);
      }
    };

    handleAuthResponse();
  }, [response]);

  return <Button title="Sign in with Google" onPress={() => promptAsync()} disabled={!request} />;
}
