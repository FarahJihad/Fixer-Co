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
      items.forEach((item) =>
        item.classList.add("profile-show")
      );
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
        rootMargin: "0px 0px -42px 0px",
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

  const isAvailable =
    Number(technician?.available) === 1;

  const reviews = [
    {
      initials: "SA",
      name: tr("Sarah Ahmed", "سارة أحمد"),
      text: tr(
        "Very professional and arrived on time. The issue was fixed quickly and everything was explained clearly.",
        "فني محترف ووصل في الوقت المحدد. تم حل المشكلة بسرعة وشرح كل شيء بوضوح."
      ),
    },
    {
      initials: "MK",
      name: tr("Mohammed Khalid", "محمد خالد"),
      text: tr(
        "Great service and fair price. I would definitely request this fixer again.",
        "خدمة ممتازة وسعر مناسب. بالتأكيد سأطلب هذا الفني مرة أخرى."
      ),
    },
  ];

  return (
    <main
      className="profile-page"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <section className="profile-shell">
        <div className="profile-container">
          <button
            type="button"
            onClick={goBack}
            className="profile-back"
          >
            <i
              className={`fa-solid ${
                isArabic
                  ? "fa-arrow-right"
                  : "fa-arrow-left"
              }`}
            ></i>
            {tr("Back to Fixers", "العودة للفنيين")}
          </button>

          {isLoading && (
            <div className="profile-state">
              <i className="fa-solid fa-spinner fa-spin"></i>
              {tr(
                "Loading fixer profile...",
                "جارٍ تحميل ملف الفني..."
              )}
            </div>
          )}

          {!isLoading && error && (
            <div className="profile-state profile-state-error">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          {!isLoading && !error && technician && (
            <>
              {/* HERO */}
              <section
                className="profile-hero"
                data-profile-reveal
              >
                <div className="profile-hero-glow"></div>

                <div className="profile-identity">
                  <div className="profile-avatar">
                    {getInitials(technician.name)}
                  </div>

                  <div className="profile-identity-copy">
                    <p className="profile-kicker">
                      {tr(
                        "FIXER PROFILE",
                        "ملف الفني"
                      )}
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

                    <p className="profile-specialty">
                      {technician.service_name}
                    </p>
                  </div>
                </div>

                <div className="profile-meta-grid">
                  <MetaItem
                    icon="fa-solid fa-star"
                    label={tr("Rating", "التقييم")}
                    value={`${Number(
                      technician.rating || 0
                    ).toFixed(1)} / 5`}
                    accent="star"
                  />

                  <MetaItem
                    icon="fa-solid fa-location-dot"
                    label={tr("Location", "الموقع")}
                    value={
                      technician.location ||
                      tr("Not specified", "غير محدد")
                    }
                  />

                  <MetaItem
                    icon="fa-solid fa-circle"
                    label={tr(
                      "Availability",
                      "التوفر"
                    )}
                    value={
                      isAvailable
                        ? tr(
                            "Available now",
                            "متاح الآن"
                          )
                        : tr(
                            "Currently unavailable",
                            "غير متاح حاليًا"
                          )
                    }
                    accent={
                      isAvailable
                        ? "available"
                        : "muted"
                    }
                  />

                  <MetaItem
                    icon="fa-solid fa-tag"
                    label={tr(
                      "Starting from",
                      "يبدأ من"
                    )}
                    value={`${Number(
                      technician.price ??
                        technician.starting_price ??
                        0
                    ).toFixed(0)} ${tr(
                      "SAR",
                      "ر.س"
                    )}`}
                  />
                </div>
              </section>

              {/* ABOUT */}
              <section
                className="profile-about"
                data-profile-reveal
              >
                <div>
                  <p className="profile-section-label">
                    {tr(
                      "ABOUT THE FIXER",
                      "عن الفني"
                    )}
                  </p>

                  <h2 className="profile-about-title">
                    {isArabic ? (
                      <>
                        <span>خبرة</span>
                        <span>موثوقية</span>
                        <span>جاهز للمساعدة</span>
                      </>
                    ) : (
                      <>
                        <span>Experienced</span>
                        <span>Reliable</span>
                        <span>Ready to help</span>
                      </>
                    )}
                  </h2>
                </div>

                <p className="profile-about-text">
                  {technician.bio ||
                    tr(
                      `Experienced professional specializing in ${technician.service_name}. Provides reliable home maintenance services with a focus on quality and customer satisfaction.`,
                      `فني محترف متخصص في ${technician.service_name} ويقدم خدمات صيانة منزلية موثوقة مع التركيز على الجودة ورضا العملاء.`
                    )}
                </p>
              </section>

              {/* REVIEWS */}
              <section
                className="profile-reviews"
                data-profile-reveal
              >
                <div className="profile-section-head">
                  <div>
                    <p className="profile-section-label">
                      {tr(
                        "CUSTOMER REVIEWS",
                        "آراء العملاء"
                      )}
                    </p>

                    <h2>
                      {tr(
                        "What customers say",
                        "ماذا يقول العملاء"
                      )}
                    </h2>
                  </div>

                  <div className="profile-review-score">
                    <i className="fa-solid fa-star"></i>
                    {Number(
                      technician.rating || 0
                    ).toFixed(1)}
                  </div>
                </div>

                <div className="profile-review-grid">
                  {reviews.map((review, index) => (
                    <article
                      key={review.name}
                      className="profile-review-card"
                      data-profile-reveal
                      style={{
                        "--profile-delay": `${
                          index * 90
                        }ms`,
                      }}
                    >
                      <div className="profile-review-stars">
                        {[0, 1, 2, 3, 4].map(
                          (star) => (
                            <i
                              key={star}
                              className="fa-solid fa-star"
                            ></i>
                          )
                        )}
                      </div>

                      <p className="profile-review-text">
                        “{review.text}”
                      </p>

                      <div
                        className="profile-review-quote"
                        aria-hidden="true"
                      >
                        “
                      </div>

                      <div className="profile-review-person">
                        <div className="profile-review-avatar">
                          {review.initials}
                        </div>

                        <div>
                          <span className="profile-review-name">
                            {review.name}
                          </span>

                          <span className="profile-review-verified">
                            {tr(
                              "Verified customer",
                              "عميل موثّق"
                            )}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <section
                className="profile-cta"
                data-profile-reveal
              >
                <div>
                  <p className="profile-cta-kicker">
                    {tr(
                      "Need this service?",
                      "تحتاج هذه الخدمة؟"
                    )}
                  </p>

                  <h2>
                    {tr(
                      `Request ${technician.name}`,
                      `اطلب خدمة ${technician.name}`
                    )}
                  </h2>

                  <p>
                    {tr(
                      "Send your request and continue with the service details.",
                      "أرسل طلبك وأكمل تفاصيل الخدمة."
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={requestService}
                  className="profile-cta-button"
                >
                  {tr(
                    "Request This Fixer",
                    "اطلب هذا الفني"
                  )}
                </button>
              </section>
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function MetaItem({
  icon,
  label,
  value,
  accent = "",
}) {
  return (
    <div className={`profile-meta-item ${accent}`}>
      <div className="profile-meta-icon">
        <i className={icon}></i>
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "FX";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default Profile;
