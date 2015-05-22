'use strict';

angular.module('SARHR.details', ['ngRoute']).filter('skills', ['skillService', function(skillService) {
	return function(input) {
		return skillService.skills[input].name;
	}
}])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/list/:userId', {
		templateUrl: 'details/details.html',
		controller: 'DetailsCtrl'
	});
}])

.controller('DetailsCtrl', ['$scope', '$routeParams', '$http', 'skillService', function($scope, $routeParams, $http, skillService) {
	var id = $routeParams.userId;

	$scope.user = {};
	console.log(skillService);

	$http.get('users/'+id).success(function(data) {
		data.user.status = data.user.status.split('_').join(' ');
		$scope.user = data.user;

		document.getElementById('profileCallLink').href = '#/call/'+id;
	});

}]);