import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./MyRequests.css";

function MyRequests() {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "/api/my-requests",
          {
            method: "GET",
            credentials: "same-origin",
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.setItem(
            "redirectAfterLogin",
            "/my-requests"
          );

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              data.error ||
              tr(
                "Could not load your requests.",
                "تعذر تحميل طلباتك."
              )
          );
        }

        setRequests(
          Array.isArray(data.requests)
            ? data.requests
            : []
        );
      } catch (error) {
        console.error(
          "My Requests error:",
          error
        );

        setError(
          error.message ||
            tr(
              "Could not load your requests.",
              "تعذر تحميل طلباتك."
            )
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
  }, [navigate, language]);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll(
        "[data-request-card-reveal]"
      )
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) =>
        item.classList.add("mr-show")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("mr-show");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    items.forEach((item) =>
      observer.observe(item)
    );

    return () => observer.disconnect();
  }, [requests, language]);

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="my-requests-page"
    >
      {/* HERO */}
      <section className="mr-hero">
        <div className="mr-container mr-hero-grid">
          <div
            className="mr-reveal"
            data-request-card-reveal
          >
            <p className="mr-label">
              {tr(
                "CUSTOMER DASHBOARD",
                "لوحة العميل"
              )}
            </p>

            <h1>
              {tr(
                "My Requests",
                "طلباتي"
              )}
            </h1>

            <p>
              {tr(
                "Follow your service requests, check your Fixer, and stay updated as the job moves forward.",
                "تابع طلبات الخدمة، وتحقق من الفني، وابقَ على اطلاع مع تقدم العمل."
              )}
            </p>
          </div>

          <div
            className="mr-count-card mr-reveal"
            data-request-card-reveal
            style={{ "--mr-delay": "100ms" }}
          >
            <strong>
              {isLoading || error
                ? "—"
                : requests.length}
            </strong>

            <span>
              {requests.length === 1
                ? tr(
                    "Service Request",
                    "طلب خدمة"
                  )
                : tr(
                    "Service Requests",
                    "طلبات خدمة"
                  )}
            </span>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mr-content">
        <div className="mr-container">

          {isLoading && (
            <div className="mr-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>
              {tr(
                "Loading your requests...",
                "جارٍ تحميل طلباتك..."
              )}
            </div>
          )}

          {!isLoading && error && (
            <div className="mr-state-card error">
              <div className="mr-state-icon">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>

              <h2>
                {tr(
                  "We couldn't load your requests",
                  "تعذر تحميل طلباتك"
                )}
              </h2>

              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
              >
                {tr(
                  "Try Again",
                  "حاول مرة أخرى"
                )}
              </button>
            </div>
          )}

          {!isLoading &&
            !error &&
            requests.length === 0 && (
              <div className="mr-state-card">
                <div className="mr-state-icon empty">
                  <i className="fa-solid fa-screwdriver-wrench"></i>
                </div>

                <h2>
                  {tr(
                    "No service requests yet",
                    "لا توجد طلبات خدمة بعد"
                  )}
                </h2>

                <p>
                  {tr(
                    "When you request a Fixer, your service details and progress will appear here.",
                    "عندما تطلب فنيًا، ستظهر تفاصيل الخدمة وتقدم الطلب هنا."
                  )}
                </p>

                <Link
                  to="/services"
                  className="mr-primary-link"
                >
                  {tr(
                    "Browse Services",
                    "تصفح الخدمات"
                  )}
                </Link>
              </div>
            )}

          {!isLoading &&
            !error &&
            requests.length > 0 && (
              <div className="mr-requests-list">
                {requests.map(
                  (request, index) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      language={language}
                      isArabic={isArabic}
                      delay={`${index * 70}ms`}
                    />
                  )
                )}
              </div>
            )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function RequestCard({
  request,
  language,
  isArabic,
  delay,
}) {
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const status = String(
    request.status || "requested"
  )
    .trim()
    .toLowerCase();

  const statusInfo =
    getStatusInfo(status, language);

  const initials =
    getInitials(request.technician_name);

  const rating =
    request.technician_rating !== null &&
    request.technician_rating !== undefined
      ? Number(
          request.technician_rating
        ).toFixed(1)
      : "—";

  const price =
    request.starting_price !== null &&
    request.starting_price !== undefined
      ? `${Number(
          request.starting_price
        ).toFixed(0)} ${
          language === "ar" ? "ر.س" : "SAR"
        }`
      : "—";

  const isCompleted =
    status === "completed";

  return (
    <article
      className="mr-request-card mr-reveal"
      data-request-card-reveal
      style={{ "--mr-delay": delay }}
    >
      <span className="mr-promo-orb mr-promo-orb-one" aria-hidden="true"></span>
      <span className="mr-promo-orb mr-promo-orb-two" aria-hidden="true"></span>
      {/* TOP */}
      <div
        className="mr-card-top mr-card-item"
        style={{ "--item-delay": "80ms" }}
      >
        <div className="mr-service-wrap">
          <div className="mr-service-icon">
            <i
              className={
                serviceIcons[
                  Number(
                    request.service_id
                  )
                ] ||
                "fa-solid fa-wrench"
              }
            ></i>
          </div>

          <div>
            <p className="mr-card-label">
              {tr(
                "SERVICE REQUEST",
                "طلب خدمة"
              )}
            </p>

            <h2>
              {translateServiceName(
                request.service_name ||
                  "Home Service",
                language
              )}
            </h2>
          </div>
        </div>

        <span
          className={`mr-status ${statusInfo.className}`}
        >
          <i className={statusInfo.icon}></i>
          {statusInfo.label}
        </span>
      </div>

      {/* PROGRESS */}
      <div
        className="mr-progress-area mr-card-item"
        style={{ "--item-delay": "150ms" }}
      >
        <RequestProgress
          status={status}
          language={language}
        />
      </div>

      {/* DETAILS */}
      <div
        className="mr-details-grid mr-card-item"
        style={{ "--item-delay": "220ms" }}
      >
        <div className="mr-fixer-info">
          <div className="mr-fixer-avatar">
            {initials}
          </div>

          <div className="mr-fixer-copy">
            <span>
              {tr(
                "YOUR FIXER",
                "الفني الخاص بك"
              )}
            </span>

            <strong>
              {request.technician_name ||
                tr(
                  "Fixer pending",
                  "بانتظار تعيين الفني"
                )}
            </strong>

            <p>
              <span>
                <i className="fa-solid fa-star"></i>
                {rating}
              </span>

              <span>•</span>

              <span>
                <i className="fa-solid fa-location-dot"></i>

                {request.technician_location ||
                  tr(
                    "Location unavailable",
                    "الموقع غير متاح"
                  )}
              </span>
            </p>
          </div>
        </div>

        <Detail
          label={tr(
            "REQUESTED",
            "تاريخ الطلب"
          )}
          value={formatRequestDate(
            request.created_at,
            language
          )}
        />

        <Detail
          label={tr(
            "STARTING PRICE",
            "السعر الابتدائي"
          )}
          value={price}
        />
      </div>

      {/* PROBLEM */}
      <div
        className="mr-problem-box mr-card-item"
        style={{ "--item-delay": "290ms" }}
      >
        <span>
          <i className="fa-regular fa-message"></i>

          {tr(
            "Problem details",
            "تفاصيل المشكلة"
          )}
        </span>

        <p>
          {request.problem ||
            tr(
              "No problem description.",
              "لا يوجد وصف للمشكلة."
            )}
        </p>
      </div>

      {/* ACTIONS */}
      <div
        className="mr-card-actions mr-card-item"
        style={{ "--item-delay": "360ms" }}
      >
        {request.technician_id && (
          <Link
            to={`/technicians/${request.technician_id}`}
            className="mr-secondary-action"
          >
            {tr(
              "View Fixer",
              "عرض الفني"
            )}
          </Link>
        )}

        {isCompleted ? (
          <button
            type="button"
            onClick={() => {
              alert(
                tr(
                  "Review form will be migrated next.",
                  "سيتم نقل نموذج التقييم لاحقًا."
                )
              );
            }}
            className="mr-primary-action"
          >
            {tr(
              "Leave a Review",
              "أضف تقييمًا"
            )}
          </button>
        ) : (
          <Link
            to={`/track?request=${request.id}`}
            className="mr-primary-action"
          >
            {tr(
              "Track Service",
              "تتبع الخدمة"
            )}
          </Link>
        )}
      </div>
    </article>
  );
}

