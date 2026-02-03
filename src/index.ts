
interface Config_Options {
    consumer_key: string,
    consumer_secret: string,
    passkey: string,
    BusinessShortCode: number,
    ShortCode: number,
    SecurityCredential: string,
    Initiator: string,
    callBackBaseUrl: string
}


class Mpesa {
    AuthToken: string
    consumer_key: string
    consumer_secret: string
    passkey: string
    BusinessShortCode: number
    ShortCode: number
    SecurityCredential: string
    Initiator: string

    QueueTimeOutURL: string
    ResultURL: string
    CallBackURL: string
    ConfirmationURL: string
    ValidationURL: string

    stkTransactionType: string

    callBackBaseUrl: string

    _accountBalanceURL: string
    _authURL: string
    _stkURL: string
    _stkCheckURL: string
    _c2bRegisterURL: string
    _c2bSimulateURL: string
    _b2cURL: string

    constructor(options: Config_Options) {
        this.AuthToken = ''
        this.consumer_key = options.consumer_key
        this.consumer_secret = options.consumer_secret
        this.passkey = options.passkey
        this.BusinessShortCode = options.BusinessShortCode
        this.ShortCode = options.ShortCode
        this.SecurityCredential = options.SecurityCredential
        this.Initiator = options.Initiator
        this.callBackBaseUrl = options.callBackBaseUrl

        this.stkTransactionType = "CustomerPayBillOnline"



        this.QueueTimeOutURL = `${this.callBackBaseUrl}/queue`
        this.ResultURL = `${this.callBackBaseUrl}/result`
        this.CallBackURL = `${this.callBackBaseUrl}/callback`
        this.ConfirmationURL = `${this.callBackBaseUrl}/confirm`
        this.ValidationURL = `${this.callBackBaseUrl}/valid`




        this._accountBalanceURL = "https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query"
        this._authURL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        this._stkURL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        this._stkCheckURL = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
        this._c2bRegisterURL = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl"
        this._c2bSimulateURL = " https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate"
        this._b2cURL = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
    }



    //  AUTH Request
    //  Use this API to generate an OAuth access token to access other APIs

    async _getAuthToken() {

        let auth: string = "Basic " + Buffer.from(this.consumer_key + ":" + this.consumer_secret).toString("base64") as string

        try {
            let res = await fetch(this._authURL, { headers: { "Authorization": auth } })
            let data = await res.json()
            if (!res.ok) {
                throw new Error(data.errorMessage || 'Authentication failed')
            }
            let { access_token } = data
            if (access_token) {
                this.AuthToken = access_token
                console.log(access_token)
            }
        } catch (error: any) {
            this.AuthToken = ''
            console.error(error.message || error)
        }
        return this.AuthToken
    }


    pad2(n: any) { return n < 10 ? '0' + n : n }

    async _getHeaders() {
        let access_token = await this._getAuthToken()
        return {
            Authorization: "Bearer " + access_token,
            'Content-Type': 'application/json'
        }
    }

    _generateTimeStamp(): string {
        var date = new Date();
        return date.getFullYear().toString() + this.pad2(date.getMonth() + 1) + this.pad2(date.getDate()) + this.pad2(date.getHours()) + this.pad2(date.getMinutes()) + this.pad2(date.getSeconds())
    }

    _generatePassword(): string {
        let Timestamp = this._generateTimeStamp()
        return Buffer.from(this.BusinessShortCode + this.passkey + Timestamp).toString("base64") as string
    }



    // Lipa Na M-Pesa Online Payment API
    // Use this API to initiate online payment on behalf of a customer.



    async stkPush(Amount: number, PhoneNumber: number, AccountReference: string, TransactionDesc: string) {
        if (!Amount) throw new Error("Must provide an amount")
        if (!PhoneNumber) throw new Error("Must provide a PhoneNumber")
        if (!AccountReference) throw new Error("Must provide an AccountReference")
        if (!TransactionDesc) throw new Error("Must provide a TransactionDesc")

        let headers = await this._getHeaders()
        var Timestamp = this._generateTimeStamp()
        var Password = this._generatePassword()

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
        }

