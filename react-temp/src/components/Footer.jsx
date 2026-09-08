import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import "./Footer.css";

function Footer() {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();

  const tr = (en, ar) => (language === "ar" ? ar : en);

  const go = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer dir={isArabic ? "rtl" : "ltr"} className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <button type="button" onClick={() => go("/")} className="site-footer__logo">
              Fixer<span>.Co</span>
            </button>

            <p>
              {tr(
                "Trusted home services, right around you.",
                "خدمات منزلية موثوقة، بالقرب منك."
              )}
            </p>

            <div className="site-footer__trust">
              <span>
                <i className="fa-solid fa-shield-halved"></i>
                {tr("Trusted fixers", "فنيون موثوقون")}
              </span>

              <span>
                <i className="fa-solid fa-location-dot"></i>
                {tr("Local help", "مساعدة محلية")}
              </span>
            </div>
          </div>

          <div className="site-footer__columns">
            <div className="site-footer__column">
              <h3>{tr("Explore", "استكشف")}</h3>
              <button type="button" onClick={() => go("/services")}>{tr("Services", "الخدمات")}</button>
              <button type="button" onClick={() => go("/technicians")}>{tr("Find a Fixer", "ابحث عن فني")}</button>
              <button type="button" onClick={() => go("/become-fixer")}>{tr("Become a Fixer", "انضم كفني")}</button>
            </div>

            <div className="site-footer__column">
              <h3>{tr("Company", "الشركة")}</h3>
              <button type="button" onClick={() => go("/about")}>{tr("About Us", "من نحن")}</button>
              <button type="button" onClick={() => go("/contact")}>{tr("Contact Us", "تواصل معنا")}</button>
              <button type="button" onClick={() => go("/privacy")}>{tr("Privacy", "الخصوصية")}</button>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© 2026 Fixer.Co</p>
          <p>{tr("The right fix. Right around you.", "الإصلاح المناسب، بالقرب منك.")}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
