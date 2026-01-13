document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: "fetchImages" }, (response) => {
            const container = document.getElementById('imageContainer');
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                container.innerHTML = '<p>Error fetching images.</p>';
                return;
            }

            if (response && response.images && response.images.length > 0) {
                const images = response.images;

                const base64Images = images.map(imgSrc => {
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("GET", imgSrc, true);
                        xhr.responseType = "blob";
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(xhr.response);
                            } else {
                                reject(`Error fetching image: ${xhr.status}`);
                            }
                        };
                        xhr.onerror = () => reject("Network error");
                        xhr.send();
                    });
                });

                Promise.all(base64Images)
                    .then(base64Results => {
                        return fetch('http://localhost:5000/upload', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ images: base64Results })
                        });
                    })
                    .then(res => res.json())
                    .then(data => {
                        container.innerHTML = '';
                        data.forEach(item => {
                            const img = document.createElement('img');
                            img.src = item.image;
                            container.appendChild(img);
                        });
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        container.innerHTML = '<p>Error communicating with server.</p>';
                    });
            } else {
                container.innerHTML = '<p>No images found.</p>';
            }
        });
    });
});
