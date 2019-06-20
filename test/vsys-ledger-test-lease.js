import "babel-polyfill";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

const { listen } = require("@ledgerhq/logs");
const hwapp = require("../lib/VsysLedger");
const tx = require("../lib/util/transaction");
const request = require('request')

const RECIPIENT_ADDR = "AU59JztgHbANCpu5PuHQt7z6BakzQN2e6tr"; //change address for your test case
const AMOUNT = 1; 

const NODE_IP = "http://test.v.systems:9922";
const NETWORK_BYTE = 'T'.charCodeAt(0);
const PATH = "44'/360'/0'/0/0";

const leaseData = {
  recipient: RECIPIENT_ADDR,
  amount: AMOUNT * 1e8,
  fee: 1e7,
  feeScale: 100,
  timestamp: Date.now() * 1e6
}

async function testLease(data) {
  const transport = await TransportNodeHid.open("");
  var app = new hwapp.Vsys(transport, NETWORK_BYTE);
  const address = await app.getWalletPublicKey(PATH);
  if (!address || !address['publicKey']) {
    throw "Failed to get Public Key!";
  }
  var dataBytes = tx.default.toBytes(data, 3);
  const signature = await app.signTransaction(PATH, dataBytes);
  var postData = {
    "timestamp": data["timestamp"],
    "amount": data["amount"],
    "fee": data["fee"],
    "feeScale": data["feeScale"],
    "recipient": data["recipient"],
    "senderPublicKey": address['publicKey'],
    "signature": signature
  }
  return postData;
}

function sendLease(postData) {
  const url = NODE_IP + '/leasing/broadcast/lease'
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

listen(log => console.log(log.type + ": " + log.message));

testLease(leaseData).then(
  result => {
    console.log("Post Data with signature: " + JSON.stringify(result));
    sendLease(result);
  },
  e => {
    console.error(e);
  }
);
