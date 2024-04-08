// Listen for alarm events
chrome.alarms.onAlarm.addListener(function (alarm) {
  // Check if the alarm name is a tab ID
  var tabId = parseInt(alarm.name);
  if (!isNaN(tabId)) {
    // Get the URL of the snoozed tab
    chrome.storage.local.get(tabId.toString(), function (result) {
      var tabInfo = result[tabId.toString()];
      if (tabInfo) {
        var url = tabInfo.url; // Get the URL from the object

        // Reopen the snoozed tab
        chrome.tabs.create({ url: url }, function (tab) {
          // Focus the newly opened tab
          chrome.tabs.update(tab.id, { active: true });
        });

        // Remove the tab from the local storage
        chrome.storage.local.remove(tabId.toString());
      }
    });
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "cancelSnooze") {
    var tabId = message.tabId;
    chrome.storage.local.remove(tabId, function () {
      // Remove the tab URL from storage
      chrome.alarms.clear(tabId, function () {
        // Cancel the alarm
        sendResponse({ status: "success" }); // Send a response
      });
    });
    // Ensure to return true for asynchronous sendResponse
    return true;
  } else {
    // Store the tab URL
    var item = {};
    item[message.tabId.toString()] = message.url;
    chrome.storage.local.set(item);

    // Create an alarm for each tab
    message.tabIds.forEach((tabId) => {
      chrome.alarms.create(tabId.toString(), {
        delayInMinutes: calculateDelay(
          message.snoozeDuration,
          message.timeUnit
        ),
      });
    });
  }
});
