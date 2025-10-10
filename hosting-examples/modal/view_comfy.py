from pathlib import Path
import subprocess
import modal

viewcomfy_version = "v0.1.0"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git")
    .apt_install("curl")
    .run_commands(
        "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash",
        'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm install 22 && nvm use 22',
    )
    .run_commands(
        "mkdir -p /app",
        "cd /app && git init .",
        "cd /app && git remote add origin https://github.com/ViewComfy/ViewComfy.git",
        f"cd /app && git fetch --tags origin && git checkout {viewcomfy_version}",
        'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 22 && cd /app && npm install',
    )
    .add_local_file(
        Path(__file__).parent / "view_comfy.json",
        "/app/view_comfy.json",
        copy=True,
    )
    .add_local_file(
        Path(__file__).parent / ".env",
        "/app/.env",
        copy=True,
    )
)

app = modal.App(name="viewcomfy-modal", image=image)

@app.cls(
    allow_concurrent_inputs=1000,
    scaledown_window=30,
    max_containers=1,
)
class ViewComfy:
    @modal.enter()
    async def launch_view_comfy(self):
        try:
            cmd = """
                export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 22 && \
                cd /app && \
                COMFYUI_API_URL="127.0.0.1" PORT=3000 npm run dev
            """
            subprocess.Popen(
                cmd,
                shell=True,
                executable="/bin/bash",
            )
        except Exception as e:
            print("error starting ViewComfy ", str(e))
            raise e

    @modal.web_server(3000, startup_timeout=120)
    def view_comfy_web_server(self):
        pass
