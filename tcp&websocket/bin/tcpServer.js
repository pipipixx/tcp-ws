var net = require('net');
var server = net.createServer();
var events = require('events');
var tcpEvent = new events.EventEmitter();

//聚合所有客户端
var sockets = {};

function tcpInit(){
  server.on('connection', function(socket){
    console.log('新的tcp连接: ' + socket.remoteAddress + ':' + socket.remotePort);
    socket.on('data', function(data){
        //console.log(socket.remoteAddress + '接收数据: ' + data);
        try{
          var obj = JSON.parse(data);
        }catch(e){
          //console.log(e);
          socket.write('format err');
          return;
        }
        //将登录数据中的设备编号存入socket对象
        if (obj.login) {
          //去掉重复登录信息
          if (!sockets.hasOwnProperty(obj.deviceNum)) {
            socket.deviceNum = obj.deviceNum;
            socket.write('login');
            sockets[obj.deviceNum] = socket;
            tcpEvent.emit('newTcpConnect',socket.deviceNum);
          }else{
            console.log(obj.deviceNum+'登录信息重复')
            return;
          }
        }else if(obj.sendData){
          tcpEvent.emit('newTcpData',{deviceNum:obj.deviceNum,data:obj.data});
          socket.write('data');
        }else{
          socket.write('abnormal');
        }
    });
    //删除被关闭的连接
    socket.on('close', function(){
      delete sockets[socket.deviceNum];
      console.log('一个tcp连接关闭');
      tcpEvent.emit('oneTcpDisconnect',socket.deviceNum);
    });
  });
   
  server.on('error', function(err){
      console.log('Server error:', err.message);
  });
   
  server.on('close', function(){
      console.log('Server closed');
  });
   
  server.listen(9559,() => {
    console.log('TCP      服务启动,端口9559');
  });
}

exports.sockets = sockets;
exports.tcpInit = tcpInit;
exports.tcpEvent = tcpEvent;

//广播数据
//每当一个已连接的用户输入数据，就将这些数据广播给其他所有已连接的用户
// sockets.forEach(function(otherSocket){
//     if (otherSocket !== socket){
//         otherSocket.write(data);
//     }
// });