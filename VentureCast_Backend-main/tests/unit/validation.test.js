const { buySchema, sellSchema, tradeHistoryQuery, userIdParam } = require('../../middleware/schemas/tradeSchemas');
const { depositSchema, withdrawSchema, addBankSchema, confirmDepositSchema, transferSchema, transactionsQuery } = require('../../middleware/schemas/stripeSchemas');
const { signupSchema, signinSchema } = require('../../middleware/schemas/authSchemas');
const { searchQuery, listQuery } = require('../../middleware/schemas/streamerSchemas');
const { updateUserSchema } = require('../../middleware/schemas/userSchemas');

describe('Trade Schemas', () => {
  describe('buySchema', () => {
    it('should accept valid buy input', () => {
      const { error } = buySchema.validate({
        streamerId: 'a'.repeat(24),
        shareCount: 10,
        maxPrice: 50.5,
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing streamerId', () => {
      const { error } = buySchema.validate({ shareCount: 10 });
      expect(error).toBeDefined();
    });

    it('should reject negative shareCount', () => {
      const { error } = buySchema.validate({
        streamerId: 'a'.repeat(24),
        shareCount: -5,
      });
      expect(error).toBeDefined();
    });

    it('should reject non-hex streamerId', () => {
      const { error } = buySchema.validate({
        streamerId: 'not-a-valid-objectid!!!!!',
        shareCount: 10,
      });
      expect(error).toBeDefined();
    });

    it('should reject shareCount above max', () => {
      const { error } = buySchema.validate({
        streamerId: 'a'.repeat(24),
        shareCount: 100001,
      });
      expect(error).toBeDefined();
    });

    it('should strip unknown fields', () => {
      const { value } = buySchema.validate({
        streamerId: 'a'.repeat(24),
        shareCount: 10,
        malicious: 'payload',
      }, { stripUnknown: true });
      expect(value.malicious).toBeUndefined();
    });
  });

  describe('sellSchema', () => {
    it('should accept valid sell input', () => {
      const { error } = sellSchema.validate({
        streamerId: 'b'.repeat(24),
        shareCount: 5,
      });
      expect(error).toBeUndefined();
    });

    it('should reject zero shareCount', () => {
      const { error } = sellSchema.validate({
        streamerId: 'b'.repeat(24),
        shareCount: 0,
      });
      expect(error).toBeDefined();
    });
  });
});

describe('Stripe Schemas', () => {
  describe('depositSchema', () => {
    it('should accept valid deposit', () => {
      const { error } = depositSchema.validate({
        amount: 5000,
        paymentMethodId: 'pm_test123',
      });
      expect(error).toBeUndefined();
    });

    it('should reject amount below minimum', () => {
      const { error } = depositSchema.validate({ amount: 50 });
      expect(error).toBeDefined();
    });

    it('should reject amount above maximum', () => {
      const { error } = depositSchema.validate({ amount: 99999999 });
      expect(error).toBeDefined();
    });

    it('should reject invalid paymentMethodId prefix', () => {
      const { error } = depositSchema.validate({
        amount: 5000,
        paymentMethodId: 'invalid_pm',
      });
      expect(error).toBeDefined();
    });
  });

  describe('confirmDepositSchema', () => {
    it('should accept valid paymentIntentId', () => {
      const { error } = confirmDepositSchema.validate({
        paymentIntentId: 'pi_abc123',
      });
      expect(error).toBeUndefined();
    });

    it('should reject invalid prefix', () => {
      const { error } = confirmDepositSchema.validate({
        paymentIntentId: 'not_pi_abc',
      });
      expect(error).toBeDefined();
    });
  });

  describe('addBankSchema', () => {
    it('should accept valid bank details', () => {
      const { error } = addBankSchema.validate({
        routingNumber: '110000000',
        accountNumber: '000123456789',
      });
      expect(error).toBeUndefined();
    });

    it('should reject non-numeric routing number', () => {
      const { error } = addBankSchema.validate({
        routingNumber: '11000abcd',
        accountNumber: '000123456789',
      });
      expect(error).toBeDefined();
    });

    it('should reject routing number wrong length', () => {
      const { error } = addBankSchema.validate({
        routingNumber: '1234',
        accountNumber: '000123456789',
      });
      expect(error).toBeDefined();
    });
  });

  describe('transferSchema', () => {
    it('should accept valid transfer', () => {
      const { error } = transferSchema.validate({
        amount: 500,
        description: 'Share purchase',
      });
      expect(error).toBeUndefined();
    });

    it('should reject amount of 0', () => {
      const { error } = transferSchema.validate({ amount: 0 });
      expect(error).toBeDefined();
    });
  });

  describe('transactionsQuery', () => {
    it('should apply defaults', () => {
      const { value } = transactionsQuery.validate({});
      expect(value.limit).toBe(20);
      expect(value.offset).toBe(0);
    });

    it('should reject invalid type', () => {
      const { error } = transactionsQuery.validate({ type: 'INVALID' });
      expect(error).toBeDefined();
    });

    it('should accept valid type', () => {
      const { error } = transactionsQuery.validate({ type: 'BUY' });
      expect(error).toBeUndefined();
    });
  });
});

describe('Auth Schemas', () => {
  describe('signupSchema', () => {
    it('should accept valid signup', () => {
      const { error } = signupSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass1!',
      });
      expect(error).toBeUndefined();
    });

    it('should reject weak password (no uppercase)', () => {
      const { error } = signupSchema.validate({
        name: 'John',
        email: 'john@example.com',
        password: 'weakpass1!',
      });
      expect(error).toBeDefined();
    });

    it('should reject weak password (no number)', () => {
      const { error } = signupSchema.validate({
        name: 'John',
        email: 'john@example.com',
        password: 'WeakPass!!',
      });
      expect(error).toBeDefined();
    });

    it('should reject weak password (no special char)', () => {
      const { error } = signupSchema.validate({
        name: 'John',
        email: 'john@example.com',
        password: 'WeakPass12',
      });
      expect(error).toBeDefined();
    });

    it('should reject short password', () => {
      const { error } = signupSchema.validate({
        name: 'John',
        email: 'john@example.com',
        password: 'Sh1!',
      });
      expect(error).toBeDefined();
    });

    it('should reject invalid email', () => {
      const { error } = signupSchema.validate({
        name: 'John',
        email: 'not-an-email',
        password: 'StrongPass1!',
      });
      expect(error).toBeDefined();
    });

    it('should trim name', () => {
      const { value } = signupSchema.validate({
        name: '  John Doe  ',
        email: 'john@example.com',
        password: 'StrongPass1!',
      });
      expect(value.name).toBe('John Doe');
    });
  });

  describe('signinSchema', () => {
    it('should accept valid signin', () => {
      const { error } = signinSchema.validate({
        email: 'john@example.com',
        password: 'anypass',
      });
      expect(error).toBeUndefined();
    });

    it('should reject empty password', () => {
      const { error } = signinSchema.validate({
        email: 'john@example.com',
        password: '',
      });
      expect(error).toBeDefined();
    });
  });
});

