require('./app').config(function ($routeProvider, $locationProvider) {
        $routeProvider.
            when('/stats', {
                templateUrl: 'js/views/overview.html',
                controller: 'ThermostatCtrl'
            }).
            otherwise({
                redirectTo: '/stats'
            });

        //$locationProvider.html5Mode(true);
    });
