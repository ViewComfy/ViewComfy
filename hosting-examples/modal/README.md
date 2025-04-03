# Hosting Examples for ViewComfy App

If you are running your app via the ViewComfy API (See Deployment section in the project's main ReadMe), you can easily deploy that application using your own hosting service. 

To get started, you can use this script to automatically host your application on Modal. 

After deploying, the frontend for your application (the app) will be running on a Modal CPU that you manage, while the backend (the ComfyUI running your workflow) will be hosted on the ViewComfy servers. 
  
## Modal Hosting

To deploy a ViewComfy App on Modal, you can follow these steps:

1. Deploy your workflow on ViewComfy

Deployed your workflow on ViewComfy cloud and connected your view_comfy.json with your serverless API endpoint. See "Deploy the workflows individually and access them via serverless APIs" on the project's main ReadMe for all the details. 

2. Create an account at [modal.com](https://modal.com/)

3. Install the modal Python packages:
```bash
pip install modal
```
4. Authenticate:
```bash
modal setup
```
if that doen't work, try running: 
``` bash
python -m modal setup
```
5. Add your ViewComfy VIEWCOMFY_CLIENT_ID and VIEWCOMFY_CLIENT_SECRET to the `.env` file inside hosting-examples/modal.

6. Replace the `view_comfy.json` file inside hosting-examples/modal with your own.

7. Run the following command to deploy the app

```bash

cd hosting-examples/modal
modal  deploy view_comfy.py

```
