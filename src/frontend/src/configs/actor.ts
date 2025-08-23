import { canisterId, idlFactory, backend } from "declarations/backend";
import { createReactor } from "@ic-reactor/react"

type Actor = typeof backend

export const { useActorStore, useAuth, useQueryCall, getAgent, useAgent } = createReactor<Actor>({
  canisterId,
  idlFactory,
  withLocalEnv: process.env.DFX_NETWORK !== "ic", // Enable local development
  host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943",
  withDevtools: true,
  
})
