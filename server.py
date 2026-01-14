from flask import Flask, request, jsonify
import torch
from PIL import Image as PILImage
from transformers import AutoImageProcessor, AutoModelForImageClassification
import base64
from io import BytesIO

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

processor = AutoImageProcessor.from_pretrained("haywoodsloan/ai-image-detector-dev-deploy")
model = AutoModelForImageClassification.from_pretrained("haywoodsloan/ai-image-detector-dev-deploy")
model.to(device)
model.eval()

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload_images():
    data = request.json
    images = data.get('images', [])

    results = []

    for base64_image in images:
        try:
            image_data = base64_image.split(',')[1]
            image = PILImage.open(BytesIO(base64.b64decode(image_data))).convert("RGB")
            print("-" * 30)
            print("Preprocessing image...")
            inputs = processor(images=image, return_tensors="pt").to(device)

            print("Running inference...")
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits

            predicted_class_idx = logits.argmax(-1).item()
            predicted_label = model.config.id2label[predicted_class_idx]

            probabilities = torch.softmax(logits, dim=-1)
            predicted_prob = probabilities[0, predicted_class_idx].item()

            
            print(f"Predicted Label: {predicted_label}")
            print(f"Confidence Score: {predicted_prob:.4f}")
            results.append({
                    "image": base64_image,
                    "label": predicted_label,
                    "probability": predicted_prob
                }) 

        except Exception as e:
            print(f"Error processing image: {e}")
            return jsonify({"error": "Failed to process the image."}), 400
        
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
