import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();

  const tr = (en, ar) =>
    language === "ar" ? ar : en;

  return (
    <footer
      dir={isArabic ? "rtl" : "ltr"}
      className="site-footer"
    >
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="site-footer__logo"
          >
            Fixer<span>.Co</span>
          </button>

          <p>
            {tr(
              "The right fix. Right around you.",
              "الإصلاح المناسب، بالقرب منك."
            )}
          </p>
        </div>

        <nav
          className="site-footer__links"
          aria-label={tr(
            "Footer navigation",
            "روابط تذييل الصفحة"
          )}
        >
          <button
            type="button"
            onClick={() => navigate("/services")}
          >
            {tr("Services", "الخدمات")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/technicians")}
          >
            {tr("Find a Fixer", "ابحث عن فني")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/about")}
          >
            {tr("About Us", "من نحن")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/contact")}
          >
            {tr("Contact Us", "تواصل معنا")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/become-fixer")}
          >
            {tr("Become a Fixer", "انضم كفني")}
          </button>
        </nav>

        <p className="site-footer__copy">
          © 2026 Fixer.Co
        </p>
      </div>
    </footer>
  );
}

export default Footer;
