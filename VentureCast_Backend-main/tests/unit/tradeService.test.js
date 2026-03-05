const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestUser, createTestStreamer, createTestShare } = require('../helpers/fixtures');

let executeBuy, executeSell, getPortfolio, getShareInfo, getTradeHistory, TradeError;

beforeAll(async () => {
  await connectTestDB();
  // Import after DB connection so models register properly
  ({ TradeError, executeBuy, executeSell, getPortfolio, getShareInfo, getTradeHistory } =
    require('../../services/tradeService'));
  // Wait for all model indexes to be built before running transaction tests
  const User = require('../../models/User');
  const Transaction = require('../../models/Transaction');
  const Share = require('../../models/Shares');
  const Streamer = require('../../models/streamer');
  await User.init();
  await Transaction.init();
  await Share.init();
  await Streamer.init();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('executeBuy', () => {
  it('should execute a buy order successfully', async () => {
    const user = await createTestUser();
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 10, totalShares: 1000000 });

    const result = await executeBuy(user._id, streamer._id.toString(), 5);

    expect(result.transaction.type).toBe('BUY');
    expect(result.transaction.shareCount).toBe(5);
    expect(result.transaction.pricePerShare).toBe(10);
    expect(result.portfolio.sharesOwned).toBe(5);
  });

  it('should throw on insufficient funds', async () => {
    const user = await createTestUser({
      treasuryBalance: { available: 100, pending: 0, currency: 'usd' },
    });
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 100, totalShares: 1000000 });

    await expect(
      executeBuy(user._id, streamer._id.toString(), 100)
    ).rejects.toThrow('Insufficient funds');
  });

  it('should throw on unverified KYC', async () => {
    const user = await createTestUser({ kycVerificationStatus: 'unverified' });
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id);

    await expect(
      executeBuy(user._id, streamer._id.toString(), 1)
    ).rejects.toThrow('KYC verification required');
  });

  it('should throw on invalid streamerId', async () => {
    const user = await createTestUser();
    const fakeId = '507f1f77bcf86cd799439011';

    await expect(
      executeBuy(user._id, fakeId, 1)
    ).rejects.toThrow('Streamer not found');
  });

  it('should throw when price exceeds maxPrice', async () => {
    const user = await createTestUser();
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 50 });

    await expect(
      executeBuy(user._id, streamer._id.toString(), 1, 10)
    ).rejects.toThrow('Price limit exceeded');
  });
});

describe('executeSell', () => {
  it('should execute a sell order successfully', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 15 });
    const user = await createTestUser({
      portfolio: [{ streamerId: streamer._id, sharesOwned: 10, averageCost: 10 }],
    });

    const result = await executeSell(user._id, streamer._id.toString(), 5);

    expect(result.transaction.type).toBe('SELL');
    expect(result.transaction.shareCount).toBe(5);
    expect(result.portfolio.sharesOwned).toBe(5);
  });

  it('should throw on insufficient shares', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id);
    const user = await createTestUser({
      portfolio: [{ streamerId: streamer._id, sharesOwned: 2, averageCost: 10 }],
    });

    await expect(
      executeSell(user._id, streamer._id.toString(), 10)
    ).rejects.toThrow('Insufficient shares');
  });

  it('should remove holding when all shares are sold', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 10 });
    const user = await createTestUser({
      portfolio: [{ streamerId: streamer._id, sharesOwned: 5, averageCost: 10 }],
    });

    const result = await executeSell(user._id, streamer._id.toString(), 5);
    expect(result.portfolio.sharesOwned).toBe(0);
  });
});

describe('getPortfolio', () => {
  it('should return enriched portfolio with gain/loss', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 20 });
    const user = await createTestUser({
      portfolio: [{ streamerId: streamer._id, sharesOwned: 10, averageCost: 10 }],
    });

    const result = await getPortfolio(user._id);

    expect(result.portfolio).toHaveLength(1);
    expect(result.portfolio[0].currentPrice).toBe(20);
    expect(result.portfolio[0].gainLoss).toBe(100); // (20-10)*10
    expect(result.summary.totalValue).toBe(200);
  });

  it('should return empty portfolio', async () => {
    const user = await createTestUser({ portfolio: [] });
    const result = await getPortfolio(user._id);
    expect(result.portfolio).toHaveLength(0);
  });
});

describe('getShareInfo', () => {
  it('should return share data for existing share', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 25 });

    const result = await getShareInfo(streamer._id.toString());

    expect(result.sharePrice).toBe(25);
    expect(result.exists).toBe(true);
  });

  it('should return defaults for nonexistent share record', async () => {
    const streamer = await createTestStreamer();
    const result = await getShareInfo(streamer._id.toString());

    expect(result.sharePrice).toBe(10);
    expect(result.exists).toBe(false);
  });

  it('should throw for invalid streamer', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    await expect(getShareInfo(fakeId)).rejects.toThrow('Streamer not found');
  });
});

describe('getTradeHistory', () => {
  it('should return paginated trade history', async () => {
    const user = await createTestUser();
    const result = await getTradeHistory(user._id.toString());

    expect(result.transactions).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.hasMore).toBe(false);
  });
});
