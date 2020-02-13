"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var axios = require('axios');
var Mpesa = /** @class */ (function () {
    function Mpesa(options) {
        this.AuthToken = '';
        this.consumer_key = options.consumer_key;
        this.consumer_secret = options.consumer_secret;
        this.passkey = options.passkey;
        this.BusinessShortCode = options.BusinessShortCode;
        this.ShortCode = options.ShortCode;
        this.SecurityCredential = options.SecurityCredential;
        this.Initiator = options.Initiator;
        this.callBackBaseUrl = options.callBackBaseUrl;
        this.stkTransactionType = "CustomerPayBillOnline";
        this.QueueTimeOutURL = this.callBackBaseUrl + "/queue";
        this.ResultURL = this.callBackBaseUrl + "/result";
        this.CallBackURL = this.callBackBaseUrl + "/callback";
        this.ConfirmationURL = this.callBackBaseUrl + "/confirm";
        this.ValidationURL = this.callBackBaseUrl + "/valid";
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
    Mpesa.prototype._getAuthToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var auth, res, access_token, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        auth = "Basic " + new (Buffer.from(this.consumer_key + ":" + this.consumer_secret).toString("base64"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios.get(this._authURL, { headers: { "Authorization": auth } })];
                    case 2:
                        res = _a.sent();
                        access_token = res.data.access_token;
                        if (access_token) {
                            this.AuthToken = access_token;
                            console.log(access_token);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.AuthToken = '';
                        console.error(error_1.response.data.errorMessage);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, this.AuthToken];
                }
            });
        });
    };
    Mpesa.prototype.pad2 = function (n) { return n < 10 ? '0' + n : n; };
    Mpesa.prototype._setHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var access_token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._getAuthToken()];
                    case 1:
                        access_token = _a.sent();
                        axios.defaults.headers = {
                            Authorization: "Bearer " + access_token,
                            'Content-Type': 'application/json'
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    Mpesa.prototype._generateTimeStamp = function () {
        var date = new Date();
        return date.getFullYear().toString() + this.pad2(date.getMonth() + 1) + this.pad2(date.getDate()) + this.pad2(date.getHours()) + this.pad2(date.getMinutes()) + this.pad2(date.getSeconds());
    };
    Mpesa.prototype._generatePassword = function () {
        var Timestamp = this._generateTimeStamp();
        return new (Buffer.from(this.BusinessShortCode + this.passkey + Timestamp).toString("base64"));
    };
    // Lipa Na M-Pesa Online Payment API
    // Use this API to initiate online payment on behalf of a customer.
    Mpesa.prototype.sktPush = function (Amount, PhoneNumber, AccountReference, TransactionDesc) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var headers, Timestamp, Password, requestBody, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Amount)
                            reject(new Error("Must provide an amount"));
                        if (!PhoneNumber)
                            reject(new Error("Must provide a PhoneNumber"));
                        if (!AccountReference)
                            reject(new Error("Must provide an AccountReference"));
                        if (!TransactionDesc)
                            reject(new Error("Must provide a TransactionDesc"));
                        return [4 /*yield*/, this._setHeaders()];
                    case 1:
                        headers = _a.sent();
                        Timestamp = this._generateTimeStamp();
                        Password = this._generatePassword();
                        requestBody = {
                            BusinessShortCode: this.BusinessShortCode,
                            TransactionType: this.stkTransactionType,
                            PartyB: this.BusinessShortCode,
                            CallBackURL: this.CallBackURL,
                            Amount: Amount,
                            PartyA: PhoneNumber,
                            PhoneNumber: PhoneNumber,
                            AccountReference: AccountReference,
                            TransactionDesc: TransactionDesc,
                            Timestamp: Timestamp,
                            Password: Password
                        };
                        data = JSON.stringify(requestBody);
                        try {
                            axios({
                                method: "POST",
                                url: this._stkURL,
                                data: data
                            })
                                .then(function (res) { resolve(res.data); })["catch"](function (error) { reject(error.response.data); });
                        }
                        catch (error) {
                            reject(error.response.data);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    // Lipa Na M-Pesa Query Request API
    // Use this API to check the status of a Lipa Na M-Pesa Online Payment.
    Mpesa.prototype.stkCheck = function (CheckoutRequestID) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var headers, requestBody, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!CheckoutRequestID)
                            reject(new Error("Must provide an CheckoutRequestID"));
                        return [4 /*yield*/, this._setHeaders()];
                    case 1:
                        headers = _a.sent();
                        requestBody = {
                            BusinessShortCode: this.BusinessShortCode,
                            CheckoutRequestID: CheckoutRequestID,
                            Timestamp: this._generateTimeStamp(),
                            Password: this._generatePassword()
                        };
                        data = JSON.stringify(requestBody);
                        try {
                            axios({
                                method: "POST",
                                url: this._stkCheckURL,
                                data: data
                            })
                                .then(function (res) { resolve(res.data); })["catch"](function (error) { reject(error.response.data); });
                        }
                        catch (error) {
                            reject(error.response.data);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    // C2B Register URL
    // Use this API to register validation and confirmation URLs on M-Pesa 
    Mpesa.prototype.c2bRegister = function (ConfirmationURL, ValidationURL, ResponseType, ShortCode) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var headers, requestBody, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ConfirmationURL)
                            reject(new Error("Must provide a ConfirmationURL"));
                        if (!ValidationURL)
                            reject(new Error("Must provide a ValidationURL"));
                        if (!ResponseType)
                            reject(new Error("Must provide a ResponseType"));
                        if (!ShortCode)
                            reject(new Error("Must provide a ShortCode"));
                        return [4 /*yield*/, this._setHeaders()];
                    case 1:
                        headers = _a.sent();
                        requestBody = {
                            ShortCode: ShortCode,
                            ResponseType: ResponseType,
                            ConfirmationURL: ConfirmationURL,
                            ValidationURL: ValidationURL
                        };
                        data = JSON.stringify(requestBody);
                        try {
                            axios({
                                method: "POST",
                                url: this._c2bRegisterURL,
                                data: data
                            })
                                .then(function (res) { return resolve(res.data); })["catch"](function (error) { reject(error.response.data); });
                        }
                        catch (error) {
                            reject(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    // C2B Simulate Transaction
    // This API is used to make payment requests from Client to Business (C2B). 
    // You can use the sandbox provided test credentials down below to simulates a payment made from the client phone's STK/SIM Toolkit menu, and enables you to receive the payment requests in real time.
    Mpesa.prototype.c2bTransact = function (ShortCode, CommandID, Amount, Msisdn, BillRefNumber) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var headers, requestBody, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ShortCode)
                            reject(new Error("Must provide a ShortCode"));
                        if (!CommandID)
                            reject(new Error("Must provide a CommandID"));
                        if (!Amount)
                            reject(new Error("Must provide an Amount"));
                        if (!Msisdn)
                            reject(new Error("Must provide a Msisdn"));
                        if (!BillRefNumber)
                            reject(new Error("Must provide a BillRefNumber"));
                        return [4 /*yield*/, this._setHeaders()];
                    case 1:
                        headers = _a.sent();
                        requestBody = {
                            ShortCode: ShortCode,
                            CommandID: CommandID,
                            Amount: Amount,
                            Msisdn: Msisdn,
                            BillRefNumber: BillRefNumber
                        };
                        data = JSON.stringify(requestBody);
                        try {
                            axios({
                                method: "POST",
                                url: this._c2bSimulateURL,
                                data: data
                            }).then(function (res) { return resolve(res.data); })["catch"](function (error) { reject(error.response.data); });
                        }
                        catch (error) {
                            reject(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    // Account Balance Request
    // Use this API to enquire the balance on an M-Pesa BuyGoods (Till Number).
    Mpesa.prototype.checkAccountBalance = function (CommandID, IdentifierType, Remarks) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var headers, requestBody, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!CommandID)
                            reject(new Error("Must provide a CommandID"));
                        if (!IdentifierType)
                            reject(new Error("Must provide an IdentifierType"));
                        if (!Remarks)
                            reject(new Error("Must provide a Remarks"));
                        return [4 /*yield*/, this._setHeaders()];
                    case 1:
                        headers = _a.sent();
                        requestBody = {
                            Initiator: this.Initiator,
                            SecurityCredential: this.SecurityCredential,
                            CommandID: CommandID,
                            PartyA: this.ShortCode,
                            IdentifierType: IdentifierType,
                            Remarks: Remarks,
                            QueueTimeOutURL: this.QueueTimeOutURL,
                            ResultURL: this.ResultURL
                        };
                        data = JSON.stringify(requestBody);
                        try {
                            axios({
                                method: "POST",
                                url: this._accountBalanceURL,
                                data: data
                            })
                                .then(function (res) { return resolve(res.data); })["catch"](function (error) { reject(error.response.data); });
                        }
                        catch (error) {
                            reject(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    //  B2C Payment Request
    //  Use this API to transact between an M-Pesa short code to a phone number registered on M-Pesa.
    Mpesa.prototype.b2c = function (Amount, PartyA, PartyB, Remarks, CommandID, Occassion, SecurityCredential) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var headers, requestBody, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Amount)
                            reject(new Error("Must provide a Amount"));
                        if (!PartyA)
                            reject(new Error("Must provide a PartyA"));
                        if (!PartyB)
                            reject(new Error("Must provide a PartyB"));
                        if (!CommandID)
                            reject(new Error("Must provide a CommandID"));
                        if (!Occassion)
                            reject(new Error("Must provide a Occassion"));
                        if (!Remarks)
                            reject(new Error("Must provide a Remarks"));
                        if (!SecurityCredential)
                            reject(new Error("Must provide a SecurityCredential"));
                        return [4 /*yield*/, this._setHeaders()];
                    case 1:
                        headers = _a.sent();
                        requestBody = {
                            InitiatorName: this.Initiator,
                            SecurityCredential: SecurityCredential,
                            CommandID: CommandID,
                            Amount: Amount,
                            PartyA: PartyA,
                            PartyB: PartyB,
                            Remarks: Remarks,
                            QueueTimeOutURL: this.QueueTimeOutURL,
                            ResultURL: this.ResultURL,
                            Occassion: Occassion
                        };
                        data = JSON.stringify(requestBody);
                        try {
                            axios({
                                method: "POST",
                                url: this._b2cURL,
                                data: data
                            })
                                .then(function (res) { return resolve(res.data); })["catch"](function (error) { reject(error.response.data); });
                        }
                        catch (error) {
                            reject(error);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return Mpesa;
}());
module.exports = Mpesa;
