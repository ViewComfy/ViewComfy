# Hosting Examples for ViewComfy

## Modal

To deploy a ViewComfy App on Modal, you can use the following guide:

1. Create an account at [modal.com](https://modal.com/)
2. Run pip install modal to install the modal Python package
3. Run modal setup to authenticate (if this doesn’t work, try python -m modal setup)
4. Add your ViewComfy VIEWCOMFY_CLIENT_ID and VIEWCOMFY_CLIENT_SECRET to the `.env` file
5. Replace the `view_comfy.json` file with your own, for it to work you need to use the [ViewComfy Endpoint](https://github.com/ViewComfy/ViewComfy?tab=readme-ov-file#deploy-the-workflows-individually-and-access-them-via-serverless-apis)
6. Run the following command to deploy the app

```bash
modal deploy -e view_comfy.py
```
