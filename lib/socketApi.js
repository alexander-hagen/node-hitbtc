const
  moment = require('moment'),
  WebSocket = require('ws');

const
  BASE = 0,
  PUBLIC = 1,
  TRADING = 2,
  ACCOUNT = 3;

const URLs=[
  'wss://api.hitbtc.com/api/2/ws', /* baseUrl */
  'wss://api.hitbtc.com/api/2/ws/public', /* publicUrl */
  'wss://api.hitbtc.com/api/2/ws/trading', /* tradingUrl */
  'wss://api.hitbtc.com/api/2/ws/account']; /* accountUrl */

class SocketClient {

  constructor(onConnected) {
    this._id = 1; // Request ID, incrementing
    this._ws = new Array (4);
    this._createSocket(BASE); /* Phase Out */
    this._createSocket(PUBLIC);
    this._createSocket(TRADING);
    this._createSocket(ACCOUNT);
    
    this._onConnected = onConnected;
    this._promises = new Map();
    this._handles = new Map();
    this._alive = true;

  }

  _createSocket(stream) {
    this._ws[stream] = new WebSocket(URLs[stream]);

    this._ws[stream].onopen = () => {
      console.log('ws '+stream+' connected');
      this._onConnected();
      this._ws[stream].user = undefined;
    };
    this._ws[stream].onclose = () => {
      console.log('ws '+stream+' closed');
      this._promises.forEach((cb, id) => {
        this._promises.delete(id);
        cb.reject(new Error('Disconnected'));
      });
    };
    this._ws[stream].onerror = err => {
      console.log('ws '+stream+' error: '+JSON.stringify(err));
    };
    this._ws[stream].onmessage = msg => {
      try {
        const message = JSON.parse(msg.data);
        if (message.id) {
          if (this._promises.has(message.id)) {
            const cb = this._promises.get(message.id);
            this._promises.delete(message.id);
            if (message.result) {
              cb.resolve(message.result);
            } else if (message.error) {
              console.log('Error response: '+JSON.stringify(message.error));
              cb.reject(message.error);
            } else {
              console.log('Unprocessed response: '+message);
            }
          }
        } else {
          if (message.method && message.params) {
            if (this._handles.has(message.method)) {
              this._handles.get(message.method).forEach(cb => {
                cb(message.params);
              });
            } else {
              console.log("Unprocessed method: "+message.method);
            }
          } else {
            console.log('Unprocessed message: '+message);
          }
        }
      } catch (e) {
        console.log('Fail parse message:'+e);
      }
    };
    this._ws[stream].on('ping', heartbeat);
  }

  // Send websocket request with method and params

  request(method, params = {}) {

//    console.log("Request: "+method);

    if (this._ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        const requestId = ++this._id;
        this._promises.set(requestId, {resolve, reject});
        const msg = JSON.stringify({method, params, id: requestId});
        this._ws.send(msg);
        setTimeout(() => {
          if (this._promises.has(requestId)) {
            this._promises.delete(requestId);
            reject(new Error('Timeout'));
          }
        }, 10000);
      });

    } else {
      return Promise.reject(new Error('WebSocket connection not established'))
    }

  }

  // Process websocket handler
  setHandler(method, callback) {

    if (!this._handles.has(method)) { this._handles.set(method, []); };
    this._handles.get(method).push(callback);

  }

}

class OrderBookStore {

  constructor(onChangeBest) {

    this._data = {};

    this._onChangeBest = onChangeBest;

  }


  getOrderBook(symbol) {
    console.log("getOrderbook "+symbol);
    return this._data[symbol.toString()];
  }

  snapshotOrderBook(symbol, ask, bid) {
    var asksize=0, bidsize=0;

    console.log("snapshotOrderBook "+symbol);

    this._data[symbol.toString()] = {
      ask: ask,
      bid: bid
    };

    this._data[symbol.toString()].ask.forEach(function(line) {
      asksize=math.round(asksize+parseFloat(line.size), allsymbols[marketidx].decimals);
      line["cumulative"]=asksize.toString();
    });

    this._data[symbol.toString()].bid.forEach(function(line) {
      bidsize=math.round(bidsize+parseFloat(line.size), allsymbols[marketidx].decimals);
      line["cumulative"]=bidsize.toString();
    });

  }

  updateOrderBook(symbol, ask, bid) {
    console.log("updateOrderBook "+symbol);

    const data = this._data[symbol.toString()];
    if (data) {

    }

  }

}

function reconnect(config) {


};

