import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { loginWithGoogle } from "../utils/googleAuth.js";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { language, isArabic, toggleLanguage } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function finishLogin() {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.removeItem("guestMode");

    const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");
    localStorage.removeItem("redirectAfterLogin");

    navigate(redirectAfterLogin || "/");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    const usernameValue = username.trim();

    if (!usernameValue || !password) {
      setMessage(tr(
        "Please enter your username and password.",
        "يرجى إدخال اسم المستخدم وكلمة المرور."
      ));
      setMessageType("error");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: usernameValue, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to log in.");
      }

      setMessage(tr("Logged in successfully.", "تم تسجيل الدخول بنجاح."));
      setMessageType("success");
      setTimeout(finishLogin, 300);
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message || tr("Unable to log in.", "تعذر تسجيل الدخول."));
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    setMessage(tr(
      "Password recovery is not available yet.",
      "استعادة كلمة المرور غير متاحة حاليًا."
    ));
    setMessageType("info");
  }

  async function handleGoogleLogin() {
    setMessage("");
    setMessageType("");

    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      setMessage(tr("Google login successful.", "تم تسجيل الدخول عبر Google بنجاح."));
      setMessageType("success");
      setTimeout(finishLogin, 300);
    } catch (error) {
      console.error("Google login error:", error);
      setMessage(error.message || tr(
        "Unable to continue with Google.",
        "تعذر المتابعة باستخدام Google."
      ));
      setMessageType("error");
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGuestContinue() {
    localStorage.setItem("guestMode", "true");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("redirectAfterLogin");
    navigate("/");
  }

  return (
    <main className="auth-page" dir={isArabic ? "rtl" : "ltr"}>
      <div className="auth-background" aria-hidden="true" />

      <div className="auth-topbar" dir="ltr">
        <Link to="/" className="auth-brand">
          Fixer<span>.Co</span>
        </Link>

        <div className="auth-top-actions">
          <button type="button" className="auth-language" onClick={toggleLanguage}>
            {language === "ar" ? "EN" : "AR"}
          </button>

          <button type="button" className="auth-guest" onClick={handleGuestContinue}>
            <span>{tr("Continue as Guest", "المتابعة كضيف")}</span>
          </button>
        </div>
      </div>

      <div className="auth-shell">
        <section className="auth-story">
          <div className="auth-story-line" />
          <h1>
            {tr("Find the right fixer ", "اعثر على الفني المناسب ")}
            <span>{tr("today.", "اليوم.")}</span>
          </h1>
          <div className="auth-points auth-points-classic">
            <AuthPoint
              icon="fa-solid fa-shield-halved"
              title={tr("Trusted", "موثوقون")}
              text={tr("Professionals", "محترفون")}
            />
            <AuthStoryDivider />
            <AuthPoint
              icon="fa-solid fa-bolt"
              title={tr("Fast & Easy", "سريع وسهل")}
              text={tr("Booking", "الحجز")}
            />
            <AuthStoryDivider />
            <AuthPoint
              icon="fa-solid fa-house"
              title={tr("A More", "منزل أكثر")}
              text={tr("Comfortable Home", "راحة")}
            />
          </div>
        </section>

        <div className="auth-card-wrap">
          <section className="auth-card">
            <p className="auth-kicker">{tr("WELCOME BACK", "مرحبًا بعودتك")}</p>
            <h2>{tr("Log in to Fixer.Co", "تسجيل الدخول إلى Fixer.Co")}</h2>
            <p className="auth-subtitle">
              {tr(
                "Continue to your requests, tracking, and saved service details.",
                "تابع طلباتك وتتبع الخدمات وبياناتك المحفوظة."
              )}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <AuthInput icon="fa-regular fa-user">
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={tr("Username", "اسم المستخدم")}
                  autoComplete="username"
                />
              </AuthInput>

              <AuthInput icon="fa-solid fa-lock">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={tr("Password", "كلمة المرور")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </AuthInput>

              <div className="auth-inline-row">
                <button type="button" className="auth-text-button" onClick={handleForgotPassword}>
                  {tr("Forgot password?", "نسيت كلمة المرور؟")}
                </button>
              </div>

              <button type="submit" className="auth-primary" disabled={isLoading}>
                {isLoading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i>{tr("Logging in...", "جارٍ تسجيل الدخول...")}</>
                ) : tr("Log In", "تسجيل الدخول")}
              </button>
            </form>

            <div className="auth-divider">
              <span></span><span>{tr("OR", "أو")}</span><span></span>
            </div>

            <button type="button" className="auth-google" onClick={handleGoogleLogin} disabled={googleLoading}>
              {googleLoading ? (
                <><i className="fa-solid fa-spinner fa-spin"></i>{tr("Connecting...", "جارٍ الاتصال...")}</>
              ) : (
                <><GoogleIcon />{tr("Continue with Google", "المتابعة باستخدام Google")}</>
              )}
            </button>

            {message && <div className={`auth-message ${messageType}`}>{message}</div>}

            <p className="auth-switch">
              {tr("New to Fixer.Co? ", "جديد على Fixer.Co؟ ")}
              <Link to="/register">{tr("Create an account", "إنشاء حساب")}</Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function AuthInput({ icon, children }) {
  return <div className="auth-input"><i className={icon}></i>{children}</div>;
}

function AuthPoint({ icon, title, text }) {
  return (
    <div className="auth-point auth-point-classic">
      <i className={icon}></i>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function AuthStoryDivider() {
  return <span className="auth-story-divider" aria-hidden="true" />;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.35Z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.4 13.91A6 6 0 0 1 6.08 12c0-.66.11-1.31.32-1.91V7.5H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.5l3.34-2.59Z"/>
      <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.49l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.59c.79-2.36 3-4.12 5.6-4.12Z"/>
    </svg>
  );
}

export default Login;
