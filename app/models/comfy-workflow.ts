import path from "node:path";
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import type { IInput } from "@/app/interfaces/input";
import * as constants from "@/app/constants";
import { getComfyUIRandomSeed } from "@/lib/utils";
import { ComfyUIAPIService } from "../services/comfyui-api-service";
import { SettingsService } from "../services/settings-service";

const settingsService = new SettingsService();

export class ComfyWorkflow {
   
  private workflow: { [key: string]: any };
  private workflowFileName: string;
  private workflowFilePath: string;
  private id: string;
  private comfyInputsDir: string;
  private comfyWorkflowsDir: string;

  constructor(workflow: object) {
    this.workflow = workflow;
    this.id = crypto.randomUUID();
    this.workflowFileName = `workflow_${this.id}.json`;
    this.comfyWorkflowsDir = settingsService.getComfyWorkflowsDirectory();
    this.workflowFilePath = path.join(this.comfyWorkflowsDir, this.workflowFileName);
    this.comfyInputsDir = settingsService.getComfyInputDirectory();
  }

  public async setViewComfy(viewComfy: IInput[], comfyUIService: ComfyUIAPIService) {
    try {
      for (const input of viewComfy) {
        const path = input.key.split("-");
         
        let obj: any = this.workflow;
        for (let i = 0; i < path.length - 1; i++) {
          if (i === path.length - 1) {
            continue;
          }
          obj = obj[path[i]];
        }
        if (input.value instanceof File) {
          if (path[path.length - 1] === "viewcomfymask") {
            await this.uploadMaskToComfy({
              comfyUIService,
              maskFile: input.value,
              maskKeyParam: input.key,
              viewComfy,
            })
          } else {
            const filePath = await this.createFileFromInput(input.value);
            obj[path[path.length - 1]] = filePath;
          }
        } else {
          obj[path[path.length - 1]] = input.value;
        }
      }
    } catch (error) {
      console.error(error);
    }

    for (const key in this.workflow) {
      const node = this.workflow[key];
      switch (node.class_type) {
        case "SaveImage":
        case "VHS_VideoCombine":
          node.inputs.filename_prefix = this.getFileNamePrefix();
          break;

        default:
          Object.keys(node.inputs).forEach((key) => {
            if (
              constants.SEED_LIKE_INPUT_VALUES.some(str => key.includes(str))
              && node.inputs[key] === Number.MIN_VALUE
            ) {
              const newSeed = this.getNewSeed();
              node.inputs[key] = newSeed;
            }
          });
      }
    }
  }

  public getWorkflow() {
    return this.workflow;
  }

  public getWorkflowFilePath() {
    return this.workflowFilePath;
  }

  public getWorkflowFileName() {
    return this.workflowFileName;
  }

  public getFileNamePrefix() {
    return `${this.id}_`;
  }

  public getNewSeed() {
    return getComfyUIRandomSeed();
  }

  private async createFileFromInput(file: File) {
    const fileName = `${this.getFileNamePrefix()}${file.name}`;
    const filePath = path.join(this.comfyInputsDir, fileName);
    const fileBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileBuffer));
    return filePath;
  }

  private async uploadMaskToComfy(params: {
    maskFile: File,
    maskKeyParam: string,
    viewComfy: IInput[],
    comfyUIService: ComfyUIAPIService
  }) {
    const { maskKeyParam, maskFile, viewComfy, comfyUIService } = params;
    const originalFilePath = maskKeyParam.endsWith("-viewcomfymask") 
      ? maskKeyParam.slice(0, maskKeyParam.length - "-viewcomfymask".length)
      : maskKeyParam;
    const originalFilePathKeys = originalFilePath.split("-");
     
    let obj: any = this.workflow;
    for (let i = 0; i < originalFilePathKeys.length - 1; i++) {
      if (i === originalFilePathKeys.length - 1) {
        continue;
      }
      obj = obj[originalFilePathKeys[i]];
    }
    const unmaskedPath = obj[originalFilePathKeys[originalFilePathKeys.length - 1]];
    
    if (!unmaskedPath) {
      throw new Error(`Cannot find unmasked path at key: ${originalFilePathKeys[originalFilePathKeys.length - 1]}. Available keys: ${Object.keys(obj).join(', ')}`);
    }
    
    // Extract filename from path - handle both full paths and relative paths
    let unmaskedFilename: string;
    if (path.isAbsolute(unmaskedPath) && unmaskedPath.startsWith(this.comfyInputsDir)) {
      unmaskedFilename = path.relative(this.comfyInputsDir, unmaskedPath);
    } else if (path.isAbsolute(unmaskedPath)) {
      // If it's an absolute path but doesn't start with comfyInputsDir, just get the basename
      unmaskedFilename = path.basename(unmaskedPath);
    } else {
      // If it's already a relative path, use it as-is
      unmaskedFilename = unmaskedPath;
    }
    let viewComfyInput = undefined;
    for (const input of viewComfy) {
      if (input.key === originalFilePath) {
        viewComfyInput = input;
        break;
      }
    }

    if (!viewComfyInput) {
      throw new Error("Cannot find the original parameter to map to the mask");
    }
    const originalFile = viewComfyInput.value as File;

    const clipspaceMaskFilename = this.getMaskFilename("mask", this.id);

    await comfyUIService.uploadMask({
      maskFileName: clipspaceMaskFilename,
      maskFile,
      originalFileRef: unmaskedFilename
    });

    const clipspacePaintedFilename = this.getMaskFilename("painted", this.id);

    await comfyUIService.uploadImage({
      imageFile: originalFile,
      imageFileName: clipspacePaintedFilename,
      originalFileRef: unmaskedFilename
    });

    const clipspacePaintedMaskFilename = this.getMaskFilename("painted-masked", this.id);
    await comfyUIService.uploadMask({
      maskFileName: clipspacePaintedMaskFilename,
      maskFile,
      originalFileRef: clipspacePaintedFilename
    });

    obj[originalFilePathKeys[originalFilePathKeys.length - 1]] = `clipspace/${clipspacePaintedMaskFilename} [input]`

  }

  private getMaskFilename(filename: string, id: string) {
    return `clipspace-${filename}-${id}.png`
  }
}
