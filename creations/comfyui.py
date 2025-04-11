import sys
import uuid
import json
import urllib.request
import urllib.parse
import websocket # NOTE: needs websocket-client library
# import requests # This import doesn't seem to be used, can be removed if true
import io
import os
from PIL import Image
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime

# --- Configuration ---
COMFYUI_URL = "http://127.0.0.1:8188" # Your ComfyUI server address
# The *name* of the JSON workflow file saved via "Save (API Format)"
# *** This file MUST be in the SAME directory as this Python script ***
WORKFLOW_FILENAME = "workflow_api.json"
# The ID of the node that takes the positive prompt text
PROMPT_NODE_ID = "2" # <--- *** CHANGE THIS TO YOUR PROMPT NODE ID ***
# The ID of the node that outputs the final image (e.g., SaveImage, PreviewImage)
OUTPUT_NODE_ID = "7" # <--- *** CHANGE THIS TO YOUR FINAL IMAGE NODE ID ***

# --- Dynamic Paths ---
# Directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Full path to the workflow file (assumes it's in the same dir as the script)
WORKFLOW_FILE_PATH = os.path.join(BASE_DIR, WORKFLOW_FILENAME)
# Directory to save generated images
CREATIONS_DIR = os.path.join(BASE_DIR, 'creations_comfyui')
# --- End Configuration ---

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

def ensure_creations_directory():
    if not os.path.exists(CREATIONS_DIR):
        os.makedirs(CREATIONS_DIR)
        print(f"Created directory: {CREATIONS_DIR}")

def get_unique_filename(prompt_text="image"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    # Basic sanitization for filename
    safe_prompt = "".join(c if c.isalnum() else "_" for c in prompt_text[:30])
    return os.path.join(CREATIONS_DIR, f"{timestamp}_{safe_prompt}.png")

def queue_prompt(prompt_workflow, client_id):
    """Sends the workflow to the ComfyUI server to be queued."""
    try:
        p = {"prompt": prompt_workflow, "client_id": client_id}
        data = json.dumps(p).encode('utf-8')
        req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except urllib.error.URLError as e:
        print(f"Error connecting to ComfyUI: {e}")
        print(f"Is ComfyUI running at {COMFYUI_URL}?")
        return None
    except Exception as e:
        print(f"Error queuing prompt: {e}")
        return None

def get_image_data(filename, subfolder, folder_type):
    """Fetches the image data from ComfyUI's /view endpoint."""
    try:
        data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
        url_values = urllib.parse.urlencode(data)
        with urllib.request.urlopen(f"{COMFYUI_URL}/view?{url_values}") as response:
            return response.read()
    except Exception as e:
        print(f"Error fetching image data: {e}")
        return None

def get_history(prompt_id):
    """Retrieves the execution history for a given prompt ID."""
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"Error fetching history: {e}")
        return None

