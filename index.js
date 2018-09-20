require('dotenv').config()
const bch = require('bitcoincashjs')
var fromHash = function(hash) {
  const RpcClient = require('bitcoind-rpc');
  const rpc = new RpcClient({
    protocol: 'http',
    user: process.env.BITCOIN_USERNAME ? process.env.BITCOIN_USERNAME : 'root',
    pass: process.env.BITCOIN_PASSWORD ? process.env.BITCOIN_PASSWORD : 'bitcoin',
    host: process.env.BITCOIN_IP ? process.env.BITCOIN_IP : '127.0.0.1',
    port: process.env.BITCOIN_PORT ? process.env.BITCOIN_PORT : '8332',
  })
  return new Promise(function(resolve, reject) {
    rpc.getRawTransaction(hash, async function(err, transaction) {
      if (err) {
        console.log("Error: ", err)
      } else {
        let result = await fromTx(transaction.result)
        resolve(result)
      }
    })
  })
}
var fromTx = function(transaction, options) {
  return new Promise(function(resolve, reject) {
    let gene = new bch.Transaction(transaction);
    let t = gene.toObject()
    let result = [];
    let senders = []
    let receivers = [];
    let inputs = [];
    let outputs = [];
    let graph = {};
    if (gene.inputs) {
      gene.inputs.forEach(function(input, input_index) {
        if (input.script) {
          let xput = { index: input_index }
          input.script.chunks.forEach(function(c, chunk_index) {
            let chunk = c;
            if (c.buf) {
              xput["b" + chunk_index] = c.buf.toString('base64')
              if (options && options.h && options.h > 0) {
                xput["h" + chunk_index] = c.buf.toString('hex')
              }
            } else {
              xput["b" + chunk_index] = c;
            }
          })
          xput.str = input.script.inspect()
          let sender = {
            tx: input.prevTxId.toString('hex'),
            index: input.outputIndex
          }
          let address = input.script.toAddress(bch.Networks.livenet).toString(bch.Address.CashAddrFormat).split(':')[1];
          if (address && address.length > 0) {
            sender.a = address;
          }
          xput.sender = sender;
          senders.push(sender)
          inputs.push(xput)
        }
      })
    }
    if (gene.outputs) {
      gene.outputs.forEach(function(output, output_index) {
        if (output.script) {
          let xput = { index: output_index }
          output.script.chunks.forEach(function(c, chunk_index) {
            let chunk = c;
            if (c.buf) {
              xput["b" + chunk_index] = c.buf.toString('base64')
              xput["s" + chunk_index] = c.buf.toString('utf8')
              if (options && options.h && options.h > 0) {
                xput["h" + chunk_index] = c.buf.toString('hex')
              }
            } else {
              xput["b" + chunk_index] = c;
            }
          })
          xput.str = output.script.inspect()
          let receiver = {
            v: output.satoshis,
            index: output_index
          }
          let address = output.script.toAddress(bch.Networks.livenet).toString(bch.Address.CashAddrFormat).split(':')[1];
          if (address && address.length > 0) {
            receiver.a = address;
          }
          xput.receiver = receiver;
          receivers.push(receiver)
          outputs.push(xput)
        }
      })
    }
    resolve({
      tx: { hash: t.hash },
      input: inputs,
      output: outputs
    })
  })
}
module.exports = {
  fromHash: fromHash,
  fromTx: fromTx
}