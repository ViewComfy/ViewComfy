import util from 'util';
import path from "path";
import { IComfyInput } from "../interfaces/comfy-input";
import { ComfyWorkflow } from "../models/comfy-workflow";
import fs from 'fs/promises';

const execProm = util.promisify(require('child_process').exec);

export class ComfyUIService {

    async runComfyUI(args: IComfyInput) {
        if (!await this.isComfyUIRunning()) {
            await this.launchComfyUI();
        }
        return await this.runWorkflow(args);
    }

    async launchComfyUI() {
        const cmd = "comfy launch --background";
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
            throw new Error(error.stdout || "Failed to launch ComfyUI");
        }
        throw new Error(err || "Failed to launch ComfyUI");
    }

    async isComfyUIRunning(port: number = 8188, host: string = "localhost") {
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
            const cmd = `comfy run --workflow "${comfyWorkflow.getWorkflowFilePath()}" --wait`;
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
            throw new Error(error.stdout);
        }
    }


    async getEnvVariables() {
        let cmd = "comfy env";
        let err = "";
        try {
            let { stdout, stderr } = await execProm(cmd);
            if (!stderr) {
                if (stdout) {
                    return this.parseEnvOutput(stdout.toString());
                } else {
                    throw new Error("Failed to get environment variables");
                }
            }
            err = stderr.toString();
        } catch (error: any) {
            throw new Error(error.stdout || "Failed to get environment variables");
        }
        throw new Error(err || "Failed to get environment variables");
    }

    async getOutputDir() {
        let cmd = "comfy which";
        let err = "";
        try {
            let { stdout, stderr } = await execProm(cmd);
            if (!stderr) {
                if (stdout) {
                    return `${stdout.toString().split(":")[1].trim()}/output`;
                } else {
                    throw new Error("Failed to get output directory");
                }
            }
            err = stderr.toString();
        } catch (error: any) {
            throw new Error(error.stdout || "Failed to get output directory");
        }
        throw new Error(err || "Failed to get output directory");
    }

    parseEnvOutput(stdout: string) {
        // comfy which
        const lines = stdout.split('\n').slice(3, -2);
        const result: Record<string, string> = {};

        lines.forEach(line => {
            const [key, value] = line.split('│').slice(1, 3).map(s => s.trim());
            if (key && value) {
                result[key] = value;
            }
        });

        return {
            workspacePath: result['Current selected workspace'].split(" ")[1]
        };
    }
}
