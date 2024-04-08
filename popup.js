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

  // Function to get and display the snoozed tabs
  function getSnoozedTabs() {
    chrome.storage.local.get(null, function (items) {
      var snoozedTabs = document.getElementById("snoozedTabs");
      snoozedTabs.innerHTML = ""; // Clear the current list

      for (var tabId in items) {
        if (items[tabId]) {
          var url = items[tabId].url;
          var endTime = items[tabId].endTime;

          var listItem = document.createElement("li");
          listItem.id = "tab-" + tabId; // Assign a unique ID to each list item

          var urlSpan = document.createElement("span"); // Create a new span for the URL
          urlSpan.textContent = url + " (";
          urlSpan.title = url; // Set the title attribute to the URL
          listItem.appendChild(urlSpan); // Append the span to the list item

          var timeSpan = document.createElement("span"); // This span will display the remaining time
          listItem.appendChild(timeSpan);
          listItem.appendChild(document.createTextNode(" seconds)"));

          var cancelButton = document.createElement("button");
          cancelButton.textContent = "Cancel";
          cancelButton.addEventListener("click", function () {
            chrome.runtime.sendMessage(
              {
                action: "cancelSnooze",
                tabId: tabId,
              },
              function (response) {
                // This callback function will be called after the message is sent
                // and the operation is completed

                // Update the list of snoozed tabs after a snooze is cancelled
                getSnoozedTabs();
              }
            );
          });

          listItem.appendChild(cancelButton);
          snoozedTabs.appendChild(listItem);
        }
      }

      // Start the countdown
      setInterval(function () {
        for (var tabId in items) {
          var endTime = items[tabId].endTime;
          var remainingTime = Math.round((endTime - Date.now()) / 1000); // Convert milliseconds to seconds
          var element = document.querySelector(
            "#tab-" + tabId + " span:nth-child(2)"
          );
          if (element) {
            element.textContent = remainingTime;
          }
        }
      }, 1000); // Update every second
    });
  }

  // Call the getTabs and getSnoozedTabs functions when popup is opened
  getTabs();
  getSnoozedTabs();

  // Function to handle snooze button click event
  document
    .getElementById("snoozeButton")
    .addEventListener("click", function () {
      var selectedTabIds = Array.from(
        document.getElementById("tabList").selectedOptions
      ).map((option) => parseInt(option.value));
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

      // Check if snooze duration is less than 0.5 minutes (30 seconds)
      if (snoozeDuration < 0.5) {
        alert("Snooze duration must be at least 30 seconds.");
        return; // Stop the snooze operation
      }
      snoozeDuration = Math.max(snoozeDuration, 0.5);

      // Get the selected tabs
      selectedTabIds.forEach((selectedTabId) => {
        chrome.tabs.query({}, function (tabs) {
          if (tabs.some((tab) => tab.id === selectedTabId)) {
            chrome.tabs.get(selectedTabId, function (tab) {
              // Store the tab URL and snooze end time
              var item = {};
              item[selectedTabId.toString()] = {
                url: tab.url,
                endTime: Date.now() + snoozeDuration * 60 * 1000, // Convert minutes to milliseconds
              };
              chrome.storage.local.set(item, function () {
                // Set alarm to reopen tab after snooze duration
                chrome.alarms.create(selectedTabId.toString(), {
                  delayInMinutes: snoozeDuration,
                });

                // Close the tab
                chrome.tabs.remove(selectedTabId);

                // Update the list of snoozed tabs after a tab is snoozed
                getSnoozedTabs();
              });
            });
          }
        });
      });
    });
});
