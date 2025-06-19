# ViewComfy

ViewComfy is an open source tool to help you create beautiful web apps from ComfyUI workflows.

[![Deployment](https://img.shields.io/badge/Deployment%20-%20green?label=ViewComfy&color=7F68D9)](https://app.viewcomfy.com/)
[![Discord](https://img.shields.io/badge/ViewComfy-Discord-%235865F2.svg)](https://discord.gg/DXubrz5R7E)
[![Website](https://img.shields.io/badge/Website%20-%20green?label=ViewComfy&color=4D7D85)](https://www.viewcomfy.com/)


![Group 21](https://github.com/user-attachments/assets/ad9a98e6-6c4c-4bf5-85db-4d03ab682f9b)
It can support multiple workflows in the same UI and image, video, and text outputs and is optimized to work well on desktop and mobile.

Easily deploy your applications on serverless infrastructure using [ViewComfy cloud](https://www.viewcomfy.com/), or on the service of your choice. Applications hosted on ViewComfy cloud come with a user management system, billing tracking and shareable email links out of the box. More info in the [deployment section](#Deployment). 

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
For a  more detailed guide on how to set up ViewMode and share your app with ngrok you can refer to [our blog](https://www.viewcomfy.com/blog/turn-a-comfyui-workflow-into-an-app).


## Deployment

You can deploy ViewComfy apps on the service of your choice, but by far the easiest way to do it is by using [ViewComfy Cloud](https://app.viewcomfy.com/). 

ViewComfy Cloud is designed to make the whole deployment process feel like a breeze. It's as simple as uploading your workflow; everything else is taken care of for you - no need to worry about setting up volumes, docker images, or anything like that. 

### Set up the Comfy server 

The first thing you need to do to deploy your app is set up the Comfy server and get your API endpoint. This [guide](https://youtu.be/pIODXFU9sHw) goes over how to do that.

Once set up, the workflow will be running on the serverless infrastructure and be accessible via the standard Comfy interface and an API endpoint. 

To link your endpoint to your workflow inside your ViewComfy app, you just need to copy it in the right field:

![Screenshot 2025-03-17 175719](https://github.com/user-attachments/assets/25495f87-5639-456b-9266-9fcabb3995cc)

To use the endpoint with your local installation of ViewComfy, you will also need to get your API keys from the dashboard and add them to your .env file:

```bash
.env file ->
VIEWCOMFY_CLIENT_ID="<your client id>"
VIEWCOMFY_CLIENT_SECRET="<your client secret>"
```

Once you are done, the app will send a request to your ViewComfy deployment every time you click generate. 

### Deploy the ViewComfy app

The easiest way to do this is to navigate to the ViewComfy Apps tab on the ViewComfy cloud dashboard and drop the viewcomfy.json there. For all the details, you can refer to [this](https://www.youtube.com/watch?v=pIODXFU9sHw&ab_channel=ViewComfy) video.

![deploy a viewcomfy app](https://github.com/user-attachments/assets/23988845-2526-4a16-b93d-89a3d1a365b9)

But ultimately, you can deploy your app on the hosting service of your choice. For example, there are some details on how to host the app on modal in the hosting-examples/modal folder.

## Usage
### Form Editor

You can drag and drop your ComfyUI workflow_api.json file into the form editor. It will then generate a new form that you can use to configure the inputs that will be displayed on the playground.

For more details on how to use the editor with advanced Comfy workflows, you can refer to [this](https://youtu.be/70h0FUohMlE) guide. 

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
docker build -t viewcomfy .
```

Run docker image

```bash
docker run -it --name viewcomfy-container -p 3000:3000 viewcomfy
```

## Tech

ViewComfy is a Next.js app - [Next.js Documentation](https://nextjs.org/docs)
