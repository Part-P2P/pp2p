class pp2p {
  
  constructor(server, id, clientid) {
    this.server = server;
    this.id = id;
    this.clientId = clientid;
  }
  
  ping() {
    const start = Date.now();
    var res = http_request(this.server);
    const end = Date.now()
    return (end - start);
  }
 
  isDominantClient(otherping, p2p) {
    if (otherping > this.ping()) {
      return false;
      this.send(p2p, 'pp2p.tech:notDom');
    } else {
      this.send(p2p, 'pp2p.tech:Dom');
      return true;
    }
  }
}
