import { lazy } from "react";

export interface Route {
  component: React.LazyExoticComponent<() => JSX.Element> | (() => JSX.Element);
  path?: string;
  key?: string;
  children?: Route[];
}

export const publicRoutes: Route[] = [
  {
    path: "/",
    component: lazy(() => import("../pages/Home")),
  },
  // {
  //   path: "/login",
  //   component: lazy(() => import("../pages/Login")),
  // },
];

export const protectedRoutes: Route[] = [];

export const routes: Route[] = [...publicRoutes, ...protectedRoutes];
