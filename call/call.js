'use strict';

angular.module('SARHR.call', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/call/:userId', {
		templateUrl: 'call/call.html',
		controller: 'CallCtrl'
	});
}])

.controller('CallCtrl', ['$scope', '$routeParams', '$http', '$location', 'peopleService', function($scope, $routeParams, $http, $location, peopleService) {
	var id = $routeParams.userId;

	$scope.user = {};

	$scope.back = function() {
		p2p.endCall();
		window.location.href = '/#/list/' + id;
		window.location.reload();
	};

	media.setVideoSurface(document.getElementById('callVideo'));
	media.setThumbnailSource(document.getElementById('callThumb'));

	drawing.setup();

	document.getElementById('callThumb').addEventListener('click', function() {
		media.swapStreams();
	});

	if(!p2p.isBeingCalled()) {
		$http.get('users/' + id).success(function(data) {
			$scope.user = data.user;

			if($scope.user.status === 'offline') {
				$location.path('/list/' + id);
				return;
			}
			var name = data.user.peer_id;

			p2p.connectTo(name, function() {
				p2p.streamVideo(name, function() {
				})
			});
		});
	} else {

	}

}]);
