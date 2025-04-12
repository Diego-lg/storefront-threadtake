import sys
import uuid
import json
import urllib.request
import urllib.parse
import websocket # NOTE: needs websocket-client library
import io
import os
import base64
from PIL import Image
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
import requests # Need this for multipart upload

# --- Configuration ---
COMFYUI_URL = "http://127.0.0.1:8188" # Your ComfyUI server address
RMBG_WORKFLOW_FILENAME = "FAST_RMBG.json"
# The ID of the LoadImage node in the RMBG workflow
RMBG_INPUT_NODE_ID = "3"
# The IDs of the PreviewImage nodes in the RMBG workflow
RMBG_OUTPUT_NODE_IDS = ["20", "26", "27"] # Corresponds to RMBG-2.0, INSPYRENET, BEN outputs via PreviewImage

# --- Dynamic Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RMBG_WORKFLOW_FILE_PATH = os.path.join(BASE_DIR, RMBG_WORKFLOW_FILENAME)
# Directory to save temporary/uploaded images if needed (optional)
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads_rembg')
# Directory to save final output images (optional, for debugging/logging)
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs_rembg')
# --- End Configuration ---

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

def ensure_directory(dir_path):
    """Ensures a directory exists, creating it if necessary."""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
        print(f"Created directory: {dir_path}")

def get_unique_filename(prefix="image"):
    """Generates a unique filename with a timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    return f"{prefix}_{timestamp}.png"

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
        print(f"Error fetching image data for {filename}: {e}")
        return None

def get_history(prompt_id):
    """Retrieves the execution history for a given prompt ID."""
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"Error fetching history for {prompt_id}: {e}")
        return None

def upload_image_to_comfyui(image_bytes, filename="temp_upload.png"):
    """Uploads image bytes to ComfyUI's /upload/image endpoint."""
    try:
        files = {'image': (filename, image_bytes, 'image/png')}
        data = {'overwrite': 'true'} # Overwrite if filename exists (optional)
        response = requests.post(f"{COMFYUI_URL}/upload/image", files=files, data=data)
        response.raise_for_status() # Raise an exception for bad status codes
        upload_data = response.json()
        print(f"Image uploaded to ComfyUI: {upload_data}")
        # Ensure the expected fields are present
        if 'name' in upload_data:
             # ComfyUI might place it in a subfolder depending on its setup
            return upload_data['name'], upload_data.get('subfolder', ''), upload_data.get('type', 'input')
        else:
            print(f"Error: Unexpected response format from ComfyUI upload: {upload_data}")
            return None, None, None
    except requests.exceptions.RequestException as e:
        print(f"Error uploading image to ComfyUI: {e}")
        return None, None, None
    except Exception as e:
        print(f"An unexpected error occurred during image upload: {e}")
        return None, None, None


def get_image_filenames_via_websocket(client_id, prompt_id, target_node_ids):
    """
    Connects to ComfyUI websocket, waits for execution data for the
    specific prompt and ALL target nodes, and returns a dictionary mapping
    target node IDs to their output image info (filename, subfolder, type).
    """
    ws = None
    output_images = {}
    target_node_set = set(target_node_ids) # Use a set for efficient checking
    received_nodes = set()

    try:
        ws_url = f"ws://{COMFYUI_URL.split('//')[1]}/ws?clientId={client_id}"
        ws = websocket.WebSocket()
        # Set a reasonable timeout (e.g., 120 seconds)
        ws.settimeout(120)
        ws.connect(ws_url)
        print(f"Websocket connected for client_id: {client_id}, waiting for nodes: {target_node_set}")

        while received_nodes != target_node_set: # Loop until all target nodes are received
            out = ws.recv()
            if isinstance(out, str):
                message = json.loads(out)
                msg_type = message.get('type')
                data = message.get('data')

                # Track execution progress/status
                if msg_type == 'status':
                    if data and 'queue_remaining' in data.get('status', {}).get('exec_info', {}):
                         queue_remaining = data['status']['exec_info']['queue_remaining']
                         # print(f"Queue remaining: {queue_remaining}") # Optional progress log

                elif msg_type == 'executing':
                     if data and data.get('prompt_id') == prompt_id:
                         node_id = data.get('node')
                         if node_id:
                             # print(f"Executing node: {node_id}") # Optional progress log
                             pass
                         else: # Start of prompt execution
                             print(f"Execution started for prompt_id: {prompt_id}")

                # Check for finished execution of one of our target nodes
                elif msg_type == 'executed' and data:
                    node_id = data.get('node')
                    current_prompt_id = data.get('prompt_id')

                    if current_prompt_id == prompt_id and node_id in target_node_set:
                        print(f"Execution finished for target node {node_id} (prompt_id: {prompt_id})")
                        if 'output' in data and 'images' in data['output'] and data['output']['images']:
                            image_info = data['output']['images'][0] # Assuming one image per node
                            filename = image_info['filename']
                            subfolder = image_info.get('subfolder', '')
                            folder_type = image_info.get('type', 'output')
                            output_images[node_id] = {
                                "filename": filename,
                                "subfolder": subfolder,
                                "type": folder_type
                            }
                            received_nodes.add(node_id)
                            print(f"  -> Found image: {filename} (Subfolder: '{subfolder}', Type: '{folder_type}')")
                            print(f"  -> Received nodes: {received_nodes}/{target_node_set}")
                        else:
                            print(f"Warning: 'executed' message for target node {node_id} received, but no image data found directly.")
                            # Mark as received to avoid infinite loop, but value will be None
                            output_images[node_id] = None
                            received_nodes.add(node_id)

            # Add a timeout mechanism? Could be useful if a node fails silently.
            # For now, relies on ComfyUI sending messages for all nodes.

        print(f"All target nodes received: {received_nodes}")
        ws.close()
        return output_images

    except ConnectionRefusedError:
        print(f"Error: Websocket connection refused ({ws_url}). Is ComfyUI running and websocket enabled?")
        return None # Indicate connection error
    except websocket.WebSocketTimeoutException:
         print(f"Error: Websocket connection timed out waiting for nodes: {target_node_set - received_nodes}")
         return output_images # Return what we have so far
    except websocket.WebSocketException as e:
        print(f"Websocket error: {e}")
        return None # Indicate websocket error
    except Exception as e:
        print(f"Error in websocket processing: {e}")
        # Ensure websocket is closed even if an error occurs mid-processing
        if ws and ws.connected:
            try: ws.close()
            except Exception as close_err: print(f"Error closing websocket: {close_err}")
        return None # Indicate general error
    finally:
        # Ensure websocket is closed if the loop exits unexpectedly or successfully
        if ws and ws.connected:
             try:
                 ws.close()
                 print("Websocket closed.")
             except Exception as close_err:
                 print(f"Error closing websocket in finally block: {close_err}")


