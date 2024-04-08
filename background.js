// Listen for alarm events
chrome.alarms.onAlarm.addListener(function (alarm) {
  // Check if the alarm name is a tab ID
  var tabId = parseInt(alarm.name);
  if (!isNaN(tabId)) {
    // Get the URL of the snoozed tab
    chrome.storage.local.get(tabId.toString(), function (result) {
      var url = result[tabId.toString()];
      if (url) {
        // Reopen the snoozed tab
        chrome.tabs.create({ url: url }, function (tab) {
          // Focus the newly opened tab
          chrome.tabs.update(tab.id, { active: true });
        });
      }
    });
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Store the tab URL
  var item = {};
  item[message.tabId.toString()] = message.url;
  chrome.storage.local.set(item);
});
