import { create } from "zustand"

interface SnackbarState {
  snackbar: { message: string } | null
  setSnackbar: (snackbar: { message: string } | null) => void
}

export const useSnackbarStore = create<SnackbarState>((set) => ({
  snackbar: null,
  setSnackbar: (snackbar) => set({ snackbar }),
}))