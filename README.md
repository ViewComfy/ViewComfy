# ViewComfy

ViewComfy is an open source tool to help you create beautiful web apps from ComfyUI workflows  
[![Discord](https://img.shields.io/badge/ViewComfy-Discord-%235865F2.svg)](https://discord.gg/DXubrz5R7E)
[![Website](https://img.shields.io/badge/ViewComfy%20-%20dark%20green?link=https%3A%2F%2Fwww.viewcomfy.com%2F)]

![image](https://github.com/user-attachments/assets/2cdacb83-3f71-4e11-9fbd-55b61852a1cb)

https://github.com/user-attachments/assets/7830118a-0a79-4cf8-ad54-3cca3f969e69

## Playground

The Playground is a simplified UI where you can run your workflows.

## Form Editor

You can drag and drop your ComfyUI workflow_api.json file into the form editor. It will then generate a new form that you can use to configure the inputs that will be displayed on the playground.

### How to use it

You need to have [comfy-cli](https://github.com/Comfy-Org/comfy-cli/) installed

```bash
pip install comfy-cli
comfy install
```

Install [Node.js 18.18](https://nodejs.org/) or later (recommended v20.17)

Clone the repo

If you're using a **virtual environment**, activate it.

If you're using a virtual environment with **PowerShell** you need to put the full path of the Activate.ps1 file in the .env file
e.g:

```bash
.env file ->
VENV_ACTIVATION_PATH="C:\Users\YourUsername\comfyui\venv\Scripts\Activate.ps1"
```

Install dependencies and start the dev server  
(Don't forget to activate the virtual environment if you're using one)

```bash
npm install
npm run dev
```

## ViewMode

ViewMode only loads the playground page. This is to allow people to use a ViewComfy web app without the workflow_api.json or to hide the form editor from users.
To use ViewMode you need to download the view_comfy.json that is generated when you use the form editor and place it in the root of the project along with the workflow_api.json.

To enable ViewMode, edit the .env file in the root of the project:

```bash
.env file ->
NEXT_PUBLIC_VIEW_MODE="true"

npm run dev
```

ViewComfy by default will look for a file called view_comfy.json in the project's root folder to render the web app. You can use the VIEW_COMFY_FILE_NAME environment variable to point to a different file. You can also use the WORKFLOW_API_FILE_NAME environment variable to point to a different workflow than the default workflow_api.json.

```bash
.env file ->
VIEW_COMFY_FILE_NAME="view_comfy.json"
WORKFLOW_API_FILE_NAME="workflow_api.json"
NEXT_PUBLIC_VIEW_MODE="true"

npm run dev
```

e.g with command line:

```bash

VIEW_COMFY_FILE_NAME="view_comfy.json" NEXT_PUBLIC_VIEW_MODE="true" npm run dev
```

## Form Editor Advanced

You can also drop a view_comfy.json directly in the form editor to edit it without the need for the workflow_api.json. But be aware that if you're using the view_comfy.json directly, you will still need to have the original workflow_api.json in the project's root.

Feel free to contribute with feedback, suggestions, issues or pull requests.

### Tech

ViewComfy is a Next.js app - [Next.js Documentation](https://nextjs.org/docs)