@app.route('/remove-background', methods=['POST'])
def remove_background_endpoint():
    """Flask endpoint to remove background from an uploaded image."""
    if 'image' not in request.files:
        return jsonify({"error": "Missing 'image' file part in the request"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        try:
            image_bytes = file.read()
            # You might want to validate the image format here (e.g., using PIL)
            print(f"Received image file: {file.filename} ({len(image_bytes)} bytes)")
        except Exception as e:
            print(f"Error reading uploaded file: {e}")
            return jsonify({"error": "Could not read uploaded image file."}), 400

        # --- Upload Image to ComfyUI ---
        # Use a unique name to avoid conflicts if multiple requests happen concurrently
        temp_filename = get_unique_filename(prefix="upload_rembg")
        uploaded_filename, subfolder, folder_type = upload_image_to_comfyui(image_bytes, temp_filename)

        if not uploaded_filename:
            return jsonify({"error": "Failed to upload image to ComfyUI."}), 500

        print(f"Image uploaded to ComfyUI input: {uploaded_filename} (Subfolder: '{subfolder}', Type: '{folder_type}')")

        # --- Load Workflow ---
        try:
            with open(RMBG_WORKFLOW_FILE_PATH, 'r') as f:
                workflow = json.load(f)
            print(f"Loaded RMBG workflow from {RMBG_WORKFLOW_FILE_PATH}")
        except FileNotFoundError:
            print(f"Error: RMBG Workflow file not found at {RMBG_WORKFLOW_FILE_PATH}")
            return jsonify({"error": f"Workflow file '{RMBG_WORKFLOW_FILENAME}' not found."}), 500
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from {RMBG_WORKFLOW_FILE_PATH}")
            return jsonify({"error": f"Invalid JSON in workflow file '{RMBG_WORKFLOW_FILENAME}'."}), 500
        except Exception as e:
            print(f"Error loading workflow file {RMBG_WORKFLOW_FILE_PATH}: {e}")
            return jsonify({"error": "Failed to load RMBG workflow file."}), 500

        # --- Modify Workflow ---
        if RMBG_INPUT_NODE_ID not in workflow:
            print(f"Error: Input node ID '{RMBG_INPUT_NODE_ID}' not found in RMBG workflow.")
            return jsonify({"error": f"Input node ID '{RMBG_INPUT_NODE_ID}' not found in workflow."}), 500

        input_node = workflow[RMBG_INPUT_NODE_ID]
        if 'inputs' not in input_node or 'image' not in input_node.get('inputs', {}):
             print(f"Error: Node {RMBG_INPUT_NODE_ID} structure incorrect. Expected 'inputs' with an 'image' field.")
             return jsonify({"error": f"Workflow structure error: Cannot find 'inputs.image' in node {RMBG_INPUT_NODE_ID}."}), 500

        try:
            # Modify the image input to use the uploaded file's name
            # ComfyUI LoadImage node expects just the filename relative to its input dir
            workflow[RMBG_INPUT_NODE_ID]['inputs']['image'] = uploaded_filename
            # If the upload returned a subfolder, you might need to adjust the filename path here
            # depending on how LoadImage handles subfolders (e.g., f"{subfolder}/{uploaded_filename}")
            # For now, assuming it handles it based on the upload response structure.
            print(f"Modified input node {RMBG_INPUT_NODE_ID} to use image: {uploaded_filename}")
        except Exception as e:
            print(f"Error modifying workflow node {RMBG_INPUT_NODE_ID}: {e}")
            return jsonify({"error": "Failed to modify workflow with the uploaded image."}), 500

        # --- Queue Prompt ---
        client_id = str(uuid.uuid4())
        queue_response = queue_prompt(workflow, client_id)

        if not queue_response or 'prompt_id' not in queue_response:
            print("Error: Failed to queue prompt. Queue response:", queue_response)
            return jsonify({"error": "Failed to queue prompt with ComfyUI."}), 500

        prompt_id = queue_response['prompt_id']
        print(f"RMBG Prompt queued successfully. Prompt ID: {prompt_id}")

        # --- Wait for Images using Websocket ---
        output_details = get_image_filenames_via_websocket(client_id, prompt_id, RMBG_OUTPUT_NODE_IDS)

        if not output_details: # Check if None was returned (indicates connection/websocket error)
             print(f"Error: Failed to get output details via websocket for prompt_id {prompt_id}.")
             return jsonify({"error": "Failed to get generated image details from ComfyUI (websocket error)."}), 500

        if len(output_details) != len(RMBG_OUTPUT_NODE_IDS):
            print(f"Warning: Did not receive all expected output images via websocket for prompt_id {prompt_id}.")
            print(f"Expected: {len(RMBG_OUTPUT_NODE_IDS)}, Received: {len(output_details)}")
            print(f"Received details: {output_details}")
            # Attempt history lookup as a fallback
            history = get_history(prompt_id)
            print(f"History lookup for prompt {prompt_id}: {json.dumps(history, indent=2)}")
            # Try to populate missing details from history if possible (complex, skipping for now)
            # For now, proceed with what we have, but the response might be incomplete.


        # --- Fetch Image Data for Each Output ---
        results = {}
        ensure_directory(OUTPUT_DIR) # Ensure output dir exists for saving

        # Use RMBG_OUTPUT_NODE_IDS to ensure we check for all expected outputs
        for node_id in RMBG_OUTPUT_NODE_IDS:
            details = output_details.get(node_id) # Get details if received
            if details:
                print(f"Fetching image for node {node_id}: {details}")
                image_data = get_image_data(details['filename'], details['subfolder'], details['type'])
                if image_data:
                    print(f"  -> Fetched {len(image_data)} bytes.")
                    # Encode image data as base64 for JSON response
                    image_data_base64 = base64.b64encode(image_data).decode('utf-8')
                    results[f"node_{node_id}"] = {
                        "filename": details['filename'],
                        "subfolder": details['subfolder'],
                        "type": details['type'],
                        "image_data_base64": image_data_base64
                    }
                    # Optional: Save outputs locally for debugging/logging
                    try:
                        save_path = os.path.join(OUTPUT_DIR, f"{prompt_id}_{node_id}_{details['filename']}")
                        with open(save_path, 'wb') as f_save:
                            f_save.write(image_data)
                        print(f"  -> Saved output locally to {save_path}")
                    except Exception as e:
                        print(f"Warning: Could not save output image locally for node {node_id}: {e}")
                else:
                    print(f"  -> Failed to fetch image data for node {node_id}.")
                    results[f"node_{node_id}"] = {"error": "Failed to fetch image data"}
            else:
                 print(f"  -> No details received for node {node_id} from websocket or history.")
                 results[f"node_{node_id}"] = {"error": "No image details found for this node"}


        # --- Return Results ---
        print("Sending JSON response with base64 encoded images.")
        # Check if any results were actually successful
        successful_results = [k for k, v in results.items() if 'image_data_base64' in v]
        if not successful_results:
             return jsonify({"error": "Failed to retrieve any output images.", "details": results}), 500

        return jsonify(results)

    return jsonify({"error": "An unexpected error occurred processing the file."}), 500


if __name__ == "__main__":
    print("--- Flask ComfyUI RMBG API Server ---")
    print(f"ComfyUI URL: {COMFYUI_URL}")
    print(f"Script Base Directory: {BASE_DIR}")
    print(f"RMBG Workflow File Path: {RMBG_WORKFLOW_FILE_PATH}")
    print(f"RMBG Input Node ID: {RMBG_INPUT_NODE_ID}")
    print(f"RMBG Output Node IDs: {RMBG_OUTPUT_NODE_IDS}")
    print(f"Optional Upload Dir: {UPLOAD_DIR}")
    print(f"Optional Output Dir: {OUTPUT_DIR}")

    # Check if workflow file exists at startup
    if not os.path.exists(RMBG_WORKFLOW_FILE_PATH):
        print("\n!!! FATAL ERROR !!!")
        print(f"Workflow file '{RMBG_WORKFLOW_FILENAME}' not found at expected location:")
        print(RMBG_WORKFLOW_FILE_PATH)
        print("Please ensure the workflow JSON file is in the same directory as this script.")
        sys.exit(1)

    ensure_directory(UPLOAD_DIR) # Ensure directories exist at startup
    ensure_directory(OUTPUT_DIR)

    print("\nStarting Flask server...")
    # Run on a different port (e.g., 5002) to avoid conflict with text2img server
    app.run(host='0.0.0.0', port=5002, debug=True)