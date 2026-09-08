import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const { language, isArabic } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [technician, setTechnician] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");

  useEffect(() => {
    async function loadTechnician() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`/api/technicians/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              tr(
                "Technician not found.",
                "لم يتم العثور على الفني."
              )
          );
        }

        setTechnician(data);
      } catch (error) {
        console.error("Profile loading error:", error);

        setError(
          error.message ||
            tr(
              "Could not load fixer profile.",
              "تعذر تحميل ملف الفني."
            )
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadTechnician();
    } else {
      setError(
        tr(
          "Technician not found.",
          "لم يتم العثور على الفني."
        )
      );
      setIsLoading(false);
    }
  }, [id, language]);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll("[data-profile-reveal]")
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("profile-show"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("profile-show");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [technician, isLoading, language]);

  function goBack() {
    const query = new URLSearchParams();

    if (latitude && longitude) {
      query.set("lat", latitude);
      query.set("lng", longitude);
    }

    navigate(
      query.toString()
        ? `/technicians?${query.toString()}`
        : "/technicians"
    );
  }

  function requestService() {
    if (!technician) return;

    const query = new URLSearchParams();

    query.set("technician", technician.id);
    query.set("service", technician.service_id);

    if (latitude && longitude) {
      query.set("lat", latitude);
      query.set("lng", longitude);
    }

    navigate(`/request?${query.toString()}`);
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="profile-page"
    >
      <section className="profile-section">
        <div className="profile-container">
          <button
            type="button"
            onClick={goBack}
            className="profile-back profile-reveal"
            data-profile-reveal
          >
            {tr("Back to Fixers", "العودة إلى الفنيين")}
          </button>

          {isLoading && (
            <div className="profile-state-card">
              <i className="fa-solid fa-spinner fa-spin"></i>
              {tr(
                "Loading fixer profile...",
                "جارٍ تحميل ملف الفني..."
              )}
            </div>
          )}

          {!isLoading && error && (
            <div className="profile-error-card">
              <div className="profile-error-icon">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>

              <h1>
                {tr(
                  "Fixer not found",
                  "لم يتم العثور على الفني"
                )}
              </h1>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => navigate("/technicians")}
              >
                {tr(
                  "Browse Fixers",
                  "تصفح الفنيين"
                )}
              </button>
            </div>
          )}

          {!isLoading && !error && technician && (
            <article className="profile-shell">
              {/* PROFILE TOP */}
              <section
                className="profile-top profile-reveal"
                data-profile-reveal
              >
                <div className="profile-top-main">
                  <div className="profile-avatar">
                    {getInitials(technician.name)}
                  </div>

                  <div className="profile-main-info">
                    <p className="profile-label">
                      {tr("FIXER PROFILE", "ملف الفني")}
                    </p>

                    <div className="profile-name-row">
                      <h1>{technician.name}</h1>

                      {Number(technician.verified) === 1 && (
                        <i
                          className="fa-solid fa-circle-check profile-verified"
                          title={tr(
                            "Verified Fixer",
                            "فني موثّق"
                          )}
                        ></i>
                      )}
                    </div>

                    <p className="profile-service">
                      {translateServiceName(
                        technician.service_name,
                        language
                      )}
                    </p>

                    <div className="profile-meta">
                      <span>
                        <i className="fa-solid fa-star profile-star"></i>
                        {Number(technician.rating).toFixed(1)}{" "}
                        {tr("Rating", "التقييم")}
                      </span>

                      <span>
                        <i className="fa-solid fa-location-dot"></i>
                        {technician.location}
                      </span>

                      <span
                        className={
                          Number(technician.available) === 1
                            ? "profile-available"
                            : "profile-unavailable"
                        }
                      >
                        <i className="fa-solid fa-circle"></i>
                        {Number(technician.available) === 1
                          ? tr(
                              "Available now",
                              "متاح الآن"
                            )
                          : tr(
                              "Currently unavailable",
                              "غير متاح حاليًا"
                            )}
                      </span>

                      <span className="profile-price-inline">
                        <i className="fa-solid fa-tag"></i>
                        {tr("From", "ابتداءً من")}{" "}
                        {Number(
                          technician.price ??
                            technician.starting_price
                        ).toFixed(0)}{" "}
                        {tr("SAR", "ر.س")}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ABOUT */}
              <section
                className="profile-about profile-reveal"
                data-profile-reveal
              >
                <h2>
                  {tr(
                    "About this Fixer",
                    "عن هذا الفني"
                  )}
                </h2>

                <p>
                  {technician.bio ||
                    tr(
                      `Experienced professional specializing in ${technician.service_name.toLowerCase()}. Provides reliable home maintenance services with a focus on quality and customer satisfaction.`,
                      `فني محترف متخصص في ${translateServiceName(
                        technician.service_name,
                        language
                      )} ويقدم خدمات صيانة منزلية موثوقة مع التركيز على الجودة ورضا العملاء.`
                    )}
                </p>
              </section>

              {/* REVIEWS */}
              <section
                className="profile-reviews profile-reveal"
                data-profile-reveal
              >
                <div className="reviews-heading">
                  <div>
                    <p className="profile-label">
                      {tr(
                        "CUSTOMER REVIEWS",
                        "مراجعات العملاء"
                      )}
                    </p>

                    <h2>
                      {tr(
                        "What customers say",
                        "ماذا يقول العملاء"
                      )}
                    </h2>
                  </div>

                  <span className="review-score">
                    <i className="fa-solid fa-star"></i>
                    {Number(technician.rating).toFixed(1)}
                  </span>
                </div>

                <div className="reviews-grid profile-hover-focus-group">
                  <ReviewCard
                    initials="SA"
                    name={tr("Sarah Ahmed", "سارة أحمد")}
                    text={tr(
                      "Very professional and arrived on time. The issue was fixed quickly and everything was explained clearly.",
                      "فني محترف جدًا ووصل في الوقت المحدد. تم إصلاح المشكلة بسرعة وشرح كل شيء بوضوح."
                    )}
                    role={tr(
                      "Verified customer",
                      "عميلة موثّقة"
                    )}
                    delay="0ms"
                  />

                  <ReviewCard
                    initials="MK"
                    name={tr(
                      "Mohammed Khalid",
                      "محمد خالد"
                    )}
                    text={tr(
                      "Great service and fair price. I would definitely request this fixer again.",
                      "خدمة ممتازة وسعر عادل. بالتأكيد سأطلب هذا الفني مرة أخرى."
                    )}
                    role={tr(
                      "Verified customer",
                      "عميل موثّق"
                    )}
                    delay="80ms"
                  />
                </div>
              </section>

              {/* REQUEST AREA */}
              <section
                className="profile-request-area profile-reveal"
                data-profile-reveal
              >
                <div>
                  <p>
                    {tr(
                      "Need this service?",
                      "تحتاج هذه الخدمة؟"
                    )}
                  </p>

                  <h2>
                    {tr(
                      `Request ${technician.name}`,
                      `اطلب ${technician.name}`
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={requestService}
                  disabled={
                    Number(technician.available) !== 1
                  }
                  className="profile-request-cta profile-particle-button"
                >
                  {Number(technician.available) === 1 && (
                    <span
                      className="profile-particles"
                      aria-hidden="true"
                    >
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  )}

                  <span className="profile-particle-label">
                    {Number(technician.available) === 1
                      ? tr(
                          "Request This Fixer",
                          "اطلب هذا الفني"
                        )
                      : tr(
                          "Currently Unavailable",
                          "غير متاح حاليًا"
                        )}
                  </span>

                  {Number(technician.available) !== 1 && (
                    <i className="fa-solid fa-clock"></i>
                  )}
                </button>
              </section>
            </article>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ReviewCard({
  initials,
  name,
  text,
  role,
  delay,
}) {
  return (
    <article
      className="review-card profile-focus-item profile-reveal"
      data-profile-reveal
      style={{
        "--profile-delay": delay,
      }}
    >
      <div className="review-card-topline">
        <div className="review-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className="fa-solid fa-star"
            ></i>
          ))}
        </div>

        <i
          className="fa-solid fa-quote-right review-quote"
          aria-hidden="true"
        ></i>
      </div>

      <p className="review-text">{text}</p>

      <div className="review-person">
        <div className="review-avatar">
          {initials}
        </div>

        <div>
          <h3>{name}</h3>
          <span>{role}</span>
        </div>
      </div>
    </article>
  );
}

function getInitials(name) {
  if (!name) return "F";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function translateServiceName(name, language) {
  if (language !== "ar") return name;

  const names = {
    "AC & Cooling": "التكييف والتبريد",
    Plumbing: "السباكة",
    Electrical: "الكهرباء",
    Appliances: "الأجهزة المنزلية",
    Furniture: "الأثاث",
    "Carpentry & Furniture":
      "النجارة والأثاث",
    General: "الصيانة العامة",
    "General Maintenance":
      "الصيانة العامة",
  };

  return names[name] || name;
}

export default Profile;
