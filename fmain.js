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
  },
      
  responseForEventManager: function() {
      this.connection.on('data', function(data) {
        console.log('GET');
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
              PP2P.send({"scope":"response", "content":data});
            });
          } else if (data.content.type == 'POST') {
            fetch(data.content.url, {headers:get.content.headers, body:get.content.body}).then(response => { return response.text() }).then(data => {
              PP2P.send({"scope":"response", "content":data});
            });
          } else {
            PP2P.log(2, 'Unexpected ServerConnectionType from remote request');
          }
        } else if (get.scope == "pp2p") {
          console.log('uw');
          CommonJS.makeEvent(window, 'getPP2PLocalResponse', {"detail":{"do":get.do, "content":get.content}});
          
          if (get.do == "ping") {
            var prima = Date.now();
            fetch(this.server).then(response => {
              var dit = Date.now() - timeStart;
              PP2P.connection.send({"scope":"pp2p", "do":"pingResponse", "content":dit});
            });
          } else if (get.do == "connection") {
            console.log('debugging');
            PP2P.connection.send({"scope":"pp2p", "do":"connection", "content":"DONE"});
          } else if (get.do == "dominant") {
            if (get.do.content) {
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
    window.addEventListener('getPP2PLocalResponse', function(response) {
      PP2P.log(1, 'Message getPP2PLocalResponse..RECEIVED');
      PP2P.connected = true;
      response = response.detail;
      if (response.do == "connection" && response.content == "DONE") {
        PP2P.log(1, 'ConnectionMain responseAsMessage received');
        PP2P.connection.send({"scope":"pp2p", "do":"ping", "content":"ConnectionEnstabilished"});
        PP2P.log(1, 'PingMain message sent');
        window.addEventListener('getPP2PLocalResponse', function(response) {
          response = response.detail;
          if (response.do == "pingResponse") {
            if (PP2P.globalPing > response.content) {
              PP2P.dominant = true;
              PP2P.send({"scope":"pp2p", "do":"dominant", "content":false});
            } else {
              PP2P.dominant = true;
              PP2P.send({"scope":"pp2p", "do":"dominant", "content":false});
            }
          }
          return;
        });
      }
    });
    
    console.log('OutLoop');
  },

  send: function(scope, message, customServer) {
    customServer = customServer ?? '';
    if (scope == "client") {
      this.connection.send({"scope":"client","content":message});
    } else if (scope == "customServer") {
      this.connection.send({"scope":"customServer", "content":message});
    } else if (scope == "server") {
      this.connection.send({"scope":"server", "content":message});
    } else {
      this.log('Unexpected scope');
    }
  }
}
