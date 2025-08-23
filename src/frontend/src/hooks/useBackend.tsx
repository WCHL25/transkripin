import { Identity } from "@dfinity/agent";
import { useAuth } from "@ic-reactor/react";
import { createActor, canisterId, backend } from "declarations/backend";

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

export const useBackend = () => {
  const { identity, isAuthenticated } = useAuth();

  if (!isAuthenticated || !identity) {
    return backend;
  }

  return createAuthenticatedBackend(identity);
};
