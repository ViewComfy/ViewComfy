import { IBase } from "@/app/interfaces/base";

export interface IUser extends IBase {
    user_name: string;
    email: string;
    auth_id: string;
    teams: ITeam[];
}

export interface ITeam extends IBase {
    name: string;
    slug: string;
    playgroundLandingLogoUrl: string | undefined;
    playgroundLandingName: string | undefined;
    projects: IProject[];
}

export interface IProject extends IBase {
    name: string;
}
