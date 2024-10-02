# ViewComfy

ViewComfy is an open source tool to help you create beautiful web apps from ComfyUI workflows.

[![Discord](https://img.shields.io/badge/ViewComfy-Discord-%235865F2.svg)](https://discord.gg/DXubrz5R7E)
[![Website](https://img.shields.io/badge/ViewComfy%20-%20green?label=Website&color=4D7D85)](https://www.viewcomfy.com/)

![Group 9](https://github.com/user-attachments/assets/b4987b5e-c3a4-4a24-bc27-e9c9d4940cfe)

## Demo

https://github.com/user-attachments/assets/7830118a-0a79-4cf8-ad54-3cca3f969e69

## Form Editor

You can drag and drop your ComfyUI workflow_api.json file into the form editor. It will then generate a new form that you can use to configure the inputs that will be displayed on the playground.

## Playground

The Playground is a simplified UI where you can run your workflows. It can easily be turned into a sharable web app using a service like ngrok.

### How to use it

You need to have [comfy-cli](https://github.com/Comfy-Org/comfy-cli/) installed

```bash
pip install comfy-cli
comfy install
```

Install [Node.js 18.18](https://nodejs.org/) or later (recommended v20.17)

Clone the repo

```bash
git cone https://github.com/ViewComfy/ViewComfy.git
```

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

ViewMode only loads the playground page and can easily be turned into a web app. This is convenient if you want to share your workflow with someone without sharing the workflow_api.json, and without them having to install ComfyUI.

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

e.g with the command line:

```bash

VIEW_COMFY_FILE_NAME="view_comfy.json" NEXT_PUBLIC_VIEW_MODE="true" npm run dev
```

For a  more detailed guide on how to set up ViewMode and share your app with ngrok you can refer to our blog: https://www.viewcomfy.com/blog/blog-post-title-one-d2cy8

## Form Editor Advanced

You can also drop a view_comfy.json directly in the form editor to edit it without the need for the workflow_api.json. But be aware that if you're using the view_comfy.json directly, you will still need to have the original workflow_api.json in the project's root.

Feel free to contribute with feedback, suggestions, issues or pull requests.

## Roadmap

- [ ]  Build a solution to deploy ViewComfy apps on the cloud 
- [ ]  Enable video inputs and outputs
- [ ]  Randomize the seed by default at every generation
- [ ]  Enable adding parameters back to the form editor after deletion 

### Tech

ViewComfy is a Next.js app - [Next.js Documentation](https://nextjs.org/docs)