function RequestProgress({
  status,
  language,
}) {
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const steps = [
    {
      key: "requested",
      label: tr(
        "Requested",
        "تم الطلب"
      ),
      icon: "fa-regular fa-file-lines",
    },
    {
      key: "accepted",
      label: tr(
        "Accepted",
        "مقبول"
      ),
      icon: "fa-solid fa-check",
    },
    {
      key: "on_the_way",
      label: tr(
        "On the way",
        "في الطريق"
      ),
      icon: "fa-solid fa-car-side",
    },
    {
      key: "in_progress",
      label: tr(
        "In progress",
        "قيد التنفيذ"
      ),
      icon: "fa-solid fa-screwdriver-wrench",
    },
    {
      key: "completed",
      label: tr(
        "Completed",
        "مكتمل"
      ),
      icon: "fa-solid fa-flag-checkered",
    },
  ];

  const normalizedStatus =
    status === "pending"
      ? "requested"
      : status === "arrived"
      ? "on_the_way"
      : status;

  let currentIndex =
    steps.findIndex(
      (step) =>
        step.key === normalizedStatus
    );

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  return (
    <div className="mr-progress">
      {steps.map(
        (step, index) => {
          const isDone =
            index < currentIndex;

          const isCurrent =
            index === currentIndex;

          return (
            <div
              key={step.key}
              className="mr-progress-step"
            >
              {index !== 0 && (
                <div
                  className={`mr-progress-line ${
                    index <= currentIndex
                      ? "done"
                      : ""
                  }`}
                ></div>
              )}

              <div
                className={`mr-progress-icon ${
                  isDone
                    ? "done"
                    : isCurrent
                    ? "current"
                    : ""
                }`}
              >
                <i className={step.icon}></i>
              </div>

              <span
                className={
                  isDone || isCurrent
                    ? "active"
                    : ""
                }
              >
                {step.label}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

const serviceIcons = {
  1: "fa-solid fa-snowflake",
  2: "fa-solid fa-droplet",
  3: "fa-solid fa-bolt",
  4: "fa-solid fa-screwdriver-wrench",
  5: "fa-solid fa-hammer",
  6: "fa-solid fa-house",
};

function getStatusInfo(
  status,
  language
) {
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const statuses = {
    pending: {
      label: tr(
        "Requested",
        "تم الطلب"
      ),
      icon: "fa-regular fa-clock",
      className: "requested",
    },

    requested: {
      label: tr(
        "Requested",
        "تم الطلب"
      ),
      icon: "fa-regular fa-clock",
      className: "requested",
    },

    accepted: {
      label: tr(
        "Accepted",
        "مقبول"
      ),
      icon: "fa-solid fa-check",
      className: "accepted",
    },

    on_the_way: {
      label: tr(
        "On the way",
        "في الطريق"
      ),
      icon: "fa-solid fa-car-side",
      className: "on-way",
    },

    arrived: {
      label: tr(
        "Arrived",
        "وصل"
      ),
      icon: "fa-solid fa-location-dot",
      className: "on-way",
    },

    in_progress: {
      label: tr(
        "In progress",
        "قيد التنفيذ"
      ),
      icon: "fa-solid fa-screwdriver-wrench",
      className: "progress",
    },

    completed: {
      label: tr(
        "Completed",
        "مكتمل"
      ),
      icon: "fa-solid fa-circle-check",
      className: "completed",
    },
  };

  return (
    statuses[status] || {
      label: status
        .replaceAll("_", " ")
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        ),
      icon: "fa-regular fa-clock",
      className: "requested",
    }
  );
}

function getInitials(name) {
  if (!name) {
    return "FX";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatRequestDate(
  value,
  language
) {
  if (!value) {
    return "—";
  }

  const normalizedValue =
    String(value).includes("T")
      ? value
      : String(value).replace(
          " ",
          "T"
        ) + "Z";

  const date =
    new Date(normalizedValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    language === "ar"
      ? "ar-SA"
      : "en",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function Detail({
  label,
  value,
}) {
  return (
    <div className="mr-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function translateServiceName(
  name,
  language
) {
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
    "Home Service":
      "خدمة منزلية",
  };

  return names[name] || name;
}

export default MyRequests;
