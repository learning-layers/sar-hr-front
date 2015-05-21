(function() {
	var self = {};
	window.media = self;

	var stream = false;
	var mainStreamSource = false;
	var thumbnailStreamSource = false;
	var videoSurface = false;
	var camera = false;

	var streams = {};

	var userMediaReady = function(localMediaStream, callback) {
		stream = localMediaStream;
		callback(stream);
	}

	var setMediaStream = function(stream, peer) {
		videoSurface.src = window.URL.createObjectURL(stream);
		videoSurface.play();
		return this;
	}

	self.setStream = function(name, stream) {
		streams[name] = stream;
		return this;
	}

	var setThumbnailStream = function(stream, peer) {
		thumbnailVideo.src = window.URL.createObjectURL(stream);
		thumbnailVideo.play();
		return this;
	}

	/**
	 * Asks for clients userstream (webcam)
	 * @param callback {function(MediaStream)}
	 * @return {media}
	 */
	self.getUserStream = function(callback) {
		if(stream) {
			setThumbnailStream(stream, p2p.localPeer());
			callback(stream);
			return this;
		}

		var videoConf = {}
		if(camera) {
			videoConf.optional = [{
				sourceId: camera
			}];
		}
		var us = navigator.webkitGetUserMedia({
			video: videoConf,
			audio: true
		}, function(stream) {
			self.setStream(p2p.localPeer(), stream);
			userMediaReady(stream, callback);
		}, function(error) {
			console.log(error);
		});

		return this;
	};

	var remoteStream = false;

	var sourceChanged = [];
	self.onSourceChanged = function(callback) {
		if(sourceChanged.indexOf(callback) === -1) {
			sourceChanged.push(callback);
		}
		return this;
	}

	var triggerSourceChange = function() {
		for(var i = 0; i < sourceChanged.length; i++) {
			sourceChanged[i](mainStreamSource);
		}
	}

	self.currentMainStream = function() {
		return mainStreamSource;
	}

	self.clearMediaSource = function() {
		mainStreamSource = false;
		return this;
	}

	self.swapStreams = function() {
		for(var i in streams) {
			if(i !== mainStreamSource) {
				self.switchToStream(i);
				return this;
			}
		}
	};

	var waitingForSurface = false;
	self.switchToStream = function(name) {
		if(!videoSurface || !thumbnailVideo) {
			waitingForSurface = function() {
				self.switchToStream(name);
			};
			return this;
		}

		if(mainStreamSource === name) {
			return this;
		}

		mainStreamSource = name;

		var used = [name];

		videoSurface.src = window.URL.createObjectURL(streams[name]);
		if(mainStreamSource === p2p.localPeer()) {
			videoSurface.muted = true;
			thumbnailVideo.muted = false;
		} else {
			videoSurface.muted = false;
			thumbnailVideo.muted = true;
		}
		videoSurface.play();

		for(var i in streams) {
			if(used.indexOf(i) === -1) {
				thumbnailVideo.src = window.URL.createObjectURL(streams[i]);
				thumbnailStreamSource = i;
				thumbnailVideo.play();
			}
		}

		triggerSourceChange();
	};

	var isPlaying = false;
	self.setVideoSurface = function(videoElement) {
		videoSurface = videoElement;

		if(waitingForSurface) {
			waitingForSurface();
			waitingForSurface = false;
		}
		return this;
	};

	self.createVideoElement = function() {
		videoSurface = document.createElement('video');
		videoSurface.classList.add('Main');
		return videoSurface;
	}

	var thumbnailVideo = false;

	self.setThumbnailSource = function(videoElement) {
		thumbnailVideo = videoElement;
		if(waitingForSurface) {
			waitingForSurface();
			waitingForSurface = false;
		}
		return this;
	};

	self.createThumbnailVideo = function() {
		thumbnailVideo = document.createElement('video');
		thumbnailVideo.classList.add('Thumbnail');
		thumbnailVideo.addEventListener('click', function() {
			self.switchToStream(thumbnailStreamSource);
		});
		return thumbnailVideo;
	}

	if(MediaStreamTrack.getSources) {
		MediaStreamTrack.getSources(function(src) {
			var first = false;
			var back = false;
			for(var i in src) {
				if(src[i].kind === 'video') {
					if(!first) {
						first = src[i].id;
					}

					if(src[i].facing === 'environment') {
						back = src[i].id;
					}
				}
			}
			camera = back || first;
		});
	}

})();