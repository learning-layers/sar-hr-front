'use strict';

angular.module('SARHR.list', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/list', {
		templateUrl: 'list/list.html',
		controller: 'ListCtrl'
	});
}])

.controller('ListCtrl', ['$scope', 'peopleService', 'skillService', function($scope, peopleService, skillService) {
	$scope.query = '';

	$scope.people = peopleService.people;

	$scope.peopleSearch = function() {
		return function(person) {
			if($scope.query === '') {
				return true;
			}

			var needle = $scope.query.toLowerCase();
			var stack = ['first_name', 'last_name', 'name'];
			for(var i = 0; i < stack.length; i++) {
				if(person[stack[i]].toLowerCase().indexOf(needle) > -1) {
					return true;
				}
			}

			for(var i = 0; i < person.skill_ids.length; i++) {
				if(skillService.skills[person.skill_ids[i]].name.indexOf(needle) > -1) {
					return true;
				}
			}

			return false;
		}
	}

}]);