import React from "react";
import Header from "./../Header/Header";
import Routers from "../../router/Routers";
import Footer from "./../Footer/Footer";

const Layout = () => {
  return (
    <>
      <Header />
      <Routers />
      {/* Footer temporarily hidden during development */}
      {/* <Footer /> */}
    </>
  );
};

export default Layout;
