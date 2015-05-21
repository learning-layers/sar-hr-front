(function() {
	var self = {};
	window.p2p = self;

	// Hearbeat
	var bpm = 4;
	var me = false;
	var peer;
	var connections = {
		data: {},
		video: {}
	};

	var colors = {};

	var activePeer = false;
	var called = false;
	var defaultConnection;
	var calling = false;

	var afterConnection = [];
	var backupPart = 1;

	self.colorForPeer = function() {
		return 'blue';
	};

	var heartbeatInterval = false;

	self.start = function(username, func, error) {
		me = username;
		peer = new Peer(me, {
			debug: 0,
			secure: true,
			path: '/',
			host: 'legroup-p2p.herokuapp.com',
			port: 443
		});

		peer.on('open', function(id) {
			if(func) {
				func(id);
			}

			if(id != me) {
				new Error('Could not get intended id, using "' + id + '" instead.');
			}

			console.log(peer)

			if(heartbeatInterval) {
				clearInterval(heartbeatInterval);
			}

			heartbeatInterval = setInterval(function() {
				peer.socket.send({type: 'HEARTBEAT'});
			}, (60 / bpm) * 1000);
		});

		peer.on('error', function(err) {
			if(err.type === 'unavailable-id') {
				self.start(username + '-' + backupPart, func, error);
				backupPart++;
			}
			if(error) {

				error(err);
			}
		});

		peer.on('connection', function(connection) {
			onConnection(connection);
		});

		peer.on('call', function(call) {
			called = true;
			if(calling) {
				return;
			}
			onCall(call)
		});
	};

	self.isBeingCalled = function() {
		return called;
	};

	self.destroy = function() {
		if(!!peer && !peer.destroyed) {
			peer.destroy();
		}
		peer = false;
	};

	var onDataCallbacks = [];
	self.onData = function(func) {
		if(onDataCallbacks.indexOf(func) === -1) {
			onDataCallbacks.push(func);
		}
		return this;
	}

	var onData = function(data) {
		for(var i = 0; i < onDataCallbacks.length; i++) {
			onDataCallbacks[i](data);
		}
	}

	var onStream = function(call, stream) {
		media.setStream(call.peer, stream);
		media.switchToStream(call.peer);
	}

	var onCallList = [];
	var onCall = function(param) {
		onCallList.push(param);
		return this;
	};

	self.setOnCall = function(func) {
		onCall = func;
		while(onCallList.length > 0) {
			onCall(onCallList.pop());
		}
		return this;
	}

	self.endCall = function() {
		media.clearMediaSource();

		if(connections.video[activePeer]) {
			connections.video[activePeer].close();
		}

		connections.data[activePeer].close();
		return this;
	};

	var onConnection = function(connection) {
		activePeer = connection.peer;
		connection.on('close', function() {
			onClose(connection);
			//ui.playSound('busy');
		});

		connection.on('data', function(data) {
			onData(data);
		});

		connections.data[connection.peer] = connection;

		while(afterConnection.length > 0) {
			afterConnection.pop()();
		}
	};

	var onClose = function(connection) {
		console.log('CLOSE', connection);
		//ui.hideRingALingDialog();
		//ui.showCallDialog();
	};

	var onError = function(error) {
		new Error(error);
	}

	self.connectTo = function(remote, func) {
		if(!peer) {
			afterConnection.push(function() {
				self.connectTo(remote, func);
			});
			return this;
		}

		remote = remote || defaultConnection;
		activePeer = remote;
		var conn = peer.connect(remote)

		conn.on('open', function() {
			if(func) {
				func();
			}
			onConnection(conn)
		});

		conn.on('error', function(err) {
			console.log(err)
		});

		return this;
	}

	self.remotePeer = function() {
		return defaultConnection;
	}

	self.colorForSelf = function() {
		return 'red';
	};

	self.localPeer = function() {
		return me;
	}

	self.sendData = function(data, remote) {
		connections.data[activePeer].send(data);
		return this;
	}

	self.streamVideo = function(remote, func) {
		calling = true;
		remote = remote || defaultConnection;
		activePeer = remote;
		remotePeer = remote;

		if(func) {
			func();
		}
		media.getUserStream(function(stream) {
			var call = peer.call(remote, stream);
			call.on('stream', function(stream) {
				onStream(call, stream);
			});

			call.on('close', function() {
				connections[remotePeer] = false;
			})
			connections.video[remotePeer] = call;
		});

	}

	window.onunload = window.onbeforeunload = function(e) {
		if(!!peer && !peer.destroyed) {
			peer.destroy();
		}
	};
})();