describe('Streamer Schemas', () => {
  describe('searchQuery', () => {
    it('should accept valid search', () => {
      const { error } = searchQuery.validate({ q: 'MrBeast' });
      expect(error).toBeUndefined();
    });

    it('should reject empty search', () => {
      const { error } = searchQuery.validate({ q: '' });
      expect(error).toBeDefined();
    });

    it('should reject missing q', () => {
      const { error } = searchQuery.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('listQuery', () => {
    it('should apply defaults', () => {
      const { value } = listQuery.validate({});
      expect(value.limit).toBe(50);
      expect(value.offset).toBe(0);
    });

    it('should reject limit over 100', () => {
      const { error } = listQuery.validate({ limit: 500 });
      expect(error).toBeDefined();
    });
  });
});

describe('User Schemas', () => {
  describe('updateUserSchema', () => {
    it('should accept valid update', () => {
      const { error } = updateUserSchema.validate({
        name: 'New Name',
        email: 'new@example.com',
      });
      expect(error).toBeUndefined();
    });

    it('should accept E.164 phone number', () => {
      const { error } = updateUserSchema.validate({
        phoneNumber: '+12125551234',
      });
      expect(error).toBeUndefined();
    });

    it('should reject non-E.164 phone number', () => {
      const { error } = updateUserSchema.validate({
        phoneNumber: '212-555-1234',
      });
      expect(error).toBeDefined();
    });

    it('should accept valid address', () => {
      const { error } = updateUserSchema.validate({
        address: { street: '123 Main St', city: 'NYC', state: 'NY', zipCode: '10001' },
      });
      expect(error).toBeUndefined();
    });
  });
});
