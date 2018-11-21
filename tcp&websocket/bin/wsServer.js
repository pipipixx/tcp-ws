var WebSocket = require('ws');
var sockets = require('./tcpServer').sockets;
var tcpEvent = require('./tcpServer').tcpEvent;
var server = require('./www');

var wsInit = function(){
  var wss = new WebSocket.Server({server});
  console.log('websocket服务启动,端口9560');
  wss.broadcast = function(data) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  function newConnect(ws){
    for(let i in sockets) {
      if (sockets[i] != null) {
        ws.send(JSON.stringify({deviceNum:i,online:true}));
      }    
    }
  }
  //新的ws端连接
  wss.on('connection', function connection(ws) {
    console.log('新的ws连接');
    newConnect(ws);
    //ws客户端向终端发送数据
    ws.on('message', function incoming(deviceNum) {
      sockets[deviceNum].write('controlInfo');
    });
  });
  //新tcp客户端连接
  tcpEvent.on('newTcpConnect',function(deviceNum){
    wss.broadcast({deviceNum:deviceNum,newConnect:true});
  });
  tcpEvent.on('oneTcpDisconnect',function(deviceNum){
    wss.broadcast({deviceNum:deviceNum,disconnect:true});
  });
  //tcp收到数据时
  tcpEvent.on('newTcpData',function(obj){
    wss.broadcast({deviceNum:obj.deviceNum,newData:true,data:obj.data});
  });
}

exports.wsInit = wsInit;