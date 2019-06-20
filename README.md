# vsystems-ledger-js
The JavaScript library for V Systems and Ledger Wallet

## Install

  1. install node.js (homebrew or https://nodejs.org/)

  2. clone this project

``` bash
$ git clone https://github.com/virtualeconomy/vsystems-ledger-js.git
```

  3. install packages

```bash
  $ cd vsystems-ledger-js
  $ npm install
```

  4. build project and then you can use JS library for V Systems and Ledger Wallet

```bash
  $ npm run build
```


## Test

Firstly, you need to install VSYS app in ledger wallet. To install VSYS app, please use Ledger Live or refer [this repo](https://github.com/virtualeconomy/ledger-app-vsystems).

Conntect ledger wallet to PC. Unlock screen with PIN and enter VSYS app. Then run these commands as you want (you may need to change some parameters in test file).

```
# Test payment with ledger wallet
# Change RECIPIENT_ADDR in "test/vsys-ledger-test-payment.js" for your test case
$ npm run payment

# Test leasing with ledger wallet
# Change RECIPIENT_ADDR in "test/vsys-ledger-test-lease.js" for your test case
$ npm run lease

# Test cancel leasing with ledger wallet
# Change LEASE_TX_ID in "test/vsys-ledger-test-cancellease.js" for your test case
$ npm run cancel
```

Feel free to modify these test example files. Write your own code as wallet client and integrate into your project.