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

          var urlLink = document.createElement("a"); // Create a new 'a' element for the URL
          urlLink.href = url;
          urlLink.textContent = url;
          urlLink.title = url;
          urlLink.target = "_blank";
          urlLink.classList.add("url-link");

          var timeSpan = document.createElement("span"); // This span will display the remaining time
          timeSpan.classList.add("time-span");

          var cancelButton = document.createElement("button");
          cancelButton.textContent = "Cancel";
          cancelButton.classList.add("cancel-button");
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

          // Append the elements in the desired order: urlLink -> timeSpan -> cancelButton
          listItem.appendChild(urlLink);
          listItem.appendChild(timeSpan);
          listItem.appendChild(cancelButton);

          snoozedTabs.appendChild(listItem);
        }
      }

      // Helper function to convert seconds to days, hours, minutes, and seconds
      function secondsToDhms(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor((seconds % (3600 * 24)) / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);

        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
      }

      // Use the helper function in your countdown
      setInterval(function () {
        for (var tabId in items) {
          var endTime = items[tabId].endTime;
          var remainingTime = Math.round((endTime - Date.now()) / 1000); // Convert milliseconds to seconds
          var element = document.querySelector(
            "#tab-" + tabId + " span:nth-child(2)"
          );
          if (element) {
            element.textContent = secondsToDhms(remainingTime); // Use the helper function here
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

      // Get the selected date and time
      var snoozeDateTimeValue = document.getElementById("snoozeDateTime").value;
      var snoozeDateTime = new Date(snoozeDateTimeValue);

      // Check if snoozeDateTime is a valid date
      if (isNaN(snoozeDateTime.getTime())) {
        alert("Please enter a valid date and time.");
        return; // Stop the snooze operation
      }

      // Calculate the snooze duration in minutes
      var snoozeDuration = (snoozeDateTime.getTime() - Date.now()) / 1000 / 60;

      // Check if snooze duration is less than 0.5 minutes (30 seconds)
      if (snoozeDuration < 0.5) {
        alert("Snooze duration must be at least 30 seconds.");
        return; // Stop the snooze operation
      }
      snoozeDuration = Math.max(snoozeDuration, 0.5);

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

                // Clear the current list of tabs in the dropdown menu
                document.getElementById("tabList").innerHTML = "";

                // Update the list of snoozed tabs after a tab is snoozed
                getSnoozedTabs();

                // Update the tab list options after a tab is snoozed
                getTabs();
              });
            });
          }
        });
      });
    });
});
