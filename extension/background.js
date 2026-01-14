chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id:"sendImage",
    title: "Is this AI?",
    type: 'normal',
    contexts: ["image"]
  });
});
chrome.contextMenus.onClicked.addListener((info)=> {
  if (info.menuItemId === "sendImage"){
    chrome.storage.local.set({ imageUrl: info.srcUrl});
    chrome.action.openPopup()
  }
});