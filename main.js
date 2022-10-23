class pp2p {
  
  constructor(server, id,  peer) {
    this.server = server;
    this.id = id;
    this.peer = peer;
  }
  
  ping() {
    const start = Date.now();
    var res = http_request(this.server);
    const end = Date.now()
    return (end - start);
  }
  
  log(type, message) {
    if (type == 1) {
      var h = "[#INFO]";
    } else if (type == 2) {
      var h = "[#ERROR]";
    } else {
      var h = "[#UNDEFINED-ERROR]";
    }
    
    window.console.log("[PP2P.js]" + type + " >> " + message);
  }
 
  connect(peer) {
    this.connection = peer.connect(this.id);
    this.connection.on('open', function() {
      this.connection.send({"scope" => "pp2p.connection", "content":"NIL"});
    });
    this.connection.on('data', function(data) {
      if ((JSON.parse(data)).scope == "pp2p.connection" && (JSON.parse(data)).content == "DONE") {
        this.connection = true;
        this.log(1, 'Connection enstabilished, now declaring dominant server!');
        this.validateConnection();
      } else {
        this.connection = false;
        return false;
      }
    });  
  } 
  
  validateConnection() {
    if (!this.connection) {
      this.log(2, 'This..connection is NUL / FALSE');
      return;
    }
    
    this.connection.send({"scope":"pp2p.ping", "content":"ConnectionEnstabilished"});
    this.log(1, "PingScope (PP2P) message P2P sent, awaiting response from upstream");
    this.connection.on('data', function(data) {
      if ((JSON.parse(data)).scope == "pp2p.pingResponse") {
        this.log(1, 'Response received, analyzing content');
        var localPing = this.ping();
        
        if (JSON.parse(data)).content > localPing) {
          this.dominant = false;
          this.connection.send({"scope":"pp2p.dominant", "content":true});
          this.log(1, 'Not dominant, send to 2nd client a dominant confirm');
        } else {
          this.dominant = true;
          this.connection.send({"scope":"pp2p.dominant", "content":false});
          this.log(1, 'Dominant, send to 2nd client a not-dominant confirm');
        }
        
        return this.connection;
      }
    });
  }
}
