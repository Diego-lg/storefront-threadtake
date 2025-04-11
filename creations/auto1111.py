from flask import Flask, send_file, jsonify, request
import json, requests, io, base64, os
from PIL import Image, PngImagePlugin
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREATIONS_DIR = os.path.join(BASE_DIR, 'creations')

def ensure_creations_directory():
    if not os.path.exists(CREATIONS_DIR):
        os.makedirs(CREATIONS_DIR)
        print(f"Created directory: {CREATIONS_DIR}")

def get_unique_filename():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    return os.path.join(CREATIONS_DIR, f"output_{timestamp}.png")

def generate_images():
    data = request.json
    input_value = data.get('input')
    print("PROMPT:", input_value)
    
    url = "http://127.0.0.1:7860"
    payload = {
        "prompt": f"{input_value} (vector art style), detailed, 8k uhd, high quality, masterpiece, best quality",
        "negative_prompt": "NSFW",
        "steps": 7,
        "width": 1024,
        "height": 1024,
        "sampler_name": "DDIM",
        "cfg_scale": 1.5
    }
    
    option_payload = {"sd_model_checkpoint": "Juggernaut_RunDiffusionPhoto2_Lightning_4Steps.safetensors"}
    requests.post(url=f'{url}/sdapi/v1/options', json=option_payload)
    response = requests.post(url=f'{url}/sdapi/v1/txt2img', json=payload)
    
    r = response.json()
    images = []
    
    if 'images' in r:
        for i in r['images']:
            image_data = base64.b64decode(i.split(",", 1)[0])
            image = Image.open(io.BytesIO(image_data))
            
            ensure_creations_directory()
            
            unique_filename = get_unique_filename()
            png_payload = {"image": "data:image/png;base64," + i}
            response2 = requests.post(url=f'{url}/sdapi/v1/png-info', json=png_payload)
            pnginfo = PngImagePlugin.PngInfo()
            pnginfo.add_text("parameters", response2.json().get("info"))
            
            try:
                image.save(unique_filename, pnginfo=pnginfo)
                print(f"Image saved as {unique_filename}")
                images.append(unique_filename)
            except Exception as e:
                print("Error saving image:", e)

    print("Images generated.")
    return images

@app.route('/generate', methods=['POST'])
def imgProcess():
    images = generate_images()
    if not images:
        return jsonify({"error": "No images generated"}), 500

    image_path = images[0]
    print("Sending image:", image_path)

    return send_file(image_path, mimetype='image/png')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
