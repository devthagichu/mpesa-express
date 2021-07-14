import axios from "axios";

interface Config_Options {
  consumer_key: string;
  consumer_secret: string;
  passkey: string;
  BusinessShortCode: number;
  ShortCode: number;
  SecurityCredential: string;
  Initiator: string;
  callBackBaseUrl: string;
}

class Mpesa {
  AuthToken: string;
  consumer_key: string;
  consumer_secret: string;
  passkey: string;
  BusinessShortCode: number;
  ShortCode: number;
  SecurityCredential: string;
  Initiator: string;

  QueueTimeOutURL: string;
  ResultURL: string;
  CallBackURL: string;
  ConfirmationURL: string;
  ValidationURL: string;

  stkTransactionType: string;

  callBackBaseUrl: string;

  _accountBalanceURL: string;
  _authURL: string;
  _stkURL: string;
  _stkCheckURL: string;
  _c2bRegisterURL: string;
  _c2bSimulateURL: string;
  _b2cURL: string;

  constructor(options: Config_Options) {
    this.AuthToken = "";
    this.consumer_key = options.consumer_key;
    this.consumer_secret = options.consumer_secret;
    this.passkey = options.passkey;
    this.BusinessShortCode = options.BusinessShortCode;
    this.ShortCode = options.ShortCode;
    this.SecurityCredential = options.SecurityCredential;
    this.Initiator = options.Initiator;
    this.callBackBaseUrl = options.callBackBaseUrl;

    this.stkTransactionType = "CustomerPayBillOnline";

    this.QueueTimeOutURL = `${this.callBackBaseUrl}/queue`;
    this.ResultURL = `${this.callBackBaseUrl}/result`;
    this.CallBackURL = `${this.callBackBaseUrl}/callback`;
    this.ConfirmationURL = `${this.callBackBaseUrl}/confirm`;
    this.ValidationURL = `${this.callBackBaseUrl}/valid`;

    this._accountBalanceURL =
      "https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query";
    this._authURL =
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    this._stkURL =
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    this._stkCheckURL =
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
    this._c2bRegisterURL =
      "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";
    this._c2bSimulateURL =
      " https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate";
    this._b2cURL =
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
  }

  //  AUTH Request
  //  Use this API to generate an OAuth access token to access other APIs

  async _getAuthToken() {
    let auth: string = ("Basic " +
      Buffer.from(this.consumer_key + ":" + this.consumer_secret).toString(
        "base64"
      )) as string;

    try {
      let res = await axios.get(this._authURL, {
        headers: { Authorization: auth },
      });
      let { access_token } = res.data;
      if (access_token) {
        this.AuthToken = access_token;
        console.log(access_token);
      }
    } catch (error) {
      this.AuthToken = "";
      console.error(error.response.data.errorMessage);
    }
    return this.AuthToken;
  }

  pad2(n: any) {
    return n < 10 ? "0" + n : n;
  }

  async _setHeaders() {
    let access_token = await this._getAuthToken();
    axios.defaults.headers = {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    };
  }

  _generateTimeStamp(): string {
    var date = new Date();
    return (
      date.getFullYear().toString() +
      this.pad2(date.getMonth() + 1) +
      this.pad2(date.getDate()) +
      this.pad2(date.getHours()) +
      this.pad2(date.getMinutes()) +
      this.pad2(date.getSeconds())
    );
  }

  _generatePassword(): string {
    let Timestamp = this._generateTimeStamp();
    return Buffer.from(
      this.BusinessShortCode + this.passkey + Timestamp
    ).toString("base64") as string;
  }

  // Lipa Na M-Pesa Online Payment API
  // Use this API to initiate online payment on behalf of a customer.

