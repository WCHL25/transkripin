import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useEffect } from "react";
import { useNavigation } from "react-router-dom";

const useProgressBarHandler = () => {
   const navigation = useNavigation();

   useEffect(() => {
      if (navigation.state === "loading") {
         NProgress.start();
      } else {
         NProgress.done();
      }
   }, [navigation.state]);
};

export default useProgressBarHandler;
