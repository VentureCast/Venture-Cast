import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useStripe } from '../StripeProvider';

type RootStackParamList = {
  MainTabs: undefined;
};

type OnboardingStep = 'loading' | 'webview' | 'pending' | 'complete' | 'error';

const KYCOnboarding = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    accountStatus,
    initializeStripeAccount,
    getOnboardingUrl,
    refreshAccountStatus,
    isLoading,
    error,
  } = useStripe();

  const [step, setStep] = useState<OnboardingStep>('loading');
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    setStep('loading');
    setErrorMessage(null);

    try {
      // Check if user already has account status
      if (!accountStatus?.hasStripeAccount) {
        // Create Stripe account first
        const success = await initializeStripeAccount();
        if (!success) {
          throw new Error('Failed to create account');
        }
      }

      // Check current status
      await refreshAccountStatus();

      if (accountStatus?.onboardingStatus === 'completed') {
        setStep('complete');
        return;
      }

      if (accountStatus?.kycVerificationStatus === 'pending') {
        setStep('pending');
        return;
      }

      // Get onboarding URL
      const url = await getOnboardingUrl();
      if (!url) {
        throw new Error('Failed to get onboarding URL');
      }

      setOnboardingUrl(url);
      setStep('webview');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStep('error');
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;

    // Check for return URL (onboarding complete or cancelled)
    if (url.includes('venturecast://stripe/return')) {
      // User completed onboarding flow
      setStep('loading');
      await refreshAccountStatus();

      if (accountStatus?.onboardingStatus === 'completed') {
        setStep('complete');
      } else if (accountStatus?.kycVerificationStatus === 'pending') {
        setStep('pending');
      } else {
        // Need more info - restart
        setStep('loading');
        initializeOnboarding();
      }
    }

    // Check for refresh URL (user cancelled or link expired)
    if (url.includes('venturecast://stripe/refresh')) {
      // Get new onboarding link
      setStep('loading');
      initializeOnboarding();
    }
  };

  const handleOpenExternal = async () => {
    if (onboardingUrl) {
      const supported = await Linking.canOpenURL(onboardingUrl);
      if (supported) {
        await Linking.openURL(onboardingUrl);
      } else {
        Alert.alert('Error', 'Unable to open link');
      }
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#351560" />
            <Text style={styles.loadingText}>
              {isLoading ? 'Setting up your account...' : 'Loading...'}
            </Text>
          </View>
        );

      case 'webview':
        return (
          <View style={styles.webviewContainer}>
            <View style={styles.webviewHeader}>
              <Text style={styles.webviewHeaderText}>
                Complete Account Verification
              </Text>
              <TouchableOpacity onPress={handleOpenExternal}>
                <Text style={styles.openExternalText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
            <WebView
              ref={webViewRef}
              source={{ uri: onboardingUrl! }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#351560" />
                </View>
              )}
              style={styles.webview}
            />
          </View>
        );

      case 'pending':
        return (
          <View style={styles.centerContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⏳</Text>
            </View>
            <Text style={styles.title}>Verification Pending</Text>
            <Text style={styles.subtitle}>
              Your information has been submitted and is being reviewed. This
              usually takes 1-2 business days.
            </Text>
            <Text style={styles.infoText}>
              We'll notify you when your account is verified and ready to use.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.primaryButtonText}>Continue to App</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={async () => {
                setStep('loading');
                await refreshAccountStatus();
                if (accountStatus?.onboardingStatus === 'completed') {
                  setStep('complete');
                } else {
                  setStep('pending');
                }
              }}
            >
              <Text style={styles.secondaryButtonText}>Check Status</Text>
            </TouchableOpacity>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.centerContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>✅</Text>
            </View>
            <Text style={styles.title}>Account Verified!</Text>
            <Text style={styles.subtitle}>
              Congratulations! Your account has been verified and you're ready
              to start trading.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.primaryButtonText}>Start Trading</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centerContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>❌</Text>
            </View>
            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.subtitle}>
              {errorMessage || error || 'Unable to complete verification. Please try again.'}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={initializeOnboarding}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (only show for non-webview states) */}
      {step !== 'webview' && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Setup</Text>
        </View>
      )}

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    marginLeft: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#757575',
    fontFamily: 'urbanist',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    fontFamily: 'urbanist',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#A0A0A0',
    fontFamily: 'urbanist',
    textAlign: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#351560',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'urbanist',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  secondaryButtonText: {
    color: '#351560',
    fontSize: 16,
    fontFamily: 'urbanist',
  },
  webviewContainer: {
    flex: 1,
  },
  webviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  webviewHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'urbanist',
  },
  openExternalText: {
    fontSize: 14,
    color: '#351560',
    fontFamily: 'urbanist',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default KYCOnboarding;
