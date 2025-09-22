import { HttpAgent } from "@dfinity/agent";
import { useAgent } from "@ic-reactor/react";
import { createActor, canisterId } from "declarations/backend";
import { useMemo } from "react";

export const createAuthenticatedBackend = (agent: HttpAgent) => {
  return createActor(canisterId, {
    agent,
  });
};

export const useBackend = () => {
  const agent = useAgent()

  return useMemo(() => {
    const  authenticatedBackend = createAuthenticatedBackend(agent!);

    return authenticatedBackend;
  }, [agent]);
};