function heartbeat() {

  clearTimeout(this.pingTimeout);

  // Use `WebSocket#terminate()`, which immediately destroys the connection,
  // instead of `WebSocket#close()`, which waits for the close timer.
  // Delay should be equal to the interval at which your server
  // sends out pings plus a conservative assumption of the latency.

  var config=this.user;
console.log("\nPinging :"+this.readyState);

  this.pingTimeout = setTimeout(() => {
    console.log("EndState :"+this.readyState+" / "+moment().toISOString());
    console.log("terminated "+(config==undefined?config:config.psid)+"\n");
//    this.close();
    this.terminate();
//    process.exit(0);
    // create new socket
    if(config!=undefined) { config.ws=new socketApi(config); }
  }, 30000 + 1000);

  console.log("ping "+(config==undefined?config:config.psid)+"\n");

}

const orderBooks = new OrderBookStore((symbol, bestASk, bestBid) => {
  logger.info('New best orderbook', symbol, bestASk, bestBid);
});

class OrderBook {

  constructor(onChangeBest) {
    this._data = {};
  }

  getOrderBook(symbol) {
    return this._data[symbol.toString()];
  }

  // Process snapshotOrderbook notification

  snapshotOrderBook(symbol, ask, bid) {
    var marketidx;
    var asksize=0, bidsize=0;

    console.log("Snapshot orderbook "+symbol);

    marketidx=allsymbols.findIndex(function(market) { return market.id===symbol; });

    this._data[symbol.toString()] = {
      ask: ask,
      bid: bid
    };

    this._data[symbol.toString()].ask.forEach(function(line) {
      asksize=math.round(asksize+parseFloat(line.size), allsymbols[marketidx].decimals);
      line["cumulative"]=asksize.toString();
    });

    this._data[symbol.toString()].bid.forEach(function(line) {
      bidsize=math.round(bidsize+parseFloat(line.size), allsymbols[marketidx].decimals);
      line["cumulative"]=bidsize.toString();
    });

    console.log(JSON.stringify(data));

  }


  // Process updateOrderbook notification

  updateOrderBook(symbol, ask, bid) {
    var marketidx;
    var askidx=0, bididx=0;
    var asksize=0, bidsize=0;

    console.log("Updating orderbook "+symbol);

    marketidx=allsymbols.findIndex(function(market) { return market.id===symbol; });

    const data = this._book[symbol.toString()];

    if (data) {

    for(var i=0; i<data.ask.length; i++) {
      if(askidx<ask.length)
        if(data.ask[i].price>ask[askidx].price) {
          asksize=math.round(asksize+ask[askidx].size, allsymbols[marketidx].decimals);
          ask[askidx]["cumulative"]=asksize.toString();
          data.ask.splice(i,0,ask[askidx]);
          askidx++;
          continue;
        };
        if(data.ask[i].price==ask[askidx].price) {
          if(ask[askidx].size==0) {
            data.ask.splice(i,1);
            i--; // Make i stay the same
          } else {
            asksize=math.round(asksize+ask[askidx].size, allsymbols[marketidx].decimals);
            data.ask[i].cumulative=asksize.toString();
          };
          askidx++;
          continue;
        };
      };
      asksize=math.round(asksize+data.ask[i].size, allsymbols[marketidx].decimals);
      data.ask[i].cumulative=asksize.toString();
    };

    for(var i=0; i<data.bid.length; i++) {
      if(bididx<bid.length) {
        if(data.bid[i].price<bid[bididx].price) {
          bidsize=math.round(bidsize+bid[bididx].size, allsymbols[marketidx].decimals);
          bid[bididx]["cumulative"]=bidsize.toString();
          data.bid.splice(i,0,ask[bididx]);
          bididx++;
          continue;
        };
        if(data.bid[i].price==bid[bididx].price) {
          if(bid[bididx].size==0) {
            data.bid.splice(i,1);
            i--; // Make i stay the same
          } else {
            bidsize=math.round(bidsize+bid[bididx].size, allsymbols[marketidx].decimals);
            data.bid[i].cumulative=bidsize.toString();
          };
          bididx++;
          continue;
        };
      };
      bidsize=math.round(bidsize+data.bid[i].size, allsymbols[marketidx].decimals);
      data.bid[i].cumulative=bidsize.toString();
    };

    console.log(JSON.stringify(data));
  }

}

var HitbtcSocket = function(keys) {
  this.baseURL = 'wss://api.hitbtc.com/api/2/ws';
  this.timeout = 5000;
  this.initialized = false;
  this.authenticated = false;
  this.orderBooks = new OrderBookStore();
  this.socket = new SocketClient(async () => {
    this.initialized=true;
    if(keys!=undefined) { this.login(keys); };
  });
};

var socketApi = module.exports = function(keys) {
  return new HitbtcSocket(keys);
};

