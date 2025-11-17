# ViewComfy

ViewComfy is an open source tool to help you create beautiful web apps from ComfyUI workflows.

[![Website](https://img.shields.io/badge/Website%20-%20green?label=ViewComfy&color=4D7D85)](https://www.viewcomfy.com/)
[![Deployment](https://img.shields.io/badge/Deployment%20-%20green?label=ViewComfy&color=7F68D9)](https://app.viewcomfy.com/)
[![Discord](https://img.shields.io/badge/ViewComfy-Discord-%235865F2.svg)](https://discord.gg/DXubrz5R7E)
[![Twitter](https://img.shields.io/twitter/follow/ViewComfy)](https://x.com/ViewComfy)


![Open Source project to turn ComfyUI workflows to web apps](https://github.com/user-attachments/assets/1e30bf5d-7186-4eee-94aa-2e2fe8bfeaa9)
It can support multiple workflows in the same UI and works well with image, video, and text outputs.

Easily deploy your applications on serverless infrastructure using [ViewComfy cloud](https://www.viewcomfy.com/), or on the service of your choice. Applications hosted on ViewComfy cloud come with a user management system, billing tracking and shareable email links out of the box. More info in the [deployment section](#Deployment) and in the [docs](https://docs.viewcomfy.com/get_started/introduction).

## Demo
[![Demo](https://github.com/user-attachments/assets/864508d8-705a-4882-8179-7fd3c864724b)](https://youtu.be/Su_rbjodvEI)

## Features

### Input Editor
Configure how each workflow input appears and expose only what your users need.
![ViewComfy input editor](https://github.com/user-attachments/assets/009e3cb1-2a72-4a97-8c5d-b691ab679cae)

Supported input types:
- Text
- Numbers
- Dropdowns (Select)
- Sliders
- Check boxes
- Images
- Videos
- Audio

Inputs can be required or optional. It is also possible to add helper text to guide users. 

### Mask Editor 
Easily add masks to image inputs. 
![ViewComfy mask editor](https://github.com/user-attachments/assets/f459b3da-9599-40c8-982f-4a6c3cd18c0c)

### History
Built-in user output history for apps deployed on ViewComfy Cloud. 
![ViewComfy app user history](https://github.com/user-attachments/assets/123d68d4-eaed-43c1-80fa-81684c125fb3)


### User management and Analytics
Built-in user management and analytics for apps deployed on ViewComfy Cloud. 
![ViewComfy usage data](https://github.com/user-attachments/assets/2e4bd980-8e9b-4791-97a9-01a6f5de87f9)

### Serverless API connection
Run workflows on serverless infrastructure and connect them via API to your apps. 

### Enable complex workflow behaviours
Create complex workflow behaviours in your apps, like workflow routing, optional images, and custom input validation with error message using the [ViewComfy utils](https://github.com/ViewComfy/ViewComfy-Utils) node pack.  



## Installation

After installing ViewComfy, you will be able to connect it to your local installation of ComfyUI, or workflows deployed on [ViewComfy cloud](https://www.viewcomfy.com/). 

You can also skip the installation by using the web-hosted version of the [ViewComfy app editor](https://editor.viewcomfy.com/). When using the web-hosted version of the editor, you will need to first deploy the workflow on ViewComfy cloud and connect the app with the workflow's API endpoint. 

### Installation Guide
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
For a more detailed guide on how to set up playground mode and share your app with ngrok you can refer to [our blog](https://www.viewcomfy.com/blog/turn-a-comfyui-workflow-into-an-app).


## Deployment

You can deploy ViewComfy apps on the service of your choice, but by far the easiest way to do it is by using [ViewComfy Cloud](https://www.viewcomfy.com/). 

### Set up the Comfy server

The first thing you need to do to deploy your app is set up the Comfy server and get your API endpoint. This [guide](https://youtu.be/pIODXFU9sHw) goes over how to do that.

Once set up, the workflow will be running on serverless infrastructure and be accessible via the standard Comfy interface and an API endpoint. 

To link your endpoint to your workflow inside your ViewComfy app, you just need to copy it into the right field:

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

But ultimately, you can deploy your app on the hosting service of your choice. For example, there are some details on how to host the app on Modal in the hosting-examples/modal folder.

## Usage
### Form Editor

You can drag and drop your ComfyUI workflow_api.json file into the form editor. It will then generate a new form that you can use to configure the inputs that will be displayed on the playground.

For more details on how to use the editor with advanced Comfy workflows, you can refer to [this](https://youtu.be/70h0FUohMlE) guide. 

### Playground

The Playground is a simplified UI where you can run your workflows. It can easily be turned into a shareable web app using a service like ngrok or ViewComfy Cloud.

### Playground Mode (aka ViewMode)

Playground Mode will only load the playground page and can easily be turned into a web app. This is convenient if you want to share your workflow with someone without sharing the workflow_api.json, and without them having to install ComfyUI. It also allows you to only expose the inputs you want to expose to the end user. 

This mode is enabled by default when running apps on ViewComfy Cloud. To use it on your local you need to follow the following steps. 

To use Playground Mode on your local, you need to download the view_comfy.json that is generated when you use the form editor and place it in the root of the project along with the workflow_api.json.

To enable Playground Mode, edit the .env file in the root of the project and set NEXT_PUBLIC_VIEW_MODE to true:

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

e.g. with the command line:

```bash

VIEW_COMFY_FILE_NAME="view_comfy.json" NEXT_PUBLIC_VIEW_MODE="true" npm run dev
```

### Form Editor Advanced

You can also drop a view_comfy.json directly in the form editor to edit it without needing the workflow_api.json.

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

Feel free to contribute with feedback, suggestions, issues or pull requests.
