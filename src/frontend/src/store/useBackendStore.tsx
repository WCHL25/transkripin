import { ActorSubclass, Identity } from "@dfinity/agent";
import { createActor, canisterId, backend } from "declarations/backend";
import { _SERVICE } from "declarations/backend/backend.did";
import { create } from "zustand";

export const createAuthenticatedBackend = (identity: Identity) => {
   return createActor(canisterId, {
      agentOptions: {
         identity: identity,
         host:
            process.env.DFX_NETWORK === "ic"
               ? "https://ic0.app"
               : "http://localhost:4943",
      },
   });
};

interface BackendStore {
   backend: ActorSubclass<_SERVICE>;
   setBackend: (be: ActorSubclass<_SERVICE>) => void;
   createAuthenticatedActor: (identity: Identity) => ActorSubclass<_SERVICE>;
   resetBackend: () => void;
}

export const useBackendStore = create<BackendStore>((set) => ({
   backend: backend, // Default backend

   setBackend: (newBackend) => {
      set({ backend: newBackend });
   },

   createAuthenticatedActor: (identity: Identity) => {
      const authenticatedBackend = createAuthenticatedBackend(identity);
      set({ backend: authenticatedBackend });
      return authenticatedBackend;
   },

   resetBackend: () => {
      set({ backend: backend }); // Reset ke default backend
   },
}));
