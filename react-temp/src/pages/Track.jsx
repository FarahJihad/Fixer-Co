import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./Track.css";

function Track() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { language, isArabic } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const requestId = searchParams.get("request");

  const [requestGroup, setRequestGroup] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedStage, setSelectedStage] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(true);

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  const loadRequest = useCallback(
    async (manual = false) => {
      if (!requestId) {
        setError(
          tr(
            "No service request was selected.",
            "لم يتم تحديد طلب خدمة."
          )
        );
        setIsLoading(false);
        return;
      }

      try {
        if (manual) {
          setIsRefreshing(true);
        }

        const response = await fetch(
          "/api/my-requests",
          {
            method: "GET",
            credentials: "same-origin",
          }
        );

        if (response.status === 401) {
          localStorage.setItem(
            "redirectAfterLogin",
            `/track?request=${requestId}`
          );

          navigate("/login", {
            replace: true,
          });

          return;
        }

        const data = await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              data.error ||
              tr(
                "Unable to load service request.",
                "تعذر تحميل طلب الخدمة."
              )
          );
        }

        const groups =
          Array.isArray(data.requests)
            ? data.requests
            : [];

        /*
          Track now represents ONE request group.
          The URL may contain the group id (new flow)
          or a service item id (older links/navbar).
          Both resolve to the same request group.
        */
        let matchedGroup =
          groups.find(
            (group) =>
              String(group.id) ===
              String(requestId)
          ) || null;

        let matchedItem = null;

        if (!matchedGroup) {
          for (const group of groups) {
            const items =
              Array.isArray(group.items)
                ? group.items
                : [];

            const foundItem =
              items.find(
                (item) =>
                  String(item.id) ===
                  String(requestId)
              );

            if (foundItem) {
              matchedGroup = group;
              matchedItem = foundItem;
              break;
            }
          }
        }

        if (!matchedGroup) {
          throw new Error(
            tr(
              "This request could not be found.",
              "تعذر العثور على هذا الطلب."
            )
          );
        }

        const rawItems =
          Array.isArray(matchedGroup.items)
            ? [...matchedGroup.items].sort(
                (a, b) =>
                  Number(a.slot_number || 99) -
                  Number(b.slot_number || 99)
              )
            : [];

        if (rawItems.length === 0) {
          throw new Error(
            tr(
              "This request has no services to track.",
              "لا توجد خدمات لتتبعها في هذا الطلب."
            )
          );
        }

        async function enrichItem(item) {
          let nextItem = {
            ...item,

            request_group_id:
              matchedGroup.id,

            reference_code:
              matchedGroup.reference_code || null,

            created_at:
              item.created_at ||
              matchedGroup.created_at ||
              null,

            starting_price:
              item.technician_price ??
              null,

            technician_location:
              item.technician_location ??
              null,

            technician_latitude:
              item.technician_latitude ??
              null,

            technician_longitude:
              item.technician_longitude ??
              null,
          };

          if (!item.technician_id) {
            return nextItem;
          }

          try {
            const fixerResponse =
              await fetch(
                `/api/technicians/${item.technician_id}`,
                {
                  method: "GET",
                  credentials: "same-origin",
                }
              );

            if (!fixerResponse.ok) {
              return nextItem;
            }

            const fixer =
              await fixerResponse.json();

            nextItem = {
              ...nextItem,

              technician_name:
                fixer.name ??
                nextItem.technician_name,

              technician_rating:
                fixer.rating ??
                nextItem.technician_rating,

              technician_location:
                fixer.location ??
                nextItem.technician_location,

              starting_price:
                fixer.starting_price ??
                fixer.price ??
                nextItem.starting_price,

              technician_latitude:
                fixer.latitude ??
                nextItem.technician_latitude,

              technician_longitude:
                fixer.longitude ??
                nextItem.technician_longitude,

              latitude:
                fixer.latitude ??
                nextItem.latitude,

              longitude:
                fixer.longitude ??
                nextItem.longitude,
            };
          } catch (fixerError) {
            console.warn(
              "Could not enrich Track with Fixer profile:",
              fixerError
            );
          }

          return nextItem;
        }

        const enrichedItems =
          await Promise.all(
            rawItems.map(enrichItem)
          );

        const nextGroup = {
          ...matchedGroup,
          items: enrichedItems,
        };

        setRequestGroup(nextGroup);

        setActiveItemId(
          (currentId) => {
            if (
              currentId &&
              enrichedItems.some(
                (item) =>
                  String(item.id) ===
                  String(currentId)
              )
            ) {
              return currentId;
            }

            const preferredItem =
              matchedItem
                ? enrichedItems.find(
                    (item) =>
                      String(item.id) ===
                      String(matchedItem.id)
                  )
                : null;

            return (
              preferredItem?.id ||
              enrichedItems[0].id
            );
          }
        );

        setError("");
      } catch (error) {
        console.error(
          "Track Request error:",
          error
        );

        setError(
          error.message ||
            tr(
              "Unable to load your request.",
              "تعذر تحميل طلبك."
            )
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [navigate, requestId, language]
  );

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const request = useMemo(() => {
    const items =
      Array.isArray(requestGroup?.items)
        ? requestGroup.items
        : [];

    if (items.length === 0) {
      return null;
    }

    return (
      items.find(
        (item) =>
          String(item.id) ===
          String(activeItemId)
      ) || items[0]
    );
  }, [requestGroup, activeItemId]);

  useEffect(() => {
    if (!request || !mapRef.current) {
      return;
    }

    const latitude = Number(
      request.technician_latitude ??
        request.latitude
    );

    const longitude = Number(
      request.technician_longitude ??
        request.longitude
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(
        mapRef.current
      ).setView([latitude, longitude], 14);

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            "&copy; OpenStreetMap contributors",
        }
      ).addTo(leafletMapRef.current);

      L.circleMarker(
        [latitude, longitude],
        {
          radius: 10,
          weight: 4,
          fillOpacity: 1,
        }
      )
        .addTo(leafletMapRef.current)
        .bindPopup(
          request.technician_name ||
            tr("Your Fixer", "الفني الخاص بك")
        );
    } else {
      leafletMapRef.current.setView(
        [latitude, longitude],
        14
      );
    }

    setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 100);

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
    };
  }, [request, language]);

  useEffect(() => {
    if (!requestId) return;

    const interval =
      setInterval(() => {
        loadRequest(false);
      }, 20000);

    return () =>
      clearInterval(interval);
  }, [loadRequest, requestId]);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll(
        "[data-track-reveal]"
      )
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) =>
        item.classList.add("track-show")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(
            "track-show"
          );
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
  }, [requestGroup, activeItemId, language]);

  const status = useMemo(
    () =>
      normalizeStatus(
        request?.status
      ),
    [request?.status]
  );

  const state = useMemo(
    () =>
      request
        ? getTrackState(
            status,
            request,
            language
          )
        : null,
    [request, status, language]
  );

  if (isLoading) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="track-state-page"
      >
        <div className="track-loading-wrap">
          <div className="track-loading-icon">
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>

          <strong>
            {tr(
              "Loading your request...",
              "جارٍ تحميل الطلب..."
            )}
          </strong>

          <span>
            {tr(
              "Getting the latest update.",
              "جارٍ جلب آخر تحديث."
            )}
          </span>
        </div>
      </main>
    );
  }

  if (error || !request || !state) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="track-state-page"
      >
        <div className="track-error-card">
          <div className="track-error-icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>

          <h2>
            {tr(
              "We couldn't load this request",
              "تعذر تحميل هذا الطلب"
            )}
          </h2>

          <p>
            {error ||
              tr(
                "Please try again.",
                "يرجى المحاولة مرة أخرى."
              )}
          </p>

          <Link
            to="/my-requests"
            className="track-primary-link"
          >
            {tr(
              "Back to My Requests",
              "العودة إلى طلباتي"
            )}
          </Link>
        </div>
      </main>
    );
  }

  const initials =
    getInitials(
      request.technician_name
    );

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="track-page"
    >
      {/* HERO */}
      <section className="track-hero">
        <div className="track-container">
          <Link
            to="/my-requests"
            className="track-back-link"
          >
            {tr(
              "Back to My Requests",
              "العودة إلى طلباتي"
            )}
          </Link>

          <div
            className="track-hero-card track-reveal"
            data-track-reveal
          >
            <span
              className="track-hero-orb"
              aria-hidden="true"
            ></span>

            <div className="track-hero-top">
              <div>
                <p className="track-eyebrow">
                  {tr(
                    "REQUEST TRACKING",
                    "تتبع الطلب"
                  )}
                </p>

                <h1>{state.heroTitle}</h1>

                <p className="track-hero-description">
                  {state.heroDescription}
                </p>
              </div>

              <div className="track-refresh-status">
                <span></span>
                {tr(
                  "Auto-refreshing",
                  "تحديث تلقائي"
                )}
              </div>
            </div>

            <div className="track-summary">
              <SummaryItem
                icon={
                  serviceIcons[
                    Number(
                      request.service_id
                    )
                  ] ||
                  "fa-solid fa-wrench"
                }
                label={tr(
                  "SERVICE",
                  "الخدمة"
                )}
                value={translateServiceName(
                  request.service_name ||
                    tr(
                      "Service Request",
                      "طلب خدمة"
                    ),
                  language
                )}
              />

              <div className="track-summary-divider"></div>

              <div className="track-fixer-summary">
                <div className="track-fixer-avatar">
                  {initials}
                </div>

                <div>
                  <span>
                    {tr(
                      "YOUR FIXER",
                      "الفني الخاص بك"
                    )}
                  </span>

                  <strong>
                    {request.technician_name ||
                      tr(
                        "Fixer",
                        "الفني"
                      )}
                  </strong>
                </div>
              </div>

              <div className="track-summary-divider"></div>

              <span className="track-status-chip">
                <span></span>
                {state.statusLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                loadRequest(true)
              }
              disabled={isRefreshing}
              className="track-refresh-button"
              title={tr(
                "Refresh status",
                "تحديث الحالة"
              )}
            >
              <i
                className={`fa-solid fa-rotate ${
                  isRefreshing
                    ? "fa-spin"
                    : ""
                }`}
              ></i>
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="track-content">
        <div className="track-container track-content-inner">
          {requestGroup?.items?.length > 1 && (
            <section
              className="track-card track-reveal"
              data-track-reveal
              style={{
                padding: "22px",
              }}
            >
              <span className="track-small-label accent">
                {tr(
                  "SERVICES IN THIS REQUEST",
                  "الخدمات ضمن هذا الطلب"
                )}
              </span>

              <h2 style={{ marginTop: "8px" }}>
                {tr(
                  "Choose a service to view its live progress.",
                  "اختر خدمة لعرض تقدمها الحالي."
                )}
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: "12px",
                  marginTop: "18px",
                }}
              >
                {requestGroup.items.map(
                  (item, index) => {
                    const active =
                      String(item.id) ===
                      String(request.id);

                    const itemStatus =
                      normalizeStatus(
                        item.status
                      );

                    const itemState =
                      getTrackState(
                        itemStatus,
                        item,
                        language
                      );

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveItemId(
                            item.id
                          );
                          setSelectedStage(null);
                          setDetailsOpen(true);
                        }}
                        aria-pressed={active}
                        style={{
                          width: "100%",
                          border: active
                            ? "1.5px solid #4faf8f"
                            : "1px solid #dde7e3",
                          borderRadius: "16px",
                          background: active
                            ? "#edf7f3"
                            : "#ffffff",
                          padding: "16px",
                          textAlign:
                            isArabic
                              ? "right"
                              : "left",
                          cursor: "pointer",
                          boxShadow: active
                            ? "0 12px 30px rgba(79,175,143,0.12)"
                            : "none",
                          transition:
                            "all 0.25s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              letterSpacing:
                                "0.8px",
                              color: active
                                ? "#3d9276"
                                : "#809097",
                              textTransform:
                                "uppercase",
                            }}
                          >
                            {tr(
                              `Service ${String(
                                index + 1
                              ).padStart(2, "0")}`,
                              `الخدمة ${String(
                                index + 1
                              ).padStart(2, "0")}`
                            )}
                          </span>

                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: active
                                ? "#173b57"
                                : "#66757f",
                            }}
                          >
                            {itemState.statusLabel}
                          </span>
                        </div>

                        <strong
                          style={{
                            display: "block",
                            marginTop: "10px",
                            color: "#173b57",
                            fontSize: "16px",
                          }}
                        >
                          {translateServiceName(
                            item.service_name ||
                              tr(
                                "Service Request",
                                "طلب خدمة"
                              ),
                            language
                          )}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            marginTop: "7px",
                            color: "#66757f",
                            fontSize: "12px",
                          }}
                        >
                          {item.technician_name ||
                            tr(
                              "Fixer pending",
                              "بانتظار تعيين الفني"
                            )}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </section>
          )}

          <section
            className="track-next-card track-reveal"
            data-track-reveal
          >
            <div className="track-next-icon">
              <i className={state.nextIcon}></i>
            </div>

            <div>
              <span className="track-small-label">
                {tr(
                  "WHAT'S NEXT?",
                  "ما الخطوة التالية؟"
                )}
              </span>

              <h2>{state.nextTitle}</h2>

              <p>{state.nextDescription}</p>
            </div>

            <div className="track-next-stage">
              <span>
                {tr(
                  "NEXT STAGE",
                  "المرحلة التالية"
                )}
              </span>

              <strong>{state.nextStage}</strong>
            </div>
          </section>

          <section
            className="track-card track-reveal"
            data-track-reveal
          >
            <span className="track-small-label accent">
              {tr(
                "YOUR SERVICE JOURNEY",
                "رحلة الخدمة"
              )}
            </span>

            <h2>
              {tr(
                "From request to completion.",
                "من الطلب إلى الإكمال."
              )}
            </h2>

            <p className="track-card-intro">
              {tr(
                "Follow every stage of your service.",
                "تابع كل مرحلة من مراحل الخدمة."
              )}
            </p>

            <div className="track-journey-list">
              {journeySteps.map(
                (step, index) => (
                  <JourneyStep
                    key={step.key}
                    step={step}
                    index={index}
                    status={status}
                    language={language}
                    onClick={() =>
                      setSelectedStage(
                        step
                      )
                    }
                  />
                )
              )}
            </div>

            <p className="track-hint">
              <i className="fa-regular fa-hand-pointer"></i>
              {tr(
                "Select any stage to learn more.",
                "اختر أي مرحلة لمعرفة المزيد."
              )}
            </p>
          </section>

          <section
            className="track-card track-reveal"
            data-track-reveal
          >
            <span className="track-small-label accent">
              {tr(
                "FIXER LOCATION",
                "موقع الفني"
              )}
            </span>

            <h2>
              {tr(
                "Know where your Fixer is.",
                "اعرف أين يوجد الفني."
              )}
            </h2>

            <div
              ref={mapRef}
              className="track-map"
            ></div>

            <p className="track-map-caption">
              <i className="fa-solid fa-location-dot"></i>
              {tr(
                "Shows the Fixer's saved location",
                "يعرض الموقع المحفوظ للفني"
              )}
            </p>
          </section>

          <div className="track-details-grid">
            <section
              className="track-card track-detail-motion-card track-reveal"
              data-track-reveal
            >
              <span
                className="track-detail-orb"
                aria-hidden="true"
              ></span>

              <span
                className="track-small-label track-detail-item"
                style={{ "--track-item-delay": "80ms" }}
              >
                {tr(
                  "YOUR FIXER",
                  "الفني الخاص بك"
                )}
              </span>

              <div
                className="track-fixer-profile track-detail-item"
                style={{ "--track-item-delay": "150ms" }}
              >
                <div className="track-fixer-profile-avatar">
                  {initials}
                </div>

                <div>
                  <h2>
                    {request.technician_name ||
                      tr(
                        "Fixer",
                        "الفني"
                      )}
                  </h2>

                  <p className="track-verified">
                    <i className="fa-solid fa-circle-check"></i>
                    {tr(
                      "Verified professional",
                      "محترف موثّق"
                    )}
                  </p>
                </div>
              </div>

              <div
                className="track-stats-grid track-detail-item"
                style={{ "--track-item-delay": "220ms" }}
              >
                <Stat
                  label={tr(
                    "RATING",
                    "التقييم"
                  )}
                  value={
                    request.technician_rating !=
                    null
                      ? `★ ${Number(
                          request.technician_rating
                        ).toFixed(1)}`
                      : "—"
                  }
                />

                <Stat
                  label={tr(
                    "STARTING FROM",
                    "يبدأ من"
                  )}
                  value={
                    request.starting_price !=
                    null
                      ? `${Number(
                          request.starting_price
                        ).toFixed(0)} ${
                          language === "ar"
                            ? "ر.س"
                            : "SAR"
                        }`
                      : "—"
                  }
                />
              </div>

              <p
                className="track-location-line track-detail-item"
                style={{ "--track-item-delay": "290ms" }}
              >
                <i className="fa-solid fa-location-dot"></i>

                {request.technician_location ||
                  tr(
                    "Location unavailable",
                    "الموقع غير متاح"
                  )}
              </p>

              {request.technician_id && (
                <Link
                  to={`/technicians/${request.technician_id}`}
                  className="track-outline-link track-detail-item"
                  style={{ "--track-item-delay": "360ms" }}
                >
                  {tr(
                    "View Fixer Profile",
                    "عرض ملف الفني"
                  )}
                </Link>
              )}
            </section>

            <section
              className="track-card track-detail-motion-card track-reveal"
              data-track-reveal
            >
              <span
                className="track-detail-orb"
                aria-hidden="true"
              ></span>

              <button
                type="button"
                onClick={() =>
                  setDetailsOpen(
                    (value) =>
                      !value
                  )
                }
                className="track-details-toggle track-detail-item"
                style={{ "--track-item-delay": "100ms" }}
              >
                <span>
                  <i className="fa-regular fa-message"></i>
                  {tr(
                    "Request details",
                    "تفاصيل الطلب"
                  )}
                </span>

                <i
                  className={`fa-solid fa-chevron-down ${
                    detailsOpen
                      ? "open"
                      : ""
                  }`}
                ></i>
              </button>

              {detailsOpen && (
                <div
                  className="track-details-body track-detail-item"
                  style={{ "--track-item-delay": "190ms" }}
                >
                  <p>
                    {request.problem ||
                      tr(
                        "No problem description provided.",
                        "لم يتم توفير وصف للمشكلة."
                      )}
                  </p>

                  <div className="track-request-date">
                    <span>
                      {tr(
                        "REQUESTED",
                        "تاريخ الطلب"
                      )}
                    </span>

                    <strong>
                      {formatDate(
                        request.created_at,
                        language
                      )}
                    </strong>
                  </div>
                </div>
              )}
            </section>
          </div>

          {status === "completed" && (
            <section
              className="track-review-card track-reveal"
              data-track-reveal
            >
              <div className="track-review-icon">
                <i className="fa-solid fa-star"></i>
              </div>

              <span>
                {tr(
                  "SERVICE COMPLETED",
                  "اكتملت الخدمة"
                )}
              </span>

              <h2>
                {tr(
                  "How was your service?",
                  "كيف كانت تجربتك؟"
                )}
              </h2>

              <p>
                {tr(
                  "Share your experience and help others choose the right Fixer.",
                  "شارك تجربتك وساعد الآخرين في اختيار الفني المناسب."
                )}
              </p>

              {request.technician_id && (
                <Link
                  to="/my-requests"
                  className="track-primary-link"
                >
                  {tr(
                    "Rate in My Requests",
                    "قيّم من طلباتي"
                  )}
                </Link>
              )}
            </section>
          )}
        </div>
      </section>

      {selectedStage && (
        <div
          className="track-modal-overlay"
          onClick={() =>
            setSelectedStage(null)
          }
        >
          <div
            className="track-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                setSelectedStage(null)
              }
              className="track-modal-close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="track-modal-icon">
              <i className={selectedStage.icon}></i>
            </div>

            <span>
              {tr(
                "JOURNEY STAGE",
                "مرحلة الرحلة"
              )}
            </span>

            <h2>
              {translateJourneyTitle(
                selectedStage.key,
                language
              )}
            </h2>

            <p>
              {translateJourneyDescription(
                selectedStage.key,
                language
              )}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

function JourneyStep({
  step,
  index,
  status,
  language,
  onClick,
}) {
  const currentIndex =
    getStatusIndex(status);

  const isDone =
    index < currentIndex;

  const isCurrent =
    index === currentIndex;

  return (
    <button
      type="button"
      onClick={onClick}
      className="track-journey-step"
    >
      {index !==
        journeySteps.length - 1 && (
        <span
          className={`track-journey-line ${
            index < currentIndex
              ? "done"
              : ""
          }`}
        ></span>
      )}

      <span
        className={`track-journey-icon ${
          isDone
            ? "done"
            : isCurrent
            ? "current"
            : ""
        }`}
      >
        <i
          className={
            isDone
              ? "fa-solid fa-check"
              : step.icon
          }
        ></i>
      </span>

      <span className="track-journey-copy">
        <small>
          {language === "ar"
            ? `الخطوة ${String(
                index + 1
              ).padStart(2, "0")}`
            : `STEP ${String(
                index + 1
              ).padStart(2, "0")}`}
        </small>

        <strong
          className={
            isDone || isCurrent
              ? "active"
              : ""
          }
        >
          {translateJourneyTitle(
            step.key,
            language
          )}
        </strong>

        <span>
          {translateJourneyDescription(
            step.key,
            language
          )}
        </span>
      </span>
    </button>
  );
}

const journeySteps = [
  {
    key: "requested",
    icon: "fa-solid fa-paper-plane",
  },
  {
    key: "accepted",
    icon: "fa-solid fa-check",
  },
  {
    key: "on_the_way",
    icon: "fa-solid fa-car-side",
  },
  {
    key: "in_progress",
    icon: "fa-solid fa-screwdriver-wrench",
  },
  {
    key: "completed",
    icon: "fa-solid fa-flag-checkered",
  },
];

const serviceIcons = {
  1: "fa-solid fa-snowflake",
  2: "fa-solid fa-droplet",
  3: "fa-solid fa-bolt",
  4: "fa-solid fa-screwdriver-wrench",
  5: "fa-solid fa-hammer",
  6: "fa-solid fa-house",
};

function normalizeStatus(status) {
  const value = String(
    status || "requested"
  )
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

  if (value === "pending") {
    return "requested";
  }

  if (value === "arrived") {
    return "on_the_way";
  }

  return value;
}

function getStatusIndex(status) {
  const index =
    journeySteps.findIndex(
      (step) =>
        step.key === status
    );

  return index < 0 ? 0 : index;
}

function getTrackState(
  status,
  request,
  language
) {
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const fixerName =
    request.technician_name ||
    tr("Your Fixer", "الفني الخاص بك");

  const firstName =
    fixerName
      .trim()
      .split(/\s+/)[0];

  const states = {
    requested: {
      statusLabel: tr(
        "Requested",
        "تم الطلب"
      ),
      heroTitle: tr(
        "Request received",
        "تم استلام الطلب"
      ),
      heroDescription: tr(
        `Waiting for ${firstName} to accept your request.`,
        `بانتظار ${firstName} لقبول طلبك.`
      ),
      nextTitle: tr(
        `Waiting for ${firstName} to accept`,
        `بانتظار ${firstName} لقبول الطلب`
      ),
      nextDescription: tr(
        `Once ${firstName} accepts your request, we'll move you to the next stage.`,
        `بمجرد قبول ${firstName} للطلب، ستنتقل إلى المرحلة التالية.`
      ),
      nextStage: tr(
        "Accepted",
        "مقبول"
      ),
      nextIcon:
        "fa-solid fa-user-check",
    },

    accepted: {
      statusLabel: tr(
        "Accepted",
        "مقبول"
      ),
      heroTitle: tr(
        "Your Fixer accepted",
        "وافق الفني على الطلب"
      ),
      heroDescription: tr(
        `${firstName} accepted your request and is preparing for your service.`,
        `وافق ${firstName} على الطلب ويستعد لتنفيذ الخدمة.`
      ),
      nextTitle: tr(
        `${firstName} is getting ready`,
        `${firstName} يستعد الآن`
      ),
      nextDescription: tr(
        `Your next update will appear when ${firstName} starts heading your way.`,
        `سيظهر التحديث التالي عندما يبدأ ${firstName} بالتوجه إليك.`
      ),
      nextStage: tr(
        "On the way",
        "في الطريق"
      ),
      nextIcon:
        "fa-solid fa-route",
    },

    on_the_way: {
      statusLabel: tr(
        "On the way",
        "في الطريق"
      ),
      heroTitle: tr(
        "Your Fixer is on the way",
        "الفني في الطريق إليك"
      ),
      heroDescription: tr(
        `${firstName} is heading toward your service location.`,
        `${firstName} متجه إلى موقع الخدمة.`
      ),
      nextTitle: tr(
        `${firstName} is heading your way`,
        `${firstName} في الطريق إليك`
      ),
      nextDescription: tr(
        "The next stage begins when your service work starts.",
        "تبدأ المرحلة التالية عند بدء تنفيذ الخدمة."
      ),
      nextStage: tr(
        "In progress",
        "قيد التنفيذ"
      ),
      nextIcon:
        "fa-solid fa-car-side",
    },

    in_progress: {
      statusLabel: tr(
        "In progress",
        "قيد التنفيذ"
      ),
      heroTitle: tr(
        "Your service is in progress",
        "الخدمة قيد التنفيذ"
      ),
      heroDescription: tr(
        `${firstName} is currently working on your service.`,
        `${firstName} يعمل حاليًا على تنفيذ الخدمة.`
      ),
      nextTitle: tr(
        "Almost there",
        "شارفت على الانتهاء"
      ),
      nextDescription: tr(
        "Once the work is finished, your review will become available.",
        "بعد انتهاء العمل، سيصبح بإمكانك إضافة تقييم."
      ),
      nextStage: tr(
        "Completed",
        "مكتمل"
      ),
      nextIcon:
        "fa-solid fa-screwdriver-wrench",
    },

    completed: {
      statusLabel: tr(
        "Completed",
        "مكتمل"
      ),
      heroTitle: tr(
        "Service completed",
        "اكتملت الخدمة"
      ),
      heroDescription: tr(
        `${firstName} finished your service. We hope everything went smoothly.`,
        `أنهى ${firstName} الخدمة. نأمل أن تكون التجربة قد سارت بشكل ممتاز.`
      ),
      nextTitle: tr(
        "Your service is complete",
        "اكتملت خدمتك"
      ),
      nextDescription: tr(
        `Tell us how your experience with ${firstName} went.`,
        `أخبرنا عن تجربتك مع ${firstName}.`
      ),
      nextStage: tr(
        "Leave a review",
        "أضف تقييمًا"
      ),
      nextIcon:
        "fa-solid fa-star",
    },
  };

  return (
    states[status] ||
    states.requested
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

function formatDate(
  value,
  language
) {
  if (!value) {
    return "—";
  }

  const normalized =
    String(value).includes("T")
      ? value
      : `${String(value).replace(
          " ",
          "T"
        )}Z`;

  const date =
    new Date(normalized);

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

function SummaryItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="track-summary-item">
      <div className="track-summary-icon">
        <i className={icon}></i>
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}) {
  return (
    <div className="track-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function translateJourneyTitle(
  key,
  language
) {
  const titles = {
    requested: {
      en: "Request sent",
      ar: "تم إرسال الطلب",
    },
    accepted: {
      en: "Fixer accepts",
      ar: "قبول الفني",
    },
    on_the_way: {
      en: "On the way",
      ar: "في الطريق",
    },
    in_progress: {
      en: "Service in progress",
      ar: "الخدمة قيد التنفيذ",
    },
    completed: {
      en: "Completed",
      ar: "مكتمل",
    },
  };

  return titles[key]?.[language] || key;
}

function translateJourneyDescription(
  key,
  language
) {
  const descriptions = {
    requested: {
      en: "Your service request was sent to the Fixer.",
      ar: "تم إرسال طلب الخدمة إلى الفني.",
    },
    accepted: {
      en: "Your Fixer confirms the service request.",
      ar: "قام الفني بتأكيد طلب الخدمة.",
    },
    on_the_way: {
      en: "Your Fixer is heading toward the service location.",
      ar: "الفني متجه إلى موقع الخدمة.",
    },
    in_progress: {
      en: "Your Fixer is currently working on your service.",
      ar: "الفني يعمل حاليًا على تنفيذ الخدمة.",
    },
    completed: {
      en: "Service finished. Your review becomes available.",
      ar: "اكتملت الخدمة وأصبح التقييم متاحًا.",
    },
  };

  return (
    descriptions[key]?.[language] ||
    ""
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
    "Service Request":
      "طلب خدمة",
  };

  return names[name] || name;
}

export default Track;
