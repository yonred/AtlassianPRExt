(function($, chrome, document, window){
'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
  	console.log('previousVersion', details.previousVersion);
});

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
            stashObj.reviewComments.push({"url": url, "comments": comments});
			chrome.notifications.create(url, notificationOptions);
		} else {
			stashObj.reviewComments.forEach(function(itemObj) {
				if (itemObj.url === url && itemObj.comments[0] !== comments[0]) {
					itemObj.comments[0] = comments[0];
					notificationOptions.title = 'NEW COMMENT FOR';
					chrome.notifications.create(url, notificationOptions);
				}
			});
		}
	}
};
stashObj.init();
window.stashObj = stashObj;
})(window.$, window.chrome, window.document, window);

