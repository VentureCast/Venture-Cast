import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { StripeProvider as StripeProviderRN } from '@stripe/stripe-react-native';
import { useUser } from './UserProvider';
import api from './services/api';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RZC4g02gJ6pprGdxqo2SJdzGhrg5ufa1IYX2uf0WswLY6CgUMmz808LUrMfJRN6OEInbsDi8ThESEJhaIWzJ7VS00bHrGcpqW';

// Types
interface PaymentMethod {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface BankAccount {
  id: string;
  last4: string;
  bankName: string;
  status: string;
  isDefault: boolean;
}

interface Balance {
  available: number;
  pending: number;
  outboundPending?: number;
  currency: string;
}

interface AccountStatus {
  hasStripeAccount: boolean;
  stripeAccountId?: string;
  accountStatus?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  onboardingStatus: string;
  kycVerificationStatus?: string;
  hasFinancialAccount: boolean;
  financialAccountId?: string;
  canTrade: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

interface StripeContextType {
  // State
  isLoading: boolean;
  error: string | null;
  accountStatus: AccountStatus | null;
  balance: Balance | null;
  paymentMethods: PaymentMethod[];
  bankAccounts: BankAccount[];

  // Account Management
  initializeStripeAccount: () => Promise<boolean>;
  getOnboardingUrl: () => Promise<string | null>;
  refreshAccountStatus: () => Promise<void>;

  // Payment Methods
  refreshPaymentMethods: () => Promise<void>;
  getSetupIntent: () => Promise<string | null>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;
  removePaymentMethod: (id: string) => Promise<boolean>;

  // Bank Accounts
  refreshBankAccounts: () => Promise<void>;
  addBankAccount: (
    routingNumber: string,
    accountNumber: string,
    holderName?: string
  ) => Promise<boolean>;

  // Balance
  refreshBalance: () => Promise<void>;

  // Deposits
  createDeposit: (
    amount: number,
    paymentMethodId?: string
  ) => Promise<{ clientSecret: string; paymentIntentId: string } | null>;
  confirmDeposit: (paymentIntentId: string) => Promise<boolean>;

  // Withdrawals
  createWithdrawal: (
    amount: number,
    bankAccountId?: string
  ) => Promise<boolean>;

  // Computed
  canDeposit: boolean;
  canWithdraw: boolean;
  needsOnboarding: boolean;
  isPendingVerification: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useUser();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [balance, setBalance] = useState<Balance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Set user ID in API client when user changes
  useEffect(() => {
    if (user?.id) {
      api.setUserId(user.id);
      // Fetch initial data
      refreshAccountStatus();
      refreshBalance();
      refreshPaymentMethods();
      refreshBankAccounts();
    }
  }, [user?.id]);

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================
  const initializeStripeAccount = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Step 1: Create Stripe Connect account
      const accountResult = await api.createStripeAccount();
      if (!accountResult.success) {
        throw new Error('Failed to create Stripe account');
      }

      // Step 2: Create Customer for payment methods
      await api.createCustomer();

      // Step 3: Create Treasury Financial Account
      const financialResult = await api.createFinancialAccount();
      if (!financialResult.success) {
        throw new Error('Failed to create financial account');
      }

      // Refresh status
      await refreshAccountStatus();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOnboardingUrl = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getOnboardingLink(
        'venturecast://stripe/return',
        'venturecast://stripe/refresh'
      );
      return result.url;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAccountStatus = useCallback(async () => {
    try {
      const status = await api.getAccountStatus();
      setAccountStatus(status);
    } catch (err: any) {
      console.error('Error fetching account status:', err);
    }
  }, []);

  // ============================================
  // PAYMENT METHODS
  // ============================================
  const refreshPaymentMethods = useCallback(async () => {
    try {
      const result = await api.getPaymentMethods();
      setPaymentMethods(result.paymentMethods);
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
    }
  }, []);

  const getSetupIntent = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getSetupIntent();
      return result.clientSecret;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await api.setDefaultPaymentMethod(id);
        await refreshPaymentMethods();
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshPaymentMethods]
  );

  const removePaymentMethod = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await api.removePaymentMethod(id);
        await refreshPaymentMethods();
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshPaymentMethods]
  );

  // ============================================
  // BANK ACCOUNTS
  // ============================================
  const refreshBankAccounts = useCallback(async () => {
    try {
      const result = await api.getBankAccounts();
      setBankAccounts(result.bankAccounts);
    } catch (err: any) {
      console.error('Error fetching bank accounts:', err);
    }
  }, []);

  const addBankAccount = useCallback(
    async (
      routingNumber: string,
      accountNumber: string,
      holderName?: string
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await api.addBankAccount(routingNumber, accountNumber, holderName);
        await refreshBankAccounts();
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshBankAccounts]
  );

  // ============================================
  // BALANCE
  // ============================================
  const refreshBalance = useCallback(async () => {
    try {
      const result = await api.getBalance();
      setBalance({
        available: result.available,
        pending: result.pending,
        outboundPending: result.outboundPending,
        currency: result.currency,
      });
    } catch (err: any) {
      console.error('Error fetching balance:', err);
    }
  }, []);

  // ============================================
  // DEPOSITS
  // ============================================
  const createDeposit = useCallback(
    async (
      amount: number,
      paymentMethodId?: string
    ): Promise<{ clientSecret: string; paymentIntentId: string } | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.createDeposit(amount, paymentMethodId);
        return {
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
        };
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const confirmDeposit = useCallback(
    async (paymentIntentId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await api.confirmDeposit(paymentIntentId);
        await refreshBalance();
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshBalance]
  );

  // ============================================
  // WITHDRAWALS
  // ============================================
  const createWithdrawal = useCallback(
    async (amount: number, bankAccountId?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await api.createWithdrawal(amount, bankAccountId);
        await refreshBalance();
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshBalance]
  );

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const canDeposit =
    !!accountStatus?.hasStripeAccount &&
    !!accountStatus?.hasFinancialAccount &&
    paymentMethods.length > 0;

  const canWithdraw =
    !!accountStatus?.hasStripeAccount &&
    !!accountStatus?.hasFinancialAccount &&
    accountStatus?.canTrade &&
    bankAccounts.length > 0 &&
    (balance?.available || 0) > 0;

  const needsOnboarding =
    !accountStatus?.hasStripeAccount ||
    accountStatus?.onboardingStatus !== 'completed';

  const isPendingVerification =
    accountStatus?.kycVerificationStatus === 'pending';

  const value: StripeContextType = {
    isLoading,
    error,
    accountStatus,
    balance,
    paymentMethods,
    bankAccounts,
    initializeStripeAccount,
    getOnboardingUrl,
    refreshAccountStatus,
    refreshPaymentMethods,
    getSetupIntent,
    setDefaultPaymentMethod,
    removePaymentMethod,
    refreshBankAccounts,
    addBankAccount,
    refreshBalance,
    createDeposit,
    confirmDeposit,
    createWithdrawal,
    canDeposit,
    canWithdraw,
    needsOnboarding,
    isPendingVerification,
  };

  return (
    <StripeContext.Provider value={value}>{children}</StripeContext.Provider>
  );
};

// Main provider that wraps both Stripe SDK and our context
export const StripeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <StripeProviderRN
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.venturecast"
      urlScheme="venturecast"
    >
      <StripeContextProvider>{children}</StripeContextProvider>
    </StripeProviderRN>
  );
};

// Hook to use Stripe context
export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

export default StripeProvider;
