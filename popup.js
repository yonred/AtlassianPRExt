(function($, chrome, angular, window){
'use strict';
var backgroundPage = chrome.extension.getBackgroundPage();
angular.module('stashApp', [])
  .controller('reviewListCtrl', function ($scope, $http) {
    $scope.listReviews = backgroundPage.stashObj.reviewItems;
    $scope.listAuthor = backgroundPage.stashObj.authorItems;
    $scope.listPullRequest = backgroundPage.stashObj.pullRequestItems;
    $scope.objBamboo = backgroundPage.stashObj.buildStatus;
    $http.get('scripts/front-devs.json').success(function(response) {
        $scope.listDevelopers = response;
    });
  })
  .filter('myFilter', function () {
    return function(inputs,filterValues) {
      	var output = [];

      	angular.forEach(inputs, function (input) {
        	angular.forEach(input, function (item) {
          		if (filterValues.indexOf(item.user.emailAddress) !== -1 && item.approved === false) {
              		output.push(item);
              	}
         	});
       	});

       	return output;
   	};
  })
  .filter('myFilter2', function () {
    return function(inputs,filterValues) {
        var output = [];

        angular.forEach(inputs, function (input) {
            if (filterValues.indexOf(input.approved) !== -1 && input.approved === true) {
                output.push(input);
            }
        });

        return output;
    };
  });

})(window.$, window.chrome, window.angular, window);
