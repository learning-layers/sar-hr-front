'use strict';

angular.module('SARHR.profile', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/profile', {
		templateUrl: 'profile/profile.html',
		controller: 'ProfileCtrl'
	});
}])

.controller('ProfileCtrl', function($scope) {
	$scope.profileFormData = {};

	$scope.allTags = ['UI', 'Backend', 'JavaScript', 'Testing', 'PHP', 'BASIC', 'Agile', 'Nagging'];
	$scope.profileTags = ['JavaScript'];

	$scope.addSkill = function() {
		$scope.profileTags.push($scope.tagToAdd);
	};

	$scope.notInUse = function() {
		return function(tag) {
			return $scope.profileTags.indexOf(tag) === -1;
		}
	};

	$scope.saveProfile = function() {

	};
});