        let res = await fetch(this._stkURL, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        })
        let data = await res.json()
        if (!res.ok) {
            throw data
        }
        return data
    }



    // Lipa Na M-Pesa Query Request API
    // Use this API to check the status of a Lipa Na M-Pesa Online Payment.

    async stkCheck(CheckoutRequestID: string) {
        if (!CheckoutRequestID) throw new Error("Must provide an CheckoutRequestID")

        let headers = await this._getHeaders()

        let requestBody = {
            BusinessShortCode: this.BusinessShortCode,
            CheckoutRequestID,
            Timestamp: this._generateTimeStamp(),
            Password: this._generatePassword()
        }

        let res = await fetch(this._stkCheckURL, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        })
        let data = await res.json()
        if (!res.ok) {
            throw data
        }
        return data
    }


    // C2B Register URL
    // Use this API to register validation and confirmation URLs on M-Pesa 


    async c2bRegister(ConfirmationURL: string, ValidationURL: string, ResponseType: string, ShortCode: string) {
        if (!ConfirmationURL) throw new Error("Must provide a ConfirmationURL")
        if (!ValidationURL) throw new Error("Must provide a ValidationURL")
        if (!ResponseType) throw new Error("Must provide a ResponseType")
        if (!ShortCode) throw new Error("Must provide a ShortCode")

        let headers = await this._getHeaders()

        let requestBody = {
            ShortCode,
            ResponseType,
            ConfirmationURL,
            ValidationURL
        }

        let res = await fetch(this._c2bRegisterURL, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        })
        let data = await res.json()
        if (!res.ok) {
            throw data
        }
        return data
    }




    // C2B Simulate Transaction
    // This API is used to make payment requests from Client to Business (C2B). 
    // You can use the sandbox provided test credentials down below to simulates a payment made from the client phone's STK/SIM Toolkit menu, and enables you to receive the payment requests in real time.


    async c2bTransact(ShortCode: string, CommandID: string, Amount: string, Msisdn: string, BillRefNumber: string) {
        if (!ShortCode) throw new Error("Must provide a ShortCode")
        if (!CommandID) throw new Error("Must provide a CommandID")
        if (!Amount) throw new Error("Must provide an Amount")
        if (!Msisdn) throw new Error("Must provide a Msisdn")
        if (!BillRefNumber) throw new Error("Must provide a BillRefNumber")

        let headers = await this._getHeaders()

        let requestBody = {
            ShortCode,
            CommandID,
            Amount,
            Msisdn,
            BillRefNumber
        }

        let res = await fetch(this._c2bSimulateURL, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        })
        let data = await res.json()
        if (!res.ok) {
            throw data
        }
        return data
    }




    // Account Balance Request
    // Use this API to enquire the balance on an M-Pesa BuyGoods (Till Number).


    async checkAccountBalance(CommandID: string, IdentifierType: string, Remarks: string) {
        if (!CommandID) throw new Error("Must provide a CommandID")
        if (!IdentifierType) throw new Error("Must provide an IdentifierType")
        if (!Remarks) throw new Error("Must provide a Remarks")

        let headers = await this._getHeaders()

        let requestBody = {
            Initiator: this.Initiator,
            SecurityCredential: this.SecurityCredential,
            CommandID,
            PartyA: this.ShortCode,
            IdentifierType,
            Remarks,
            QueueTimeOutURL: this.QueueTimeOutURL,
            ResultURL: this.ResultURL
        }

        let res = await fetch(this._accountBalanceURL, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        })
        let data = await res.json()
        if (!res.ok) {
            throw data
        }
        return data
    }



    //  B2C Payment Request
    //  Use this API to transact between an M-Pesa short code to a phone number registered on M-Pesa.


    async b2c(Amount: string, PartyA: string, PartyB: string, Remarks: string, CommandID: string, Occassion: string, SecurityCredential: string) {
        if (!Amount) throw new Error("Must provide a Amount")
        if (!PartyA) throw new Error("Must provide a PartyA")
        if (!PartyB) throw new Error("Must provide a PartyB")
        if (!CommandID) throw new Error("Must provide a CommandID")
        if (!Occassion) throw new Error("Must provide a Occassion")
        if (!Remarks) throw new Error("Must provide a Remarks")
        if (!SecurityCredential) throw new Error("Must provide a SecurityCredential")

        let headers = await this._getHeaders()

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
        }

        let res = await fetch(this._b2cURL, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        })
        let data = await res.json()
        if (!res.ok) {
            throw data
        }
        return data
    }

}

module.exports = Mpesa; 