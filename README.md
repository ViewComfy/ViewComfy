# ViewComfy

ViewComfy is an open source tool to help you create beautiful web apps from ComfyUI workflows.

[![Discord](https://img.shields.io/badge/ViewComfy-Discord-%235865F2.svg)](https://discord.gg/DXubrz5R7E)
[![Website](https://img.shields.io/badge/Website%20-%20green?label=ViewComfy&color=4D7D85)](https://www.viewcomfy.com/)


![Group 21](https://github.com/user-attachments/assets/ad9a98e6-6c4c-4bf5-85db-4d03ab682f9b)
It can support multiple workflows in the same UI and image, video, and text outputs and is optimized to work well on desktop and mobile.


## Installation and demo

### Demo going through the installation
[![Installation Guide](https://github.com/user-attachments/assets/8b6f6b0d-859a-4a98-80b5-664591160512)](https://youtu.be/sG2elA1bdrg)

### Installation
Install [Node.js v20.18](https://nodejs.org/) or later (recommended v20.18)

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

### Detailed installation guide
For a  more detailed guide on how to set up ViewMode and share your app with ngrok you can refer to our blog: <https://www.viewcomfy.com/blog/turn-a-comfyui-workflow-into-an-app>


## Deployment

There are two different ways you can run your ViewComfy apps on cloud GPUs. 

[![Guide](https://img.shields.io/badge/Youtube-Guide-FF0000)](https://youtu.be/pIODXFU9sHw)
[![Deploy](https://img.shields.io/badge/ViewComfy-Deploy-4D7D85)](https://app.viewcomfy.com/)

### Deploy the frontend and backend separately.

This is the recommended option. You can deploy your workflows (backend) without the viewcomfy.json and access them via your serverless API endpoints. This ensures that the GPUs behind your workflow will only be running when generating.

You can then separately deploy the ViewComfy app (frontend) and run it on a CPU.

**Deploy the backend**
  
To get an API endpoint, you can follow the guide above. You will then need to get your API keys from the dashboard and add them to your .env file:

```bash
.env file ->
VIEWCOMFY_CLIENT_ID="<your client id>"
VIEWCOMFY_CLIENT_SECRET="<your client secret>"
```

Finally, you can link your endpoint to your workflow inside your ViewComfy app:

![Screenshot 2025-03-17 175719](https://github.com/user-attachments/assets/25495f87-5639-456b-9266-9fcabb3995cc)

Once you are done, the app will send a request to your viewcomfy deployment every time you click generate. 

  **Deploy the Frontend**

After deploying the backend, you also have the option to deploy the frontend on the hosting service of your choice. After this, your ComfyUI workflow will truly be a web app. 

There is an example on how to do that using Modal in the hosting-examples/modal folder.

The advantage of deploying in two parts is that you can run the heavy generation tasks on GPUs while running the frontend on a CPU. This is a lot more cost effective than running everything on a GPU! 

### Deploy the entire web app

You can also deploy the whole web app and access it via its own unique URL by following the guide above. Note that unlike with the API option, the GPU powering the app will be running for as long as the URL is open in the browser, not just when generating.


## Usage
### Form Editor

You can drag and drop your ComfyUI workflow_api.json file into the form editor. It will then generate a new form that you can use to configure the inputs that will be displayed on the playground.

### Playground

The Playground is a simplified UI where you can run your workflows. It can easily be turned into a sharable web app using a service like ngrok or ViewComfy cloud.

### ViewMode

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

### Form Editor Advanced

You can also drop a view_comfy.json directly in the form editor to edit it without needing the workflow_api.json.

Feel free to contribute with feedback, suggestions, issues or pull requests.

### User Management

ViewComfy supports user management through [Clerk](https://clerk.com/). You can enable it by setting the NEXT_PUBLIC_USER_MANAGEMENT="true". We recommend using this feature only when Playground mode is activated (NEXT_PUBLIC_VIEW_MODE="true").

```bash
.env file ->
NEXT_PUBLIC_USER_MANAGEMENT="true"
NEXT_PUBLIC_VIEW_MODE="true"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
```

## Docker

Build docker image

```bash
docker build \
  --build-arg NEXT_PUBLIC_VIEW_MODE="true" \
  --build-arg NEXT_PUBLIC_USER_MANAGEMENT="true" \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key" \
  -t viewcomfy .
```

Run docker image

```bash
docker run -it --name viewcomfy-container -p 3000:3000 viewcomfy
```

## Tech

ViewComfy is a Next.js app - [Next.js Documentation](https://nextjs.org/docs)
