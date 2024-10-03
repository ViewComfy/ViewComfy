import util from "node:util";
import path from "node:path";
import type { IComfyInput } from "../interfaces/comfy-input";
import { ComfyWorkflow } from "../models/comfy-workflow";
import fs from "node:fs/promises";

const execProm = util.promisify(require("node:child_process").exec);
function getComfyLaunchCmd(args: string) {
    if (process.platform === 'win32' && process.env.VENV_ACTIVATION_PATH) {
        const venv = process.env.VENV_ACTIVATION_PATH;
        return `powershell -NoProfile -ExecutionPolicy Bypass -Command "& {. .${venv}; comfy ${args}}"`
    }
    return `comfy ${args}`
}


export class ComfyUIService {

    async runComfyUI(args: IComfyInput) {
        if (!await this.isComfyUIRunning()) {
            await this.launchComfyUI();
        }
        return await this.runWorkflow(args);
    }

    async launchComfyUI() {
        // const cmd = "comfy launch --background";
        const cmd = getComfyLaunchCmd("launch --background");
        let err: string | null = null;
        try {
            const { stdout, stderr } = await execProm(cmd);
            if (stdout) {
                return stdout.toString();
            }
            if (stderr) {
                err = stderr.toString();
            }
        } catch (error: any) {
            throw new Error(error || "Failed to launch ComfyUI");
        }
        throw new Error(err || "Failed to launch ComfyUI");
    }

    async isComfyUIRunning(port = 8188, host = "localhost") {
        const url = `http://${host}:${port}/history`;
        try {
            const response = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async runWorkflow(args: IComfyInput) {
        let workflow = args.workflow;
        if (!workflow) {
            const workflowFile = process.env.WORKFLOW_API_FILE_NAME || "workflow_api.json";
            try {
                const filePath = path.join(process.cwd(), workflowFile);
                const fileContent = await fs.readFile(filePath, 'utf8');
                workflow = JSON.parse(fileContent);
            } catch (error) {
                throw new Error(`Workflow file ${workflowFile} not found`);
            }
        }

        if (!workflow) {
            throw new Error("Workflow is required");
        }

        const outputDir = await this.getOutputDir();
        const comfyWorkflow = new ComfyWorkflow(workflow, outputDir);
        await comfyWorkflow.setViewComfy(args.viewComfy);
        await comfyWorkflow.saveWorkflowAsFile();

        try {
            const cmd = getComfyLaunchCmd(`run --workflow "${comfyWorkflow.getWorkflowFilePath()}" --wait`);
            const { stdout, stderr } = await execProm(cmd);

            if (stderr) {
                throw new Error(stderr);
            }

            const outputFiles = await fs.readdir(comfyWorkflow.getOutputDir());
            const imagePaths = [];
            for (const file of outputFiles) {
                if (file.startsWith(comfyWorkflow.getFileNamePrefix())) {
                    const filePath = path.join(comfyWorkflow.getOutputDir(), file);
                    imagePaths.push(filePath);
                }
            }

            return imagePaths;
        } catch (error: any) {
            throw new Error(error);
        }
    }


    async getEnvVariables() {
        const cmd = getComfyLaunchCmd("env");
        let err = "";
        try {
            const { stdout, stderr } = await execProm(cmd);
            if (!stderr) {
                if (stdout) {
                    return this.parseEnvOutput(stdout.toString());
                }
                throw new Error("Failed to get environment variables");
            }
            err = stderr.toString();
        } catch (error: any) {
            throw new Error(error || "Failed to get environment variables");
        }
        throw new Error(err || "Failed to get environment variables");
    }

    async getOutputDir() {
        const cmd = getComfyLaunchCmd("which");
        let err = "";
        try {
            const { stdout, stderr } = await execProm(cmd);
            if (!stderr) {
                if (stdout) {
                    const comfyPath = stdout.toString().split("Target ComfyUI path: ")[1].replace(/\r?\n/g, '').replace(/'/g, '');
                    return `${comfyPath}/output`;
                }
                throw new Error("Failed to get output directory");
            }
            err = stderr.toString();
        } catch (error: any) {
            throw new Error(error || "Failed to get output directory");
        }
        throw new Error(err || "Failed to get output directory");
    }

    parseEnvOutput(stdout: string) {
        // comfy which
        const lines = stdout.split('\n').slice(3, -2);
        const result: Record<string, string> = {};

        for (const line of lines) {
            const [key, value] = line.split('│').slice(1, 3).map(s => s.trim());
            if (key && value) {
                result[key] = value;
            }
        };

        return {
            workspacePath: result['Current selected workspace'].split(" ")[1]
        };
    }
}
