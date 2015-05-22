'use strict';

angular.module('SARHR.details', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/list/:userId', {
		templateUrl: 'details/details.html',
		controller: 'DetailsCtrl'
	});
}])

.controller('DetailsCtrl', ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http) {
	var id = $routeParams.userId;

	$scope.user = {};

	$http.get('users/'+id).success(function(data) {
		data.user.status = data.user.status.split('_').join(' ');
		$scope.user = data.user;

		document.getElementById('profileCallLink').href = '#/call/'+id;
	});

}]);