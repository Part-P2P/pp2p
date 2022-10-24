const PP2P = {
  peer: new Peer(),
  main: this,
  firstDone: false,
  
  defineServer: function(server) {
    this.server = server;
  },

/*
  getURL: async function(url) {
    var response = await fetch(url).then(response => { return response.text() });
    return response;
  },
  
  postURL: async function(url, headers, jsoncontent) {
    var response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: jsoncontent
    }).then((r)=>{return r.text()})
      return response;
  },
*/
  
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
 
  start: function(id) {
    this.ping();
    this.id = id;
    this.connection = this.peer.connect(this.id);
    this.log(1, 'Prepare to ConnectionEvent message');
    this.connection.on('open', function() {
      PP2P.connection.send({"scope":"pp2p", "do":"connection", "content":"NIL"});
      PP2P.log(1, 'ConnectionMain message sent');
    });
    this.connection.on('data', function(data) {
      if (data.scope == "pp2p" && data.do == "connection" && data.content == "DONE" && !PP2P.firstDone) {
        PP2P.firstDone = true;
        PP2P.log(1, 'Connection enstabilished, now declaring dominant server!');
        PP2P.validateConnection();
        return false;
      } else if (PP2P.firstDone) {
        PP2P.log(1, '[CommonEvent] >> Disabled');
      } else {
        PP2P.connection = false;
        PP2P.log(2, 'DataScope false - return to ZERO - SCOPE: ' + data.scope + ' - DO: ' + data.do + ' CONTENT: ' + data.content);
        return false;
        // PP2P.log(3, '2');
      }
    });
  },
  
  validateConnection: function() {
    if (!this.connection) {
      this.log(2, 'This..connection is NUL / FALSE');
      return;
    }
    
    this.connection.send({"scope":"pp2p", "do":"ping", "content":"ConnectionEnstabilished"});
    this.log(1, "PingScope (PP2P) message P2P sent, awaiting response from upstream");
    this.connection.on('data', function(data) {
      if (data.scope == "pp2p" && data.do == "pingResponse") {
        PP2P.log(1, 'Response received, analyzing content');
        var localPing = PP2P.globalPing;
        
        if (localPing == undefined) {
          localPing = 5000;
        }
        
        if (data.content > localPing) {
          PP2P.dominant = false;
          PP2P.log(1, 'Not dominant, send to 2nd client a dominant confirm');
        } else {
          PP2P.dominant = true;
          PP2P.log(1, 'Dominant, send to 2nd client a not-dominant confirm');
        }
        PP2P.connection.send({"scope":"pp2p", "do":"dominant", "content":PP2P.dominant});
        return PP2P.connection;
      }
    });
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

const tempPP2P = PP2P;
tempPP2P.defineServer('https://api.fcosma.it/');

tempPP2P.peer.on('open', function(id) {
  tempPP2P.myid = id;
  CommonJS.makeEvent(document, 'pp2pOn', {"detail":id});
});

tempPP2P.peer.on('connection', function(connection) {
  tempPP2P.log(1, 'PeerListener started!');
  connection.on('data', function(data) {
    tempPP2P.log(1, 'DataListener ReC');
    loadData(data);
  });
  
  if (tempPP2P.connection == undefined || tempPP2P.connection != connection) {
    tempPP2P.connection = connection;
  }
});

async function loadData(get) {
  if (get.scope == "client") {
    CommonJS.makeEvent(document, 'clientData', {"detail":get.content});
  } else if (get.scope == "customServer") {
    if (get.content.type = "GET") {
      fetch(get.content.url).then((response) => {
        tempPP2P.connection.send({"scope":"response", "content":response.text()});
      });
    } else if (get.content.type = "POST") {
      fetch(get.content.url, {method:'POST', headers: get.content.headers, body:get.content.body}).then(response => {
        tempPP2P.connection.send({"scope":"response", "content":response.text()});
      });
    } else {
      tempPP2P.log(2, 'Undefined requestType (customServer.type)');
    }
  } else if (get.scope == "server") {
    if (get.content.type = "GET") {
      fetch(tempPP2P.server).then(function(response) {
        console.log(response);
        console.log(response.text());
        tempPP2P.connection.send({"scope":"response", "content":response.text()});
      });
    } else if (get.content.type = "POST") {
      fetch(tempPP2P.server, {method:'POST', headers: get.content.headers, body:get.content.body}).then(response => {
        tempPP2P.connection.send({"scope":"response", "content":response.text()});
      });
    } else {
      tempPP2P.log(2, 'Undefined requestType (customServer.type)');
    }
  } else if (get.scope == "response") {
    CommonJS.makeEvent(document, 'serverData', {"detail":get.content});
  } else if (get.scope == "pp2p" && get.do != undefined) {
    if (get.do == "ping") {
      const timeStart = Date.now();
      fetch(tempPP2P.server).then(response => {
        var dit = Date.now() - timeStart;
        tempPP2P.connection.send({"scope":"pp2p", "do":"pingResponse", "content":dit});
      });
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
