/**
 * VentureCast API Client
 * Centralized API client for all backend communication
 */

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.venturecast.app';

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
}

class ApiClient {
  private userId: string | null = null;
  private token: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.userId && { 'x-user-id': this.userId }),
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // ============================================
  // AUTH
  // ============================================
  async signUp(name: string, email: string, password: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request<{ token: string; userId: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // ============================================
  // STRIPE CONNECT
  // ============================================
  async createStripeAccount() {
    return this.request<{
      success: boolean;
      stripeAccountId: string;
      message: string;
    }>('/stripe/create-account', {
      method: 'POST',
    });
  }

  async createFinancialAccount() {
    return this.request<{
      success: boolean;
      financialAccountId: string;
      status: string;
      message: string;
    }>('/stripe/create-financial-account', {
      method: 'POST',
    });
  }

  async getOnboardingLink(returnUrl?: string, refreshUrl?: string) {
    return this.request<{
      success: boolean;
      url: string;
      expiresAt: number;
    }>('/stripe/onboarding-link', {
      method: 'POST',
      body: JSON.stringify({ returnUrl, refreshUrl }),
    });
  }

  async getAccountStatus() {
    return this.request<{
      hasStripeAccount: boolean;
      stripeAccountId?: string;
      accountStatus?: string;
      chargesEnabled?: boolean;
      payoutsEnabled?: boolean;
      requirements?: {
        currently_due: string[];
        eventually_due: string[];
        past_due: string[];
        pending_verification: string[];
      };
      onboardingStatus: string;
      kycVerificationStatus?: string;
      hasFinancialAccount: boolean;
      financialAccountId?: string;
      treasuryBalance?: {
        cash: { usd: number };
        inbound_pending: { usd: number };
        outbound_pending: { usd: number };
      };
      canTrade: boolean;
    }>('/stripe/account-status', {
      method: 'GET',
    });
  }

  // ============================================
  // STRIPE CUSTOMER & PAYMENT METHODS
  // ============================================
  async createCustomer() {
    return this.request<{
      success: boolean;
      customerId: string;
      message: string;
    }>('/stripe/create-customer', {
      method: 'POST',
    });
  }

  async getSetupIntent() {
    return this.request<{
      success: boolean;
      clientSecret: string;
      setupIntentId: string;
    }>('/stripe/setup-intent', {
      method: 'POST',
    });
  }

  async getPaymentMethods() {
    return this.request<{
      paymentMethods: Array<{
        id: string;
        type: string;
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
        isDefault: boolean;
      }>;
    }>('/stripe/payment-methods', {
      method: 'GET',
    });
  }

  async setDefaultPaymentMethod(paymentMethodId: string) {
    return this.request<{
      success: boolean;
      defaultPaymentMethodId: string;
    }>('/stripe/set-default-payment-method', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId }),
    });
  }

  async removePaymentMethod(paymentMethodId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/stripe/payment-method/${paymentMethodId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ============================================
  // DEPOSITS
  // ============================================
  async createDeposit(amount: number, paymentMethodId?: string) {
    return this.request<{
      success: boolean;
      clientSecret: string;
      paymentIntentId: string;
      amount: number;
    }>('/stripe/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethodId }),
    });
  }

  async confirmDeposit(paymentIntentId: string) {
    return this.request<{
      success: boolean;
      transaction: any;
      message: string;
    }>('/stripe/confirm-deposit', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }

  // ============================================
  // WITHDRAWALS
  // ============================================
  async addBankAccount(
    routingNumber: string,
    accountNumber: string,
    accountHolderName?: string,
    accountHolderType?: 'individual' | 'company'
  ) {
    return this.request<{
      success: boolean;
      bankAccount: {
        id: string;
        last4: string;
        bankName: string;
        status: string;
      };
    }>('/stripe/add-bank-account', {
      method: 'POST',
      body: JSON.stringify({
        routingNumber,
        accountNumber,
        accountHolderName,
        accountHolderType,
      }),
    });
  }

  async getBankAccounts() {
    return this.request<{
      bankAccounts: Array<{
        id: string;
        last4: string;
        bankName: string;
        status: string;
        isDefault: boolean;
      }>;
    }>('/stripe/bank-accounts', {
      method: 'GET',
    });
  }

  async createWithdrawal(amount: number, destinationAccountId?: string) {
    return this.request<{
      success: boolean;
      outboundTransferId: string;
      status: string;
      expectedArrival: string;
      transaction: any;
    }>('/stripe/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, destinationAccountId }),
    });
  }

  // ============================================
  // BALANCE
  // ============================================
  async getBalance() {
    return this.request<{
      available: number;
      pending: number;
      outboundPending?: number;
      currency: string;
      hasFinancialAccount: boolean;
      financialAccountId?: string;
    }>('/stripe/balance', {
      method: 'GET',
    });
  }

  // ============================================
  // TRANSACTIONS
  // ============================================
  async getTransactions(
    limit = 20,
    offset = 0,
    type?: 'DEPOSIT' | 'WITHDRAW' | 'BUY' | 'SELL'
  ) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(type && { type }),
    });

    return this.request<{
      transactions: Array<{
        _id: string;
        type: string;
        amount: number;
        status: string;
        createdAt: string;
        completedAt?: string;
        streamerId?: {
          name: string;
          ticker: string;
        };
        shareCount?: number;
        sharePrice?: number;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>(`/stripe/transactions?${params.toString()}`, {
      method: 'GET',
    });
  }

  // ============================================
  // INTERNAL TRANSFER (for trading)
  // ============================================
  async createTransfer(
    amount: number,
    description?: string,
    metadata?: Record<string, any>
  ) {
    return this.request<{
      success: boolean;
      transactionId: string;
      newBalance: number;
      transaction: any;
    }>('/stripe/transfer', {
      method: 'POST',
      body: JSON.stringify({ amount, description, metadata }),
    });
  }

  // ============================================
  // TRADING
  // ============================================
  async buyShares(streamerId: string, shareCount: number, maxPrice?: number) {
    return this.request<{
      success: boolean;
      transaction: {
        id: string;
        type: string;
        shareCount: number;
        pricePerShare: number;
        totalCost: number;
        newBalance: number;
        createdAt: string;
      };
      portfolio: {
        streamerId: string;
        sharesOwned: number;
        averageCost: number;
      };
    }>('/trade/buy', {
      method: 'POST',
      body: JSON.stringify({ streamerId, shareCount, maxPrice }),
    });
  }

  async sellShares(streamerId: string, shareCount: number, minPrice?: number) {
    return this.request<{
      success: boolean;
      transaction: {
        id: string;
        type: string;
        shareCount: number;
        pricePerShare: number;
        totalProceeds: number;
        newBalance: number;
        createdAt: string;
      };
      portfolio: {
        streamerId: string;
        sharesOwned: number;
        averageCost: number;
      };
    }>('/trade/sell', {
      method: 'POST',
      body: JSON.stringify({ streamerId, shareCount, minPrice }),
    });
  }

  async getPortfolio(userId: string) {
    return this.request<{
      portfolio: Array<{
        streamer: {
          _id: string;
          name: string;
          platform: string;
          subscriberCount: number;
        };
        sharesOwned: number;
        averageCost: number;
        currentPrice: number;
        currentValue: number;
        totalCost: number;
        gainLoss: number;
        gainLossPercent: string;
      }>;
      summary: {
        totalValue: number;
        totalCost: number;
        totalGainLoss: number;
        totalGainLossPercent: string;
        cashBalance: number;
        totalAccountValue: number;
      };
    }>(`/portfolio/${userId}`, {
      method: 'GET',
    });
  }

  async getShareInfo(streamerId: string) {
    return this.request<{
      streamerId: string;
      sharePrice: number;
      totalShares: number;
      marketCap: number;
      priceHistory?: {
        day1: number | null;
        day2: number | null;
        day3: number | null;
        day4: number | null;
        day5: number | null;
        day6: number | null;
        day7: number | null;
      };
      exists: boolean;
      updatedAt?: string;
    }>(`/shares/${streamerId}`, {
      method: 'GET',
    });
  }

  async getTradeHistory(userId: string, limit = 50, offset = 0) {
    return this.request<{
      transactions: Array<{
        id: string;
        type: string;
        streamer: { name: string; platform: string };
        shareCount: number;
        sharePrice: number;
        amount: number;
        status: string;
        createdAt: string;
      }>;
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(`/trade/history/${userId}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getUserProfile(userId: string) {
    return this.request<any>(`/users/${userId}`, {
      method: 'GET',
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me', {
      method: 'GET',
    });
  }

  // ============================================
  // STREAMERS
  // ============================================
  async getStreamers() {
    return this.request<{
      streamers: Array<{
        _id: string;
        id: string;
        name: string;
        platform: string;
        profileImageUrl?: string;
        followerCount?: number;
        category?: string;
        sharePrice: number;
        totalShares: number;
        marketCap: number;
      }>;
    }>('/streamer', {
      method: 'GET',
    });
  }

  async getStreamer(streamerId: string) {
    return this.request<{
      _id: string;
      id: string;
      name: string;
      platform: string;
      ticker: string;
      profileImageUrl?: string;
      followerCount?: number;
      sharePrice: number;
      totalShares: number;
      marketCap: number;
    }>(`/streamer/${streamerId}`, {
      method: 'GET',
    });
  }

  async searchStreamers(query: string) {
    return this.request<{
      streamers: Array<{
        _id: string;
        id: string;
        name: string;
        platform: string;
        ticker: string;
        profileImageUrl?: string;
        sharePrice: number;
      }>;
    }>(`/streamer/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
  }

  async getCategories() {
    return this.request<{
      categories: Array<{
        id: string;
        name: string;
      }>;
    }>('/streamer/categories', {
      method: 'GET',
    });
  }

  // ============================================
  // WATCHLIST
  // ============================================
  async getWatchlist() {
    return this.request<{
      watchlist: Array<{
        _id: string;
        streamerId: string;
        addedAt: string;
        name: string;
        ticker: string;
        platform: string;
        profileImageUrl: string | null;
        category: string | null;
        sharePrice: number;
        day1Price: number | null;
        marketCap: number;
      }>;
    }>('/watchlist', {
      method: 'GET',
    });
  }

  async addToWatchlist(streamerId: string) {
    return this.request<{
      success: boolean;
      watchlistItem: {
        _id: string;
        streamerId: string;
        addedAt: string;
      };
    }>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ streamerId }),
    });
  }

  async removeFromWatchlist(streamerId: string) {
    return this.request<{ success: boolean }>(`/watchlist/${streamerId}`, {
      method: 'DELETE',
    });
  }

  async isInWatchlist(streamerId: string) {
    return this.request<{ inWatchlist: boolean }>(`/watchlist/check/${streamerId}`, {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
