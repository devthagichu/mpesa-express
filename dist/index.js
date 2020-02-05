"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require('axios');
class Mpesa {
    constructor(options) {
        this.AuthToken = '';
        this.consumer_key = options.consumer_key;
        this.consumer_secret = options.consumer_secret;
        this.passkey = options.passkey;
        this.BusinessShortCode = options.BusinessShortCode;
        this.ShortCode = options.ShortCode;
        this.SecurityCredential = options.SecurityCredential;
        this.Initiator = options.Initiator;
        this.stkTransactionType = "CustomerPayBillOnline",
            this.QueueTimeOutURL = "https://1bc68cbb.ngrok.io/mpesa";
        this.ResultURL = "https://1bc68cbb.ngrok.io/mpesa";
        this.CallBackURL = "https://1bc68cbb.ngrok.io/mpesa";
        this.ConfirmationURL = "https://1bc68cbb.ngrok.io/mpesa";
        this.ValidationURL = "https://1bc68cbb.ngrok.io/mpesa";
        this._accountBalanceURL = "https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query";
        this._authURL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
        this._stkURL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        this._stkCheckURL = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
        this._c2bRegisterURL = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";
        this._c2bSimulateURL = " https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate";
        this._b2cURL = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
    }
    //  AUTH Request
    //  Use this API to generate an OAuth access token to access other APIs
    async _getAuthToken() {
        let auth = "Basic " + new Buffer.from(this.consumer_key + ":" + this.consumer_secret).toString("base64");
        try {
            let res = await axios.get(this._authURL, { headers: { "Authorization": auth } });
            let { access_token } = res.data;
            if (access_token) {
                this.AuthToken = access_token;
                console.log(access_token);
            }
        }
        catch (error) {
            this.AuthToken = '';
            console.error(error.response.data.errorMessage);
        }
        return this.AuthToken;
    }
    pad2(n) { return n < 10 ? '0' + n : n; }
    async _setHeaders() {
        let access_token = await this._getAuthToken();
        axios.defaults.headers = {
            Authorization: "Bearer " + access_token,
            'Content-Type': 'application/json'
        };
    }
    _generateTimeStamp() {
        var date = new Date();
        return date.getFullYear().toString() + this.pad2(date.getMonth() + 1) + this.pad2(date.getDate()) + this.pad2(date.getHours()) + this.pad2(date.getMinutes()) + this.pad2(date.getSeconds());
    }
    _generatePassword() {
        let Timestamp = this._generateTimeStamp();
        return new Buffer.from(this.BusinessShortCode + this.passkey + Timestamp).toString("base64");
    }
    // Lipa Na M-Pesa Online Payment API
    // Use this API to initiate online payment on behalf of a customer.
    async sktPush(Amount, PhoneNumber, AccountReference, TransactionDesc) {
        let headers = await this._setHeaders();
        var Timestamp = this._generateTimeStamp();
        var Password = this._generatePassword();
        return new Promise((resolve, reject) => {
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
                Password
            };
            let data = JSON.stringify(requestBody);
            try {
                axios({
                    method: "POST",
                    url: this._stkURL,
                    data
                })
                    .then((res) => { resolve(res.data); })
                    .catch((error) => { reject(error.response.data); });
            }
            catch (error) {
                reject(error.response.data);
            }
        });
    }
    // Lipa Na M-Pesa Query Request API
    // Use this API to check the status of a Lipa Na M-Pesa Online Payment.
    async stkCheck(CheckoutRequestID) {
        let headers = await this._setHeaders();
        let requestBody = {
            BusinessShortCode: this.BusinessShortCode,
            CheckoutRequestID,
            Timestamp: this._generateTimeStamp(),
            Password: this._generatePassword()
        };
        let data = JSON.stringify(requestBody);
        return new Promise((resolve, reject) => {
            try {
                axios({
                    method: "POST",
                    url: this._stkCheckURL,
                    data
                })
                    .then((res) => { resolve(res.data); })
                    .catch((error) => { reject(error.response.data); });
            }
            catch (error) {
                reject(error.response.data);
            }
        });
    }
    // C2B Register URL
    // Use this API to register validation and confirmation URLs on M-Pesa 
    async c2bRegister(ConfirmationURL, ValidationURL, ResponseType, ShortCode) {
        let headers = await this._setHeaders();
        let requestBody = {
            ShortCode,
            ResponseType,
            ConfirmationURL,
            ValidationURL
        };
        let data = JSON.stringify(requestBody);
        return new Promise((resolve, reject) => {
            try {
                axios({
                    method: "POST",
                    url: this._c2bRegisterURL,
                    data
                })
                    .then((res) => resolve(res.data))
                    .catch((error) => { reject(error.response.data); });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    // C2B Simulate Transaction
    // This API is used to make payment requests from Client to Business (C2B). 
    // You can use the sandbox provided test credentials down below to simulates a payment made from the client phone's STK/SIM Toolkit menu, and enables you to receive the payment requests in real time.
    async c2bTransact(ShortCode, CommandID, Amount, Msisdn, BillRefNumber) {
        let headers = await this._setHeaders();
        let requestBody = {
            ShortCode,
            CommandID,
            Amount,
            Msisdn,
            BillRefNumber
        };
        let data = JSON.stringify(requestBody);
        return new Promise((resolve, reject) => {
            try {
                axios({
                    method: "POST",
                    url: this._c2bSimulateURL,
                    data
                });
            }
            finally {
            }
        });
    }
    // Account Balance Request
    // Use this API to enquire the balance on an M-Pesa BuyGoods (Till Number).
    async checkAccountBalance(CommandID, IdentifierType, Remarks) {
        let headers = await this._setHeaders();
        let requestBody = {
            Initiator: this.Initiator,
            SecurityCredential: this.SecurityCredential,
            CommandID,
            PartyA: this.ShortCode,
            IdentifierType,
            Remarks,
            QueueTimeOutURL: this.QueueTimeOutURL,
            ResultURL: this.ResultURL
        };
        let data = JSON.stringify(requestBody);
        return new Promise((resolve, reject) => {
            try {
                axios({
                    method: "POST",
                    url: this._accountBalanceURL,
                    data
                })
                    .then((res) => resolve(res.data))
                    .catch((error) => { reject(error.response.data); });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    //  B2C Payment Request
    //  Use this API to transact between an M-Pesa short code to a phone number registered on M-Pesa.
    async b2c(Amount, PartyA, PartyB, Remarks, CommandID, Occassion, SecurityCredential) {
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
            Occassion
        };
        let data = JSON.stringify(requestBody);
        return new Promise((resolve, reject) => {
            try {
                axios({
                    method: "POST",
                    url: this._b2cURL,
                    data
                })
                    .then((res) => resolve(res.data))
                    .catch((error) => { reject(error.response.data); });
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
module.exports = Mpesa;
