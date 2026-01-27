document.addEventListener("DOMContentLoaded", () => {

    document.documentElement.style.setProperty('--highlight-color', 'green');
    const container = document.getElementById('imageContainer');
    const loader = document.getElementById('loader');
    const menu = document.getElementById('menu');
    const settingsMenu = document.getElementById('settingsMenu');

    chrome.storage.local.get("imageUrl", (data) => {
        container.style.display = 'flex';
        if (!data.imageUrl) {
            loader.style.display = 'none';
            settingsMenu.style.display = 'none';
            menu.style.display = 'unset';
            return;
        }
        loader.style.display = 'block';
        menu.style.display = 'none';
        settingsMenu.style.display = 'none';
        let images = Array.isArray(data.imageUrl) ? data.imageUrl : [data.imageUrl];

        fetchAndUploadImages(images, container, loader, menu, settingsMenu);
    });
});

const defaults = {
    highlight: '#8500a0',
    highlightHover: '#540064',
    background: '#121212',
    fontColor: '#ffffff'
};

const keys = Object.keys(defaults);

function applyColors(values) {
    const root = document.documentElement;
    root.style.setProperty('--highlight-color', values.highlight);
    root.style.setProperty('--highlight-hover-color', values.highlightHover);
    root.style.setProperty('--bg-color', values.background);
    root.style.setProperty('--text-color', values.fontColor);
}

function saveToStorage(values) {
    localStorage.setItem('colors', JSON.stringify(values));
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem('colors');
        return raw ? JSON.parse(raw) : { ...defaults };
    } catch {
        return { ...defaults };
    }
}

function init() {
    const values = loadFromStorage();
    keys.forEach(k => {
        const el = document.getElementById(k);
        if (el) el.value = values[k];
        el?.addEventListener('input', onInputChange);
    });

    const restoreBtn = document.getElementById('restoreDefaults');
    if (restoreBtn) restoreBtn.addEventListener('click', restoreDefaults);
    applyColors(values);
}

function onInputChange() {
    const values = {};
    keys.forEach(k => {
        const el = document.getElementById(k);
        values[k] = el ? el.value : defaults[k];
    });
    applyColors(values);
    saveToStorage(values);
}
document.addEventListener('DOMContentLoaded', init);

document.getElementById('settingsIcon').addEventListener('click', () => {
    const container = document.getElementById('imageContainer');
    const loader = document.getElementById('loader');
    const menu = document.getElementById('menu');
    const settingsMenu = document.getElementById('settingsMenu');

    const toggle = settingsMenu.style.display === 'block' ? 'none' : 'block';

    if (toggle === 'block') {
        container.style.display = 'none';
        menu.style.display = 'none';
        settingsMenu.style.display = 'block';
        loader.style.display = 'none';
    } else {
        container.style.display = 'none';
        settingsMenu.style.display = 'none';
        menu.style.display = 'unset';
        loader.style.display = 'none';
    }
});

function restoreDefaults() {
    keys.forEach(k => {
        const el = document.getElementById(k);
        if (el) el.value = defaults[k];
    });
    applyColors(defaults);
    saveToStorage(defaults);
    document.body.offsetHeight;
}

function fetchAndUploadImages(images, container, loader, menu, settingsMenu) {
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
        .then(res => {
            if (!res.ok) {
                return res.text().then(text => {
                    let message = text;
                    try {
                        const json = JSON.parse(text);
                        message = json.message || JSON.stringify(json);
                    } catch (e) {
                    }
                    const err = new Error(message || `HTTP error ${res.status}`);
                    err.status = res.status;
                    throw err;
                });
            }
            return res.json();
        })
        .then(data => {
            loader.style.display = 'none';
            menu.style.display = 'none';
            settingsMenu.style.display = 'none';
            container.innerHTML = '';
            data.forEach(item => {
                const h2 = document.createElement('h2');
                h2.textContent = item.label === 'artificial' ? 'AI-Generated Image' : 'Real Image';
                container.appendChild(h2);
                const img = document.createElement('img');
                img.src = item.image;
                container.appendChild(img);
                const label = document.createElement('p');
                label.className = 'label';
                label.innerHTML = `Predicted Label: ${item.label}<br>Confidence Score: ${Math.round(item.probability * 100) / 100}<br><br>* The prediction becomes less reliable with lower image quality. This tool does not guarantee accuracy, so use it at your own discretion.`;
                container.appendChild(label);
                chrome.storage.local.remove("imageUrl");
            });
        })
        .catch(error => {
            loader.style.display = 'none';
            menu.style.display = 'none';
            settingsMenu.style.display = 'none';

            console.error("Error during fetch/upload:", error);

            if (error && typeof error.status === 'number') {
                if (error.status === 400) {
                    container.innerHTML = '<p class="error">This image format is not supported.</p>';
                } else if (error.status === 451) {
                    container.innerHTML = '<p class="error">Unavailable For Legal Reasons (451): This image cannot be processed.</p>';
                } else {
                    container.innerHTML = `<p class="error">Error communicating with server. Status Code: ${error.status}</p>`;
                }
                return;
            }

            container.innerHTML = `<p class="error">Network or unexpected error: ${error && error.message ? error.message : error}</p>`;

            chrome.storage.local.get("imageUrl", (data) => {
                if (!data.imageUrl) {
                    console.error("No image URL found in storage.");
                    return;
                }
                const lastUrl = Array.isArray(data.imageUrl) ? data.imageUrl[data.imageUrl.length - 1] : data.imageUrl;
                const img = document.createElement('img');
                img.src = lastUrl;
                container.insertBefore(img, container.firstChild);
                chrome.storage.local.remove("imageUrl");
            });
        });

}
