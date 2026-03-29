import React from "react";
import Header from "./../Header/Header";
import Routers from "../../router/Routers";

const Layout = () => {
  return (
    <>
      <Header />
      <Routers />
      {/* Footer temporarily hidden during development */}
    </>
  );
};

export default Layout;
