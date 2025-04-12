import sys
import uuid
import json
import urllib.request
import urllib.parse
import websocket # NOTE: needs websocket-client library
import io
import os
import time # Added for polling
import random # Required for generating random seeds
from PIL import Image
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
# import requests # Not needed for this script

# --- Configuration ---
COMFYUI_URL = "http://127.0.0.1:8080" # Your ComfyUI server address
# The *name* of the JSON workflow file saved via "Save (API Format)"
# *** This file MUST be in the SAME directory as this Python script ***
WORKFLOW_FILENAME = "workflow_api.json"
# The ID of the node that takes the positive prompt text
PROMPT_NODE_ID = "2" # <--- *** CHANGE THIS TO YOUR PROMPT NODE ID ***
# The ID of the node that outputs the final image (e.g., SaveImage, PreviewImage)
OUTPUT_NODE_ID = "7" # <--- *** CHANGE THIS TO YOUR FINAL IMAGE NODE ID ***

# --- Generate a persistent Client ID for this script instance ---
CLIENT_ID = str(uuid.uuid4())
print(f"Persistent Client ID for this session: {CLIENT_ID}")

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
        print(f"Error fetching history for {prompt_id}: {e}")
        return None

def wait_for_output_and_get_details(prompt_id, target_node_ids, timeout=120, interval=2):
    """
    Polls the /history endpoint for a given prompt_id until the target output nodes
    are found or a timeout occurs.

    Args:
        prompt_id (str): The ID of the prompt to check history for.
        target_node_ids (list or str): A list of target output node IDs or a single ID string.
        timeout (int): Maximum time to wait in seconds.
        interval (int): Time interval between polling attempts in seconds.

    Returns:
        dict: A dictionary mapping target node IDs to their output details
              (filename, subfolder, type) or an error message.
              Returns None if a connection error occurs during polling.
              Returns an incomplete dict if timeout occurs before all nodes are found.
    """
    if isinstance(target_node_ids, str):
        target_node_ids = [target_node_ids] # Ensure it's a list

    start_time = time.time()
    output_details = {}
    target_node_set = set(target_node_ids)
    found_nodes = set()

    print(f"Polling history for prompt_id: {prompt_id}, waiting for nodes: {target_node_set}")

    while time.time() - start_time < timeout:
        if found_nodes == target_node_set:
            print(f"All target nodes found in history for prompt {prompt_id}.")
            break # All nodes found

        history = get_history(prompt_id)
        if history is None:
             # Connection error during get_history
             print(f"Error polling history for prompt {prompt_id} (connection issue?).")
             # Return None or an error dict? Let's return None for connection errors.
             return None

        if prompt_id in history:
            history_entry = history[prompt_id]
            # print(f"History entry found for {prompt_id}. Status: {history_entry.get('status')}") # Optional status log

            if 'outputs' in history_entry:
                current_outputs = history_entry['outputs']
                for node_id in target_node_set - found_nodes: # Only check for nodes not yet found
                    if node_id in current_outputs:
                        outputs = current_outputs[node_id]
                        if 'images' in outputs and outputs['images']:
                            image_info = outputs['images'][0] # Assuming one image per node
                            filename = image_info['filename']
                            subfolder = image_info.get('subfolder', '')
                            folder_type = image_info.get('type', 'output')
                            output_details[node_id] = {
                                "filename": filename,
                                "subfolder": subfolder,
                                "type": folder_type
                            }
                            found_nodes.add(node_id)
                            print(f"  -> Found output for node {node_id} in history.")
                        else:
                            # Node executed but no image output? Mark as error for this node.
                            if node_id not in output_details: # Don't overwrite previous findings
                                output_details[node_id] = {"error": f"Node {node_id} executed but no image found in history output."}
                                found_nodes.add(node_id) # Mark as processed to avoid infinite loop

            # Check if prompt execution failed (optional, based on status if available)
            # status_info = history_entry.get('status')
            # if status_info and status_info.get('status_str') == 'error':
            #     print(f"Error status found in history for prompt {prompt_id}.")
            #     # Mark remaining nodes as errored?
            #     for node_id in target_node_set - found_nodes:
            #         output_details[node_id] = {"error": "Prompt execution failed according to history status."}
            #     return output_details # Return immediately on prompt error

        else:
            # Prompt ID not yet in history, wait and retry
            # print(f"Prompt {prompt_id} not in history yet.")
            pass

        time.sleep(interval)

    # After loop (timeout or all found)
    if found_nodes != target_node_set:
        print(f"Warning: Polling timed out after {timeout}s for prompt {prompt_id}. Found {len(found_nodes)}/{len(target_node_set)} nodes.")
        # Add error entries for nodes never found
        for node_id in target_node_set - found_nodes:
             if node_id not in output_details:
                 output_details[node_id] = {"error": "Polling timed out before node output found in history."}

    return output_details


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
  # --- *** ADD THIS SECTION TO RANDOMIZE SEED *** ---
    KSAMPLER_NODE_ID = "4" # <--- Add this near your other config variables
    if KSAMPLER_NODE_ID not in workflow:
        print(f"Error: KSampler node ID '{KSAMPLER_NODE_ID}' not found in workflow keys.")
        print(f"Available node IDs: {list(workflow.keys())}")
        return jsonify({"error": f"KSampler node ID '{KSAMPLER_NODE_ID}' not found in workflow."}), 500

    ksampler_node = workflow[KSAMPLER_NODE_ID]
    if 'inputs' not in ksampler_node or 'seed' not in ksampler_node.get('inputs', {}):
         print(f"Error: Node {KSAMPLER_NODE_ID} structure incorrect. Expected 'inputs' with a 'seed' field.")
         print(f"Node content: {json.dumps(ksampler_node, indent=2)}")
         return jsonify({"error": f"Workflow structure error: Cannot find 'inputs.seed' in node {KSAMPLER_NODE_ID}."}), 500

    try:
        # Generate a random seed (ComfyUI uses large integers)
        new_seed = random.randint(0, 0xffffffffffffffff) # Generates a 64-bit integer
        workflow[KSAMPLER_NODE_ID]['inputs']['seed'] = new_seed
        print(f"Set random seed in node {KSAMPLER_NODE_ID} to: {new_seed}")
    except Exception as e:
        print(f"Error modifying seed in workflow node {KSAMPLER_NODE_ID}: {e}")
        return jsonify({"error": "Failed to set random seed in workflow."}), 500
    # --- *** END OF ADDED SECTION *** ---

    # --- Queue Prompt ---
    # Use the persistent CLIENT_ID
    queue_response = queue_prompt(workflow, CLIENT_ID)

    if not queue_response or 'prompt_id' not in queue_response:
        print("Error: Failed to queue prompt. Queue response:", queue_response)
        return jsonify({"error": "Failed to queue prompt with ComfyUI. Check ComfyUI connection and logs."}), 500

    prompt_id = queue_response['prompt_id']
    print(f"Prompt queued successfully. Prompt ID: {prompt_id} (Client ID: {CLIENT_ID})")

    # --- Wait for Image using Polling ---
    output_details_dict = wait_for_output_and_get_details(prompt_id, OUTPUT_NODE_ID) # Pass single ID

    # --- Process Polling Result ---
    if output_details_dict is None: # Indicates connection error during polling
         print(f"Error: Connection error while polling history for prompt_id {prompt_id}.")
         return jsonify({"error": "Failed to get generated image details (history connection error)."}), 500

    if OUTPUT_NODE_ID not in output_details_dict or "filename" not in output_details_dict.get(OUTPUT_NODE_ID, {}):
        error_detail = output_details_dict.get(OUTPUT_NODE_ID, {}).get("error", "Output not found in history.")
        print(f"Error: Could not retrieve image details via history polling for prompt_id {prompt_id}. Error: {error_detail}")
        return jsonify({"error": f"Failed to get generated image details from ComfyUI. Reason: {error_detail}"}), 500

    output_details = output_details_dict[OUTPUT_NODE_ID]
    filename = output_details['filename']
    subfolder = output_details['subfolder']
    folder_type = output_details['type']

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
    print(f"Using Client ID: {CLIENT_ID}") # Log the client ID being used

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