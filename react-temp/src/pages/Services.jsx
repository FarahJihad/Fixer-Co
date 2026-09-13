import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
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

        setServices(
          Array.isArray(data)
            ? data
            : data.services || []
        );
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

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll("[data-services-reveal]")
    );

    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) =>
        element.classList.add("services-show")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("services-show");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();

      if (
        rect.top < window.innerHeight - 20 &&
        rect.bottom > 0
      ) {
        element.classList.add("services-show");
      } else {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [services, isLoading, language]);

  function openService(serviceId) {
    navigate(`/technicians?service=${serviceId}`);
  }

  function goToSmartAssist() {
    navigate("/");

    window.setTimeout(() => {
      const aiBox = document.querySelector(
        ".home-hero-ai-glass"
      );

      if (aiBox) {
        aiBox.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, 120);
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="services-page"
    >
      {/* =========================
          EDITORIAL HERO
      ========================== */}
      <section className="services-hero">
        <div
          className="services-hero__word"
          aria-hidden="true"
        >
          {tr("SERVICES", "خدماتنا")}
        </div>
      </section>

      {/* =========================
          MOVING SERVICES TICKER
      ========================== */}
      <section
        className="services-ticker"
        aria-label={tr(
          "Available service categories",
          "فئات الخدمات المتاحة"
        )}
      >
        <div className="services-ticker__track">
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className="services-ticker__group"
              aria-hidden={copyIndex === 1 ? "true" : undefined}
            >
              {[
                tr("AC & COOLING", "التكييف والتبريد"),
                tr("PLUMBING", "السباكة"),
                tr("ELECTRICAL", "الكهرباء"),
                tr("APPLIANCES", "الأجهزة المنزلية"),
                tr("CARPENTRY & FURNITURE", "النجارة والأثاث"),
                tr("GENERAL MAINTENANCE", "الصيانة العامة"),
              ].map((item) => (
                <span
                  key={`${copyIndex}-${item}`}
                  className="services-ticker__item"
                >
                  <span className="services-ticker__dot"></span>
                  <span>{item}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          SERVICES GRID
      ========================== */}
      <section className="services-catalog">
        <div className="services-shell">
          <div
            className="services-catalog__head"
            data-services-reveal
          >
            <div>
              <p className="services-kicker">
                {tr("WHAT DO YOU NEED?", "ماذا تحتاج؟")}
              </p>

              <h2>
                {tr(
                  "Find the right service for your home",
                  "اعثر على الخدمة المناسبة لمنزلك"
                )}
              </h2>
            </div>

            <p>
              {tr(
                "Explore all available home services and choose the one that best matches your problem.",
                "استكشف جميع الخدمات المنزلية واختر الخدمة الأقرب إلى مشكلتك."
              )}
            </p>
          </div>

          {isLoading && (
            <div className="services-state">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <span>
                {tr(
                  "Loading services...",
                  "جارٍ تحميل الخدمات..."
                )}
              </span>
            </div>
          )}

          {!isLoading && error && (
            <div className="services-error">
              <i className="fa-solid fa-circle-exclamation"></i>

              <div>
                <strong>
                  {tr(
                    "Could not load services",
                    "تعذر تحميل الخدمات"
                  )}
                </strong>

                <p>{error}</p>
              </div>
            </div>
          )}

          {!isLoading &&
            !error &&
            services.length > 0 && (
              <div className="services-grid">
                {services.map((service, index) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() =>
                      openService(service.id)
                    }
                    className="services-card"
                    data-services-reveal
                    style={{
                      "--services-delay": `${index * 90}ms`,
                    }}
                  >
                    <img
                      src={getServiceImage(service.name)}
                      alt={translateServiceName(
                        service.name,
                        language
                      )}
                      className="services-card__image"
                      style={{
                        objectPosition:
                          service.name === "Electrical"
                            ? "30% center"
                            : "center",
                      }}
                    />

                    <span
                      className="services-card__overlay"
                      aria-hidden="true"
                    ></span>

                    <span className="services-card__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="services-card__content">
                      <span className="services-card__icon">
                        <i
                          className={getServiceIcon(
                            service.id
                          )}
                        ></i>
                      </span>

                      <span className="services-card__title">
                        {translateServiceName(
                          service.name,
                          language
                        )}
                      </span>

                      <span className="services-card__description">
                        {getServiceDescription(
                          service.name,
                          language
                        )}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

          {!isLoading &&
            !error &&
            services.length === 0 && (
              <div className="services-state">
                <i className="fa-solid fa-screwdriver-wrench"></i>
                <span>
                  {tr(
                    "No services are available right now.",
                    "لا توجد خدمات متاحة حاليًا."
                  )}
                </span>
              </div>
            )}
        </div>
      </section>

      {/* =========================
          SMART ASSIST CTA
      ========================== */}
      <section className="services-assist">
        <div
          className="services-shell services-assist__inner"
          data-services-reveal
        >
          <div>
            <p className="services-kicker">
              {tr(
                "NOT SURE WHICH SERVICE?",
                "لست متأكدًا من الخدمة؟"
              )}
            </p>

            <h2 className="services-assist__title">
              {isArabic ? (
                <>
                  <span>صف المشكلة</span>
                  <span>وسنساعدك في تحديد الخدمة</span>
                </>
              ) : (
                <>
                  <span>Describe the problem</span>
                  <span>We’ll guide you</span>
                </>
              )}
            </h2>

            <p>
              {tr(
                "Use Smart Assist on the home page to describe what is wrong or add a photo.",
                "استخدم المساعد الذكي في الصفحة الرئيسية لوصف المشكلة أو إضافة صورة."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={goToSmartAssist}
            className="services-assist__button"
          >
            {tr(
              "Try Smart Assist",
              "جرّب المساعد الذكي"
            )}
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function getServiceImage(serviceName) {
  const images = {
    "AC & Cooling":
      "/media/services/ac-cooling.png",
    Plumbing:
      "/media/services/plumbing.png",
    Electrical:
      "/media/services/electrical.png",
    Appliances:
      "/media/services/appliances.png",
    Furniture:
      "/media/services/carpentry-furniture.png",
    "Carpentry & Furniture":
      "/media/services/carpentry-furniture.png",
    General:
      "/media/services/general-maintenance.png",
    "General Maintenance":
      "/media/services/general-maintenance.png",
  };

  return (
    images[serviceName] ||
    "/media/services/general-maintenance.png"
  );
}

function getServiceIcon(serviceId) {
  const icons = {
    1: "fa-solid fa-snowflake",
    2: "fa-solid fa-droplet",
    3: "fa-solid fa-bolt",
    4: "fa-solid fa-tv",
    5: "fa-solid fa-couch",
    6: "fa-solid fa-screwdriver-wrench",
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

function getServiceDescription(serviceName, language) {
  const english = {
    "AC & Cooling":
      "Cooling, AC repair and maintenance.",
    Plumbing:
      "Plumbing and water repair services.",
    Electrical:
      "Electrical repair and maintenance services.",
    Appliances:
      "Home appliance repair services.",
    Furniture:
      "Furniture repair and maintenance.",
    "Carpentry & Furniture":
      "Carpentry and furniture repair services.",
    General:
      "General home repair and maintenance.",
    "General Maintenance":
      "General home repair and maintenance.",
  };

  const arabic = {
    "AC & Cooling":
      "إصلاح وصيانة أنظمة التكييف والتبريد.",
    Plumbing:
      "خدمات السباكة وإصلاح مشاكل المياه.",
    Electrical:
      "خدمات إصلاح وصيانة الكهرباء.",
    Appliances:
      "خدمات إصلاح الأجهزة المنزلية.",
    Furniture:
      "إصلاح وصيانة الأثاث.",
    "Carpentry & Furniture":
      "خدمات النجارة وإصلاح الأثاث.",
    General:
      "إصلاحات وصيانة منزلية عامة.",
    "General Maintenance":
      "إصلاحات وصيانة منزلية عامة.",
  };

  return (
    (language === "ar" ? arabic : english)[
      serviceName
    ] || ""
  );
}

export default Services;
