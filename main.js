const PP2P = {
  defineServer: function(server) {
    this.server = server;
    this.peer = new Peer();
    this.connected = false;
    this.internalEvent = false;
    
    this.eventHandler();
  },
  
  eventHandler: function() {
    this.peer.on('open', function(id) {
      CommonJS.makeEvent(document, 'pp2pOn', {"detail":id});
    });
    
    this.peer.on('connection', function(conn) {
      PP2P.connection = conn;
      PP2P.responseForEventManager();
    });
  },
      
  responseForEventManager: function() {
      this.connection.on('data', function(data) {
        PP2P.connected = true;
        var get = data;
        if (get.scope == "client") {
          CommonJS.makeEvent(document, 'clientData', {"detail":get.content});
        } else if (get.scope == "response") {
          CommonJS.makeEvent(document, 'serverData', {"detail":get.content});
        } else if (get.scope == "server") {
          if (get.content.url == undefined) {
            get.content.url = PP2P.server;
          }
          
          if (get.content.type == 'GET') {
            fetch(get.content.url).then(response => { return response.text() }).then(data => {
              PP2P.connection.send({"scope":"response", "content":{"requestId":get.requestId, "content":data}});
            });
          } else if (data.content.type == 'POST') {
            fetch(data.content.url, {headers:get.content.headers, body:get.content.body}).then(response => { return response.text() }).then(data => {
              PP2P.connection.send({"scope":"response", "content":{"requestId":get.requestId, "content":data}});
            });
          } else {
            PP2P.log(2, 'Unexpected ServerConnectionType from remote request');
          }
        } else if (get.scope == "pp2p") {
          CommonJS.makeEvent(window, 'getPP2PLocalResponse', {"detail":{"do":get.do, "content":get.content}});
          
          if (get.do == "ping") {
            var prima = Date.now();
            fetch(PP2P.server).then(response => {
              var dit = Date.now() - prima;
              PP2P.connection.send({"scope":"pp2p", "do":"pingResponse", "content":dit});
            });
          } else if (get.do == "connectionResponse" && get.content == "DONE") {
            CommonJS.makeEvent(window, 'getPP2PLocalResponse_connection');
          } else if (get.do == "pingResponse") {
            CommonJS.makeEvent(window, 'getPP2PLocalResponse_ping', {"detail":get.content});
          } else if (get.do == "connection") {
            PP2P.connection.send({"scope":"pp2p", "do":"connectionResponse", "content":"DONE"});
          } else if (get.do == "dominant") {
            CommonJS.makeEvent(document, 'pp2pConnected', {'detail':get.content});
            if (get.content) {
              PP2P.dominant = true;
            } else {
              PP2P.dominant = false;
            }
          }          
        }
      });
  },
  
  ping: function() {
    const start = Date.now();
    fetch(this.server).then(response => {
      const end = Date.now();
      PP2P.globalPing = end - start;
    });
  },
  
  log: function(type, message) {
    if (type == 1) {
      var h = "[#INFO]";
    } else if (type == 2) {
      var h = "[#ERROR]";
    } else {
      var h = "[#UNDEFINED-ERROR]";
    }
    
    window.console.log("[PP2P.js]" + h + " >> " + message);
  },
  
  getConnection: function() {
    return this.connection;
  },

  connect: function(id) {
    this.ping();
    this.id = id;
    this.connection = this.peer.connect(this.id);
    this.log(1, 'Prepare to ConnectionEvent message');
    this.connection.on('open', function() {
      PP2P.responseForEventManager();
      PP2P.connection.send({"scope":"pp2p", "do":"connection", "content":"NIL"});
      PP2P.log(1, 'ConnectionMain message sent');
    });
    window.addEventListener('getPP2PLocalResponse_connection', function() {
      PP2P.connected = true;
      PP2P.log(1, 'ConnectionMain responseAsMessage received');
      PP2P.connection.send({"scope":"pp2p", "do":"ping", "content":"ConnectionEnstabilished"});
      PP2P.log(1, 'PingMain message sent');
      window.addEventListener('getPP2PLocalResponse_ping', function(response) {
        response = response.detail;
        
        if (PP2P.globalPing > response) {
          CommonJS.makeEvent(document, 'pp2pConnected', {'detail':false});
          PP2P.dominant = true;
          PP2P.connection.send({"scope":"pp2p", "do":"dominant", "content":false});
          PP2P.log(1, 'This client is dominant, sending a non-dominant message to other peer');
        } else {
          CommonJS.makeEvent(document, 'pp2pConnected', {'detail':false});
          PP2P.dominant = false;
          PP2P.connection.send({"scope":"pp2p", "do":"dominant", "content":true});
          PP2P.log(1, 'This client is not dominant, sending a dominant message to other peer');
        }
      });
    });
  },

  send: function(scope, message, customServer) {
    customServer = customServer ?? '';
    if (scope == "client") {
      this.connection.send({"scope":"client","content":message});
    } else if (scope == "server") {
      var requestId = Math.floor(Math.random() * 100000) + 1;
      if (this.dominant) {
        var get = message;
        if (get.url == undefined) {
          get.url = this.server;
        }
        
        if (get.type == 'GET') {
          fetch(get.url).then(response => { return response.text() }).then(data => {
            CommonJS.makeEvent(document, 'serverData', {'detail':{'response':data, 'requestId':requestId}});
          });
        } else if (get.type == 'POST') {
          fetch(get.url, {headers:get.headers, body:get.body}).then(response => { return response.text() }).then(data => {
            CommonJS.makeEvent(document, 'serverData', {'detail':{'response':data, 'requestId':requestId}});
          });
        } else {
          this.log(2, 'Unexpected SendTypeRequest');
        }
      } else {
        this.connection.send({"scope":"server", "requestId":requestId, "content":message});
      }
      return requestId;
    } else {
      this.log(2, 'Unexpected scope [2]');
    }
  }
}
