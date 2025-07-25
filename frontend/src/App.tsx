import { Suspense, useMemo } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Route as RouteType, routes } from "@/configs/routes";
import NotFound from "@/pages/NotFound";

function App() {
   const renderRoutes = (routes: RouteType[]) => {
      return routes.map((route) => {
         if (route.children && route.children.length > 0) {
            return (
               <Route key={route.key} element={<route.component />}>
                  {renderRoutes(route.children)}
               </Route>
            );
         } else {
            return (
               <Route
                  key={route.path}
                  path={route.path}
                  element={<route.component />}
               />
            );
         }
      });
   };

   const renderedRoutes = useMemo(() => renderRoutes(routes), []);

   return (
      <BrowserRouter>
         <Suspense fallback={<>Loading...</>}>
            <Routes>
               {renderedRoutes}

               <Route path="*" element={<NotFound />} />
            </Routes>
         </Suspense>
      </BrowserRouter>
   );
}

export default App;
