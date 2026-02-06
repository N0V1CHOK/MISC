// Keep track of most recently used tabs
let recentTabs = [];

// Max number of tabs to keep loaded
const MAX_LOADED_TABS = 3;

// Helper: unload a tab safely
async function unloadTab(tabId) {
    try {
        await browser.tabs.discard(tabId);
        console.log(`Tab ${tabId} unloaded.`);
        // Optional: trigger garbage collection if enabled in about:config
        // window.gc(); // Requires Firefox started with --enable-gc
    } catch (e) {
        console.warn(`Failed to unload tab ${tabId}:`, e);
    }
}

// Update recent tab list
function markTabActive(tabId) {
    // Remove if already in list
    recentTabs = recentTabs.filter(id => id !== tabId);
    // Add to front
    recentTabs.unshift(tabId);
    // Keep only MAX_LOADED_TABS loaded
    manageTabs();
}

// Unload tabs beyond MAX_LOADED_TABS
async function manageTabs() {
    const tabs = await browser.tabs.query({});
    for (let tab of tabs) {
        if (!recentTabs.slice(0, MAX_LOADED_TABS).includes(tab.id)) {
            // Only unload if not pinned and discardable
            if (!tab.pinned && !tab.discarded) {
                unloadTab(tab.id);
            }
        }
    }
}

// Listen to tab activation
browser.tabs.onActivated.addListener(activeInfo => {
    markTabActive(activeInfo.tabId);
});

// Listen to new tab creation
browser.tabs.onCreated.addListener(tab => {
    markTabActive(tab.id);
});

// Initial setup: mark currently active tab
(async () => {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    if (tabs.length) {
        markTabActive(tabs[0].id);
    }
})();

