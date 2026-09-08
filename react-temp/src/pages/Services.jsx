import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import ScrollReveal from "../components/ScrollReveal.jsx";
import "./Services.css";

function Services() {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();

  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/services");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            tr("Could not load services.", "تعذر تحميل الخدمات.")
          );
        }

        const serviceList = Array.isArray(data)
          ? data
          : data.services || [];

        setServices(serviceList);
      } catch (error) {
        console.error("Services error:", error);

        setError(
          tr(
            "Services are temporarily unavailable. Please try again later.",
            "الخدمات غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى لاحقًا."
          )
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadServices();
  }, [language]);

  function handleServiceCardMouseMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();

    card.style.setProperty(
      "--mouse-x",
      `${event.clientX - rect.left}px`
    );

    card.style.setProperty(
      "--mouse-y",
      `${event.clientY - rect.top}px`
    );
  }

  function handleServiceCardMouseLeave(event) {
    event.currentTarget.style.removeProperty("--mouse-x");
    event.currentTarget.style.removeProperty("--mouse-y");
  }

  function openService(serviceId) {
    navigate(`/technicians?service=${serviceId}`);
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="services-exact-page"
    >
      <ScrollReveal />

      {/* =========================
          PAGE HEADER
      ========================== */}
      <section className="old-page-hero services-page-enter">
        <div className="old-container">
          <p className="old-section-label">
            {tr("OUR SERVICES", "خدماتنا")}
          </p>

          <h1>
            {tr(
              "Home services made simple",
              "خدمات منزلية بطريقة أبسط"
            )}
          </h1>

          <p className="old-page-hero-description">
            {tr(
              "Choose the service you need and find trusted professionals ready to help.",
              "اختر الخدمة التي تحتاجها واعثر على فنيين موثوقين جاهزين للمساعدة."
            )}
          </p>
        </div>
      </section>

      {/* =========================
          SERVICES
      ========================== */}
      <section className="old-services-page-section services-page-enter services-page-enter-delay">
        <div className="old-container">

          <div
            className="old-section-heading old-reveal"
            data-reveal="up"
          >
            <div>
              <p className="old-section-label">
                {tr("FIND WHAT YOU NEED", "اعثر على ما تحتاجه")}
              </p>

              <h2>
                {tr("Explore our services", "استكشف خدماتنا")}
              </h2>
            </div>

            <p>
              {tr(
                "Select a service to view available technicians and compare your options.",
                "اختر خدمة لعرض الفنيين المتاحين ومقارنة خياراتك."
              )}
            </p>
          </div>

          {isLoading && (
            <div className="old-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>
                {tr("Loading services...", "جارٍ تحميل الخدمات...")}
              </span>
            </div>
          )}

          {!isLoading && error && (
            <div className="old-error-box">
              <i className="fa-solid fa-circle-exclamation"></i>
              <div>
                <strong>
                  {tr("Could not load services", "تعذر تحميل الخدمات")}
                </strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && services.length > 0 && (
            <div className="old-services-grid">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => openService(service.id)}
                  onMouseMove={handleServiceCardMouseMove}
                  onMouseLeave={handleServiceCardMouseLeave}
                  className="old-service-card old-motion-item"
                  data-reveal="up"
                  style={{
                    "--motion-delay": `${index * 80}ms`,
                  }}
                >
                  <span
                    className="old-service-hover-glow"
                    aria-hidden="true"
                  ></span>

                  <div className="old-service-icon">
                    <i className={getServiceIcon(service.id)}></i>
                  </div>

                  <div className="old-service-copy">
                    <h3>
                      {translateServiceName(service.name, language)}
                    </h3>

                    <p>
                      {getOldServiceDescription(service.name, language)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && !error && services.length === 0 && (
            <div className="old-empty-box">
              <i className="fa-solid fa-screwdriver-wrench"></i>
              <strong>
                {tr("No services available", "لا توجد خدمات متاحة")}
              </strong>
              <p>
                {tr(
                  "Please check again later.",
                  "يرجى التحقق مرة أخرى لاحقًا."
                )}
              </p>
            </div>
          )}

        </div>
      </section>

      {/* =========================
          HELP SECTION
      ========================== */}
      <section className="old-service-help">
        <div
          className="old-container old-service-help-content old-reveal"
          data-reveal="up"
        >
          <div>
            <p className="old-section-label">
              {tr(
                "NOT SURE WHAT YOU NEED?",
                "لست متأكدًا مما تحتاجه؟"
              )}
            </p>

            <h2>
              {tr(
                "Describe the problem instead.",
                "صف المشكلة بدلًا من ذلك."
              )}
            </h2>

            <p>
              {tr(
                "Tell us what is happening and we’ll help match you with the right type of fixer.",
                "أخبرنا بما يحدث وسنساعدك في الوصول إلى نوع الفني المناسب."
              )}
            </p>
          </div>

          <button
            type="button"
            className="old-cta-button services-home-liquid-button"
            onClick={() => {
              navigate("/");

              setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }, 50);
            }}
          >
            <span
              className="services-home-liquid-sheen"
              aria-hidden="true"
            ></span>

            <span className="services-home-liquid-content">
              {tr("Describe Your Problem", "صف مشكلتك")}
            </span>
          </button>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="old-footer">
        <div className="old-container old-footer-content">
          <div>
            <button
              type="button"
              className="old-footer-logo"
              onClick={() => navigate("/")}
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

          <div className="old-footer-links">
            <button onClick={() => navigate("/services")}>
              {tr("Services", "الخدمات")}
            </button>

            <button onClick={() => navigate("/technicians")}>
              {tr("Find a Fixer", "ابحث عن فني")}
            </button>

            <button onClick={() => navigate("/about")}>
              {tr("About Us", "من نحن")}
            </button>

            <button onClick={() => navigate("/contact")}>
              {tr("Contact Us", "تواصل معنا")}
            </button>

            <button onClick={() => navigate("/become-fixer")}>
              {tr("Become a Fixer", "انضم كفني")}
            </button>
          </div>

          <p className="old-footer-copy">
            © 2026 Fixer.Co
          </p>
        </div>
      </footer>
    </main>
  );
}

