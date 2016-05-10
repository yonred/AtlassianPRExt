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
	buildStatus: {},
	clickedNotifications: [],
	redBuild: false,
	getReviewRequest: function() {
		$.ajax({
			method: 'GET',
			url: 'https://stash.lbi.co.uk/rest/inbox/latest/pull-requests?role=reviewer&limit=20',
			dataType:'json',
			success: function(data) {
				stashObj.reviewItems = data.values;
        		stashObj.updateNotifications();
        		chrome.browserAction.setBadgeText({text: stashObj.reviewItems.length + ' PR'});
			}
		});
	},
	getAuthorRequest: function() {
		$.ajax({
			method: 'GET',
			url: 'https://stash.lbi.co.uk/rest/inbox/latest/pull-requests?role=author&limit=20',
			dataType:'json',
			success: function(data) {
				stashObj.authorItems = data.values;
			}
		});
	},
	getAllPullRequest: function() {
		$.ajax({
			method: 'GET',
			url: 'https://stash.lbi.co.uk/rest/api/1.0/projects/HEL/repos/application/pull-requests?state=OPEN&limit=100',
			dataType:'json',
			success: function(data) {
				stashObj.pullRequestItems = [];
				data.values.forEach(function(item) {
					stashObj.pullRequestItems.push(item.reviewers);
				});
			}
		});
	},
	getBuildStatus: function() {
		$.ajax({
			method: 'GET',
			url: 'http://bamboo.lbi.co.uk/rest/api/latest/result/HELIOS-AEMDEV',
			dataType:'json',
			success: function(data) {
				stashObj.buildStatus = data.results;

				if (stashObj.buildStatus.result[0].buildState !== 'Failed') {
					stashObj.redBuild === false;
        			chrome.browserAction.setBadgeBackgroundColor({color: '#53B145'});
				} else {
        			chrome.browserAction.setBadgeBackgroundColor({color: '#E2292E'});
				}
			},
			error: function(error) {
				stashObj.buildStatus = error;
				chrome.browserAction.setBadgeBackgroundColor({color: '#369ED3'});
			}
		});
	},
	init: function() {
		if (stashObj.repeat){
            clearTimeout(stashObj.repeat);
        }

        stashObj.getBuildStatus();
        stashObj.getReviewRequest();
        stashObj.getAuthorRequest();
        stashObj.getAllPullRequest();
        chrome.notifications.onClicked.addListener(stashObj.clickNotification);
        stashObj.repeat = setTimeout(stashObj.init, 30000);
	},
	updateNotifications: function() {
		stashObj.reviewItems.forEach(stashObj.sendNotification);
	},
	sendNotification: function(item, index) {
		var url = item.links.self[0].href,
			notificationOptions = {
				title: item.author.user.displayName,
                iconUrl: 'https://stash.lbi.co.uk/users/' + item.author.user.slug + '/avatar.png?s=128', // 'images/icon-128.png'
              	type: 'basic',
              	message: item.title,
              	isClickable: true
			},
			comments = item.attributes.commentCount ? item.attributes.commentCount : ['0'];

		if (stashObj.buildStatus.hasOwnProperty('result')) {
			if (stashObj.buildStatus.result[0].buildState === 'Failed') {
				if (stashObj.redBuild === false) {
					notificationOptions.title = 'RED BUILD';
					notificationOptions.iconUrl = 'images/icon-128.png';
					notificationOptions.message = 'Last build is failed! Be carefull to merge PRs'
					chrome.notifications.create('http://bamboo.lbi.co.uk/browse/HELIOS-AEMDEV', notificationOptions, function() {
						stashObj.clickedNotifications = [];
						stashObj.redBuild = true;
					});
				}
			}
		}

		if (!stashObj.reviewItems[index].attributes.commentCount) {
			stashObj.reviewItems[index].attributes.commentCount = ['0'];
		}

		if (stashObj.seenNotifications.indexOf(url) === -1) {
            stashObj.seenNotifications.push(url);
            stashObj.reviewComments.push({'url': url, 'comments': comments});
			chrome.notifications.create(url, notificationOptions);
		} else {
			stashObj.reviewComments.forEach(function(itemObj) {
				if (itemObj.url === url && itemObj.comments[0] !== comments[0]) {
					itemObj.comments[0] = comments[0];
					notificationOptions.title = 'NEW COMMENT FOR';
					chrome.notifications.create(url, notificationOptions, function() {
						stashObj.clickedNotifications = [];
					});
				}
			});
		}
	},
	clickNotification: function(id) {
		if (id && stashObj.clickedNotifications.indexOf(id) === -1) {
    		chrome.tabs.create({ url: id });
    		stashObj.clickedNotifications.push(id);
    		chrome.notifications.clear(id);
    	}
	}
};
stashObj.init();
window.stashObj = stashObj;
})(window.$, window.chrome, window.document, window);