def get_image_filename_via_websocket(client_id, prompt_id, target_node_id):
    """
    Connects to ComfyUI websocket, waits for execution data for the
    specific prompt and node, and returns the output image filename, subfolder, and type.
    """
    ws = None # Initialize ws to None
    try:
        ws_url = f"ws://{COMFYUI_URL.split('//')[1]}/ws?clientId={client_id}"
        ws = websocket.WebSocket()
        ws.connect(ws_url)
        print(f"Websocket connected for client_id: {client_id}")

        while True:
            out = ws.recv()
            if isinstance(out, str):
                message = json.loads(out)
                # print(f"Received WS message type: {message.get('type')}") # Debug specific message types

                # Primary check: execution finished for the specific target node
                if message['type'] == 'executed' and 'data' in message:
                    data = message['data']
                    if data.get('node') == target_node_id and data.get('prompt_id') == prompt_id:
                        print(f"Execution of target node {target_node_id} finished for prompt_id: {prompt_id}")
                        if 'output' in data and 'images' in data['output'] and data['output']['images']:
                             image_info = data['output']['images'][0]
                             filename = image_info['filename']
                             subfolder = image_info.get('subfolder', '')
                             folder_type = image_info.get('type', 'output')
                             print(f"Found image directly from 'executed' message: {filename} in subfolder '{subfolder}' (type: {folder_type})")
                             ws.close()
                             return filename, subfolder, folder_type
                        else:
                             print(f"Warning: 'executed' message for node {target_node_id} received, but no image data found directly. Trying history lookup.")
                             # Fall through to history lookup if direct data missing

                # Secondary check: execution finished for the whole prompt (fallback)
                elif message['type'] == 'executed' and 'data' in message:
                     data = message['data']
                     # Check if this is the final execution message for the prompt
                     if data.get('prompt_id') == prompt_id and data.get('node') is None and 'output' in data: # Often node is None on final executed msg
                         print(f"Execution finished (general) for prompt_id: {prompt_id}. Attempting history lookup.")
                         history = get_history(prompt_id)
                         if not history or prompt_id not in history:
                             print(f"Error: Could not find history for prompt_id {prompt_id} after 'executed' message.")
                             ws.close()
                             return None, None, None # Indicate error

                         history_entry = history[prompt_id]
                         if 'outputs' in history_entry and target_node_id in history_entry['outputs']:
                             outputs = history_entry['outputs'][target_node_id]
                             if 'images' in outputs and outputs['images']:
                                 image_info = outputs['images'][0] # Assuming first image is the target
                                 filename = image_info['filename']
                                 subfolder = image_info.get('subfolder', '') # Get subfolder, default to empty string
                                 folder_type = image_info.get('type', 'output') # Get type, default to 'output'
                                 print(f"Found image via history lookup: {filename} in subfolder '{subfolder}' (type: {folder_type})")
                                 ws.close()
                                 return filename, subfolder, folder_type
                             else:
                                 print(f"Error: No 'images' found in the history output of node {target_node_id}")
                                 ws.close()
                                 return None, None, None # Indicate error
                         else:
                             print(f"Error: No 'outputs' found for node {target_node_id} in history")
                             ws.close()
                             return None, None, None # Indicate error

                # Optional: Track progress
                elif message['type'] == 'executing':
                    data = message['data']
                    if data.get('node') is None and data.get('prompt_id') == prompt_id:
                        print(f"Execution started for prompt_id: {prompt_id}")
                    # You could add more detailed progress tracking here if needed

            else:
                 # Ignore binary messages (like previews)
                 pass

    except ConnectionRefusedError:
        print(f"Error: Websocket connection refused ({ws_url}). Is ComfyUI running and websocket enabled?")
        return None, None, None
    except websocket.WebSocketException as e:
        print(f"Websocket error: {e}")
        return None, None, None
    except Exception as e:
        print(f"Error in websocket processing: {e}")
        # Ensure websocket is closed even if an error occurs mid-processing
        if ws and ws.connected:
            try:
                ws.close()
            except Exception as close_err:
                print(f"Error closing websocket: {close_err}")
        return None, None, None
    finally:
        # Ensure websocket is closed if the loop exits unexpectedly or successfully
        if ws and ws.connected:
             try:
                 ws.close()
                 print("Websocket closed.")
             except Exception as close_err:
                 print(f"Error closing websocket in finally block: {close_err}")