/* Same service icon mapping as the old static version. */
function getServiceIcon(serviceId) {
  const icons = {
    1: "fa-solid fa-snowflake",
    2: "fa-solid fa-droplet",
    3: "fa-solid fa-bolt",
    4: "fa-solid fa-screwdriver-wrench",
    5: "fa-solid fa-hammer",
    6: "fa-solid fa-house",
  };

  return (
    icons[Number(serviceId)] ||
    "fa-solid fa-screwdriver-wrench"
  );
}

function translateServiceName(name, language) {
  if (language !== "ar") return name;

  const names = {
    "AC & Cooling": "التكييف والتبريد",
    Plumbing: "السباكة",
    Electrical: "الكهرباء",
    Appliances: "الأجهزة المنزلية",
    Furniture: "الأثاث",
    "Carpentry & Furniture": "النجارة والأثاث",
    General: "الصيانة العامة",
    "General Maintenance": "الصيانة العامة",
  };

  return names[name] || name;
}

function getOldServiceDescription(serviceName, language) {
  const english = {
    "AC & Cooling":
      "Find trusted professionals for AC & cooling.",
    Plumbing:
      "Find trusted professionals for plumbing.",
    Electrical:
      "Find trusted professionals for electrical.",
    Appliances:
      "Find trusted professionals for appliances.",
    Furniture:
      "Find trusted professionals for furniture.",
    "Carpentry & Furniture":
      "Find trusted professionals for carpentry & furniture.",
    General:
      "Find trusted professionals for general maintenance.",
    "General Maintenance":
      "Find trusted professionals for general maintenance.",
  };

  const arabic = {
    "AC & Cooling":
      "اعثر على فنيين موثوقين لخدمات التكييف والتبريد.",
    Plumbing:
      "اعثر على فنيين موثوقين لخدمات السباكة.",
    Electrical:
      "اعثر على فنيين موثوقين لخدمات الكهرباء.",
    Appliances:
      "اعثر على فنيين موثوقين لصيانة الأجهزة.",
    Furniture:
      "اعثر على فنيين موثوقين لإصلاح الأثاث.",
    "Carpentry & Furniture":
      "اعثر على فنيين موثوقين للنجارة والأثاث.",
    General:
      "اعثر على فنيين موثوقين للصيانة العامة.",
    "General Maintenance":
      "اعثر على فنيين موثوقين للصيانة العامة.",
  };

  if (language === "ar") {
    return (
      arabic[serviceName] ||
      "اعثر على فنيين موثوقين لهذه الخدمة."
    );
  }

  return (
    english[serviceName] ||
    "Find trusted professionals for this service."
  );
}

export default Services;