HitbtcSocket.prototype.setHandler = function(method, callback) {
  this.socket.setHandler(method, callback);
};

HitbtcSocket.prototype.getCurrencies = async function() {
  const currencies = await this.socket.request('getCurrencies');
  return currencies;
};

HitbtcSocket.prototype.getCurrency = async function(symbol) {
  const currency = await this.socket.request('getCurrency', {"currency": symbol});
  return currency;
};

HitbtcSocket.prototype.getSymbols = async function() {
  const symbols = await this.socket.request('getSymbols');
  return symbols;
};

HitbtcSocket.prototype.getSymbol = async function(market) {
  const symbol = await this.socket.request('getSymbol', {"symbol": market});
  return symbol;
};

//
// Public Socket API's
//

HitbtcSocket.prototype.subscribeOrderbook = function(market) { // async
  this.socket.request('subscribeOrderbook', {"symbol": market});
};

HitbtcSocket.prototype.unsubscribeOrderbook = function(market) { // async
  this.socket.request('unsubscribeOrderbook', {"symbol": market});
};

HitbtcSocket.prototype.subscribeTicker = function(market) { // async
  this.socket.request('subscribeTicker', {"symbol": market});
};

HitbtcSocket.prototype.unsubscribeTicker = function(market) { // async
  this.socket.request('unsubscribeTicker', {"symbol": market});
};

//
// Private Socket API's
//

HitbtcSocket.prototype.login = async function(keys) {

  try {
    const result = await this.socket.request('login', {
      "algo": "BASIC",
      "pKey": keys.apikey,
      "sKey": keys.secret
    });
    this.authenticated=true;
    return result;
  }
  catch(e) {
    console.log("### Error caught (login): "+JSON.stringify(e));
  };
};

HitbtcSocket.prototype.getTradingBalance = async function() { // sync
  try {
    const result = await this.socket.request('getTradingBalance', { });
    return result;
  }
  catch(e) {
    console.log("### Error caught (getTradingBalance): "+e);
//    process.exit(0);
    return [];
  };
};

HitbtcSocket.prototype.getOrders = async function() { // sync
  try {
    const result = await this.socket.request('getOrders', { });
    return result;
  }
  catch(e) {
    console.log("### Error caught (getOrders): "+JSON.stringify(e));
//    process.exit(0);
    return [];
  };
};

HitbtcSocket.prototype.subscribeReports = function() { // async
  const result = this.socket.request('subscribeReports', { });
  return result;
};

HitbtcSocket.prototype.newOrder = async function(symbol, price, quantity, side, type, stopPrice, order_id) { // async

  try {
    const result = await this.socket.request('newOrder', {
      "clientOrderId": order_id,
      "symbol": symbol,
      "side": side,
      "type": type,
      "timeInForce": undefined,
      "quantity": quantity,
      "price": price,
      "stopPrice": stopPrice,
      "expireTime": undefined,
      "strictValidate": false,
      "postOnly": false
    });
    console.log("### Success (newOrder):\nADD: "+order_id+" ==> "+side.toUpperCase()+" "+quantity+" @ " +price);
    return result;
  } catch(e) {
    switch(e.code) {
      case 20008: console.log("### Error caught (newOrder): "+JSON.stringify(e)+"\nADD: "+order_id+" ==> "+side.toUpperCase()+" "+quantity+" @ " +price); break;
      default: break;
    };
  };

  return null;

};

HitbtcSocket.prototype.cancelOrder = async function(clientOrderId) { // async

  try {
    const result = await this.socket.request('cancelOrder', { "clientOrderId": clientOrderId });
    return result;
  } catch(e) {
    switch(e.code) {
      case 20008: console.log("### Error caught (cancelOrder): "+JSON.stringify(e)+"\nDEL: "+clientOrderId); break;
      default: console.log("### Error caught (cancelOrder): "+JSON.stringify(e)+"\nDEL: "+clientOrderId); break;
    };
  };

  return null;

};

HitbtcSocket.prototype.replaceOrder = async function(clientOrderId, newOrderId, price, quantity) { // async

  try {
    const result = await this.socket.request('cancelReplaceOrder', {
      "clientOrderId": clientOrderId,
      "requestClientId": newOrderId,
      "quantity": quantity,
      "price": price,
      "strictValidate": false
    });
    return result;
  } catch(e) {
    switch(e.code) {
      case 20008: console.log("### Error caught (replaceOrder): "+JSON.stringify(e)+"\nREPL: "+clientOrderId+"/"+newOrderId+" ==> "+quantity+" @ " +price); break;
      default: break;
    };
  };

  return null;

};
