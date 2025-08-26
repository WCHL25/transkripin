import Root from "@/layouts/Root";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        lazy: async () => ({
          Component: (await import("@/layouts/Main")).default,
        }),
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("@/pages/Home")).default,
            }),
          },
          {
            path: '/saved',
            lazy: async () => ({
              Component: (await import("@/pages/SavedWork")).default,
            }),
          },
          {
            path: '/saved/:id',
            lazy: async () => ({
              Component: (await import("@/pages/Result")).default,
            }),
          },
          {
            path: '/explore',
            lazy: async () => ({
              Component: (await import("@/pages/Explore")).default,
            }),
          },
          {
            path: "*",
            lazy: async () => ({
              Component: (await import("@/pages/NotFound")).default,
            }),
          },
        ],
      },
    ],
  },
]);
