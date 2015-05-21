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
		$location.path('/list/' + id);
	};

	$http.get('users/' + id).success(function(data) {
		$scope.user = data.user;

		if($scope.user.status === 'offline') {
			$location.path('/list/' + id);
			return;
		}
		var name = data.user.peer_id;

		media.setVideoSurface(document.getElementById('callVideo'));
		media.setThumbnailSource(document.getElementById('callThumb'));
		media.getUserStream(function(stream) {
			console.log(stream);
			media.switchToStream('self');
		});

		p2p.connectTo(name, function() {
			p2p.streamVideo(name, function() {
				console.log('STREAMING')
			})
		});

		drawing.setup();
	});

}]);