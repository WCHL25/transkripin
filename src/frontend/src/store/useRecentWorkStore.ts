import { ActorSubclass } from "@dfinity/agent";
import { _SERVICE, UserFileArtifact } from "declarations/backend/backend.did";
import { create } from "zustand";

interface RecentWorkState {
   loading: boolean;
   recentWorks: UserFileArtifact[];
   reload: (backend: ActorSubclass<_SERVICE>) => Promise<void>;
}

export const useRecentWorkStore = create<RecentWorkState>((set, get) => ({
   loading: false,
   recentWorks: [],
   reload: async (backend) => {
      const listUserFiles = await backend.list_user_file_artifacts([
         {
            file_type: [],
            language: [],
            search: [],
            sort: [{ Newest: null }],
         },
      ]);

      set({ recentWorks: listUserFiles });

      get().loading = false;
   },
}));
