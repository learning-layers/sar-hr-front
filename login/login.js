'use strict';

angular.module('SARHR.login', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/login', {
		templateUrl: 'login/login.html',
		controller: 'LoginCtrl'
	});
}])

.controller('LoginCtrl', ['$scope', '$location', '$http', 'sessionService', function($scope, $location, $http, sessionService) {
	sessionService.clearSession($http);

	$scope.loginFormData = {};
	$scope.processLogin = function() {
		$http.post('sessions/', $scope.loginFormData).success(function(data, status) {
			if(status === 201) {
				sessionService.setSession(data.session, $http);
				$location.path('/list');
				window.location.reload();
			}
		});
	};
}]);