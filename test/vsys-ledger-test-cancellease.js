import "babel-polyfill";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";

const { listen } = require("@ledgerhq/logs");
const hwapp = require("../lib/VsysLedger");
const tx = require("../lib/util/transaction");
const request = require('request')

const LEASE_TX_ID = ""; //change the transaction ID for your test case

const NODE_IP = "http://test.v.systems:9922";
const NETWORK_BYTE = 'T'.charCodeAt(0);
const PATH = "44'/360'/0'/0/0";

const cancelleaseData = {
  txId: LEASE_TX_ID,
  fee: 1e7,
  feeScale: 100,
  timestamp: Date.now() * 1e6
}

async function testCancellease(data) {
  if (!data["txId"]) {
    throw "Cannot cancel lease! Transaction ID is not set.";
  }
  const transport = await TransportNodeHid.open("");
  var app = new hwapp.Vsys(transport, NETWORK_BYTE);
  const address = await app.getWalletPublicKey(PATH);
  if (!address || !address['publicKey']) {
    throw "Failed to get Public Key!";
  }
  var dataBytes = tx.default.toBytes(data, 4);
  const signature = await app.signTransaction(PATH, dataBytes);
  var postData = {
    "timestamp": data["timestamp"],
    "txId": data["txId"],
    "fee": data["fee"],
    "feeScale": data["feeScale"],
    "senderPublicKey": address['publicKey'],
    "signature": signature
  }
  return postData;
}

function sendCancellease(postData) {
  const url = NODE_IP + '/leasing/broadcast/cancel'
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

testCancellease(cancelleaseData).then(
  result => {
    console.log("Post Data with signature: " + JSON.stringify(result));
    sendCancellease(result);
  },
  e => {
    console.error(e);
  }
);
