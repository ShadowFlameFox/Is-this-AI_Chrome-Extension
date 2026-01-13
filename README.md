# Is this AI? - Chrome Extension

This project is a Chrome extension that retrieves images from the current webpage and sends them to a Flask server for classification, determining whether they are AI-generated or real.

---

## Features

- **Image Retrieval**: Fetches images directly from the current tab.
- **AI Classification**: Classifies images as either AI-generated or authentic.
- **Result Display**: Shows the classification results in a user-friendly format.

---

## Installation

### Chrome Extension

1. **Download or Clone** the repository.
2. Navigate to `chrome://extensions/` in your Chrome browser.
3. **Enable "Developer Mode"**, then click "Load unpacked" to upload the extension folder.

### Flask Server

1. **Install Python 3.x** and the required packages:
   ```bash
   pip install Flask torch Pillow transformers
   ```
   
2. **Run the Flask server**:
   ```bash
   python server.py
   ```

---

## Usage

1. **Open a Webpage** with images in Chrome.
2. **Click the Extension Icon** to fetch images from the page.
3. The popup will display the results, highlighting all AI-generated images.

---

## License

This project is licensed under the **Apache License, Version 2.0**. 