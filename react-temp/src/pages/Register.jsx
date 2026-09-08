import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { loginWithGoogle } from "../utils/googleAuth.js";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const { language, isArabic, toggleLanguage } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordRules = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const passwordIsValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  function handleGuestContinue() {
    localStorage.setItem("guestMode", "true");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("redirectAfterLogin");
    navigate("/");
  }

  function finishGoogleLogin() {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.removeItem("guestMode");
    const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");
    localStorage.removeItem("redirectAfterLogin");
    navigate(redirectAfterLogin || "/");
  }

  async function handleGoogleLogin() {
    setMessage("");
    setMessageType("");

    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      setMessage(tr("Google account connected successfully.", "تم ربط حساب Google بنجاح."));
      setMessageType("success");
      setTimeout(finishGoogleLogin, 300);
    } catch (error) {
      console.error("Google register error:", error);
      setMessage(error.message || tr(
        "Unable to continue with Google.",
        "تعذر المتابعة باستخدام Google."
      ));
      setMessageType("error");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    const nameValue = name.trim();
    const usernameValue = username.trim();
    const emailValue = email.trim();
    const phoneValue = phone.trim();

    if (!nameValue || !usernameValue || !emailValue || !password || !confirmPassword) {
      setMessage(tr("Please fill in all required fields.", "يرجى تعبئة جميع الحقول المطلوبة."));
      setMessageType("error");
      return;
    }

    if (usernameValue.length < 3 || usernameValue.length > 20) {
      setMessage(tr("Username must be between 3 and 20 characters.", "يجب أن يكون اسم المستخدم بين 3 و20 حرفًا."));
      setMessageType("error");
      return;
    }

    if (phoneValue && !/^05\d{8}$/.test(phoneValue)) {
      setMessage(tr("Please enter a valid phone number starting with 05.", "يرجى إدخال رقم جوال صحيح يبدأ بـ 05."));
      setMessageType("error");
      return;
    }

    if (!passwordIsValid) {
      setMessage(tr("Please make sure your password meets all requirements.", "يرجى التأكد من أن كلمة المرور تحقق جميع المتطلبات."));
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(tr("Passwords do not match.", "كلمتا المرور غير متطابقتين."));
      setMessageType("error");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: nameValue,
          username: usernameValue,
          email: emailValue,
          phone: phoneValue,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to create account.");
      }

      setMessage(tr("Account created successfully!", "تم إنشاء الحساب بنجاح!"));
      setMessageType("success");
      setTimeout(() => navigate("/login"), 600);
    } catch (error) {
      console.error("Register error:", error);
      setMessage(error.message || tr("Unable to create account.", "تعذر إنشاء الحساب."));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page" dir={isArabic ? "rtl" : "ltr"}>
      <div className="auth-background" aria-hidden="true" />

      <div className="auth-topbar" dir="ltr">
        <Link to="/" className="auth-brand">Fixer<span>.Co</span></Link>
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
            {tr("Create your Fixer.Co ", "أنشئ حسابك في Fixer.Co ")}
            <span>{tr("in minutes.", "خلال دقائق.")}</span>
          </h1>
          <p>
            {tr(
              "Request trusted home services, keep your details together, and follow every job from one place.",
              "اطلب خدمات منزلية موثوقة، واحتفظ بتفاصيلك، وتابع كل خدمة من مكان واحد."
            )}
          </p>
          <div className="auth-points">
            <AuthPoint icon="fa-solid fa-user-check" text={tr("One account", "حساب واحد")} />
            <AuthPoint icon="fa-solid fa-location-dot" text={tr("Track requests", "تتبع الطلبات")} />
            <AuthPoint icon="fa-solid fa-shield-halved" text={tr("Secure access", "دخول آمن")} />
          </div>
        </section>

        <div className="auth-card-wrap">
          <section className="auth-card">
            <p className="auth-kicker">{tr("GET STARTED", "ابدأ الآن")}</p>
            <h2>{tr("Create your account", "إنشاء حساب")}</h2>
            <p className="auth-subtitle">
              {tr("A few details and you're ready to use Fixer.Co.", "بضع معلومات فقط وتصبح جاهزًا لاستخدام Fixer.Co.")}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-grid-two">
                <AuthInput icon="fa-regular fa-user">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Full Name", "الاسم الكامل")} autoComplete="name" />
                </AuthInput>
                <AuthInput icon="fa-solid fa-at">
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={tr("Username", "اسم المستخدم")} autoComplete="username" minLength={3} maxLength={20} />
                </AuthInput>
              </div>

              <AuthInput icon="fa-regular fa-envelope">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tr("Email Address", "البريد الإلكتروني")} autoComplete="email" />
              </AuthInput>

              <AuthInput icon="fa-solid fa-phone">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" autoComplete="tel" maxLength={10} />
              </AuthInput>

              <AuthInput icon="fa-solid fa-lock">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tr("Create a strong password", "أنشئ كلمة مرور قوية")} autoComplete="new-password" />
                <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)}>
                  <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </AuthInput>

              <div className="auth-password-panel">
                <p>{tr("Password must contain:", "يجب أن تحتوي كلمة المرور على:")}</p>
                <div className="auth-rule-grid">
                  <PasswordRule valid={passwordRules.length} text={tr("8+ characters", "8 أحرف أو أكثر")} />
                  <PasswordRule valid={passwordRules.uppercase} text={tr("Uppercase letter", "حرف كبير")} />
                  <PasswordRule valid={passwordRules.lowercase} text={tr("Lowercase letter", "حرف صغير")} />
                  <PasswordRule valid={passwordRules.number} text={tr("One number", "رقم واحد")} />
                  <PasswordRule valid={passwordRules.special} text={tr("Special character", "رمز خاص")} />
                </div>
              </div>

              <AuthInput icon="fa-solid fa-lock">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={tr("Confirm Password", "تأكيد كلمة المرور")} autoComplete="new-password" />
                <button type="button" className="auth-eye" onClick={() => setShowConfirmPassword((v) => !v)}>
                  <i className={showConfirmPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </AuthInput>

              {confirmPassword && (
                <p className={`auth-match ${passwordsMatch ? "good" : "bad"}`}>
                  <i className={passwordsMatch ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
                  {passwordsMatch ? tr("Passwords match", "كلمتا المرور متطابقتان") : tr("Passwords do not match", "كلمتا المرور غير متطابقتين")}
                </p>
              )}

              <button type="submit" className="auth-primary" disabled={isSubmitting}>
                {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin"></i>{tr("Creating account...", "جارٍ إنشاء الحساب...")}</> : tr("Create Account", "إنشاء الحساب")}
              </button>
            </form>

            <div className="auth-divider"><span></span><span>{tr("OR", "أو")}</span><span></span></div>

            <button type="button" className="auth-google" onClick={handleGoogleLogin} disabled={googleLoading}>
              {googleLoading ? <><i className="fa-solid fa-spinner fa-spin"></i>{tr("Connecting...", "جارٍ الاتصال...")}</> : <><GoogleIcon />{tr("Continue with Google", "المتابعة باستخدام Google")}</>}
            </button>

            {message && <div className={`auth-message ${messageType}`}>{message}</div>}

            <p className="auth-switch">
              {tr("Already have an account? ", "لديك حساب بالفعل؟ ")}
              <Link to="/login">{tr("Log in", "تسجيل الدخول")}</Link>
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

function PasswordRule({ valid, text }) {
  return <div className={`auth-rule ${valid ? "valid" : ""}`}><i className={valid ? "fa-solid fa-circle-check" : "fa-solid fa-circle"}></i><span>{text}</span></div>;
}

function AuthPoint({ icon, text }) {
  return <div className="auth-point"><i className={icon}></i><span>{text}</span></div>;
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

export default Register;
