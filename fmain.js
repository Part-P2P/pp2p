const PP2P = function(server) {
  this.server = server;
  this.peer = new Peer();
  
  this.getURL = async function(url) {
    var response = await fetch(url).then((r)=>{return r.text()});
    console.log(response);
    return response;
  }
  
  this.postURL = async function(url, headers, jsoncontent) {
    var response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: jsoncontent
    }).then((r)=>{return r.text()})
      return response;
  }
  
  this.ping = function() {
    const start = Date.now();
    var res = this.getURL(this.server);
    const end = Date.now()
    return (end - start);
  }
  
  this.log = function(type, message) {
    if (type == 1) {
      var h = "[#INFO]";
    } else if (type == 2) {
      var h = "[#ERROR]";
    } else {
      var h = "[#UNDEFINED-ERROR]";
    }
    
    window.console.log("[PP2P.js]" + type + " >> " + message);
  }
  
  this.getConnection = function() {
    return this.connection;
  }
 
  this.connect function(id) {
    this.id = id;
    this.connection = this.peer.connect(this.id);
    this.log(1, 'Prepare to ConnectionEvent message');
    this.connection.on('open', function() {
      this.connection.send({"scope":"pp2p", "do":"connection", "content":"NIL"});
      this.log(1, 'ConnectionMain message sent');
    });
    this.connection.on('data', function(data) {
      if (data.scope == "pp2p" && data.do == "connection" && data.content == "DONE") {
        this.log(1, 'Connection enstabilished, now declaring dominant server!');
        this.validateConnection();
      } else {
        this.connection = false;
        return false;
      }
    });
  } 
  
  this.validateConnection = function() {
    if (!this.connection) {
      this.log(2, 'This..connection is NUL / FALSE');
      return;
    }
    
    this.connection.send({"scope":"pp2p", "do":"ping", "content":"ConnectionEnstabilished"});
    this.log(1, "PingScope (PP2P) message P2P sent, awaiting response from upstream");
    this.connection.on('data', function(data) {
      if (data.scope == "pp2p" && data.do == "pingResponse") {
        this.log(1, 'Response received, analyzing content');
        var localPing = this.ping();
        
        if (data.content > localPing) {
          this.dominant = false;
          this.connection.send({"scope":"pp2p", "do":"dominant", "content":true});
          this.log(1, 'Not dominant, send to 2nd client a dominant confirm');
        } else {
          this.dominant = true;
          this.connection.send({"scope":"pp2p", "do":"dominant", "content":false});
          this.log(1, 'Dominant, send to 2nd client a not-dominant confirm');
        }
        return this.connection;
      }
    });
  }
  
  this.send = function(scope, message, customServer) {
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

const tempPP2P = PP2P('https://api.fcosma.it/');

tempPP2P.peer.on('open', function(id) {
  tempPP2P.myid = id;
  CommonJS.makeEvent(document, 'pp2pOn', {"detail":id});
});

tempPP2P.peer.on('connection', function(connection) {
  connection.on('data', function(data) {
    loadData(data);
  });
  
  if (tempPP2P.connection == undefined || tempPP2P.connection != connection) {
    tempPP2P.connection = connection;
  }
});

function loadData(get) {
  if (get.scope == "client") {
    CommonJS.makeEvent(document, 'clientData', {"detail":get.content});
  } else if (get.scope == "customServer") {
    if (get.content.type = "GET") {
      var response = tempPP2P.getURL(get.content.url);
      tempPP2P.connection.send({"scope":"response", "content":response});
    } else if (get.content.type = "POST") {
      var response = tempPP2P.postURL(get.content.url, get.content.headers, get.content.body);
      tempPP2P.connection.send({"scope":"response", "content":response});
    } else {
      tempPP2P.log(2, 'Undefined requestType (customServer.type)');
    }
  } else if (get.scope == "response") {
    CommonJS.makeEvent(document, 'serverData', {"detail":get.content});
  } else if (get.scope == "pp2p" && get.do != undefined) {
    if (get.do == "ping") {
      var ping = tempPP2P.ping();
      tempPP2P.connection.send({"scope":"pp2p", "do":"pingResponse", "content":ping});
    } else if (get.do == "connection") {
      tempPP2P.connection.send({"scope":"pp2p", "do":"connection", "content":"DONE"});
    } else if (get.do == "dominant") {
      if (get.do.content) {
        tempPP2P.dominant = true;
      } else {
        tempPP2P.dominant = false;
      }
    }
  }
}
