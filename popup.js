document.addEventListener("DOMContentLoaded", function () {
  // Function to get all open tabs and populate the dropdown menu
  function getTabs() {
    chrome.tabs.query({}, function (tabs) {
      var tabList = document.getElementById("tabList");
      tabs.forEach(function (tab) {
        var option = document.createElement("option");
        option.text = tab.title;
        option.value = tab.id;
        tabList.add(option);
      });
    });
  }

  // Function to handle snooze button click event
  document
    .getElementById("snoozeButton")
    .addEventListener("click", function () {
      var selectedTabId = parseInt(document.getElementById("tabList").value);
      var snoozeDuration = parseInt(
        document.getElementById("snoozeDuration").value
      );
      var timeUnit = document.getElementById("timeUnit").value;

      // Convert snooze duration to minutes based on selected time unit
      switch (timeUnit) {
        case "seconds":
          snoozeDuration /= 60; // 1 minute = 60 seconds
          break;
        case "minutes":
          break; // already in minutes
        case "hours":
          snoozeDuration *= 60; // 1 hour = 60 minutes
          break;
        case "days":
          snoozeDuration *= 24 * 60; // 1 day = 24 hours = 1440 minutes
          break;
      }

      // Get the selected tab
      chrome.tabs.get(selectedTabId, function (tab) {
        // Store the tab URL
        var item = {};
        item[selectedTabId.toString()] = tab.url;
        chrome.storage.local.set(item);

        // Set alarm to reopen tab after snooze duration
        chrome.alarms.create(selectedTabId.toString(), {
          delayInMinutes: snoozeDuration,
        });

        // Close the tab
        chrome.tabs.remove(selectedTabId);
      });

      window.close(); // Close the popup after snooze action
    });

  // Call the getTabs function to populate the dropdown menu when popup is opened
  getTabs();
});
