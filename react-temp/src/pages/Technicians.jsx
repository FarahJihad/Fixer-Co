import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import "./Technicians.css";

function Technicians() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const { language, isArabic } = useLanguage();

  const tr = (en, ar) =>
    language === "ar" ? ar : en;

  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] =
    useState([]);

  const [serviceFilter, setServiceFilter] =
    useState(searchParams.get("service") || "");

  const [availabilityFilter, setAvailabilityFilter] =
    useState(
      searchParams.get("available") === "true"
        ? "available"
        : ""
    );

  const [sortFilter, setSortFilter] =
    useState("recommended");

  const [customerLocation, setCustomerLocation] =
    useState(null);

  const [locationStatus, setLocationStatus] =
    useState("");

  const [locationStatusType, setLocationStatusType] =
    useState("");

  const [isGettingLocation, setIsGettingLocation] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  /* =========================
     LOAD SERVICES
  ========================= */

  useEffect(() => {
    async function loadServices() {
      try {
        const response =
          await fetch("/api/services");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            tr(
              "Could not load services.",
              "تعذر تحميل الخدمات."
            )
          );
        }

        setServices(
          Array.isArray(data)
            ? data
            : data.services || []
        );
      } catch (error) {
        console.error(
          "Services error:",
          error
        );
      }
    }

    loadServices();
  }, [language]);

  /* =========================
     LOAD TECHNICIANS
  ========================= */

  useEffect(() => {
    async function loadTechnicians() {
      try {
        setIsLoading(true);
        setError("");

        const query =
          new URLSearchParams();

        if (serviceFilter) {
          query.set(
            "service",
            serviceFilter
          );
        }

        if (sortFilter) {
          query.set(
            "sort",
            sortFilter
          );
        }

        if (customerLocation) {
          query.set(
            "lat",
            customerLocation.latitude
          );

          query.set(
            "lng",
            customerLocation.longitude
          );
        }

        const url =
          query.toString()
            ? `/api/technicians?${query.toString()}`
            : "/api/technicians";

        const response =
          await fetch(url);

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            tr(
              "Could not load Fixers.",
              "تعذر تحميل الفنيين."
            )
          );
        }

        setTechnicians(
          Array.isArray(data)
            ? data
            : data.technicians || []
        );
      } catch (error) {
        console.error(
          "Technicians error:",
          error
        );

        setError(
          tr(
            "Could not load Fixers.",
            "تعذر تحميل الفنيين."
          )
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTechnicians();
  }, [
    serviceFilter,
    sortFilter,
    customerLocation,
    language,
  ]);

  /* =========================
     ORDERED REVEAL
  ========================= */

  useEffect(() => {
    if (isLoading) return;

    const elements = Array.from(
      document.querySelectorAll(
        "[data-technician-reveal]"
      )
    );

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) =>
        element.classList.add("tech-show")
      );
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "tech-show"
            );

            observer.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.08,
          rootMargin:
            "0px 0px -30px 0px",
        }
      );

    elements.forEach((element) => {
      const rect =
        element.getBoundingClientRect();

      if (
        rect.top <
          window.innerHeight - 10 &&
        rect.bottom > 0
      ) {
        element.classList.add(
          "tech-show"
        );
      } else {
        observer.observe(element);
      }
    });

    const fallback =
      window.setTimeout(() => {
        elements.forEach((element) =>
          element.classList.add(
            "tech-show"
          )
        );
      }, 1600);

    return () => {
      observer.disconnect();
      window.clearTimeout(
        fallback
      );
    };
  }, [
    isLoading,
    filteredDependencyKey(
      technicians,
      availabilityFilter
    ),
  ]);

  /* =========================
     AVAILABILITY
  ========================= */

  const filteredTechnicians =
    useMemo(() => {
      if (
        availabilityFilter !==
        "available"
      ) {
        return technicians;
      }

      return technicians.filter(
        (technician) =>
          Number(
            technician.available
          ) === 1
      );
    }, [
      technicians,
      availabilityFilter,
    ]);

  /* =========================
     RESULTS TITLE
  ========================= */

  const selectedService =
    services.find(
      (service) =>
        String(service.id) ===
        String(serviceFilter)
    );

  let resultsTitle = tr(
    "All Fixers",
    "جميع الفنيين"
  );

  if (selectedService) {
    const translatedService =
      translateServiceName(
        selectedService.name,
        language
      );

    resultsTitle =
      customerLocation
        ? tr(
            `${translatedService} Fixers Near You`,
            `فنيو ${translatedService} بالقرب منك`
          )
        : tr(
            `${translatedService} Fixers`,
            `فنيو ${translatedService}`
          );
  } else if (customerLocation) {
    resultsTitle = tr(
      "Fixers Near You",
      "فنيون بالقرب منك"
    );
  }

  /* =========================
     SERVICE FILTER
  ========================= */

  function handleServiceChange(event) {
    const value = event.target.value;

    setServiceFilter(value);

    const newParams =
      new URLSearchParams(
        searchParams
      );

    if (value) {
      newParams.set(
        "service",
        value
      );
    } else {
      newParams.delete(
        "service"
      );
    }

    setSearchParams(newParams);
  }

  /* =========================
     AVAILABILITY FILTER
  ========================= */

  function handleAvailabilityChange(
    event
  ) {
    const value = event.target.value;

    setAvailabilityFilter(value);

    const newParams =
      new URLSearchParams(
        searchParams
      );

    if (value === "available") {
      newParams.set(
        "available",
        "true"
      );
    } else {
      newParams.delete(
        "available"
      );
    }

    setSearchParams(newParams);
  }

  /* =========================
     SORT
  ========================= */

  function handleSortChange(event) {
    const value =
      event.target.value;

    if (
      value === "nearest" &&
      !customerLocation
    ) {
      setSortFilter("nearest");
      requestCustomerLocation(
        "nearest"
      );
      return;
    }

    setSortFilter(value);
  }

  /* =========================
     LOCATION
  ========================= */

  function requestCustomerLocation(
    requestedSort = null
  ) {
    if (!navigator.geolocation) {
      setLocationStatus(
        tr(
          "Location is not supported by this browser.",
          "خدمة الموقع غير مدعومة في هذا المتصفح."
        )
      );

      setLocationStatusType(
        "error"
      );

      if (
        requestedSort ===
        "nearest"
      ) {
        setSortFilter(
          "recommended"
        );
      }

      return;
    }

    setIsGettingLocation(true);

    setLocationStatus(
      tr(
        "Waiting for location permission...",
        "بانتظار السماح بالوصول إلى موقعك..."
      )
    );

    setLocationStatusType("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation({
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
        });

        setIsGettingLocation(false);

        setLocationStatus(
          tr(
            "Location enabled. Distances are now shown from your current location.",
            "تم تفعيل الموقع. ستظهر المسافات الآن حسب موقعك الحالي."
          )
        );

        setLocationStatusType(
          "success"
        );
      },

      (error) => {
        setCustomerLocation(null);
        setIsGettingLocation(false);

        let message =
          tr(
            "We could not access your location.",
            "تعذر الوصول إلى موقعك."
          );

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message = tr(
            "Location permission was denied. You can still browse Fixers normally.",
            "تم رفض إذن الموقع. ما زال بإمكانك تصفح الفنيين بشكل طبيعي."
          );
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message = tr(
            "Your location is currently unavailable.",
            "موقعك غير متاح حاليًا."
          );
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          message = tr(
            "Getting your location took too long. Please try again.",
            "استغرق تحديد موقعك وقتًا طويلًا. يرجى المحاولة مرة أخرى."
          );
        }

        setLocationStatus(
          message
        );

        setLocationStatusType(
          "error"
        );

        if (
          requestedSort ===
            "nearest" ||
          sortFilter === "nearest"
        ) {
          setSortFilter(
            "recommended"
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  /* =========================
     CLEAR FILTERS
  ========================= */

  function clearFilters() {
    setServiceFilter("");
    setAvailabilityFilter("");
    setSortFilter(
      "recommended"
    );

    setCustomerLocation(null);

    setLocationStatus("");
    setLocationStatusType("");

    setSearchParams({});
  }

  /* =========================
     OPEN PROFILE
  ========================= */

  function openProfile(
    technicianId
  ) {
    let url =
      `/technicians/${technicianId}`;

    if (customerLocation) {
      url +=
        `?lat=${encodeURIComponent(
          customerLocation.latitude
        )}` +
        `&lng=${encodeURIComponent(
          customerLocation.longitude
        )}`;
    }

    navigate(url);
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="technicians-page"
    >
      {/* PAGE HERO */}
      <section className="tech-page-hero tech-page-enter">
        <div className="tech-container">
          <p className="tech-eyebrow">
            {tr(
              "FIND A FIXER",
              "ابحث عن فني"
            )}
          </p>

          <h1>
            {tr(
              "Compare trusted professionals",
              "قارن بين الفنيين الموثوقين"
            )}
          </h1>

          <p className="tech-hero-copy">
            {tr(
              "Browse Fixers by service, rating, distance, availability and price.",
              "تصفح الفنيين حسب الخدمة والتقييم والمسافة والتوفر والسعر."
            )}
          </p>
        </div>
      </section>

      {/* FIXERS */}
      <section className="tech-main-section tech-page-enter tech-page-enter-delay">
        <div className="tech-container">

          {/* FILTERS */}
          <div
            className="tech-filter-panel tech-reveal"
            data-technician-reveal
          >
            <FilterGroup
              label={tr(
                "Service",
                "الخدمة"
              )}
            >
              <select
                value={serviceFilter}
                onChange={
                  handleServiceChange
                }
              >
                <option value="">
                  {tr(
                    "All Services",
                    "جميع الخدمات"
                  )}
                </option>

                {services.map(
                  (service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {translateServiceName(
                        service.name,
                        language
                      )}
                    </option>
                  )
                )}
              </select>
            </FilterGroup>

            <FilterGroup
              label={tr(
                "Availability",
                "التوفر"
              )}
            >
              <select
                value={
                  availabilityFilter
                }
                onChange={
                  handleAvailabilityChange
                }
              >
                <option value="">
                  {tr(
                    "All Fixers",
                    "جميع الفنيين"
                  )}
                </option>

                <option value="available">
                  {tr(
                    "Available Now",
                    "متاح الآن"
                  )}
                </option>
              </select>
            </FilterGroup>

            <FilterGroup
              label={tr(
                "Sort By",
                "الترتيب حسب"
              )}
            >
              <select
                value={sortFilter}
                onChange={
                  handleSortChange
                }
              >
                <option value="recommended">
                  {tr(
                    "Recommended",
                    "الموصى بهم"
                  )}
                </option>

                <option value="nearest">
                  {tr(
                    "Nearest",
                    "الأقرب"
                  )}
                </option>

                <option value="rating">
                  {tr(
                    "Highest Rated",
                    "الأعلى تقييمًا"
                  )}
                </option>

                <option value="price">
                  {tr(
                    "Lowest Price",
                    "الأقل سعرًا"
                  )}
                </option>
              </select>
            </FilterGroup>

            <div className="tech-filter-action">
              <button
                type="button"
                onClick={() =>
                  requestCustomerLocation()
                }
                disabled={
                  isGettingLocation
                }
                className={
                  customerLocation
                    ? "tech-location-button active"
                    : "tech-location-button"
                }
              >
                {isGettingLocation ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    {tr(
                      "Getting...",
                      "جارٍ التحديد..."
                    )}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-location-crosshairs"></i>

                    {customerLocation
                      ? tr(
                          "Update Location",
                          "تحديث الموقع"
                        )
                      : tr(
                          "Use My Location",
                          "استخدم موقعي"
                        )}
                  </>
                )}
              </button>
            </div>

            <div className="tech-filter-action">
              <button
                type="button"
                onClick={clearFilters}
                className="tech-clear-button"
              >
                <i className="fa-solid fa-rotate-left"></i>
                {tr(
                  "Clear Filters",
                  "مسح الفلاتر"
                )}
              </button>
            </div>
          </div>

          {/* LOCATION STATUS */}
          {locationStatus && (
            <div
              className={`tech-location-status ${locationStatusType}`}
            >
              <i
                className={
                  locationStatusType ===
                  "success"
                    ? "fa-solid fa-circle-check"
                    : locationStatusType ===
                      "error"
                    ? "fa-solid fa-circle-exclamation"
                    : "fa-solid fa-location-dot"
                }
              ></i>

              {locationStatus}
            </div>
          )}

          {/* RESULTS HEADER */}
          <div
            className="tech-results-heading tech-reveal"
            data-technician-reveal
          >
            <div>
              <p className="tech-eyebrow">
                {tr(
                  "AVAILABLE PROFESSIONALS",
                  "الفنيون المتاحون"
                )}
              </p>

              <h2>
                {resultsTitle}
              </h2>
            </div>

            <p className="tech-result-count">
              {isLoading
                ? tr(
                    "Loading...",
                    "جارٍ التحميل..."
                  )
                : tr(
                    `${filteredTechnicians.length} Fixer${
                      filteredTechnicians.length ===
                      1
                        ? ""
                        : "s"
                    } found`,
                    `تم العثور على ${filteredTechnicians.length} فني`
                  )}
            </p>
          </div>

          {/* ERROR */}
          {error && !isLoading && (
            <div className="tech-error-box">
              {error}
            </div>
          )}

          {/* LOADING */}
          {isLoading && (
            <div className="tech-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>
              {tr(
                "Loading Fixers...",
                "جارٍ تحميل الفنيين..."
              )}
            </div>
          )}

          {/* NO RESULTS */}
          {!isLoading &&
            !error &&
            filteredTechnicians.length ===
              0 && (
              <div className="tech-empty">
                <div className="tech-empty-icon">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>

                <h3>
                  {tr(
                    "No Fixers found",
                    "لم يتم العثور على فنيين"
                  )}
                </h3>

                <p>
                  {tr(
                    "Try changing your filters.",
                    "جرّب تغيير خيارات التصفية."
                  )}
                </p>
              </div>
            )}

          {/* CARDS */}
          {!isLoading &&
            !error &&
            filteredTechnicians.length >
              0 && (
              <div className="tech-grid">
                {filteredTechnicians.map(
                  (
                    technician,
                    index
                  ) => {
                    const isAvailable =
                      Number(
                        technician.available
                      ) === 1;

                    const hasDistance =
                      technician.distance !==
                        null &&
                      technician.distance !==
                        undefined &&
                      technician.distance !==
                        "";

                    const showBestMatch =
                      Boolean(
                        customerLocation
                      ) &&
                      sortFilter ===
                        "recommended" &&
                      index === 0;

                    return (
                      <article
                        key={technician.id}
                        className={`tech-card tech-card-reveal ${
                          showBestMatch
                            ? "best-match"
                            : ""
                        }`}
                        data-technician-reveal
                        style={{
                          "--tech-delay": `${index * 55}ms`,
                        }}
                      >
                        {showBestMatch && (
                          <span className="tech-best-match">
                            <i className="fa-solid fa-sparkles"></i>
                            {tr(
                              "Best Match",
                              "أفضل تطابق"
                            )}
                          </span>
                        )}

                        <div className="tech-card-top">
                          <div className="tech-avatar">
                            {getInitials(
                              technician.name
                            )}
                          </div>

                          <div className="tech-card-name">
                            <div className="tech-name-row">
                              <h3>
                                {technician.name}
                              </h3>

                              {Number(
                                technician.verified
                              ) === 1 && (
                                <i
                                  className="fa-solid fa-circle-check tech-verified"
                                  title={tr(
                                    "Verified Fixer",
                                    "فني موثّق"
                                  )}
                                ></i>
                              )}
                            </div>

                            <p>
                              {translateServiceName(
                                technician.service_name,
                                language
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="tech-info">
                          <p>
                            <i className="fa-solid fa-star tech-star"></i>

                            <strong>
                              {Number(
                                technician.rating
                              ).toFixed(1)}
                            </strong>
                          </p>

                          <p>
                            <i className="fa-solid fa-location-dot"></i>
                            {technician.location}
                          </p>

                          {hasDistance && (
                            <p>
                              <i className="fa-solid fa-route"></i>

                              {Number(
                                technician.distance
                              ).toFixed(1)}{" "}
                              {tr(
                                "km away",
                                "كم"
                              )}
                            </p>
                          )}

                          <p
                            className={
                              isAvailable
                                ? "tech-availability available"
                                : "tech-availability unavailable"
                            }
                          >
                            <i className="fa-solid fa-circle"></i>

                            {isAvailable
                              ? tr(
                                  "Available now",
                                  "متاح الآن"
                                )
                              : tr(
                                  "Currently unavailable",
                                  "غير متاح حاليًا"
                                )}
                          </p>
                        </div>

                        {technician.bio && (
                          <p className="tech-bio">
                            {technician.bio}
                          </p>
                        )}

                        <div className="tech-card-footer">
                          <div>
                            <strong className="tech-price">
                              {Number(
                                technician.price ??
                                  technician.starting_price
                              ).toFixed(0)}{" "}
                              {tr(
                                "SAR",
                                "ر.س"
                              )}
                            </strong>

                            <span>
                              {tr(
                                "starting price",
                                "السعر الابتدائي"
                              )}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openProfile(
                                technician.id
                              )
                            }
                            className="tech-profile-button"
                          >
                            {tr(
                              "View Profile",
                              "عرض الملف"
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="tech-footer">
        <div className="tech-container tech-footer-content">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="tech-footer-logo"
            >
              Fixer
              <span>.Co</span>
            </button>

            <p>
              {tr(
                "The right fix. Right around you.",
                "الإصلاح المناسب، بالقرب منك."
              )}
            </p>
          </div>

          <div className="tech-footer-links">
            <button
              onClick={() =>
                navigate("/services")
              }
            >
              {tr(
                "Services",
                "الخدمات"
              )}
            </button>

            <button
              onClick={() =>
                navigate("/technicians")
              }
            >
              {tr(
                "Find a Fixer",
                "ابحث عن فني"
              )}
            </button>

            <button
              onClick={() =>
                navigate("/about")
              }
            >
              {tr(
                "About Us",
                "من نحن"
              )}
            </button>

            <button
              onClick={() =>
                navigate("/contact")
              }
            >
              {tr(
                "Contact Us",
                "تواصل معنا"
              )}
            </button>

            <button
              onClick={() =>
                navigate(
                  "/become-fixer"
                )
              }
            >
              {tr(
                "Become a Fixer",
                "انضم كفني"
              )}
            </button>
          </div>

          <p className="tech-footer-copy">
            © 2026 Fixer.Co
          </p>
        </div>
      </footer>
    </main>
  );
}

function FilterGroup({
  label,
  children,
}) {
  return (
    <div className="tech-filter-group">
      <label>
        {label}
      </label>

      {children}
    </div>
  );
}

function getInitials(name) {
  if (!name) {
    return "F";
  }

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function translateServiceName(
  name,
  language
) {
  if (language !== "ar") {
    return name;
  }

  const names = {
    "AC & Cooling":
      "التكييف والتبريد",
    Plumbing: "السباكة",
    Electrical: "الكهرباء",
    Appliances:
      "الأجهزة المنزلية",
    Furniture: "الأثاث",
    "Carpentry & Furniture":
      "النجارة والأثاث",
    General: "الصيانة العامة",
    "General Maintenance":
      "الصيانة العامة",
  };

  return names[name] || name;
}

/*
  This helper makes the reveal effect rerun
  when the visible technician set changes.
*/
function filteredDependencyKey(
  technicians,
  availabilityFilter
) {
  return `${availabilityFilter}-${technicians
    .map((technician) => technician.id)
    .join("-")}`;
}

export default Technicians;
