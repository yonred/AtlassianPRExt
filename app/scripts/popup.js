(function($, chrome, angular, window){
'use strict';
//https://stash.lbi.co.uk/rest/inbox/latest/pull-requests?role=reviewer&limit
console.log(chrome);
//console.log(chrome.extension.getBackgroundPage());
var backgroundPage = chrome.extension.getBackgroundPage();
console.log(backgroundPage.stashObj.reviewItems);
angular.module('stashApp', [])
  .controller('reviewListCtrl', function ($scope, $http) {
    $scope.listReviews = backgroundPage.stashObj.reviewItems;
    $scope.listAuthor = backgroundPage.stashObj.authorItems;
    $scope.listPullRequest = backgroundPage.stashObj.pullRequestItems;
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
  });

})(window.$, window.chrome, window.angular, window);
