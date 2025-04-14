export interface IViewComfyApp {
    name: string
    description: string
    viewComfyJson: Record<string, unknown>
    appId: string
}

export interface IViewComfyAppSecrets {
    clientId: string
    clientSecret: string
}
