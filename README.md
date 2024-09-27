# ViewComfy

ViewComfy is a open source tool to help you create beautiful web apps from ComfyUI
[![Discord](https://img.shields.io/badge/ViewComfy-Discord-%235865F2.svg)](https://discord.gg/DXubrz5R7E)

// Screenshot of the UI playground

## Playground

The Playground is a simplified UI where you can run your workflows.

## Form Editor

You can drag and drop your ComfyUI workflow_api.json file into the form editor. The form editor will generate a form that you can use to configure the inputs that you want to show in the playground.

### How to use it

Install [Node.js 18.18](https://nodejs.org/) or later (recommended v20.17)

Clone the repo

Install dependencies and start the dev server

```bash
npm install
npm run dev
```

## ViewMode

ViewMode is a mode that will load only the playground page so people can use it without needing to load the workflow_api.json file  
or to prevent people from editing the form.
to use ViewMode you need to download the view_comfy.json that is generated when you use the form editor. You need to place that file in the root of the project along with the workflow_api.json.

e.g. with env file:

```bash
.env file ->
NEXT_PUBLIC_VIEW_MODE="true"

npm run dev
```

ViewComfy by default will look at a file called view_comfy.json in the root of the project or you can specify a different file with the VIEW_COMFY_FILE_NAME environment variable. You can also specify a different workflow_api.json with the WORKFLOW_API_FILE_NAME environment variable.

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

In the form editor you can also drop the view_comfy.json to edit and create a new version of it without the need of the workflow_api.json.
But we aware if you're only using the view_comfy.json the workflow_api.json needs to be present in the root of the project.

Feel free to contribute with feedback, suggestions, issues or pull requests.

### Tech

ViewComfy is a Next.js app - [Next.js Documentation](https://nextjs.org/docs)
