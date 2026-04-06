import React, { useEffect, useRef, useContext, useMemo } from "react";
import { Container, Row, Button } from "reactstrap";
import { NavLink, Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import userPlaceholder from "../../assets/images/user.png";
import "./header.css";
import { AuthContext } from "../../context/AuthContext";

const baseNavLinks = [
  { path: "/home", display: "Home" },
  { path: "/about", display: "About" },
  { path: "/tours", display: "Tours" },
];

const Header = () => {
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, dispatch } = useContext(AuthContext);

  const navLinks = useMemo(
    () =>
      user
        ? [...baseNavLinks, { path: "/users", display: "Traveller" }]
        : baseNavLinks,
    [user],
  );

  const firstName = useMemo(() => {
    const source =
      user?.firstName ||
      user?.displayName ||
      user?.username ||
      user?.email ||
      "Traveler";

    return source.split("@")[0].trim().split(" ")[0] || "Traveler";
  }, [user]);

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => {
      if (
        document.body.scrollTop > 80 ||
        document.documentElement.scrollTop > 80
      ) {
        headerRef.current?.classList.add("sticky__header");
      } else {
        headerRef.current?.classList.remove("sticky__header");
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => menuRef.current?.classList.toggle("show__menu");

  return (
    <header className="header" ref={headerRef}>
      <Container>
        <Row>
          <div className="nav__wrapper d-flex align-items-center justify-content-between">
            <Link to="/home" className="logo">
              <img src={Logo} alt="logo" />
              <span className="brand-text">
                Travel Like<span className="brand-text__ap"> AP</span>
              </span>
            </Link>

            <div className="navigation" ref={menuRef} onClick={toggleMenu}>
              <ul className="menu d-flex align-items-center gap-5">
                {navLinks.map((item, index) => (
                  <li className="nav__item" key={index}>
                    <NavLink
                      to={item.path}
                      className={(navClass) =>
                        navClass.isActive ? "active__link" : ""
                      }
                    >
                      {item.display}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav__right d-flex align-items-center gap-4">
              <div className="nav__btns d-flex align-items-center gap-2">
                {user ? (
                  <>
                    <button
                      type="button"
                      className="profile__summary"
                      onClick={() => navigate("/dashboard")}
                    >
                      <img
                        src={user?.photoURL || userPlaceholder}
                        alt={firstName}
                        className="profile__avatar"
                        onError={(event) => {
                          event.currentTarget.src = userPlaceholder;
                        }}
                      />
                      <span className="profile__details">
                        <strong>Hello, {firstName}</strong>
                      </span>
                    </button>
                    <Button
                      className="btn btn-dark logout__btn"
                      onClick={logout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="btn secondary__btn">
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button className="btn primary__btn">
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>

              <span className="mobile__menu" onClick={toggleMenu}>
                <i className="ri-menu-line"></i>
              </span>
            </div>
          </div>
        </Row>
      </Container>
    </header>
  );
};

export default Header;
