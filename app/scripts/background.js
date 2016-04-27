(function($, chrome, document, window){
'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  	console.log('previousVersion', details.previousVersion);
});

//chrome.browserAction.setBadgeText({text: 'Buenas'});

var stashObj = {
	reviewItems: [],
	authorItems: [],
	seenNotifications: [],
	reviewComments: [],
	getReviewRequest: function() {
		$.ajax({
			method: "GET",
			url: "https://stash.lbi.co.uk/rest/inbox/latest/pull-requests?role=reviewer&limit=20",
			dataType:"json",
			success: function(data) {
				stashObj.reviewItems = data.values;
        		stashObj.updateNotifications();
        		chrome.browserAction.setBadgeText({text: stashObj.reviewItems.length + ' PR'});
        		console.log('reviews', stashObj.reviewItems);
			}
		});
	},
	getAuthorRequest: function() {
		$.ajax({
			method: "GET",
			url: "https://stash.lbi.co.uk/rest/inbox/latest/pull-requests?role=author&limit=20",
			dataType:"json",
			success: function(data) {
				stashObj.authorItems = data.values;
        		console.log('auhtor', stashObj.authorItems);
			}
		});
	},
	getAllPullRequest: function() {
		$.ajax({
			method: "GET",
			url: "https://stash.lbi.co.uk/rest/api/1.0/projects/HEL/repos/application/pull-requests?state=OPEN&limit=100",
			dataType:"json",
			success: function(data) {
				stashObj.pullRequestItems = [];
				data.values.forEach(function(item) {
					stashObj.pullRequestItems.push(item.reviewers);
				});
        		console.log('pull request', stashObj.pullRequestItems);
			}
		});
	},
	init: function() {
		if (stashObj.repeat){
            clearTimeout(stashObj.repeat);
        }

        stashObj.getReviewRequest();
        stashObj.getAuthorRequest();
        stashObj.getAllPullRequest();
        stashObj.repeat = setTimeout(stashObj.init, 30000);
	},
	updateNotifications: function() {
		stashObj.reviewItems.forEach(stashObj.sendNotification);
	},
	sendNotification: function(item, index) {
		var url = item.links.self[0].href,
			notificationOptions = {
				title: item.author.user.displayName,
                iconUrl: 'images/icon-128.png',
              	type: 'basic',
              	message: item.title
			},
			comments = item.attributes.commentCount ? item.attributes.commentCount : ["0"];

		if (!stashObj.reviewItems[index].attributes.commentCount) {
			stashObj.reviewItems[index].attributes.commentCount = ["0"];
		}

		if (stashObj.seenNotifications.indexOf(url) === -1) {
            stashObj.seenNotifications.push(url);
            stashObj.reviewComments.push(comments);
			chrome.notifications.create(url, notificationOptions);
		} else if (stashObj.reviewComments[index][0] !== stashObj.reviewItems[index].attributes.commentCount[0]) {
			stashObj.reviewComments[index][0] = stashObj.reviewItems[index].attributes.commentCount[0];
			notificationOptions.title = 'NEW COMMENT FOR';
			chrome.notifications.create(url, notificationOptions);
		}
		console.log('reviewComents: ', stashObj.reviewComments[index][0]);
		console.log('reviewItems: ', stashObj.reviewItems[index].attributes.commentCount[0]);
	}
};
stashObj.init();
window.stashObj = stashObj;
})(window.$, window.chrome, window.document, window);

