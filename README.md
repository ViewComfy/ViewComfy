# ViewComfy

ViewComfy is an open source tool to help you create beautiful web apps from ComfyUI workflows.

[![Discord](https://img.shields.io/badge/ViewComfy-Discord-%235865F2.svg)](https://discord.gg/DXubrz5R7E)
[![Website](https://img.shields.io/badge/ViewComfy%20-%20green?label=Website&color=4D7D85)](https://www.viewcomfy.com/)

![Group 21](https://github.com/user-attachments/assets/ad9a98e6-6c4c-4bf5-85db-4d03ab682f9b)


## Installation and demo

### Demo video going through the installation
[![Installation Guide](https://github.com/user-attachments/assets/8b6f6b0d-859a-4a98-80b5-664591160512)](https://youtu.be/sG2elA1bdrg)

### Installation
Install [Node.js 18.18](https://nodejs.org/) or later (recommended v20.17)

Clone the repo

```bash
git clone https://github.com/ViewComfy/ViewComfy.git
```

Install dependencies and start the dev server  

```bash
cd ViewComfy
npm install
npm run dev
```

### Detailed blog
For a  more detailed guide on how to set up ViewMode and share your app with ngrok you can refer to our blog: <https://www.viewcomfy.com/blog/turn-a-comfyui-workflow-into-an-app>


# Usage
## Form Editor

You can drag and drop your ComfyUI workflow_api.json file into the form editor. It will then generate a new form that you can use to configure the inputs that will be displayed on the playground.

## Playground

The Playground is a simplified UI where you can run your workflows. It can easily be turned into a sharable web app using a service like ngrok or ViewComfy cloud.

## ViewMode

ViewMode will only load the playground page and can easily be turned into a web app. This is convenient if you want to share your workflow with someone without sharing the workflow_api.json, and without them having to install ComfyUI.

To use ViewMode you need to download the view_comfy.json that is generated when you use the form editor and place it in the root of the project along with the workflow_api.json.

To enable ViewMode, edit the .env file in the root of the project:

```bash
.env file ->
NEXT_PUBLIC_VIEW_MODE="true"

npm run dev
```

ViewComfy by default will look for a file called view_comfy.json in the project's root folder to render the web app. You can use the VIEW_COMFY_FILE_NAME environment variable to point to a different file.

```bash
.env file ->
VIEW_COMFY_FILE_NAME="view_comfy.json"
NEXT_PUBLIC_VIEW_MODE="true"

npm run dev
```

e.g with the command line:

```bash

VIEW_COMFY_FILE_NAME="view_comfy.json" NEXT_PUBLIC_VIEW_MODE="true" npm run dev
```

## Form Editor Advanced

You can also drop a view_comfy.json directly in the form editor to edit it without needing the workflow_api.json.

Feel free to contribute with feedback, suggestions, issues or pull requests.

## Roadmap

- [x]  Build a solution to deploy ViewComfy apps on the cloud
- [x]  Enable video inputs and outputs
- [ ]  Randomize the seed by default at every generation
- [ ]  Enable adding parameters back to the form editor after deletion

### Tech

ViewComfy is a Next.js app - [Next.js Documentation](https://nextjs.org/docs)
