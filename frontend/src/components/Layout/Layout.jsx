import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./../Header/Header";
import Routers from "../../router/Routers";
import { PageRouteSkeleton } from "../../shared/TravelLoader";

const Layout = () => {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(true);
  const isConstructionPage =
    location.pathname === "/under-construction" || location.pathname === "/";

  useEffect(() => {
    setRouteLoading(true);

    const timer = window.setTimeout(() => {
      setRouteLoading(false);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {!isConstructionPage && <Header />}
      {routeLoading ? (
        <PageRouteSkeleton pathname={location.pathname} />
      ) : (
        <Routers />
      )}
      {/* Footer temporarily hidden during development */}
    </>
  );
};

export default Layout;
