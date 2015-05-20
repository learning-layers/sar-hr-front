(function() {

	var GESTURE_DEFAULTS = {
		strokeColor: 'yellow',
		strokeWidth: 5,
		strokeCap: 'round',
		strokeJoin: 'round'
	};

	var GESTURE_TIMEOUT_MS = 5000;

	var canvas;
	var drawTool;
	var gestureLayer;

	// The gesture path that is being drawn
	var currentPath;

	var self = {};
	window.drawing = self;

	self.setup = function() {

		canvas = document.querySelector('canvas#callCanvas');

		console.log(canvas);
		paper.setup(canvas);

		drawTool = new paper.Tool();
		gestureLayer = paper.project.activeLayer;

		// Minimum density for the points (pt)
		drawTool.minDistance = 10;

		// Fired when there's data
		p2p.onData(handleMessage);

		// Fired when the video stream changes
		media.onSourceChanged(changeSource);

		// Fired when the tool is first used
		drawTool.onMouseDown = function(event) {
			currentPath = new paper.Path(GESTURE_DEFAULTS);

			// Set gesture colour
			currentPath.strokeColor = p2p.colorForSelf();

			drawPath(currentPath);
		};

		// Fired when the tool is dragged
		drawTool.onMouseDrag = function(event) {
			currentPath.add(event.point);

			// Create a simple gesture from the path
			var gesture = toGesture(currentPath);

			// Creator of the gesture
			var creator = p2p.localPeer();

			// Include the stream where the gesture was drawn
			var targetStream = media.currentMainStream();

			p2p.sendData({
				type: 'gesture',
				creator: creator,
				targetStream: targetStream,
				gesture: gesture
			});
		};
	};

	/**
	 * Handles a message from the peer.
	 */
	function handleMessage(message) {
		switch(message.type) {
			case 'gesture':
				var creator = message.creator;
				var targetStream = message.targetStream;
				var gesture = message.gesture;
				var path = toPath(gesture);

				// Set gesture colour according to its creator
				path.strokeColor = p2p.colorForPeer(creator);

				media.switchToStream(targetStream);

				drawPath(path);
				break;

			default:
				console.warn('No handler for message ' + message);
		}
	}

	/**
	 * Handles changes to the stream source.
	 */
	function changeSource(isLocal) {
		erasePaths();
	}

	/**
	 * Adds a gesture path onto the layer.
	 */
	function drawPath(path) {
		gestureLayer.addChild(path);
		paper.view.update();

		setTimeout(function() {
			erasePath(path);
		}, GESTURE_TIMEOUT_MS);
	}

	/**
	 * Erases all paths.
	 */
	function erasePaths() {
		gestureLayer.removeChildren();
		paper.view.update();
	}

	/**
	 * Erases a path.
	 */
	function erasePath(path) {
		path.remove();
		paper.view.update();
	}

	/**
	 * Converts the given path into a simple gesture object.
	 */
	function toGesture(path) {
		// Path position is relative to the canvas dimensions
		var gestureX = path.position.x / path.view.size.width;
		var gestureY = path.position.y / path.view.size.height;

		var points = path.segments.map(segmentToSimplePoint);

		return {
			x: gestureX,
			y: gestureY,
			points: points
		};
	}

	/**
	 * Converts the given gesture into a Path.
	 */
	function toPath(gesture) {
		var path = new paper.Path(GESTURE_DEFAULTS);

		var posX = gesture.x * path.view.size.width;
		var posY = gesture.y * path.view.size.height;

		path.position = new paper.Point(posX, posY);

		var segments = gesture.points.map(simplePointToSegment);

		path.addSegments(segments);

		return path;
	}

	/**
	 * Converts a path segment to a simple point object.
	 */
	function segmentToSimplePoint(segment) {
		return {
			x: segment.point.x,
			y: segment.point.y
		};
	}

	/**
	 * Converts a simple point to a path segment.
	 */
	function simplePointToSegment(point) {
		return new paper.Segment(new paper.Point(point.x, point.y));
	}

})();