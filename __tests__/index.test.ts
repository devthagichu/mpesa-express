/* eslint-disable @typescript-eslint/no-var-requires */
const Mpesa = require('../src/index');

// Mock fetch globally
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock console methods to avoid noisy output
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('Mpesa', () => {
  const validConfig = {
    consumer_key: 'test_consumer_key',
    consumer_secret: 'test_consumer_secret',
    passkey: 'test_passkey',
    BusinessShortCode: 174379,
    ShortCode: 600000,
    SecurityCredential: 'test_security_credential',
    Initiator: 'test_initiator',
    callBackBaseUrl: 'https://example.com',
  };

  let mpesa: any;

  beforeEach(() => {
    mpesa = new Mpesa(validConfig);
    mockFetch.mockReset();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with provided config options', () => {
      expect(mpesa.consumer_key).toBe(validConfig.consumer_key);
      expect(mpesa.consumer_secret).toBe(validConfig.consumer_secret);
      expect(mpesa.passkey).toBe(validConfig.passkey);
      expect(mpesa.BusinessShortCode).toBe(validConfig.BusinessShortCode);
      expect(mpesa.ShortCode).toBe(validConfig.ShortCode);
      expect(mpesa.SecurityCredential).toBe(validConfig.SecurityCredential);
      expect(mpesa.Initiator).toBe(validConfig.Initiator);
      expect(mpesa.callBackBaseUrl).toBe(validConfig.callBackBaseUrl);
    });

    it('should initialize AuthToken as empty string', () => {
      expect(mpesa.AuthToken).toBe('');
    });

    it('should set correct callback URLs based on callBackBaseUrl', () => {
      expect(mpesa.QueueTimeOutURL).toBe('https://example.com/queue');
      expect(mpesa.ResultURL).toBe('https://example.com/result');
      expect(mpesa.CallBackURL).toBe('https://example.com/callback');
      expect(mpesa.ConfirmationURL).toBe('https://example.com/confirm');
      expect(mpesa.ValidationURL).toBe('https://example.com/valid');
    });

    it('should set default transaction type', () => {
      expect(mpesa.stkTransactionType).toBe('CustomerPayBillOnline');
    });

    it('should set correct API URLs', () => {
      expect(mpesa._authURL).toBe('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');
      expect(mpesa._stkURL).toBe('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest');
      expect(mpesa._stkCheckURL).toBe('https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query');
      expect(mpesa._c2bRegisterURL).toBe('https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl');
      expect(mpesa._accountBalanceURL).toBe('https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query');
      expect(mpesa._b2cURL).toBe('https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest');
    });
  });

  describe('pad2', () => {
    it('should pad single digit numbers with leading zero', () => {
      expect(mpesa.pad2(1)).toBe('01');
      expect(mpesa.pad2(9)).toBe('09');
    });

    it('should not pad double digit numbers', () => {
      expect(mpesa.pad2(10)).toBe(10);
      expect(mpesa.pad2(12)).toBe(12);
    });
  });

  describe('_generateTimeStamp', () => {
    it('should generate timestamp in YYYYMMDDHHmmss format', () => {
      const timestamp = mpesa._generateTimeStamp();
      expect(timestamp).toMatch(/^\d{14}$/);
    });

    it('should generate timestamp based on current date', () => {
      const mockDate = new Date(2024, 0, 15, 10, 30, 45); // Jan 15, 2024, 10:30:45
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const timestamp = mpesa._generateTimeStamp();
      expect(timestamp).toBe('20240115103045');

      dateSpy.mockRestore();
    });
  });

  describe('_generatePassword', () => {
    it('should generate base64 encoded password', () => {
      const mockDate = new Date(2024, 0, 15, 10, 30, 45);
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const password = mpesa._generatePassword();
      const expected = Buffer.from('174379test_passkey20240115103045').toString('base64');
      expect(password).toBe(expected);

      dateSpy.mockRestore();
    });
  });

  describe('_getAuthToken', () => {
    it('should fetch and store access token on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token_123' }),
      });

      const token = await mpesa._getAuthToken();

      expect(token).toBe('test_token_123');
      expect(mpesa.AuthToken).toBe('test_token_123');
      expect(mockFetch).toHaveBeenCalledWith(
        mpesa._authURL,
        expect.objectContaining({
          headers: { Authorization: expect.stringMatching(/^Basic /) },
        })
      );
    });

    it('should return empty string and log error on authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ errorMessage: 'Invalid credentials' }),
      });

      const token = await mpesa._getAuthToken();

      expect(token).toBe('');
      expect(mpesa.AuthToken).toBe('');
      expect(consoleSpy.error).toHaveBeenCalledWith('Invalid credentials');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const token = await mpesa._getAuthToken();

      expect(token).toBe('');
      expect(mpesa.AuthToken).toBe('');
      expect(consoleSpy.error).toHaveBeenCalledWith('Network error');
    });
  });

  describe('_getHeaders', () => {
    it('should return headers with bearer token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });

      const headers = await mpesa._getHeaders();

      expect(headers).toEqual({
        Authorization: 'Bearer test_token',
        'Content-Type': 'application/json',
      });
    });
  });

  describe('stkPush', () => {
    beforeEach(() => {
      // Mock auth token fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });
    });

    it('should throw error if Amount is not provided', async () => {
      await expect(mpesa.stkPush(0, 254712345678, 'Test', 'Test Desc')).rejects.toThrow('Must provide an amount');
    });

    it('should throw error if PhoneNumber is not provided', async () => {
      await expect(mpesa.stkPush(100, 0, 'Test', 'Test Desc')).rejects.toThrow('Must provide a PhoneNumber');
    });

    it('should throw error if AccountReference is not provided', async () => {
      await expect(mpesa.stkPush(100, 254712345678, '', 'Test Desc')).rejects.toThrow('Must provide an AccountReference');
    });

    it('should throw error if TransactionDesc is not provided', async () => {
      await expect(mpesa.stkPush(100, 254712345678, 'Test', '')).rejects.toThrow('Must provide a TransactionDesc');
    });

    it('should make successful STK push request', async () => {
      const mockResponse = {
        MerchantRequestID: '12345',
        CheckoutRequestID: '67890',
        ResponseCode: '0',
        ResponseDescription: 'Success',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await mpesa.stkPush(100, 254712345678, 'TestRef', 'Test Description');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        mpesa._stkURL,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test_token',
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );
    });

    it('should throw error data on API failure', async () => {
      const errorResponse = { errorCode: '500', errorMessage: 'Internal Server Error' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(mpesa.stkPush(100, 254712345678, 'TestRef', 'Test Description')).rejects.toEqual(errorResponse);
    });
  });

  describe('stkCheck', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });
    });

    it('should throw error if CheckoutRequestID is not provided', async () => {
      await expect(mpesa.stkCheck('')).rejects.toThrow('Must provide an CheckoutRequestID');
    });

    it('should make successful STK check request', async () => {
      const mockResponse = {
        ResponseCode: '0',
        ResponseDescription: 'The service request has been accepted successfully',
        MerchantRequestID: '12345',
        CheckoutRequestID: 'ws_CO_123',
        ResultCode: '0',
        ResultDesc: 'The service request is processed successfully.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await mpesa.stkCheck('ws_CO_123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenLastCalledWith(
        mpesa._stkCheckURL,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error data on API failure', async () => {
      const errorResponse = { errorCode: '404', errorMessage: 'Not Found' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(mpesa.stkCheck('invalid_id')).rejects.toEqual(errorResponse);
    });
  });

  describe('c2bRegister', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });
    });

    it('should throw error if ConfirmationURL is not provided', async () => {
      await expect(mpesa.c2bRegister('', 'http://valid.com', 'Completed', '600000')).rejects.toThrow('Must provide a ConfirmationURL');
    });

    it('should throw error if ValidationURL is not provided', async () => {
      await expect(mpesa.c2bRegister('http://confirm.com', '', 'Completed', '600000')).rejects.toThrow('Must provide a ValidationURL');
    });

    it('should throw error if ResponseType is not provided', async () => {
      await expect(mpesa.c2bRegister('http://confirm.com', 'http://valid.com', '', '600000')).rejects.toThrow('Must provide a ResponseType');
    });

    it('should throw error if ShortCode is not provided', async () => {
      await expect(mpesa.c2bRegister('http://confirm.com', 'http://valid.com', 'Completed', '')).rejects.toThrow('Must provide a ShortCode');
    });

    it('should make successful C2B register request', async () => {
      const mockResponse = {
        ConversationID: '',
        OriginatorCoversationID: '',
        ResponseDescription: 'Success',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await mpesa.c2bRegister(
        'http://confirm.com',
        'http://valid.com',
        'Completed',
        '600000'
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error data on API failure', async () => {
      const errorResponse = { errorCode: '400', errorMessage: 'Bad Request' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(
        mpesa.c2bRegister('http://confirm.com', 'http://valid.com', 'Completed', '600000')
      ).rejects.toEqual(errorResponse);
    });
  });

  describe('c2bTransact', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });
    });

    it('should throw error if ShortCode is not provided', async () => {
      await expect(mpesa.c2bTransact('', 'CustomerPayBillOnline', '100', '254712345678', 'test')).rejects.toThrow('Must provide a ShortCode');
    });

    it('should throw error if CommandID is not provided', async () => {
      await expect(mpesa.c2bTransact('600000', '', '100', '254712345678', 'test')).rejects.toThrow('Must provide a CommandID');
    });

    it('should throw error if Amount is not provided', async () => {
      await expect(mpesa.c2bTransact('600000', 'CustomerPayBillOnline', '', '254712345678', 'test')).rejects.toThrow('Must provide an Amount');
    });

    it('should throw error if Msisdn is not provided', async () => {
      await expect(mpesa.c2bTransact('600000', 'CustomerPayBillOnline', '100', '', 'test')).rejects.toThrow('Must provide a Msisdn');
    });

    it('should throw error if BillRefNumber is not provided', async () => {
      await expect(mpesa.c2bTransact('600000', 'CustomerPayBillOnline', '100', '254712345678', '')).rejects.toThrow('Must provide a BillRefNumber');
    });

    it('should make successful C2B transaction request', async () => {
      const mockResponse = {
        ConversationID: 'AG_123',
        OriginatorCoversationID: 'OC_123',
        ResponseDescription: 'Accept the service request successfully.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await mpesa.c2bTransact(
        '600000',
        'CustomerPayBillOnline',
        '100',
        '254712345678',
        'TestRef'
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error data on API failure', async () => {
      const errorResponse = { errorCode: '500', errorMessage: 'Internal Server Error' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(
        mpesa.c2bTransact('600000', 'CustomerPayBillOnline', '100', '254712345678', 'TestRef')
      ).rejects.toEqual(errorResponse);
    });
  });

  describe('checkAccountBalance', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });
    });

    it('should throw error if CommandID is not provided', async () => {
      await expect(mpesa.checkAccountBalance('', '4', 'Test remarks')).rejects.toThrow('Must provide a CommandID');
    });

    it('should throw error if IdentifierType is not provided', async () => {
      await expect(mpesa.checkAccountBalance('AccountBalance', '', 'Test remarks')).rejects.toThrow('Must provide an IdentifierType');
    });

    it('should throw error if Remarks is not provided', async () => {
      await expect(mpesa.checkAccountBalance('AccountBalance', '4', '')).rejects.toThrow('Must provide a Remarks');
    });

    it('should make successful account balance request', async () => {
      const mockResponse = {
        ConversationID: 'AG_123',
        OriginatorCoversationID: 'OC_123',
        ResponseCode: '0',
        ResponseDescription: 'Accept the service request successfully.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await mpesa.checkAccountBalance('AccountBalance', '4', 'Test remarks');

      expect(result).toEqual(mockResponse);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      expect(requestBody.Initiator).toBe(validConfig.Initiator);
      expect(requestBody.SecurityCredential).toBe(validConfig.SecurityCredential);
      expect(requestBody.PartyA).toBe(validConfig.ShortCode);
    });

    it('should throw error data on API failure', async () => {
      const errorResponse = { errorCode: '401', errorMessage: 'Unauthorized' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(
        mpesa.checkAccountBalance('AccountBalance', '4', 'Test remarks')
      ).rejects.toEqual(errorResponse);
    });
  });

  describe('b2c', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test_token' }),
      });
    });

    it('should throw error if Amount is not provided', async () => {
      await expect(mpesa.b2c('', '600000', '254712345678', 'Test', 'SalaryPayment', 'None', 'cred')).rejects.toThrow('Must provide a Amount');
    });

    it('should throw error if PartyA is not provided', async () => {
      await expect(mpesa.b2c('100', '', '254712345678', 'Test', 'SalaryPayment', 'None', 'cred')).rejects.toThrow('Must provide a PartyA');
    });

    it('should throw error if PartyB is not provided', async () => {
      await expect(mpesa.b2c('100', '600000', '', 'Test', 'SalaryPayment', 'None', 'cred')).rejects.toThrow('Must provide a PartyB');
    });

    it('should throw error if CommandID is not provided', async () => {
      await expect(mpesa.b2c('100', '600000', '254712345678', 'Test', '', 'None', 'cred')).rejects.toThrow('Must provide a CommandID');
    });

    it('should throw error if Occassion is not provided', async () => {
      await expect(mpesa.b2c('100', '600000', '254712345678', 'Test', 'SalaryPayment', '', 'cred')).rejects.toThrow('Must provide a Occassion');
    });

    it('should throw error if Remarks is not provided', async () => {
      await expect(mpesa.b2c('100', '600000', '254712345678', '', 'SalaryPayment', 'None', 'cred')).rejects.toThrow('Must provide a Remarks');
    });

    it('should throw error if SecurityCredential is not provided', async () => {
      await expect(mpesa.b2c('100', '600000', '254712345678', 'Test', 'SalaryPayment', 'None', '')).rejects.toThrow('Must provide a SecurityCredential');
    });

    it('should make successful B2C payment request', async () => {
      const mockResponse = {
        ConversationID: 'AG_123',
        OriginatorConversationID: 'OC_123',
        ResponseCode: '0',
        ResponseDescription: 'Accept the service request successfully.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await mpesa.b2c(
        '100',
        '600000',
        '254712345678',
        'Test remarks',
        'SalaryPayment',
        'None',
        'test_security_cred'
      );

      expect(result).toEqual(mockResponse);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const requestBody = JSON.parse(lastCall[1].body);
      expect(requestBody.InitiatorName).toBe(validConfig.Initiator);
      expect(requestBody.QueueTimeOutURL).toBe(`${validConfig.callBackBaseUrl}/queue`);
      expect(requestBody.ResultURL).toBe(`${validConfig.callBackBaseUrl}/result`);
    });

    it('should throw error data on API failure', async () => {
      const errorResponse = { errorCode: '500', errorMessage: 'System error' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(
        mpesa.b2c('100', '600000', '254712345678', 'Test', 'SalaryPayment', 'None', 'cred')
      ).rejects.toEqual(errorResponse);
    });
  });
});
