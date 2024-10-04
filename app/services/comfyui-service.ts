import util from "node:util";
import path from "node:path";
import type { IComfyInput } from "../interfaces/comfy-input";
import { ComfyWorkflow } from "../models/comfy-workflow";
import fs from "node:fs/promises";
import { ComfyErrorHandler } from "../helpers/comfy-error-handler";
import { ComfyError, ComfyWorkflowError } from "../models/errors";
import { missingWorkflowApiFileError, workflowApiFileName } from "../constants";

const execProm = util.promisify(require("node:child_process").exec);
function getComfyLaunchCmd(args: string) {
    if (process.platform === 'win32' && process.env.VENV_ACTIVATION_PATH) {
        const venv = process.env.VENV_ACTIVATION_PATH;
        return `powershell -NoProfile -ExecutionPolicy Bypass -Command "& {. .${venv}; comfy ${args}}"`
    }
    return `comfy ${args}`
}

const baseComfyErrorMsg = "the most common case is that the comfy-cli is pointing to the wrong ComfyUI path, to solve this you can try \n"
    + "`comfy set-default <path-to-comfyui>`, \n"
    + "if you're using a virtual environment remember to activate it, \n"
    + "you can check the errors in the console where you launched the ViewComfy server \n"
    + "and you can check our readme in: https://github.com/ViewComfy/ViewComfy for more details";


export class ComfyUIService {

    private comfyErrorHandler: ComfyErrorHandler;

    constructor() {
        this.comfyErrorHandler = new ComfyErrorHandler();
    }

    async runComfyUI(args: IComfyInput) {
        if (!await this.isComfyUIRunning()) {
            await this.launchComfyUI();
        }
        return await this.runWorkflow(args);
    }

    async launchComfyUI() {
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
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: any) {
            console.error("Failed to launch ComfyUI")
            console.error({ stderr: error.stderr, stdout: error.stdout });

            const errorMsg = `Failed to launch ComfyUI, ${baseComfyErrorMsg}`
            const comfyError = new ComfyWorkflowError({
                message: "Failed to launch ComfyUI",
                errors: [errorMsg]
            });
            throw comfyError;
        }
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

        const missingWorkflowError = new ComfyError({
            message: "Failed to launch ComfyUI",
            errors: [missingWorkflowApiFileError]
        });

        if (!workflow) {

            try {
                const filePath = path.join(process.cwd(), workflowApiFileName);
                const fileContent = await fs.readFile(filePath, 'utf8');
                workflow = JSON.parse(fileContent);
            } catch (error) {
                throw missingWorkflowError;
            }
        }

        if (!workflow) {
            throw missingWorkflowError
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
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: any) {
            console.error("Failed to run the workflow")
            console.error({ error });

            const comfyError = this.comfyErrorHandler.tryToParseWorkflowError(error);
            if (comfyError) {
                throw comfyError;
            }

            throw new ComfyWorkflowError({
                message: "Error running workflow",
                errors: ["Something went wrong running the workflow, the most common cases are missing nodes and running out of Vram. "]
            });

        }
    }


    async getEnvVariables() {
        const cmd = getComfyLaunchCmd("env");
        try {
            const { stdout } = await execProm(cmd);
            if (stdout) {
                return this.parseEnvOutput(stdout.toString());
            }
            throw new Error("Failed to get environment variables");
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: any) {
            console.error("Failed to get environment variables")
            console.error({ error });

            const errorMsg = `Failed to get environment variables, ${baseComfyErrorMsg}`
            throw new ComfyError({
                message: "Failed to launch ComfyUI",
                errors: [errorMsg]
            });
        }

    }

    async getOutputDir() {
        const cmd = getComfyLaunchCmd("which");
        try {
            const { stdout } = await execProm(cmd);
            if (stdout) {
                const comfyPath = stdout.toString().split("Target ComfyUI path: ")[1].replace(/\r?\n/g, '').replace(/'/g, '');
                return `${comfyPath}/output`;
            }
            throw new Error("Failed to get output directory");
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: any) {
            console.error("Failed to get output directory");
            console.error({ error });
            const errorMsg = `Failed to get output directory, ${baseComfyErrorMsg}`
            throw new ComfyError({
                message: "Failed to launch ComfyUI",
                errors: [errorMsg]
            });
        }
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
