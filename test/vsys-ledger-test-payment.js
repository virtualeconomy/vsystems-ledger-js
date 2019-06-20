import "babel-polyfill";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

const { listen } = require("@ledgerhq/logs");
const hwapp = require("../lib/VsysLedger");
const tx = require("../lib/util/transaction");
const base58 = require("../lib/util/base58");
const request = require('request')

const RECIPIENT_ADDR = "AU59JztgHbANCpu5PuHQt7z6BakzQN2e6tr"; //change address for your test case
const AMOUNT = 1; 

const NODE_IP = "http://test.v.systems:9922";
const NETWORK_BYTE = 'T'.charCodeAt(0);
const PATH = "44'/360'/0'/0/0";

const paymentData = {
  recipient: RECIPIENT_ADDR,
  amount: AMOUNT * 1e8,
  fee: 1e7,
  feeScale: 100,
  timestamp: Date.now() * 1e6,
  attachment: "Ledger Test"
}

async function testPayment(data) {
  const transport = await TransportNodeHid.open("");
  var app = new hwapp.Vsys(transport, NETWORK_BYTE);
  const address = await app.getWalletPublicKey(PATH);
  if (!address || !address['publicKey']) {
    throw "Failed to get Public Key!";
  }
  var dataBytes = tx.default.toBytes(data, 2);
  const signature = await app.signTransaction(PATH, dataBytes);
  var attachmentBase58 = base58.default.encode(toUTF8Array(data["attachment"]))
  var postData = {
    "timestamp": data["timestamp"],
    "amount": data["amount"],
    "fee": data["fee"],
    "feeScale": data["feeScale"],
    "recipient": data["recipient"],
    "senderPublicKey": address['publicKey'],
    "attachment": attachmentBase58,
    "signature": signature
  }
  return postData;
}

function sendPayment(postData) {
  const url = NODE_IP + '/vsys/broadcast/payment'
  request.post(url, {
    json: postData
  }, (error, res, body) => {
    if (error) {
      console.error(error)
    } else {
      console.log("Response: " + JSON.stringify(body))
    }
  })
}


function toUTF8Array (str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

listen(log => console.log(log.type + ": " + log.message));

testPayment(paymentData).then(
  result => {
    console.log("Post Data with signature: " + JSON.stringify(result));
    sendPayment(result);
  },
  e => {
    console.error(e);
  }
);
