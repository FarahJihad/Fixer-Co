import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useLanguage,
} from "../context/LanguageContext.jsx";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    language,
    setLanguage,
  } = useLanguage();

  const authAreaRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const languageMenuRef = useRef(null);

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [languageMenuOpen, setLanguageMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  /* =========================
     LOAD CURRENT USER
  ========================= */

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch(
          "/api/me",
          {
            method: "GET",
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          setUser(null);
          localStorage.removeItem("isLoggedIn");
          return;
        }

        const data =
          await response.json();

        if (
          !data.success ||
          !data.authenticated ||
          !data.user
        ) {
          setUser(null);
          localStorage.removeItem("isLoggedIn");
          return;
        }

        setUser(data.user);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.removeItem("guestMode");
      } catch (error) {
        console.error(
          "Auth state error:",
          error
        );

        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadCurrentUser();
  }, [location.pathname]);

  /* =========================
     SCROLL EFFECT
  ========================= */

  useEffect(() => {
    function handleScroll() {
      setScrolled(
        window.scrollY > 35
      );
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  /* =========================
     CLOSE MENUS ON ROUTE CHANGE
  ========================= */

  useEffect(() => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    setLanguageMenuOpen(false);
  }, [location.pathname]);

  /* =========================
     CLOSE DROPDOWNS
  ========================= */

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        authAreaRef.current &&
        !authAreaRef.current.contains(
          event.target
        )
      ) {
        setMenuOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(
          event.target
        )
      ) {
        setMobileMenuOpen(false);
      }

      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(
          event.target
        )
      ) {
        setLanguageMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================
     CHANGE LANGUAGE
  ========================= */

  function changeLanguage(newLanguage) {
    setLanguage(newLanguage);
    setLanguageMenuOpen(false);
  }

  /* =========================
     LOG OUT
  ========================= */

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const response = await fetch(
        "/api/logout",
        {
          method: "POST",
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Logout failed"
        );
      }

      setUser(null);
      setMenuOpen(false);
      setMobileMenuOpen(false);

      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("guestMode");
      localStorage.removeItem("redirectAfterLogin");

      navigate("/");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      setLoggingOut(false);
    }
  }

  /* =========================
     TRACK SERVICE
  ========================= */

  async function handleTrackService() {
    setMenuOpen(false);
    setMobileMenuOpen(false);

    try {
      const response = await fetch(
        "/api/my-requests",
        {
          credentials: "same-origin",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Could not load your requests."
        );
      }

      if (
        !data.requests ||
        data.requests.length === 0
      ) {
        navigate("/my-requests");
        return;
      }

      const latestRequest =
        data.requests[0];

      navigate(
        `/track?request=${latestRequest.id}`
      );
    } catch (error) {
      console.error(
        "Track Service navigation error:",
        error
      );

      navigate("/my-requests");
    }
  }

  const firstName = user
    ? (
        user.name ||
        user.username ||
        "Account"
      )
        .trim()
        .split(/\s+/)[0]
    : "";

  return (
    <header
      dir="ltr"
      className={`
        sticky
        top-0
        z-50
        w-full
        border-b
        transition-all
        duration-500
        ${
          scrolled
            ? `
              border-[#dde7e3]
              bg-white/95
              shadow-[0_8px_30px_rgba(23,59,87,0.08)]
              backdrop-blur-xl
            `
            : `
              border-[#d7e3de]
              bg-[#f0f5f2]
              shadow-[0_2px_8px_rgba(23,59,87,0.025)]
            `
        }
      `}
    >
      <div
        className={`
          mx-auto
          flex
          w-full
          items-center
          justify-between
          px-6
          transition-all
          duration-500
          sm:px-8
          lg:px-12
          xl:px-16
          ${
            scrolled
              ? "h-[68px]"
              : "h-[88px]"
          }
        `}
      >
        {/* =========================
            LOGO
        ========================= */}

        <Link
          to="/"
          aria-label="Fixer.Co Home"
          className="
            group
            flex
            shrink-0
            items-center
          "
        >
          <span
            className={`
              leading-none
              font-bold
              tracking-[-1.2px]
              text-[#173b57]
              transition-all
              duration-500
              group-hover:opacity-90
              ${
                scrolled
                  ? "text-[25px]"
                  : "text-[28px]"
              }
            `}
          >
            Fixer
            <span className="text-[#4faf8f]">
              .Co
            </span>
          </span>
        </Link>

        {/* =========================
            DESKTOP NAVIGATION
        ========================= */}

        <nav
          className="
            absolute
            left-[41%]
            hidden
            -translate-x-1/2
            items-center
            gap-10
            lg:flex
            xl:left-[42%]
            xl:gap-14
          "
        >
          <NavItem to="/">
            {language === "ar"
              ? "الرئيسية"
              : "Home"}
          </NavItem>

          <NavItem to="/services">
            {language === "ar"
              ? "الخدمات"
              : "Services"}
          </NavItem>

          <NavItem to="/technicians">
            {language === "ar"
              ? "ابحث عن فني"
              : "Find a Fixer"}
          </NavItem>

          <NavItem to="/about">
            {language === "ar"
              ? "من نحن"
              : "About Us"}
          </NavItem>

          <NavItem to="/contact">
            {language === "ar"
              ? "تواصل معنا"
              : "Contact Us"}
          </NavItem>
        </nav>

        {/* =========================
            RIGHT SIDE
        ========================= */}

        <div className="flex items-center gap-3">

          {/* =========================
              LANGUAGE DROPDOWN
          ========================= */}

          <div
            ref={languageMenuRef}
            className="relative hidden md:block"
            dir="ltr"
          >
            <button
              type="button"
              onClick={() =>
                setLanguageMenuOpen(
                  (current) => !current
                )
              }
              className="
                flex
                h-[42px]
                items-center
                gap-2
                rounded-lg
                px-3
                text-[13px]
                font-bold
                text-[#52646d]
                transition
                hover:bg-[#e5efeb]
                hover:text-[#173b57]
              "
            >
              <i className="fa-solid fa-globe text-[#4faf8f]"></i>

              <span>
                {language === "ar"
                  ? "العربية"
                  : "English"}
              </span>

              <i
                className={`fa-solid fa-chevron-down text-[9px] transition-transform duration-300 ${
                  languageMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              ></i>
            </button>

            {languageMenuOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  w-[160px]
                  rounded-xl
                  border
                  border-[#e2e9e6]
                  bg-white
                  p-2
                  shadow-[0_16px_40px_rgba(16,45,67,0.13)]
                "
              >
                <LanguageOption
                  active={
                    language === "en"
                  }
                  onClick={() =>
                    changeLanguage("en")
                  }
                >
                  English
                </LanguageOption>

                <LanguageOption
                  active={
                    language === "ar"
                  }
                  onClick={() =>
                    changeLanguage("ar")
                  }
                >
                  العربية
                </LanguageOption>
              </div>
            )}
          </div>

          {/* =========================
              BECOME A FIXER
          ========================= */}

          <Link
            to="/become-fixer"
            className="
              hidden
              items-center
              gap-2
              rounded-lg
              border
              border-[#d2e1db]
              bg-white/80
              px-5
              py-3
              text-[13px]
              font-bold
              text-[#173b57]
              transition
              duration-300
              hover:-translate-y-0.5
              hover:border-[#4faf8f]
              hover:bg-white
              xl:flex
            "
          >
            <i className="fa-solid fa-screwdriver-wrench text-[#4faf8f]"></i>

            {language === "ar"
              ? "انضم كفني"
              : "Become a Fixer"}
          </Link>

          {/* =========================
              AUTH LOADING
          ========================= */}

          {authLoading ? (
            <div
              className="
                grid
                h-[44px]
                w-[48px]
                place-items-center
                rounded-lg
                bg-[#e7efec]
                text-[#7b888f]
              "
            >
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
          ) : user ? (

            /* =========================
               LOGGED IN
            ========================= */

            <div
              ref={authAreaRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setMenuOpen(
                    (current) =>
                      !current
                  )
                }
                aria-expanded={menuOpen}
                className="
                  flex
                  h-[46px]
                  items-center
                  gap-2.5
                  rounded-lg
                  bg-[#173b57]
                  px-4
                  text-[13px]
                  font-bold
                  text-white
                  transition
                  duration-300
                  hover:bg-[#102d43]
                "
              >
                <span
                  className="
                    grid
                    h-8
                    w-8
                    place-items-center
                    rounded-md
                    bg-white/10
                  "
                >
                  <i className="fa-regular fa-user"></i>
                </span>

                <span className="hidden sm:block">
                  {firstName}
                </span>

                <i
                  className={`fa-solid fa-chevron-down hidden text-[9px] transition-transform duration-300 sm:block ${
                    menuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                ></i>
              </button>

              {menuOpen && (
                <div
                  className="
                    absolute
                    right-0
                    top-[calc(100%+12px)]
                    w-[230px]
                    overflow-hidden
                    rounded-xl
                    border
                    border-[#e2e9e6]
                    bg-white
                    p-2
                    shadow-[0_20px_50px_rgba(16,45,67,0.16)]
                  "
                >
                  <div className="px-3 pb-3 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-[#98a5aa]">
                      {language === "ar"
                        ? "تم تسجيل الدخول باسم"
                        : "Signed in as"}
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-[#173b57]">
                      {user.name ||
                        user.username}
                    </p>
                  </div>

                  <div className="border-t border-[#edf1ef] pt-1">
                    <DropdownLink
                      to="/my-requests"
                      icon="fa-regular fa-clipboard"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                    >
                      {language === "ar"
                        ? "طلباتي"
                        : "My Requests"}
                    </DropdownLink>

                    <button
                      type="button"
                      onClick={
                        handleTrackService
                      }
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-lg
                        px-3
                        py-3
                        text-left
                        text-sm
                        font-semibold
                        text-[#52646d]
                        transition
                        hover:bg-[#f2f7f5]
                        hover:text-[#173b57]
                      "
                    >
                      <i className="fa-solid fa-location-dot w-4 text-center text-[#4faf8f]"></i>

                      {language === "ar"
                        ? "تتبع الخدمة"
                        : "Track Service"}
                    </button>
                  </div>

                  <div className="my-1 border-t border-[#edf1ef]"></div>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    disabled={
                      loggingOut
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-3
                      text-left
                      text-sm
                      font-semibold
                      text-red-600
                      transition
                      hover:bg-red-50
                      disabled:opacity-60
                    "
                  >
                    {loggingOut ? (
                      <i className="fa-solid fa-spinner fa-spin w-4 text-center"></i>
                    ) : (
                      <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>
                    )}

                    {loggingOut
                      ? language === "ar"
                        ? "جاري تسجيل الخروج..."
                        : "Logging Out..."
                      : language === "ar"
                      ? "تسجيل الخروج"
                      : "Log Out"}
                  </button>
                </div>
              )}
            </div>

          ) : (

            /* =========================
               LOGGED OUT
            ========================= */

            <Link
              to="/login"
              className="
                hidden
                h-[46px]
                items-center
                gap-2
                rounded-lg
                bg-[#173b57]
                px-5
                text-[13px]
                font-bold
                text-white
                transition
                duration-300
                hover:bg-[#102d43]
                sm:flex
              "
            >
              {language === "ar"
                ? "تسجيل الدخول"
                : "Log In"}
            </Link>
          )}

          {/* =========================
              MOBILE MENU BUTTON
          ========================= */}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (current) =>
                  !current
              )
            }
            aria-label="Open navigation menu"
            aria-expanded={
              mobileMenuOpen
            }
            className="
              grid
              h-[44px]
              w-[44px]
              place-items-center
              rounded-lg
              border
              border-[#d8e4df]
              bg-white/80
              text-[#173b57]
              transition
              hover:bg-white
              lg:hidden
            "
          >
            <i
              className={`fa-solid ${
                mobileMenuOpen
                  ? "fa-xmark"
                  : "fa-bars"
              }`}
            ></i>
          </button>
        </div>
      </div>

      {/* =========================
          MOBILE MENU
      ========================= */}

      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          dir="ltr"
          className="
            border-t
            border-[#dfe8e4]
            bg-white
            px-6
            pb-6
            pt-4
            shadow-lg
            lg:hidden
          "
        >
          <nav className="flex flex-col gap-1">
            <MobileNavItem to="/">
              {language === "ar"
                ? "الرئيسية"
                : "Home"}
            </MobileNavItem>

            <MobileNavItem to="/services">
              {language === "ar"
                ? "الخدمات"
                : "Services"}
            </MobileNavItem>

            <MobileNavItem to="/technicians">
              {language === "ar"
                ? "ابحث عن فني"
                : "Find a Fixer"}
            </MobileNavItem>

            <MobileNavItem to="/about">
              {language === "ar"
                ? "من نحن"
                : "About Us"}
            </MobileNavItem>

            <MobileNavItem to="/contact">
              {language === "ar"
                ? "تواصل معنا"
                : "Contact Us"}
            </MobileNavItem>
          </nav>

          <div className="my-4 border-t border-[#edf1ef]"></div>

          {/* MOBILE LANGUAGE OPTIONS */}

          <div className="mb-3 rounded-lg bg-[#f5f8f7] p-2">
            <button
              type="button"
              onClick={() =>
                changeLanguage("en")
              }
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-lg
                px-3
                py-3
                text-sm
                font-semibold
                text-[#173b57]
                transition
                hover:bg-white
              "
            >
              English

              {language === "en" && (
                <i className="fa-solid fa-check text-[#4faf8f]"></i>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                changeLanguage("ar")
              }
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-lg
                px-3
                py-3
                text-sm
                font-semibold
                text-[#173b57]
                transition
                hover:bg-white
              "
            >
              العربية

              {language === "ar" && (
                <i className="fa-solid fa-check text-[#4faf8f]"></i>
              )}
            </button>
          </div>

          <Link
            to="/become-fixer"
            className="
              flex
              items-center
              gap-3
              rounded-lg
              bg-[#edf7f3]
              px-4
              py-3
              text-sm
              font-bold
              text-[#173b57]
            "
          >
            <i className="fa-solid fa-screwdriver-wrench text-[#4faf8f]"></i>

            {language === "ar"
              ? "انضم كفني"
              : "Become a Fixer"}
          </Link>

          {!authLoading &&
            !user && (
              <Link
                to="/login"
                className="
                  mt-2
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-[#173b57]
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-white
                "
              >
                {language === "ar"
                  ? "تسجيل الدخول"
                  : "Log In"}
              </Link>
            )}
        </div>
      )}
    </header>
  );
}

/* =========================
   DESKTOP NAV ITEM
========================= */

function NavItem({
  to,
  children,
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `
          group
          relative
          py-3
          text-[16px]
          font-semibold
          whitespace-nowrap
          transition
          duration-300
          ${
            isActive
              ? "text-[#173b57]"
              : "text-[#66757f] hover:text-[#173b57]"
          }
        `
      }
    >
      {({ isActive }) => (
        <>
          {children}

          <span
            className={`
              absolute
              bottom-[4px]
              left-1/2
              h-[2px]
              -translate-x-1/2
              rounded-full
              bg-[#4faf8f]
              transition-all
              duration-300
              ${
                isActive
                  ? "w-full opacity-100"
                  : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
              }
            `}
          ></span>
        </>
      )}
    </NavLink>
  );
}

/* =========================
   MOBILE NAV ITEM
========================= */

function MobileNavItem({
  to,
  children,
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `
          flex
          items-center
          rounded-lg
          px-4
          py-3
          text-sm
          font-semibold
          transition
          ${
            isActive
              ? `
                bg-[#edf7f3]
                text-[#173b57]
              `
              : `
                text-[#66757f]
                hover:bg-[#f5f8f7]
                hover:text-[#173b57]
              `
          }
        `
      }
    >
      {children}
    </NavLink>
  );
}

/* =========================
   DROPDOWN LINK
========================= */

function DropdownLink({
  to,
  icon,
  onClick,
  children,
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="
        flex
        items-center
        gap-3
        rounded-lg
        px-3
        py-3
        text-sm
        font-semibold
        text-[#52646d]
        transition
        hover:bg-[#f2f7f5]
        hover:text-[#173b57]
      "
    >
      <i
        className={`${icon} w-4 text-center text-[#4faf8f]`}
      ></i>

      {children}
    </Link>
  );
}

/* =========================
   LANGUAGE OPTION
========================= */

function LanguageOption({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        w-full
        items-center
        justify-between
        rounded-lg
        px-3
        py-2.5
        text-sm
        font-semibold
        transition
        ${
          active
            ? `
              bg-[#edf7f3]
              text-[#173b57]
            `
            : `
              text-[#66757f]
              hover:bg-[#f5f8f7]
              hover:text-[#173b57]
            `
        }
      `}
    >
      <span>
        {children}
      </span>

      {active && (
        <i className="fa-solid fa-check text-[11px] text-[#4faf8f]"></i>
      )}
    </button>
  );
}

export default Navbar;