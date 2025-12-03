import { create, StateCreator } from "zustand";
import { ITeam } from "@/app/interfaces/user";
import { createTeamSlice, ITeamSlice } from "@/stores/team-store-slice";
import { IWorkflowSlice, createWorkflowSlice } from "@/stores/workflows-store-slice";
import { createViewComfyAppSlice, IViewComfyAppSlice } from "@/stores/viewcomfy-app-store";

interface ISharedStore {
    setSharedProps: (
        partial:
            | ISharedStore
            | Partial<ISharedStore>
            | ((state: ISharedStore) => ISharedStore | Partial<ISharedStore>),
        replace?: false,
    ) => void;
    setInitState: (params: {
        currentTeam: ITeam;
    }) => void;
}

const useSharedStore: StateCreator<
    ITeamSlice &
    IWorkflowSlice &
    ISharedStore,
    [],
    [],
    ISharedStore
> = set => ({
    setSharedProps: (
        partial:
            | ISharedStore
            | Partial<ISharedStore>
            | ((state: ISharedStore) => ISharedStore | Partial<ISharedStore>),
        replace?: false,
    ) => {
        return set(partial, replace);
    },
    setInitState: (params: {
        currentTeam: ITeam;
        isLanding?: boolean;
    }) => {
        set({
            currentTeam: params.currentTeam,
        });
    },
});

export const useBoundStore = create<
    ITeamSlice &
    IWorkflowSlice &
    IViewComfyAppSlice &
    ISharedStore
>()((...a) => ({
    ...createTeamSlice(...a),
    ...createWorkflowSlice(...a),
    ...createViewComfyAppSlice(...a),
    ...useSharedStore(...a),
}));
