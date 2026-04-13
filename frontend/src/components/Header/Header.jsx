import React, { useEffect, useRef, useContext, useMemo } from "react";
import { Container, Row, Button } from "reactstrap";
import { NavLink, Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import userPlaceholder from "../../assets/images/user.png";
import "./header.css";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../config/featureFlags";

const baseNavLinks = [
  { path: "/", display: "Home" },
  { path: "/about", display: "About" },
  { path: "/tours", display: "Tours" },
  { path: "/contact-us", display: "Contact Us" }
];

const Header = () => {
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, dispatch, userRole } = useContext(AuthContext);
  const isAdminUser = String(userRole || "").toLowerCase() === "admin";
  const canOpenAdminPortal =
    FEATURE_FLAGS.adminTourPortal && Boolean(user) && isAdminUser;

  const navLinks = useMemo(() => {
    const links = user
      ? [...baseNavLinks, { path: "/dashboard", display: "Traveller" }]
      : [...baseNavLinks];

    if (canOpenAdminPortal) {
      links.push({
        path: "/admin",
        display: "Admin",
      });
    }

    return links;
  }, [canOpenAdminPortal, user]);

  const firstName = useMemo(() => {
    const source =
      user?.firstName ||
      user?.displayName ||
      user?.username ||
      user?.email ||
      "Traveler";

    return source.split("@")[0].trim().split(" ")[0] || "Traveler";
  }, [user]);

  const profileAvatarSrc = useMemo(() => {
    const candidates = [
      user?.uploadedProfilePhoto,
      user?.profileUrl,
      user?.imageUrl,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return (
      candidates.find(
        (value) =>
          value.startsWith("data:") ||
          /firebasestorage\.googleapis\.com|storage\.googleapis\.com/i.test(
            value,
          ),
      ) || userPlaceholder
    );
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
            <Link to="/" className="logo">
              <img src={Logo} alt="Travel Like AP logo" />
              <span className="brand-text">
                <span className="brand-text__main">TRAVEL LIKE</span>
                <span className="brand-text__ap">AP</span>
              </span>
            </Link>

            <div className="navigation" ref={menuRef} onClick={toggleMenu}>
              <ul className="menu d-flex align-items-center gap-5">
                {navLinks.map((item, index) => (
                  <li
                    className={`nav__item ${item.path === "/dashboard" ? "nav__item--traveller" : ""}`}
                    key={index}
                  >
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
                        src={profileAvatarSrc}
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
