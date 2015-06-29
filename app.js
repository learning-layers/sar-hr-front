'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('SARHR', ['ngRoute', 'SARHR.login', 'SARHR.list', 'SARHR.profile', 'SARHR.details', 'SARHR.call']).config(['$routeProvider', function($routeProvider) {
	$routeProvider.otherwise({redirectTo: '/login'});

}]).factory('sessionService', ['$injector', function($injector) {

	var globals = {
		setSession: function(session, $http) {
			this.session = session;
			sessionStorage.setItem('session', JSON.stringify(this.session));
			var name = 'legroup-sar-' + this.session.user.id;

			p2p.start(name, function(id) {
				if(!$http) {
					var $http = $injector.get('$http');
				}
				$http({
					method: 'PATCH',
					url: '/users/' + session.user.id,
					data: {
						user: {
							peer_id: id
						}
					}
				}).success(function() {
					console.log('ALL DONE');
				});
			});
		},
		clearSession: function($http) {
			if(this.session) {
				$http.delete('sessions/');
				var self = this;
				setTimeout(function() {
					self.session = false;
					sessionStorage.removeItem('session');
				}, 200);

			}

			p2p.destroy();
		},
		wake: function() {
			if(sessionStorage.getItem('session')) {
				this.setSession(JSON.parse(sessionStorage.getItem('session')));
			}
		},
		setHeaders: function(request) {
			if(this.session) {
				request.headers['X-User-Email'] = this.session.user.email;
				request.headers['X-User-Token'] = this.session.token;
			}
		},
		session: false
	};
	globals.wake();
	return globals;
}]).factory('httpInterceptor', ['$q', '$location', 'sessionService', function($q, $location, sessionService) {
	return {
		request: function(request) {
			var a = request.url.split('/');
			var last = a[a.length - 1].split('.');
			if(last.length < 2) {
				request.url = 'https://sar-backend.herokuapp.com/' + request.url;
				sessionService.setHeaders(request);
			}
			return request;
		},
		response: function(response) {
			return response;
		},
		responseError: function(rejection) {
			if(rejection.status === 401) {
				$location.path('/login');
			}

			return $q.reject(rejection);
		}
	}
}]).config(function($httpProvider) {
	$httpProvider.interceptors.push('httpInterceptor');
}).service('skillService', ['$http', function($http) {
	var t = this;
	t.skills = {};
	$http.get('skills/').success(function(data) {
		for(var i = 0; i < data.skills.length; i++) {
			t.skills[data.skills[i].id] = data.skills[i];
		}
	});
}]).service('peopleService', ['$http', '$location', 'sessionService', function($http, $location, sessionService) {
	var t = this;
	this.people = [];

	var reject = false;
	var accept = false;
	p2p.setOnCall(function(call) {
		document.querySelector('#soundIncoming').play();

		var caller = false;
		for(var i = 0; i < t.people.length; i++) {
			var person = t.people[i];
			if(person.peer_id == call.peer) {
				caller = person;
				break;
			}
		}

		var notification = document.querySelector('#notificationCall');
		notification.firstElementChild.textContent = 'Incoming call from ' + caller.name;
		notification.classList.add('visible');

		var acceptButton = document.querySelector('#callAnswer');
		if(accept) {
			acceptButton.removeEventListener('click', accept);
		}

		accept = function() {
			media.getUserStream(function(stream) {
				document.querySelector('#soundIncoming').pause();
				notification.classList.remove('visible');
				window.location.hash = '#/call/' + caller.id;
				call.on('stream', function(stream) {
					media.setStream(call.peer, stream);
					media.switchToStream(call.peer);
				});
				call.answer(stream);

			});
		};
		acceptButton.addEventListener('click', accept);

		var rejectButton = document.querySelector('#callReject');
		if(reject) {
			rejectButton.removeEventListener('click', reject);
		}
		reject = function() {
			document.querySelector('#soundIncoming').pause();
			notification.classList.remove('visible');
			call.close();
		};
		rejectButton.addEventListener('click', reject);
	});

	$http.get('users/').success(function(data, status, headers, config) {
		for(var i = 0; i < data.users.length; i++) {
			if(data.users[i].id === sessionService.session.user.id) {
				continue;
			}
			data.users[i].status = data.users[i].status.split('_').join(' ');
			t.people.push(data.users[i]);
		}

	}).error(function(data, status, headers, config) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});
}]).run(['$rootScope', 'peopleService', function($rootScope, peopleService) {
	return $rootScope.peopleService = peopleService;
}]);
