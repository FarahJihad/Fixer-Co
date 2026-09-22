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

  const chooseFor =
    searchParams.get("chooseFor");

  const requestSlot =
    searchParams.get("slot") || "1";

  const selectedServiceFromRequest =
    searchParams.get("service");

  const isRequestSelection =
    chooseFor === "request";

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
        rootMargin: "0px 0px -40px 0px",
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

    if (selectedServiceFromRequest) {
      query.set(
        "service",
        selectedServiceFromRequest
      );
    }

    if (isRequestSelection) {
      query.set(
        "chooseFor",
        "request"
      );

      query.set(
        "slot",
        requestSlot
      );
    }

    navigate(
      query.toString()
        ? `/technicians?${query.toString()}`
        : "/technicians"
    );
  }

  function requestService() {
    if (!technician) return;

    if (isRequestSelection) {
      let draft = {};

      try {
        draft = JSON.parse(
          sessionStorage.getItem(
            "requestDraft"
          ) || "{}"
        );
      } catch (error) {
        console.error(
          "Could not read request draft:",
          error
        );
      }

      if (requestSlot === "2") {
        draft = {
          ...draft,
          secondServiceEnabled: true,
          secondServiceId:
            String(
              technician.service_id
            ),
          secondTechnicianId:
            String(technician.id),
        };
      } else {
        draft = {
          ...draft,
          serviceId:
            String(
              technician.service_id
            ),
          technicianId:
            String(technician.id),
        };
      }

      sessionStorage.setItem(
        "requestDraft",
        JSON.stringify(draft)
      );

      navigate("/request");
      return;
    }

    const query = new URLSearchParams();
    query.set(
      "technician",
      technician.id
    );
    query.set(
      "service",
      technician.service_id
    );

    if (latitude && longitude) {
      query.set("lat", latitude);
      query.set("lng", longitude);
    }

    navigate(
      `/request?${query.toString()}`
    );
  }

  const isAvailable = Number(technician?.available) === 1;

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
              <section
                className="profile-sheet"
                data-profile-reveal
              >
                <aside className="profile-sheet-identity">
                  <div className="profile-sheet-orb">
                    {getInitials(technician.name)}
                  </div>

                  <p className="profile-kicker">
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

                  <p className="profile-specialty">
                    {technician.service_name}
                  </p>

                  <div className="profile-identity-rule"></div>

                  <div className="profile-mini-facts">
                    <MiniFact
                      label={tr("Rating", "التقييم")}
                      value={`${Number(
                        technician.rating || 0
                      ).toFixed(1)} / 5`}
                    />
                    <MiniFact
                      label={tr("Starting from", "يبدأ من")}
                      value={`${Number(
                        technician.price ??
                          technician.starting_price ??
                          0
                      ).toFixed(0)} ${tr("SAR", "ر.س")}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={requestService}
                    className="profile-request-button"
                  >
                    {isRequestSelection
                      ? tr(
                          `Choose for Service 0${requestSlot}`,
                          `اختيار للخدمة 0${requestSlot}`
                        )
                      : tr(
                          "Request This Fixer",
                          "اطلب هذا الفني"
                        )}
                  </button>
                </aside>

                <div className="profile-sheet-content">
                  <section className="profile-block profile-block-about">
                    <div className="profile-block-head">
                      <p className="profile-section-label">
                        {tr("ABOUT", "نبذة")}
                      </p>

                      <span
                        className={`profile-status ${
                          isAvailable
                            ? "is-available"
                            : "is-unavailable"
                        }`}
                      >
                        <i className="fa-solid fa-circle"></i>
                        {isAvailable
                          ? tr("Available now", "متاح الآن")
                          : tr(
                              "Currently unavailable",
                              "غير متاح حاليًا"
                            )}
                      </span>
                    </div>

                    <p className="profile-about-text">
                      {technician.bio ||
                        tr(
                          `Experienced professional specializing in ${technician.service_name}. Provides reliable home maintenance services with a focus on quality and customer satisfaction.`,
                          `فني محترف متخصص في ${technician.service_name} ويقدم خدمات صيانة منزلية موثوقة مع التركيز على الجودة ورضا العملاء.`
                        )}
                    </p>
                  </section>

                  <section className="profile-info-grid">
                    <InfoBox
                      icon="fa-solid fa-location-dot"
                      label={tr("LOCATION", "الموقع")}
                      value={
                        technician.location ||
                        tr("Not specified", "غير محدد")
                      }
                    />

                    <InfoBox
                      icon="fa-solid fa-screwdriver-wrench"
                      label={tr("SERVICE", "الخدمة")}
                      value={technician.service_name}
                    />

                    <InfoBox
                      icon="fa-solid fa-circle-check"
                      label={tr("STATUS", "الحالة")}
                      value={
                        Number(technician.verified) === 1
                          ? tr(
                              "Verified fixer",
                              "فني موثّق"
                            )
                          : tr(
                              "Profile not verified",
                              "الملف غير موثّق"
                            )
                      }
                    />

                    <InfoBox
                      icon="fa-solid fa-clock"
                      label={tr("AVAILABILITY", "التوفر")}
                      value={
                        isAvailable
                          ? tr(
                              "Available to receive requests",
                              "متاح لاستقبال الطلبات"
                            )
                          : tr(
                              "Currently unavailable",
                              "غير متاح حاليًا"
                            )
                      }
                    />
                  </section>

                  <section className="profile-block profile-reviews-compact">
                    <div className="profile-block-head">
                      <p className="profile-section-label">
                        {tr(
                          "CUSTOMER REVIEWS",
                          "آراء العملاء"
                        )}
                      </p>

                      <span className="profile-review-score">
                        <i className="fa-solid fa-star"></i>
                        {Number(
                          technician.rating || 0
                        ).toFixed(1)}
                      </span>
                    </div>

                    <div className="profile-review-grid">
                      {reviews.map((review, index) => (
                        <article
                          key={review.name}
                          className="profile-review-card"
                          data-profile-reveal
                          style={{
                            "--profile-delay": `${index * 80}ms`,
                          }}
                        >
                          <div className="profile-review-top">
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

                            <span className="profile-review-initials">
                              {review.initials}
                            </span>
                          </div>

                          <p className="profile-review-text">
                            “{review.text}”
                          </p>

                          <span className="profile-review-name">
                            {review.name}
                          </span>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              </section>

              <section
                className="profile-bottom-cta"
                data-profile-reveal
              >
                <div>
                  <p className="profile-cta-kicker">
                    {isRequestSelection
                      ? tr(
                          `SELECTING FOR SERVICE 0${requestSlot}`,
                          `اختيار فني للخدمة 0${requestSlot}`
                        )
                      : tr(
                          "NEED THIS SERVICE?",
                          "تحتاج هذه الخدمة؟"
                        )}
                  </p>

                  <h2>
                    {isRequestSelection
                      ? tr(
                          `Choose ${technician.name}`,
                          `اختر ${technician.name}`
                        )
                      : tr(
                          `Request ${technician.name}`,
                          `اطلب خدمة ${technician.name}`
                        )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={requestService}
                  className="profile-cta-button"
                >
                  {isRequestSelection
                    ? tr(
                        `Choose for Service 0${requestSlot}`,
                        `اختيار للخدمة 0${requestSlot}`
                      )
                    : tr(
                        "Continue to Request",
                        "متابعة الطلب"
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

function MiniFact({ label, value }) {
  return (
    <div className="profile-mini-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="profile-info-box">
      <div className="profile-info-icon">
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
