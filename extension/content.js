chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchImages") {
        const images = Array.from(document.images).map(img => img.src);
        sendResponse({ images });
    }
});