@app.route('/generate', methods=['POST'])
def generate_image_endpoint():
    """Flask endpoint to generate an image based on input prompt."""
    data = request.json
    if not data or 'input' not in data:
        return jsonify({"error": "Missing 'input' key in JSON request body"}), 400

    input_prompt = data.get('input')

    if not isinstance(input_prompt, str) or not input_prompt.strip():
         return jsonify({"error": "'input' must be a non-empty string"}), 400

    print(f"Received prompt: {input_prompt}")

    # --- Load Workflow ---
    try:
        # Use the full path to the workflow file
        with open(WORKFLOW_FILE_PATH, 'r') as f:
            workflow = json.load(f)
        print(f"Loaded workflow from {WORKFLOW_FILE_PATH}")
    except FileNotFoundError:
        print(f"Error: Workflow file not found at {WORKFLOW_FILE_PATH}")
        # Provide a more helpful error message to the client
        return jsonify({"error": f"Workflow file '{WORKFLOW_FILENAME}' not found in the server's script directory."}), 500
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {WORKFLOW_FILE_PATH}")
        return jsonify({"error": f"Invalid JSON in workflow file '{WORKFLOW_FILENAME}'."}), 500
    except Exception as e:
        print(f"Error loading workflow file {WORKFLOW_FILE_PATH}: {e}")
        return jsonify({"error": "Failed to load workflow file."}), 500

    # --- Modify Workflow ---
    if PROMPT_NODE_ID not in workflow:
        print(f"Error: Prompt node ID '{PROMPT_NODE_ID}' not found in workflow keys.")
        print(f"Available node IDs: {list(workflow.keys())}")
        return jsonify({"error": f"Prompt node ID '{PROMPT_NODE_ID}' not found in workflow."}), 500

    prompt_node = workflow[PROMPT_NODE_ID]

    # Check if the expected structure exists before modifying
    if 'inputs' not in prompt_node or 'text' not in prompt_node.get('inputs', {}):
        print(f"Error: Node {PROMPT_NODE_ID} structure incorrect. Expected 'inputs' with a 'text' field.")
        print(f"Node content: {json.dumps(prompt_node, indent=2)}")
        return jsonify({"error": f"Workflow structure error: Cannot find 'inputs.text' in node {PROMPT_NODE_ID}."}), 500

    try:
        # Modify the prompt text
        workflow[PROMPT_NODE_ID]['inputs']['text'] = input_prompt
        print(f"Modified prompt in node {PROMPT_NODE_ID}")
    except Exception as e: # Catch any unexpected modification errors
        print(f"Error modifying workflow node {PROMPT_NODE_ID}: {e}")
        return jsonify({"error": "Failed to modify workflow with the new prompt."}), 500

    # --- Queue Prompt ---
    client_id = str(uuid.uuid4())
    queue_response = queue_prompt(workflow, client_id)

    if not queue_response or 'prompt_id' not in queue_response:
        print("Error: Failed to queue prompt. Queue response:", queue_response)
        return jsonify({"error": "Failed to queue prompt with ComfyUI. Check ComfyUI connection and logs."}), 500

    prompt_id = queue_response['prompt_id']
    print(f"Prompt queued successfully. Prompt ID: {prompt_id}")

    # --- Wait for Image using Websocket ---
    filename, subfolder, folder_type = get_image_filename_via_websocket(client_id, prompt_id, OUTPUT_NODE_ID)

    if not filename:
        print(f"Error: Could not retrieve image filename via websocket for prompt_id {prompt_id}.")
        # Optional: Fallback to polling /history might be added here, but websocket is preferred
        history = get_history(prompt_id) # Attempt history lookup as last resort
        print(f"History lookup for prompt {prompt_id}: {json.dumps(history, indent=2)}")
        return jsonify({"error": "Failed to get generated image filename from ComfyUI after queuing."}), 500

    # --- Fetch Image Data ---
    print(f"Fetching image: filename={filename}, subfolder={subfolder}, type={folder_type}")
    image_data = get_image_data(filename, subfolder, folder_type)

    if not image_data:
        print("Error: Failed to fetch image data after getting filename.")
        return jsonify({"error": "Failed to fetch image data from ComfyUI even though filename was found."}), 500

    print(f"Image data fetched successfully ({len(image_data)} bytes).")

    # --- Save Image Locally (Optional but Recommended) ---
    try:
        ensure_creations_directory()
        save_path = get_unique_filename(input_prompt)
        image = Image.open(io.BytesIO(image_data))
        image.save(save_path)
        print(f"Image saved locally to {save_path}")
    except Exception as e:
        # Log the warning but don't fail the request if saving fails
        print(f"Warning: Could not save image locally to {CREATIONS_DIR}: {e}")

    # --- Return Image ---
    print("Sending image data in response.")
    return send_file(
        io.BytesIO(image_data),
        mimetype='image/png',
        as_attachment=False # Send inline in browser
        # download_name=f"{prompt_id}_{filename}" # Optional: suggest a download name
    )

if __name__ == "__main__":
    print("--- Flask ComfyUI API Server ---")
    print(f"ComfyUI URL: {COMFYUI_URL}")
    print(f"Script Base Directory: {BASE_DIR}")
    print(f"Workflow File Path: {WORKFLOW_FILE_PATH}")
    print(f"Prompt Node ID: {PROMPT_NODE_ID}")
    print(f"Output Node ID: {OUTPUT_NODE_ID}")
    print(f"Saving images to: {CREATIONS_DIR}")

    # Check if workflow file exists at startup for early feedback
    if not os.path.exists(WORKFLOW_FILE_PATH):
        print("\n!!! FATAL ERROR !!!")
        print(f"Workflow file '{WORKFLOW_FILENAME}' not found at expected location:")
        print(WORKFLOW_FILE_PATH)
        print("Please ensure the workflow JSON file is in the same directory as this script.")
        sys.exit(1) # Exit if workflow is missing

    ensure_creations_directory() # Ensure directory exists at startup

    print("\nStarting Flask server...")
    # Make sure host='0.0.0.0' is used if you want to access it from other machines on your network
    # Use debug=False in a production environment
    app.run(host='0.0.0.0', port=5001, debug=True)