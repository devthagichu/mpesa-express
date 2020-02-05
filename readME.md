 # Getting Started

    

### Installation 

        npm install mpesa-express


### Features


### Quick Start

        npm install mpesa-express  

Add to project

        const Mpesa = require ('mpesa-express');

        Initialize  with options
            
        const options = { 
            consumer_key: "",
            consumer_secret: "", 
            passkey: "", 
            BusinessShortCode:  , 
            ShortCode: , 
            SecurityCredential: "", 
            Initiator: "", 
        }
     
        const mpesa = new Mpesa(options)


###   Lipa Na M-Pesa Online Payment API
###### Use this API to initiate online payment on behalf of a customer.

        mpesa.sktPush(Amount, PhoneNumber, AccountReference, TransactionDesc) 

### Lipa Na M-Pesa Query Request API
###### Use this API to check the status of a Lipa Na M-Pesa Online Payment.

        mpesa.stkCheck(CheckoutRequestID)

### C2B Register URL
 ###### Use this API to register validation and confirmation URLs on M-Pesa 

        mpesa.c2bRegister( ConfirmationURL, ValidationURL, ResponseType, ShortCode)

### C2B Simulate Transaction
###### This API is used to make payment requests from Client to Business (C2B). 
###### You can use the sandbox provided test credentials down below to simulates a payment made from the client phone's STK/SIM Toolkit menu, and enables you to receive the payment requests in real time.

        mpesa.c2bTransact(ShortCode, CommandID, Amount, Msisdn, BillRefNumber)

### B2C Payment Request
###### Use this API to transact between an M-Pesa short code to a phone number registered on M-Pesa.

        mpesa.b2c(Amount, PartyA, PartyB, Remarks, CommandID, Occassion, SecurityCredential)

### Account Balance Request
###### Use this API to enquire the balance on an M-Pesa BuyGoods (Till Number)

        mpesa.checkAccountBalance(CommandID, IdentifierType, Remarks)
