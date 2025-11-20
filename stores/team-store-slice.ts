import { ITeam } from "@/app/interfaces/user";
import { StateCreator } from "zustand";

export interface ITeamSlice {
    currentTeam: ITeam | undefined;
    setCurrentTeam: (value: ITeam) => void;
    getTeamProps: () => ITeamSlice;
    setTeamProps: (
        partial:
            | ITeamSlice
            | Partial<ITeamSlice>
            | ((state: ITeamSlice) => ITeamSlice | Partial<ITeamSlice>),
        replace?: false,
    ) => void;
}

const teamInitState = {
    currentTeam: undefined,
};

export const createTeamSlice: StateCreator<ITeamSlice, [], [], ITeamSlice> = (
    set,
    get,
) => ({
    ...teamInitState,
    setCurrentTeam: (value: ITeam) => {
        set({ currentTeam: value });
    },
    getTeamProps: () => {
        return get();
    },
    setTeamProps: (
        partial:
            | ITeamSlice
            | Partial<ITeamSlice>
            | ((state: ITeamSlice) => ITeamSlice | Partial<ITeamSlice>),
        replace?: false,
    ) => {
        return set(partial, replace);
    },
});