  sktPush(
    Amount: number,
    PhoneNumber: number,
    AccountReference: string,
    TransactionDesc: string
  ) {
    return new Promise(async (resolve, reject) => {
      if (!Amount) reject(new Error("Must provide an amount"));
      if (!PhoneNumber) reject(new Error("Must provide a PhoneNumber"));
      if (!AccountReference)
        reject(new Error("Must provide an AccountReference"));
      if (!TransactionDesc) reject(new Error("Must provide a TransactionDesc"));

      let headers = await this._setHeaders();
      var Timestamp = this._generateTimeStamp();
      var Password = this._generatePassword();

      let requestBody = {
        BusinessShortCode: this.BusinessShortCode,
        TransactionType: this.stkTransactionType,
        PartyB: this.BusinessShortCode,
        CallBackURL: this.CallBackURL,
        Amount,
        PartyA: PhoneNumber,
        PhoneNumber,
        AccountReference,
        TransactionDesc,
        Timestamp,
        Password,
      };

      let data = JSON.stringify(requestBody);

      try {
        axios({
          method: "POST",
          url: this._stkURL,
          data,
        })
          .then((res: any) => {
            resolve(res.data);
          })
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  // Lipa Na M-Pesa Query Request API
  // Use this API to check the status of a Lipa Na M-Pesa Online Payment.

  stkCheck(CheckoutRequestID: string) {
    return new Promise(async (resolve, reject) => {
      if (!CheckoutRequestID)
        reject(new Error("Must provide an CheckoutRequestID"));

      let headers = await this._setHeaders();

      let requestBody = {
        BusinessShortCode: this.BusinessShortCode,
        CheckoutRequestID,
        Timestamp: this._generateTimeStamp(),
        Password: this._generatePassword(),
      };
      let data = JSON.stringify(requestBody);

      try {
        axios({
          method: "POST",
          url: this._stkCheckURL,
          data,
        })
          .then((res: any) => {
            resolve(res.data);
          })
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error.response.data);
      }
    });
  }

  // C2B Register URL
  // Use this API to register validation and confirmation URLs on M-Pesa

  c2bRegister(
    ConfirmationURL: string,
    ValidationURL: string,
    ResponseType: string,
    ShortCode: string
  ) {
    return new Promise(async (resolve, reject) => {
      if (!ConfirmationURL) reject(new Error("Must provide a ConfirmationURL"));
      if (!ValidationURL) reject(new Error("Must provide a ValidationURL"));
      if (!ResponseType) reject(new Error("Must provide a ResponseType"));
      if (!ShortCode) reject(new Error("Must provide a ShortCode"));

      let headers = await this._setHeaders();

      let requestBody = {
        ShortCode,
        ResponseType,
        ConfirmationURL,
        ValidationURL,
      };

      let data = JSON.stringify(requestBody);

      try {
        axios({
          method: "POST",
          url: this._c2bRegisterURL,
          data,
        })
          .then((res: any) => resolve(res.data))
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  // C2B Simulate Transaction
  // This API is used to make payment requests from Client to Business (C2B).
  // You can use the sandbox provided test credentials down below to simulates a payment made from the client phone's STK/SIM Toolkit menu, and enables you to receive the payment requests in real time.

  c2bTransact(
    ShortCode: string,
    CommandID: string,
    Amount: string,
    Msisdn: string,
    BillRefNumber: string
  ) {
    return new Promise(async (resolve, reject) => {
      if (!ShortCode) reject(new Error("Must provide a ShortCode"));
      if (!CommandID) reject(new Error("Must provide a CommandID"));
      if (!Amount) reject(new Error("Must provide an Amount"));
      if (!Msisdn) reject(new Error("Must provide a Msisdn"));
      if (!BillRefNumber) reject(new Error("Must provide a BillRefNumber"));

      let headers = await this._setHeaders();

      let requestBody = {
        ShortCode,
        CommandID,
        Amount,
        Msisdn,
        BillRefNumber,
      };
      let data = JSON.stringify(requestBody);

      try {
        axios({
          method: "POST",
          url: this._c2bSimulateURL,
          data,
        })
          .then((res: any) => resolve(res.data))
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Account Balance Request
  // Use this API to enquire the balance on an M-Pesa BuyGoods (Till Number).

  checkAccountBalance(
    CommandID: string,
    IdentifierType: string,
    Remarks: string
  ) {
    return new Promise(async (resolve, reject) => {
      if (!CommandID) reject(new Error("Must provide a CommandID"));
      if (!IdentifierType) reject(new Error("Must provide an IdentifierType"));
      if (!Remarks) reject(new Error("Must provide a Remarks"));

      let headers = await this._setHeaders();

      let requestBody = {
        Initiator: this.Initiator,
        SecurityCredential: this.SecurityCredential,
        CommandID,
        PartyA: this.ShortCode,
        IdentifierType,
        Remarks,
        QueueTimeOutURL: this.QueueTimeOutURL,
        ResultURL: this.ResultURL,
      };

      let data = JSON.stringify(requestBody);

      try {
        axios({
          method: "POST",
          url: this._accountBalanceURL,
          data,
        })
          .then((res: any) => resolve(res.data))
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  //  B2C Payment Request
  //  Use this API to transact between an M-Pesa short code to a phone number registered on M-Pesa.

  b2c(
    Amount: string,
    PartyA: string,
    PartyB: string,
    Remarks: string,
    CommandID: string,
    Occassion: string,
    SecurityCredential: string
  ) {
    return new Promise(async (resolve, reject) => {
      if (!Amount) reject(new Error("Must provide a Amount"));
      if (!PartyA) reject(new Error("Must provide a PartyA"));
      if (!PartyB) reject(new Error("Must provide a PartyB"));
      if (!CommandID) reject(new Error("Must provide a CommandID"));
      if (!Occassion) reject(new Error("Must provide a Occassion"));
      if (!Remarks) reject(new Error("Must provide a Remarks"));
      if (!SecurityCredential)
        reject(new Error("Must provide a SecurityCredential"));

      let headers = await this._setHeaders();

      let requestBody = {
        InitiatorName: this.Initiator,
        SecurityCredential,
        CommandID,
        Amount,
        PartyA,
        PartyB,
        Remarks,
        QueueTimeOutURL: this.QueueTimeOutURL,
        ResultURL: this.ResultURL,
        Occassion,
      };

      let data = JSON.stringify(requestBody);
      try {
        axios({
          method: "POST",
          url: this._b2cURL,
          data,
        })
          .then((res: any) => resolve(res.data))
          .catch((error: any) => {
            reject(error.response.data);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = Mpesa;
