import { IBase } from "@/app/interfaces/base";

export interface IUser extends IBase {
    user_name: string;
    email: string;
    auth_id: string;
}
