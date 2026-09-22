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
  const [activeTab, setActiveTab] = useState("current");
  const [notice, setNotice] = useState("");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTags, setReviewTags] = useState([]);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  async function loadRequests(showLoader = true) {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      setError("");

      const response = await fetch("/api/my-requests", {
        method: "GET",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.setItem(
          "redirectAfterLogin",
          "/my-requests"
        );

        navigate("/login", {
          replace: true,
        });

        return false;
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

      const normalized =
        Array.isArray(data.requests)
          ? data.requests.map(
              normalizeRequestGroup
            )
          : [];

      setRequests(normalized);

      return true;
    } catch (loadError) {
      console.error(
        "My Requests error:",
        loadError
      );

      setError(
        loadError.message ||
          tr(
            "Could not load your requests.",
            "تعذر تحميل طلباتك."
          )
      );

      return false;
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadRequests(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, language]);

  const counts = useMemo(() => {
    const result = {
      current: 0,
      completed: 0,
      cancelled: 0,
    };

    requests.forEach((request) => {
      const category =
        getRequestCategory(request);

      if (
        result[category] !== undefined
      ) {
        result[category] += 1;
      }
    });

    return result;
  }, [requests]);

  const visibleRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          getRequestCategory(
            request
          ) === activeTab
      ),
    [requests, activeTab]
  );

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll(
        "[data-request-card-reveal]"
      )
    );

    if (
      !(
        "IntersectionObserver" in
        window
      )
    ) {
      items.forEach(
        (item) =>
          item.classList.add(
            "mr-show"
          )
      );

      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (
                !entry.isIntersecting
              ) {
                return;
              }

              entry.target.classList.add(
                "mr-show"
              );

              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: 0.08,
          rootMargin:
            "0px 0px -45px 0px",
        }
      );

    items.forEach(
      (item) =>
        observer.observe(item)
    );

    return () =>
      observer.disconnect();
  }, [
    requests,
    activeTab,
    language,
  ]);

  useEffect(() => {
    if (
      !cancelTarget &&
      !reviewTarget
    ) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(event) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      if (
        cancelTarget &&
        !isCancelling
      ) {
        closeCancelModal();
      }

      if (
        reviewTarget &&
        !isReviewing
      ) {
        closeReviewModal();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    cancelTarget,
    reviewTarget,
    isCancelling,
    isReviewing,
  ]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          setNotice("");
        },
        4200
      );

    return () =>
      window.clearTimeout(timer);
  }, [notice]);

  function openCancelModal(
    request
  ) {
    setCancelTarget(request);
    setCancelReason("");
    setCancelNote("");
    setCancelError("");
  }

  function closeCancelModal() {
    if (isCancelling) {
      return;
    }

    setCancelTarget(null);
    setCancelReason("");
    setCancelNote("");
    setCancelError("");
  }

  async function submitCancellation() {
    if (
      !cancelTarget ||
      !cancelReason
    ) {
      setCancelError(
        tr(
          "Please choose a reason for cancelling.",
          "اختر سبب إلغاء الطلب."
        )
      );

      return;
    }

    try {
      setIsCancelling(true);
      setCancelError("");

      const response =
        await fetch(
          "/api/my-requests",
          {
            method: "POST",
            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action:
                "cancel_request",

              request_group_id:
                cancelTarget.id,

              reason_code:
                cancelReason,

              note:
                cancelNote.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        localStorage.setItem(
          "redirectAfterLogin",
          "/my-requests"
        );

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            data.message ||
            tr(
              "Could not cancel this request.",
              "تعذر إلغاء هذا الطلب."
            )
        );
      }

      setCancelTarget(null);
      setCancelReason("");
      setCancelNote("");

      await loadRequests(false);

      setActiveTab(
        "cancelled"
      );

      setNotice(
        tr(
          "Your request was cancelled. Thank you for sharing your feedback.",
          "تم إلغاء طلبك. شكرًا لمشاركتنا ملاحظاتك."
        )
      );
    } catch (submitError) {
      setCancelError(
        submitError.message ||
          tr(
            "Could not cancel this request.",
            "تعذر إلغاء هذا الطلب."
          )
      );
    } finally {
      setIsCancelling(false);
    }
  }

  function openReviewModal(
    request,
    item
  ) {
    setReviewTarget({
      request,
      item,
    });

    setReviewRating(0);
    setReviewTags([]);
    setReviewComment("");
    setReviewError("");
  }

  function closeReviewModal() {
    if (isReviewing) {
      return;
    }

    setReviewTarget(null);
    setReviewRating(0);
    setReviewTags([]);
    setReviewComment("");
    setReviewError("");
  }

  function chooseRating(value) {
    setReviewRating(value);
    setReviewTags([]);
    setReviewError("");
  }

  function toggleReviewTag(tag) {
    setReviewTags(
      (current) =>
        current.includes(tag)
          ? current.filter(
              (item) =>
                item !== tag
            )
          : [
              ...current,
              tag,
            ]
    );
  }

  async function submitReview() {
    if (
      !reviewTarget ||
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      setReviewError(
        tr(
          "Choose a star rating first.",
          "اختر عدد النجوم أولًا."
        )
      );

      return;
    }

    try {
      setIsReviewing(true);
      setReviewError("");

      const response =
        await fetch(
          "/api/my-requests",
          {
            method: "POST",
            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action:
                "submit_review",

              request_item_id:
                reviewTarget
                  .item
                  .id,

              rating:
                reviewRating,

              tags:
                reviewTags,

              comment:
                reviewComment.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (
        response.status === 401
      ) {
        localStorage.setItem(
          "redirectAfterLogin",
          "/my-requests"
        );

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            data.message ||
            tr(
              "Could not submit your review.",
              "تعذر إرسال تقييمك."
            )
        );
      }

      setReviewTarget(null);
      setReviewRating(0);
      setReviewTags([]);
      setReviewComment("");

      await loadRequests(false);

      setNotice(
        tr(
          "Thank you! Your review was submitted.",
          "شكرًا لك! تم إرسال تقييمك."
        )
      );
    } catch (submitError) {
      setReviewError(
        submitError.message ||
          tr(
            "Could not submit your review.",
            "تعذر إرسال تقييمك."
          )
      );
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
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
                "Follow current jobs, revisit completed services, and keep your cancelled requests in one place.",
                "تابع طلباتك الحالية، وراجع الخدمات المكتملة، واحتفظ بسجل الطلبات الملغاة في مكان واحد."
              )}
            </p>
          </div>

          <div
            className="mr-count-card mr-reveal"
            data-request-card-reveal
            style={{
              "--mr-delay":
                "100ms",
            }}
          >
            <strong>
              {isLoading ||
              error
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
          {!isLoading &&
            !error &&
            requests.length >
              0 && (
              <div
                role="tablist"
                aria-label={tr(
                  "Request categories",
                  "تصنيفات الطلبات"
                )}
                style={
                  styles.tabs
                }
              >
                {[
                  {
                    key:
                      "current",
                    en:
                      "Current",
                    ar:
                      "الحالية",
                    count:
                      counts.current,
                  },

                  {
                    key:
                      "completed",
                    en:
                      "Completed",
                    ar:
                      "المكتملة",
                    count:
                      counts.completed,
                  },

                  {
                    key:
                      "cancelled",
                    en:
                      "Cancelled",
                    ar:
                      "الملغاة",
                    count:
                      counts.cancelled,
                  },
                ].map(
                  (tab) => {
                    const active =
                      activeTab ===
                      tab.key;

                    return (
                      <button
                        key={
                          tab.key
                        }
                        type="button"
                        role="tab"
                        aria-selected={
                          active
                        }
                        onClick={() =>
                          setActiveTab(
                            tab.key
                          )
                        }
                        style={tabButtonStyle(
                          active
                        )}
                      >
                        <span>
                          {tr(
                            tab.en,
                            tab.ar
                          )}
                        </span>

                        <span
                          style={tabCountStyle(
                            active
                          )}
                        >
                          {
                            tab.count
                          }
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}

          {notice && (
            <div
              style={
                styles.notice
              }
              role="status"
            >
              <i className="fa-solid fa-circle-check"></i>

              <span>
                {notice}
              </span>
            </div>
          )}

          {isLoading && (
            <div className="mr-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>

              {tr(
                "Loading your requests...",
                "جارٍ تحميل طلباتك..."
              )}
            </div>
          )}

          {!isLoading &&
            error && (
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

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadRequests(
                      true
                    )
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
            requests.length ===
              0 && (
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
            requests.length >
              0 &&
            visibleRequests.length ===
              0 && (
              <div className="mr-state-card">
                <div className="mr-state-icon empty">
                  <i
                    className={
                      activeTab ===
                      "completed"
                        ? "fa-solid fa-circle-check"
                        : activeTab ===
                          "cancelled"
                        ? "fa-regular fa-circle-xmark"
                        : "fa-regular fa-clock"
                    }
                  ></i>
                </div>

                <h2>
                  {activeTab ===
                  "completed"
                    ? tr(
                        "No completed requests yet",
                        "لا توجد طلبات مكتملة بعد"
                      )
                    : activeTab ===
                      "cancelled"
                    ? tr(
                        "No cancelled requests",
                        "لا توجد طلبات ملغاة"
                      )
                    : tr(
                        "No current requests",
                        "لا توجد طلبات حالية"
                      )}
                </h2>

                <p>
                  {activeTab ===
                  "current"
                    ? tr(
                        "New and active service requests will appear here.",
                        "ستظهر هنا الطلبات الجديدة والطلبات قيد التنفيذ."
                      )
                    : activeTab ===
                      "completed"
                    ? tr(
                        "Completed services will stay here so you can review your Fixer later.",
                        "ستبقى الخدمات المكتملة هنا لتتمكن من تقييم الفني لاحقًا."
                      )
                    : tr(
                        "Cancelled requests will remain here as part of your service history.",
                        "ستبقى الطلبات الملغاة هنا ضمن سجل خدماتك."
                      )}
                </p>
              </div>
            )}

          {!isLoading &&
            !error &&
            visibleRequests.length >
              0 && (
              <div className="mr-requests-list">
                {visibleRequests.map(
                  (
                    request,
                    index
                  ) => (
                    <RequestGroupCard
                      key={
                        request.id
                      }
                      request={
                        request
                      }
                      language={
                        language
                      }
                      isArabic={
                        isArabic
                      }
                      delay={`${
                        index *
                        70
                      }ms`}
                      onCancel={() =>
                        openCancelModal(
                          request
                        )
                      }
                      onReview={(
                        item
                      ) =>
                        openReviewModal(
                          request,
                          item
                        )
                      }
                    />
                  )
                )}
              </div>
            )}
        </div>
      </section>

      {cancelTarget && (
        <CancelModal
          language={
            language
          }
          isArabic={
            isArabic
          }
          request={
            cancelTarget
          }
          reason={
            cancelReason
          }
          note={
            cancelNote
          }
          error={
            cancelError
          }
          isSubmitting={
            isCancelling
          }
          onReasonChange={
            setCancelReason
          }
          onNoteChange={
            setCancelNote
          }
          onClose={
            closeCancelModal
          }
          onSubmit={
            submitCancellation
          }
        />
      )}

      {reviewTarget && (
        <ReviewModal
          language={
            language
          }
          isArabic={
            isArabic
          }
          item={
            reviewTarget
              .item
          }
          rating={
            reviewRating
          }
          tags={
            reviewTags
          }
          comment={
            reviewComment
          }
          error={
            reviewError
          }
          isSubmitting={
            isReviewing
          }
          onRatingChange={
            chooseRating
          }
          onTagToggle={
            toggleReviewTag
          }
          onCommentChange={
            setReviewComment
          }
          onClose={
            closeReviewModal
          }
          onSubmit={
            submitReview
          }
        />
      )}

      <Footer />
    </main>
  );
}


/* =========================================================
   REQUEST GROUP CARD
   ========================================================= */

function RequestGroupCard({
  request,
  language,
  isArabic,
  delay,
  onCancel,
  onReview,
}) {
  const tr = (en, ar) =>
    language === "ar"
      ? ar
      : en;

  const category =
    getRequestCategory(
      request
    );

  const items =
    Array.isArray(
      request.items
    )
      ? request.items
      : [];

  return (
    <article
      className="mr-request-card mr-reveal"
      data-request-card-reveal
      style={{
        "--mr-delay":
          delay,
      }}
    >
      <span
        className="mr-promo-orb mr-promo-orb-one"
        aria-hidden="true"
      ></span>

      <span
        className="mr-promo-orb mr-promo-orb-two"
        aria-hidden="true"
      ></span>

      <div
        className="mr-card-top mr-card-item"
        style={{
          "--item-delay":
            "70ms",
        }}
      >
        <div className="mr-service-wrap">
          <div className="mr-service-icon">
            <i
              className={
                items.length >
                1
                  ? "fa-solid fa-layer-group"
                  : serviceIcons[
                      Number(
                        items[0]
                          ?.service_id
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
              {items.length >
              1
                ? tr(
                    `${items.length} services in this request`,
                    `${items.length} خدمات في هذا الطلب`
                  )
                : translateServiceName(
                    items[0]
                      ?.service_name ||
                      "Home Service",
                    language
                  )}
            </h2>
          </div>
        </div>

        <span
          className={`mr-status ${
            category ===
            "completed"
              ? "completed"
              : category ===
                "cancelled"
              ? "requested"
              : "accepted"
          }`}
        >
          <i
            className={
              category ===
              "completed"
                ? "fa-solid fa-circle-check"
                : category ===
                  "cancelled"
                ? "fa-regular fa-circle-xmark"
                : "fa-regular fa-clock"
            }
          ></i>

          {category ===
          "completed"
            ? tr(
                "Completed",
                "مكتمل"
              )
            : category ===
              "cancelled"
            ? tr(
                "Cancelled",
                "ملغى"
              )
            : tr(
                "Current",
                "حالي"
              )}
        </span>
      </div>

      <div
        className="mr-details-grid mr-card-item"
        style={{
          "--item-delay":
            "120ms",
        }}
      >
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
            "SERVICES",
            "الخدمات"
          )}
          value={String(
            items.length
          )}
        />
      </div>

      <div
        className="mr-card-item"
        style={{
          "--item-delay":
            "180ms",

          display:
            "grid",

          gap:
            "18px",

          marginTop:
            "18px",
        }}
      >
        {items.map(
          (
            item,
            index
          ) => (
            <ServiceItem
              key={
                item.id
              }
              item={
                item
              }
              index={
                index
              }
              totalItems={
                items.length
              }
              language={
                language
              }
              isArabic={
                isArabic
              }
              onReview={() =>
                onReview(
                  item
                )
              }
            />
          )
        )}
      </div>

      {category ===
        "cancelled" &&
        request.cancellation && (
          <div
            className="mr-problem-box mr-card-item"
            style={{
              "--item-delay":
                "260ms",

              marginTop:
                "18px",
            }}
          >
            <span>
              <i className="fa-regular fa-comment-dots"></i>

              {tr(
                "Cancellation feedback",
                "ملاحظات الإلغاء"
              )}
            </span>

            <p>
              <strong>
                {getCancellationReasonLabel(
                  request
                    .cancellation
                    .reason_code,
                  language
                )}
              </strong>

              {request
                .cancellation
                .note
                ? ` — ${request.cancellation.note}`
                : ""}
            </p>
          </div>
        )}

      {category === "current" && (
        <div
          className="mr-card-actions mr-card-item"
          style={{
            "--item-delay": "320ms",
            marginTop: "18px",
            justifyContent: request.can_cancel
              ? "space-between"
              : "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {request.can_cancel && (
            <button
              type="button"
              className="mr-secondary-action"
              onClick={onCancel}
              style={styles.cancelButton}
            >
              <i className="fa-regular fa-circle-xmark"></i>

              {tr(
                "Cancel Request",
                "إلغاء الطلب"
              )}
            </button>
          )}

          <Link
            to={`/track?request=${encodeURIComponent(
              request.id
            )}`}
            className="mr-primary-action"
          >
            {tr(
              "Track Request",
              "تتبع الطلب"
            )}

            <i
              className={`fa-solid ${
                isArabic
                  ? "fa-arrow-left"
                  : "fa-arrow-right"
              }`}
            ></i>
          </Link>
        </div>
      )}

    </article>
  );
}


/* =========================================================
   SERVICE ITEM
   ========================================================= */

function ServiceItem({
  item,
  index,
  totalItems,
  language,
  isArabic,
  onReview,
}) {
  const tr = (en, ar) =>
    language === "ar"
      ? ar
      : en;

  const status =
    normalizeStatus(
      item.status
    );

  const statusInfo =
    getStatusInfo(
      status,
      language
    );

  const completed =
    status ===
    "completed";

  const cancelled =
    status ===
    "cancelled";

  const technicianRating =
    item.technician_rating !==
      null &&
    item.technician_rating !==
      undefined
      ? Number(
          item.technician_rating
        ).toFixed(1)
      : "—";

  const technicianPrice =
    item.technician_price !==
      null &&
    item.technician_price !==
      undefined
      ? `${Number(
          item.technician_price
        ).toFixed(0)} ${
          language ===
          "ar"
            ? "ر.س"
            : "SAR"
        }`
      : "—";

  const hasReview =
    Boolean(
      item.review
    );

  return (
    <section
      style={{
        paddingTop:
          totalItems >
            1 &&
          index >
            0
            ? "20px"
            : 0,

        borderTop:
          totalItems >
            1 &&
          index >
            0
            ? "1px solid #e7eeeb"
            : "none",
      }}
    >
      {totalItems >
        1 && (
          <div
            style={
              styles.serviceNumberRow
            }
          >
            <span
              style={
                styles.serviceNumberBadge
              }
            >
              {tr(
                `Service ${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}`,
                `الخدمة ${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}`
              )}
            </span>
          </div>
        )}

      <div
        className="mr-card-top"
        style={{
          marginTop:
            totalItems >
            1
              ? 12
              : 0,
        }}
      >
        <div className="mr-service-wrap">
          <div className="mr-service-icon">
            <i
              className={
                serviceIcons[
                  Number(
                    item.service_id
                  )
                ] ||
                "fa-solid fa-wrench"
              }
            ></i>
          </div>

          <div>
            <p className="mr-card-label">
              {tr(
                "SERVICE",
                "الخدمة"
              )}
            </p>

            <h2>
              {translateServiceName(
                item.service_name ||
                  "Home Service",
                language
              )}
            </h2>
          </div>
        </div>

        <span
          className={`mr-status ${statusInfo.className}`}
        >
          <i
            className={
              statusInfo.icon
            }
          ></i>

          {
            statusInfo.label
          }
        </span>
      </div>

      {!cancelled && (
        <div
          className="mr-progress-area"
          style={{
            marginTop:
              18,
          }}
        >
          <RequestProgress
            status={
              status
            }
            language={
              language
            }
          />
        </div>
      )}

      {cancelled && (
        <div
          style={
            styles.cancelledStrip
          }
        >
          <i className="fa-regular fa-circle-xmark"></i>

          <span>
            {tr(
              "This service was cancelled before work started.",
              "تم إلغاء هذه الخدمة قبل بدء العمل."
            )}
          </span>
        </div>
      )}

      <div
        className="mr-details-grid"
        style={{
          marginTop:
            18,
        }}
      >
        <div className="mr-fixer-info">
          <div className="mr-fixer-avatar">
            {getInitials(
              item.technician_name
            )}
          </div>

          <div className="mr-fixer-copy">
            <span>
              {tr(
                "YOUR FIXER",
                "الفني الخاص بك"
              )}
            </span>

            <strong>
              {item.technician_name ||
                tr(
                  "Fixer pending",
                  "بانتظار تعيين الفني"
                )}
            </strong>

            <p>
              <span>
                <i className="fa-solid fa-star"></i>

                {
                  technicianRating
                }
              </span>

              <span>
                •
              </span>

              <span>
                <i className="fa-solid fa-location-dot"></i>

                {item.technician_location ||
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
            "STARTING PRICE",
            "السعر الابتدائي"
          )}
          value={
            technicianPrice
          }
        />
      </div>

      <div
        className="mr-problem-box"
        style={{
          marginTop:
            18,
        }}
      >
        <span>
          <i className="fa-regular fa-message"></i>

          {tr(
            "Problem details",
            "تفاصيل المشكلة"
          )}
        </span>

        <p>
          {item.problem ||
            tr(
              "No problem description.",
              "لا يوجد وصف للمشكلة."
            )}
        </p>
      </div>

      {hasReview && (
        <ReviewSummary
          review={
            item.review
          }
          language={
            language
          }
        />
      )}

      {(item.technician_id ||
        (completed &&
          !hasReview &&
          item.can_review)) && (
        <div
          className="mr-card-actions"
          style={{
            marginTop: 18,
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {item.technician_id && (
            <Link
              to={`/technicians/${item.technician_id}`}
              className="mr-secondary-action"
            >
              {tr(
                "View Fixer",
                "عرض الفني"
              )}
            </Link>
          )}

          {completed &&
            !hasReview &&
            item.can_review && (
              <button
                type="button"
                className="mr-primary-action"
                onClick={onReview}
              >
                <i className="fa-regular fa-star"></i>

                {tr(
                  "Rate your Fixer",
                  "قيّم الفني"
                )}
              </button>
            )}
        </div>
      )}
    </section>
  );
}


/* =========================================================
   SAVED REVIEW
   ========================================================= */

function ReviewSummary({
  review,
  language,
}) {
  const tr = (en, ar) =>
    language === "ar"
      ? ar
      : en;

  const rating =
    Number(
      review?.rating ||
        0
    );

  const tags =
    Array.isArray(
      review?.tags
    )
      ? review.tags
      : [];

  return (
    <div
      style={
        styles.reviewSummary
      }
    >
      <div
        style={
          styles.reviewSummaryTop
        }
      >
        <div>
          <span
            style={
              styles.reviewKicker
            }
          >
            {tr(
              "YOUR REVIEW",
              "تقييمك"
            )}
          </span>

          <div
            style={
              styles.reviewStarsStatic
            }
          >
            {Array.from(
              {
                length:
                  5,
              },
              (
                _,
                index
              ) => (
                <i
                  key={
                    index
                  }
                  className={
                    index <
                    rating
                      ? "fa-solid fa-star"
                      : "fa-regular fa-star"
                  }
                ></i>
              )
            )}
          </div>
        </div>

        <strong
          style={
            styles.reviewScore
          }
        >
          {rating}/5
        </strong>
      </div>

      {tags.length >
        0 && (
          <div
            style={
              styles.reviewTagList
            }
          >
            {tags.map(
              (tag) => (
                <span
                  key={
                    tag
                  }
                  style={
                    styles.savedReviewTag
                  }
                >
                  {getReviewTagLabel(
                    tag,
                    language
                  )}
                </span>
              )
            )}
          </div>
        )}

      {review.comment && (
        <p
          style={
            styles.reviewComment
          }
        >
          “
          {
            review.comment
          }
          ”
        </p>
      )}
    </div>
  );
}


/* =========================================================
   CANCEL POPUP
   ========================================================= */

function CancelModal({
  language,
  isArabic,
  request,
  reason,
  note,
  error,
  isSubmitting,
  onReasonChange,
  onNoteChange,
  onClose,
  onSubmit,
}) {
  const tr = (en, ar) =>
    language === "ar"
      ? ar
      : en;

  const reasons = [
    {
      value:
        "plans_changed",

      icon:
        "fa-regular fa-calendar-xmark",

      en:
        "Plans changed",

      ar:
        "تغيّرت خططي",
    },

    {
      value:
        "problem_resolved",

      icon:
        "fa-solid fa-check",

      en:
        "Problem resolved",

      ar:
        "تم حل المشكلة",
    },

    {
      value:
        "found_another_fixer",

      icon:
        "fa-solid fa-user-check",

      en:
        "Found another Fixer",

      ar:
        "وجدت فنيًا آخر",
    },

    {
      value:
        "timing_issue",

      icon:
        "fa-regular fa-clock",

      en:
        "Timing doesn't work",

      ar:
        "الوقت غير مناسب",
    },

    {
      value:
        "selected_by_mistake",

      icon:
        "fa-solid fa-arrow-rotate-left",

      en:
        "Selected by mistake",

      ar:
        "تم الطلب بالخطأ",
    },

    {
      value:
        "other",

      icon:
        "fa-regular fa-message",

      en:
        "Other",

      ar:
        "سبب آخر",
    },
  ];

  return (
    <div
      style={
        styles.overlay
      }
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !isSubmitting
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-request-title"
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        style={
          styles.modal
        }
      >
        <button
          type="button"
          onClick={
            onClose
          }
          disabled={
            isSubmitting
          }
          aria-label={tr(
            "Close",
            "إغلاق"
          )}
          style={
            styles.closeButton
          }
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div
          style={
            styles.modalIconDanger
          }
        >
          <i className="fa-regular fa-comment-dots"></i>
        </div>

        <p
          style={
            styles.modalKicker
          }
        >
          {tr(
            "BEFORE YOU GO",
            "قبل الإلغاء"
          )}
        </p>

        <h2
          id="cancel-request-title"
          style={
            styles.modalTitle
          }
        >
          {tr(
            "We'd love to know why",
            "نحب نعرف سبب الإلغاء"
          )}
        </h2>

        <p
          style={
            styles.modalText
          }
        >
          {tr(
            "Your feedback helps us improve Fixer.Co. Choose the closest reason, and add a note if you'd like.",
            "ملاحظتك تساعدنا نحسّن Fixer.Co. اختر السبب الأقرب، وإذا حبيت اكتب لنا تفاصيل أكثر."
          )}
        </p>

        <div
          style={
            styles.choiceGrid
          }
        >
          {reasons.map(
            (item) => {
              const selected =
                reason ===
                item.value;

              return (
                <button
                  key={
                    item.value
                  }
                  type="button"
                  onClick={() =>
                    onReasonChange(
                      item.value
                    )
                  }
                  disabled={
                    isSubmitting
                  }
                  style={choiceButtonStyle(
                    selected
                  )}
                >
                  <i
                    className={
                      item.icon
                    }
                  ></i>

                  <span>
                    {tr(
                      item.en,
                      item.ar
                    )}
                  </span>
                </button>
              );
            }
          )}
        </div>

        <label
          style={
            styles.fieldLabel
          }
        >
          {tr(
            "Anything else you'd like us to know?",
            "في شيء ثاني حاب تخبرنا فيه؟"
          )}
        </label>

        <textarea
          value={
            note
          }
          onChange={(
            event
          ) =>
            onNoteChange(
              event.target
                .value
            )
          }
          maxLength={
            1000
          }
          disabled={
            isSubmitting
          }
          placeholder={tr(
            "Tell us more... (optional)",
            "اكتب لنا أكثر... (اختياري)"
          )}
          style={
            styles.textarea
          }
        />

        <div
          style={
            styles.characterCount
          }
        >
          {note.length}
          /1000
        </div>

        {error && (
          <div
            style={
              styles.modalError
            }
          >
            {error}
          </div>
        )}

        <div
          style={
            styles.modalActions
          }
        >
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSubmitting
            }
            style={
              styles.secondaryModalButton
            }
          >
            {tr(
              "Keep Request",
              "الاحتفاظ بالطلب"
            )}
          </button>

          <button
            type="button"
            onClick={
              onSubmit
            }
            disabled={
              isSubmitting ||
              !reason
            }
            style={primaryDangerButtonStyle(
              isSubmitting ||
                !reason
            )}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>

                {tr(
                  "Cancelling...",
                  "جارٍ الإلغاء..."
                )}
              </>
            ) : (
              <>
                <i className="fa-regular fa-circle-xmark"></i>

                {tr(
                  "Cancel Request",
                  "إلغاء الطلب"
                )}
              </>
            )}
          </button>
        </div>

        <p
          style={
            styles.modalFinePrint
          }
        >
          {tr(
            `${
              request.items
                ?.length ||
              1
            } service${
              (request.items
                ?.length ||
                1) ===
              1
                ? ""
                : "s"
            } will be cancelled together.`,

            `سيتم إلغاء ${
              request.items
                ?.length ||
              1
            } ${
              (request.items
                ?.length ||
                1) ===
              1
                ? "خدمة"
                : "خدمات"
            } ضمن هذا الطلب.`
          )}
        </p>
      </div>
    </div>
  );
}


/* =========================================================
   REVIEW POPUP
   ========================================================= */

function ReviewModal({
  language,
  isArabic,
  item,
  rating,
  tags,
  comment,
  error,
  isSubmitting,
  onRatingChange,
  onTagToggle,
  onCommentChange,
  onClose,
  onSubmit,
}) {
  const tr = (en, ar) =>
    language === "ar"
      ? ar
      : en;

  const suggestions =
    getReviewSuggestions(
      rating
    );

  return (
    <div
      style={
        styles.overlay
      }
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !isSubmitting
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rate-fixer-title"
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        style={
          styles.modal
        }
      >
        <button
          type="button"
          onClick={
            onClose
          }
          disabled={
            isSubmitting
          }
          aria-label={tr(
            "Close",
            "إغلاق"
          )}
          style={
            styles.closeButton
          }
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div
          style={
            styles.modalIconSuccess
          }
        >
          <i className="fa-regular fa-star"></i>
        </div>

        <p
          style={
            styles.modalKicker
          }
        >
          {tr(
            "YOUR EXPERIENCE",
            "تجربتك"
          )}
        </p>

        <h2
          id="rate-fixer-title"
          style={
            styles.modalTitle
          }
        >
          {tr(
            "Rate your Fixer",
            "قيّم الفني"
          )}
        </h2>

        <p
          style={
            styles.modalText
          }
        >
          {item.technician_name
            ? tr(
                `How was your experience with ${item.technician_name}?`,
                `كيف كانت تجربتك مع ${item.technician_name}؟`
              )
            : tr(
                "How was your service experience?",
                "كيف كانت تجربتك مع الخدمة؟"
              )}
        </p>

        <div
          style={
            styles.starPicker
          }
        >
          {Array.from(
            {
              length:
                5,
            },
            (
              _,
              index
            ) => {
              const value =
                index +
                1;

              const selected =
                value <=
                rating;

              return (
                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={() =>
                    onRatingChange(
                      value
                    )
                  }
                  disabled={
                    isSubmitting
                  }
                  aria-label={tr(
                    `${value} star${
                      value ===
                      1
                        ? ""
                        : "s"
                    }`,
                    `${value} نجوم`
                  )}
                  style={starButtonStyle(
                    selected
                  )}
                >
                  <i
                    className={
                      selected
                        ? "fa-solid fa-star"
                        : "fa-regular fa-star"
                    }
                  ></i>
                </button>
              );
            }
          )}
        </div>

        <div
          style={
            styles.ratingCaption
          }
        >
          {rating >
          0
            ? getRatingCaption(
                rating,
                language
              )
            : tr(
                "Tap a star to start",
                "اختر عدد النجوم للبدء"
              )}
        </div>

        {rating >
          0 && (
          <>
            <label
              style={
                styles.fieldLabel
              }
            >
              {tr(
                "What stood out?",
                "ما الذي لفت انتباهك؟"
              )}
            </label>

            <div
              style={
                styles.reviewSuggestionWrap
              }
            >
              {suggestions.map(
                (tag) => {
                  const selected =
                    tags.includes(
                      tag
                    );

                  return (
                    <button
                      key={
                        tag
                      }
                      type="button"
                      onClick={() =>
                        onTagToggle(
                          tag
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                      style={reviewTagButtonStyle(
                        selected
                      )}
                    >
                      {selected && (
                        <i className="fa-solid fa-check"></i>
                      )}

                      {getReviewTagLabel(
                        tag,
                        language
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </>
        )}

        <label
          style={
            styles.fieldLabel
          }
        >
          {tr(
            "Want to say more?",
            "حاب تضيف شيء؟"
          )}
        </label>

        <textarea
          value={
            comment
          }
          onChange={(
            event
          ) =>
            onCommentChange(
              event.target
                .value
            )
          }
          maxLength={
            1000
          }
          disabled={
            isSubmitting
          }
          placeholder={tr(
            "Share your experience... (optional)",
            "شاركنا تجربتك... (اختياري)"
          )}
          style={
            styles.textarea
          }
        />

        <div
          style={
            styles.characterCount
          }
        >
          {comment.length}
          /1000
        </div>

        {error && (
          <div
            style={
              styles.modalError
            }
          >
            {error}
          </div>
        )}

        <div
          style={
            styles.modalActions
          }
        >
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSubmitting
            }
            style={
              styles.secondaryModalButton
            }
          >
            {tr(
              "Not Now",
              "لاحقًا"
            )}
          </button>

          <button
            type="button"
            onClick={
              onSubmit
            }
            disabled={
              isSubmitting ||
              rating ===
                0
            }
            style={primaryReviewButtonStyle(
              isSubmitting ||
                rating ===
                  0
            )}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>

                {tr(
                  "Submitting...",
                  "جارٍ الإرسال..."
                )}
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>

                {tr(
                  "Submit Review",
                  "إرسال التقييم"
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   PROGRESS
   ========================================================= */

function RequestProgress({
  status,
  language,
}) {
  const tr = (en, ar) =>
    language === "ar"
      ? ar
      : en;

  const steps = [
    {
      key:
        "requested",

      label:
        tr(
          "Requested",
          "تم الطلب"
        ),

      icon:
        "fa-regular fa-file-lines",
    },

    {
      key:
        "accepted",

      label:
        tr(
          "Accepted",
          "مقبول"
        ),

      icon:
        "fa-solid fa-check",
    },

    {
      key:
        "on_the_way",

      label:
        tr(
          "On the way",
          "في الطريق"
        ),

      icon:
        "fa-solid fa-car-side",
    },

    {
      key:
        "in_progress",

      label:
        tr(
          "In progress",
          "قيد التنفيذ"
        ),

      icon:
        "fa-solid fa-screwdriver-wrench",
    },

    {
      key:
        "completed",

      label:
        tr(
          "Completed",
          "مكتمل"
        ),

      icon:
        "fa-solid fa-flag-checkered",
    },
  ];

  const normalizedStatus =
    status === "pending"
      ? "requested"
      : status ===
        "arrived"
      ? "on_the_way"
      : status;

  let currentIndex =
    steps.findIndex(
      (step) =>
        step.key ===
        normalizedStatus
    );

  if (
    currentIndex <
    0
  ) {
    currentIndex =
      0;
  }

  return (
    <div className="mr-progress">
      {steps.map(
        (
          step,
          index
        ) => {
          const isDone =
            index <
            currentIndex;

          const isCurrent =
            index ===
            currentIndex;

          return (
            <div
              key={
                step.key
              }
              className="mr-progress-step"
            >
              {index !==
                0 && (
                <div
                  className={`mr-progress-line ${
                    index <=
                    currentIndex
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
                <i
                  className={
                    step.icon
                  }
                ></i>
              </div>

              <span
                className={
                  isDone ||
                  isCurrent
                    ? "active"
                    : ""
                }
              >
                {
                  step.label
                }
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

const serviceIcons = {
  1:
    "fa-solid fa-snowflake",

  2:
    "fa-solid fa-droplet",

  3:
    "fa-solid fa-bolt",

  4:
    "fa-solid fa-screwdriver-wrench",

  5:
    "fa-solid fa-hammer",

  6:
    "fa-solid fa-house",
};

function normalizeRequestGroup(
  request
) {
  if (
    Array.isArray(
      request?.items
    )
  ) {
    const normalizedItems =
      request.items.map(
        (item) => ({
          ...item,

          status:
            normalizeStatus(
              item.status
            ),

          review:
            item.review ||
            null,
        })
      );

    return {
      ...request,

      items:
        normalizedItems,

      category:
        request.category ||
        classifyItems(
          normalizedItems
        ),

      can_cancel:
        request.can_cancel !==
        undefined
          ? Boolean(
              request.can_cancel
            )
          : normalizedItems.length >
              0 &&
            normalizedItems.every(
              (item) =>
                normalizeStatus(
                  item.status
                ) ===
                "requested"
            ),
    };
  }

  const oldStatus =
    normalizeStatus(
      request?.status
    );

  const item = {
    id:
      String(
        request?.id ??
          ""
      ),

    slot_number:
      1,

    service_id:
      request?.service_id,

    service_name:
      request?.service_name,

    technician_id:
      request?.technician_id,

    technician_name:
      request?.technician_name,

    technician_rating:
      request?.technician_rating,

    technician_location:
      request?.technician_location,

    technician_price:
      request?.technician_price ??
      request?.starting_price ??
      null,

    problem:
      request?.problem,

    status:
      oldStatus,

    created_at:
      request?.created_at,

    review:
      request?.review ||
      null,

    can_review:
      oldStatus ===
        "completed" &&
      Boolean(
        request?.technician_id
      ) &&
      !request?.review,
  };

  return {
    id:
      String(
        request?.request_group_id ??
          request?.id ??
          ""
      ),

    created_at:
      request?.created_at,

    items: [
      item,
    ],

    cancellation:
      request?.cancellation ||
      null,

    category:
      classifyItems([
        item,
      ]),

    can_cancel:
      oldStatus ===
      "requested",
  };
}

function normalizeStatus(
  value
) {
  const status =
    String(
      value ||
        "requested"
    )
      .trim()
      .toLowerCase();

  return status ===
    "pending"
    ? "requested"
    : status;
}

function classifyItems(
  items
) {
  if (
    !Array.isArray(
      items
    ) ||
    items.length ===
      0
  ) {
    return "current";
  }

  const statuses =
    items.map(
      (item) =>
        normalizeStatus(
          item.status
        )
    );

  if (
    statuses.every(
      (status) =>
        status ===
        "cancelled"
    )
  ) {
    return "cancelled";
  }

  if (
    statuses.every(
      (status) =>
        status ===
        "completed"
    )
  ) {
    return "completed";
  }

  return "current";
}

function getRequestCategory(
  request
) {
  if (
    request?.category ===
      "current" ||
    request?.category ===
      "completed" ||
    request?.category ===
      "cancelled"
  ) {
    return request.category;
  }

  return classifyItems(
    request?.items ||
      []
  );
}

function getStatusInfo(
  status,
  language
) {
  const tr = (en, ar) =>
    language === "ar"
      ? ar
      : en;

  const statuses = {
    requested: {
      label:
        tr(
          "Requested",
          "تم الطلب"
        ),

      icon:
        "fa-regular fa-clock",

      className:
        "requested",
    },

    accepted: {
      label:
        tr(
          "Accepted",
          "مقبول"
        ),

      icon:
        "fa-solid fa-check",

      className:
        "accepted",
    },

    on_the_way: {
      label:
        tr(
          "On the way",
          "في الطريق"
        ),

      icon:
        "fa-solid fa-car-side",

      className:
        "on-way",
    },

    arrived: {
      label:
        tr(
          "Arrived",
          "وصل"
        ),

      icon:
        "fa-solid fa-location-dot",

      className:
        "on-way",
    },

    in_progress: {
      label:
        tr(
          "In progress",
          "قيد التنفيذ"
        ),

      icon:
        "fa-solid fa-screwdriver-wrench",

      className:
        "progress",
    },

    completed: {
      label:
        tr(
          "Completed",
          "مكتمل"
        ),

      icon:
        "fa-solid fa-circle-check",

      className:
        "completed",
    },

    cancelled: {
      label:
        tr(
          "Cancelled",
          "ملغى"
        ),

      icon:
        "fa-regular fa-circle-xmark",

      className:
        "requested",
    },
  };

  return (
    statuses[
      status
    ] || {
      label:
        status
          .replaceAll(
            "_",
            " "
          )
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase()
          ),

      icon:
        "fa-regular fa-clock",

      className:
        "requested",
    }
  );
}

function getInitials(
  name
) {
  if (!name) {
    return "FX";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word[0]
    )
    .join("")
    .substring(
      0,
      2
    )
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
    String(value).includes(
      "T"
    )
      ? value
      : `${String(
          value
        ).replace(
          " ",
          "T"
        )}Z`;

  const date =
    new Date(
      normalizedValue
    );

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
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  ).format(date);
}

function Detail({
  label,
  value,
}) {
  return (
    <div className="mr-detail">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function translateServiceName(
  name,
  language
) {
  if (
    language !==
    "ar"
  ) {
    return name;
  }

  const names = {
    "AC & Cooling":
      "التكييف والتبريد",

    Plumbing:
      "السباكة",

    Electrical:
      "الكهرباء",

    Appliances:
      "الأجهزة المنزلية",

    Furniture:
      "الأثاث",

    "Carpentry & Furniture":
      "النجارة والأثاث",

    General:
      "الصيانة العامة",

    "General Maintenance":
      "الصيانة العامة",

    "Home Service":
      "خدمة منزلية",
  };

  return (
    names[name] ||
    name
  );
}

function getCancellationReasonLabel(
  reason,
  language
) {
  const labels = {
    plans_changed: [
      "Plans changed",
      "تغيّرت خططي",
    ],

    problem_resolved: [
      "Problem resolved",
      "تم حل المشكلة",
    ],

    found_another_fixer: [
      "Found another Fixer",
      "وجدت فنيًا آخر",
    ],

    timing_issue: [
      "Timing didn't work",
      "الوقت لم يكن مناسبًا",
    ],

    selected_by_mistake: [
      "Selected by mistake",
      "تم الطلب بالخطأ",
    ],

    other: [
      "Other reason",
      "سبب آخر",
    ],
  };

  const label =
    labels[
      reason
    ] ||
    labels.other;

  return language ===
    "ar"
    ? label[1]
    : label[0];
}

function getReviewSuggestions(
  rating
) {
  if (
    rating >=
    4
  ) {
    return [
      "professional",
      "on_time",
      "great_communication",
      "problem_solved",
      "fair_price",
      "clean_work",
    ];
  }

  if (
    rating ===
    3
  ) {
    return [
      "professional",
      "great_communication",
      "arrived_late",
      "problem_not_solved",
      "price_issue",
      "other",
    ];
  }

  return [
    "arrived_late",
    "problem_not_solved",
    "poor_communication",
    "price_issue",
    "other",
  ];
}

function getReviewTagLabel(
  tag,
  language
) {
  const labels = {
    professional: [
      "Professional",
      "محترف",
    ],

    on_time: [
      "On time",
      "ملتزم بالوقت",
    ],

    great_communication: [
      "Great communication",
      "تواصل ممتاز",
    ],

    problem_solved: [
      "Problem solved",
      "حل المشكلة",
    ],

    fair_price: [
      "Fair price",
      "سعر مناسب",
    ],

    clean_work: [
      "Clean work",
      "عمل مرتب ونظيف",
    ],

    arrived_late: [
      "Arrived late",
      "وصل متأخرًا",
    ],

    problem_not_solved: [
      "Problem not fully solved",
      "المشكلة لم تُحل بالكامل",
    ],

    poor_communication: [
      "Poor communication",
      "التواصل غير جيد",
    ],

    price_issue: [
      "Price issue",
      "مشكلة في السعر",
    ],

    other: [
      "Other",
      "أخرى",
    ],
  };

  const label =
    labels[tag] || [
      tag,
      tag,
    ];

  return language ===
    "ar"
    ? label[1]
    : label[0];
}

function getRatingCaption(
  rating,
  language
) {
  const captions = {
    1: [
      "Very disappointing",
      "تجربة غير مرضية",
    ],

    2: [
      "Needs improvement",
      "تحتاج لتحسين",
    ],

    3: [
      "It was okay",
      "كانت مقبولة",
    ],

    4: [
      "Great experience",
      "تجربة رائعة",
    ],

    5: [
      "Excellent!",
      "ممتازة!",
    ],
  };

  const caption =
    captions[
      rating
    ] ||
    captions[3];

  return language ===
    "ar"
    ? caption[1]
    : caption[0];
}


/* =========================================================
   INLINE STYLES
   No MyRequests.css changes needed
   ========================================================= */

const styles = {
  tabs: {
    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      "10px",

    marginBottom:
      "26px",
  },

  notice: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "10px",

    marginBottom:
      "20px",

    padding:
      "14px 16px",

    border:
      "1px solid #cfe6dc",

    borderRadius:
      "12px",

    background:
      "#f0f8f5",

    color:
      "#2f7f66",

    fontSize:
      "13px",

    fontWeight:
      700,
  },

  cancelButton: {
    color:
      "#a84f4f",

    borderColor:
      "#ead1d1",

    background:
      "#fffafa",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "8px",
  },

  serviceNumberRow: {
    display:
      "flex",

    alignItems:
      "center",
  },

  serviceNumberBadge: {
    display:
      "inline-flex",

    alignItems:
      "center",

    padding:
      "7px 10px",

    borderRadius:
      "999px",

    background:
      "#eef6f3",

    color:
      "#3d9276",

    fontSize:
      "10px",

    fontWeight:
      800,

    letterSpacing:
      ".06em",
  },

  cancelledStrip: {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "10px",

    marginTop:
      "18px",

    padding:
      "13px 15px",

    borderRadius:
      "12px",

    border:
      "1px solid #ead9d9",

    background:
      "#fffafa",

    color:
      "#9b5555",

    fontSize:
      "13px",

    fontWeight:
      650,
  },

  reviewSummary: {
    marginTop:
      "18px",

    padding:
      "18px",

    borderRadius:
      "16px",

    border:
      "1px solid #dce9e4",

    background:
      "#f7fbf9",
  },

  reviewSummaryTop: {
    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      "16px",
  },

  reviewKicker: {
    display:
      "block",

    marginBottom:
      "7px",

    color:
      "#718087",

    fontSize:
      "9px",

    fontWeight:
      800,

    letterSpacing:
      ".13em",
  },

  reviewStarsStatic: {
    display:
      "flex",

    gap:
      "4px",

    color:
      "#e6a23c",

    fontSize:
      "17px",
  },

  reviewScore: {
    color:
      "#173b57",

    fontSize:
      "16px",
  },

  reviewTagList: {
    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      "7px",

    marginTop:
      "13px",
  },

  savedReviewTag: {
    display:
      "inline-flex",

    padding:
      "7px 10px",

    borderRadius:
      "999px",

    background:
      "#ffffff",

    border:
      "1px solid #d7e6e0",

    color:
      "#52656d",

    fontSize:
      "11px",

    fontWeight:
      700,
  },

  reviewComment: {
    margin:
      "13px 0 0",

    color:
      "#66757f",

    fontSize:
      "13px",

    lineHeight:
      1.7,
  },

  overlay: {
    position:
      "fixed",

    inset:
      0,

    zIndex:
      10000,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "20px",

    overflowY:
      "auto",

    background:
      "rgba(12, 31, 46, 0.54)",

    backdropFilter:
      "blur(7px)",

    WebkitBackdropFilter:
      "blur(7px)",
  },

  modal: {
    position:
      "relative",

    width:
      "min(100%, 560px)",

    maxHeight:
      "calc(100vh - 40px)",

    overflowY:
      "auto",

    padding:
      "34px",

    borderRadius:
      "24px",

    border:
      "1px solid #dfe9e5",

    background:
      "#ffffff",

    boxShadow:
      "0 30px 90px rgba(16, 45, 67, .26)",
  },

  closeButton: {
    position:
      "absolute",

    top:
      "16px",

    right:
      "16px",

    width:
      "38px",

    height:
      "38px",

    display:
      "grid",

    placeItems:
      "center",

    border:
      "1px solid #e2e9e6",

    borderRadius:
      "50%",

    background:
      "#ffffff",

    color:
      "#66757f",

    cursor:
      "pointer",
  },

  modalIconDanger: {
    width:
      "58px",

    height:
      "58px",

    display:
      "grid",

    placeItems:
      "center",

    marginBottom:
      "16px",

    borderRadius:
      "50%",

    background:
      "#fff3f1",

    color:
      "#ad5d55",

    fontSize:
      "22px",
  },

  modalIconSuccess: {
    width:
      "58px",

    height:
      "58px",

    display:
      "grid",

    placeItems:
      "center",

    marginBottom:
      "16px",

    borderRadius:
      "50%",

    background:
      "#eff8f4",

    color:
      "#3d9276",

    fontSize:
      "22px",
  },

  modalKicker: {
    margin:
      "0 0 8px",

    color:
      "#3d9276",

    fontSize:
      "9px",

    fontWeight:
      800,

    letterSpacing:
      ".15em",
  },

  modalTitle: {
    margin:
      "0 0 10px",

    color:
      "#173b57",

    fontSize:
      "27px",

    lineHeight:
      1.2,
  },

  modalText: {
    margin:
      "0 0 22px",

    color:
      "#6a7881",

    fontSize:
      "13px",

    lineHeight:
      1.75,
  },

  choiceGrid: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(145px, 1fr))",

    gap:
      "9px",

    marginBottom:
      "20px",
  },

  fieldLabel: {
    display:
      "block",

    margin:
      "18px 0 8px",

    color:
      "#29485e",

    fontSize:
      "12px",

    fontWeight:
      800,
  },

  textarea: {
    width:
      "100%",

    minHeight:
      "105px",

    resize:
      "vertical",

    padding:
      "13px 14px",

    border:
      "1px solid #dbe5e1",

    borderRadius:
      "12px",

    outline:
      "none",

    background:
      "#fbfcfc",

    color:
      "#173b57",

    font:
      "inherit",

    fontSize:
      "13px",

    lineHeight:
      1.65,

    boxSizing:
      "border-box",
  },

  characterCount: {
    marginTop:
      "5px",

    color:
      "#99a5aa",

    fontSize:
      "10px",

    textAlign:
      "end",
  },

  modalError: {
    marginTop:
      "12px",

    padding:
      "10px 12px",

    borderRadius:
      "10px",

    background:
      "#fff1f1",

    color:
      "#a34d4d",

    fontSize:
      "12px",

    fontWeight:
      650,
  },

  modalActions: {
    display:
      "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    gap:
      "10px",

    marginTop:
      "22px",
  },

  secondaryModalButton: {
    minHeight:
      "48px",

    padding:
      "0 16px",

    border:
      "1px solid #dbe5e1",

    borderRadius:
      "11px",

    background:
      "#ffffff",

    color:
      "#53656e",

    font:
      "inherit",

    fontSize:
      "12px",

    fontWeight:
      800,

    cursor:
      "pointer",
  },

  modalFinePrint: {
    margin:
      "13px 0 0",

    color:
      "#98a4a9",

    fontSize:
      "10px",

    lineHeight:
      1.6,

    textAlign:
      "center",
  },

  starPicker: {
    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "7px",

    marginTop:
      "4px",
  },

  ratingCaption: {
    marginTop:
      "10px",

    color:
      "#66757f",

    fontSize:
      "12px",

    fontWeight:
      700,

    textAlign:
      "center",
  },

  reviewSuggestionWrap: {
    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      "8px",
  },
};

function tabButtonStyle(
  active
) {
  return {
    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      "9px",

    minHeight:
      "42px",

    padding:
      "0 14px",

    border:
      active
        ? "1px solid #173b57"
        : "1px solid #dce6e2",

    borderRadius:
      "999px",

    background:
      active
        ? "#173b57"
        : "#ffffff",

    color:
      active
        ? "#ffffff"
        : "#61727a",

    font:
      "inherit",

    fontSize:
      "12px",

    fontWeight:
      800,

    cursor:
      "pointer",

    transition:
      "all .22s ease",
  };
}

function tabCountStyle(
  active
) {
  return {
    minWidth:
      "22px",

    height:
      "22px",

    display:
      "inline-grid",

    placeItems:
      "center",

    padding:
      "0 6px",

    borderRadius:
      "999px",

    background:
      active
        ? "rgba(255,255,255,.13)"
        : "#eef4f1",

    color:
      active
        ? "#ffffff"
        : "#3d9276",

    fontSize:
      "10px",

    fontWeight:
      800,
  };
}

function choiceButtonStyle(
  selected
) {
  return {
    display:
      "flex",

    alignItems:
      "center",

    gap:
      "9px",

    minHeight:
      "48px",

    padding:
      "11px 12px",

    border:
      selected
        ? "1px solid #3d9276"
        : "1px solid #dde7e3",

    borderRadius:
      "11px",

    background:
      selected
        ? "#eef8f4"
        : "#ffffff",

    color:
      selected
        ? "#2f7f66"
        : "#5f6f77",

    font:
      "inherit",

    fontSize:
      "11px",

    fontWeight:
      750,

    textAlign:
      "start",

    cursor:
      "pointer",
  };
}

function primaryDangerButtonStyle(
  disabled
) {
  return {
    minHeight:
      "48px",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "8px",

    padding:
      "0 16px",

    border:
      "none",

    borderRadius:
      "11px",

    background:
      disabled
        ? "#d9dfdd"
        : "#a95757",

    color:
      "#ffffff",

    font:
      "inherit",

    fontSize:
      "12px",

    fontWeight:
      800,

    cursor:
      disabled
        ? "not-allowed"
        : "pointer",
  };
}

function starButtonStyle(
  selected
) {
  return {
    width:
      "46px",

    height:
      "46px",

    display:
      "grid",

    placeItems:
      "center",

    padding:
      0,

    border:
      "none",

    background:
      "transparent",

    color:
      selected
        ? "#e6a23c"
        : "#c9d0d2",

    fontSize:
      "31px",

    cursor:
      "pointer",

    transition:
      "transform .18s ease, color .18s ease",
  };
}

function reviewTagButtonStyle(
  selected
) {
  return {
    display:
      "inline-flex",

    alignItems:
      "center",

    gap:
      "6px",

    padding:
      "8px 11px",

    border:
      selected
        ? "1px solid #3d9276"
        : "1px solid #dce6e2",

    borderRadius:
      "999px",

    background:
      selected
        ? "#edf7f3"
        : "#ffffff",

    color:
      selected
        ? "#327c65"
        : "#66757f",

    font:
      "inherit",

    fontSize:
      "11px",

    fontWeight:
      750,

    cursor:
      "pointer",
  };
}

function primaryReviewButtonStyle(
  disabled
) {
  return {
    minHeight:
      "48px",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "8px",

    padding:
      "0 16px",

    border:
      "none",

    borderRadius:
      "11px",

    background:
      disabled
        ? "#d9dfdd"
        : "#173b57",

    color:
      "#ffffff",

    font:
      "inherit",

    fontSize:
      "12px",

    fontWeight:
      800,

    cursor:
      disabled
        ? "not-allowed"
        : "pointer",
  };
}

export default MyRequests;