import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./Services.css";


function ServicesSmallLabelEffect({
  text,
  className = "",
}) {
  const textRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const isArabicText = /[\u0600-\u06FF]/.test(text);
  const pieces = isArabicText ? text.split(/(\s+)/) : Array.from(text);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.unobserve(element);
      },
      {
        threshold: 0.5,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [text]);

  return (
    <span
      ref={textRef}
      className={`services-small-text-effect ${
        isVisible ? "is-visible" : ""
      } ${isArabicText ? "is-arabic-effect" : ""} ${className}`}
      aria-label={text}
    >
      {pieces.map((piece, index) => {
        if (piece.trim() === "") {
          return (
            <span
              key={`space-${index}`}
              className="services-small-text-effect-space"
              aria-hidden="true"
            >
              {" "}
            </span>
          );
        }

        return (
          <span
            key={`${piece}-${index}`}
            className="services-small-text-effect-piece"
            aria-hidden="true"
            style={{
              "--services-text-delay": `${
                index * (isArabicText ? 70 : 34)
              }ms`,
            }}
          >
            {piece}
          </span>
        );
      })}
    </span>
  );
}

function Services() {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();

  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const aiInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const photoMenuRef = useRef(null);

  const [problem, setProblem] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const serviceCategoryMap = {
    "AC & Cooling": 1,
    Plumbing: 2,
    Electrical: 3,
    Appliances: 4,
    "Carpentry & Furniture": 5,
    "General Maintenance": 6,
  };

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

  useEffect(() => {
    if (!showImageMenu) return undefined;

    const handleOutsidePhotoMenu = (event) => {
      if (
        photoMenuRef.current &&
        !photoMenuRef.current.contains(event.target)
      ) {
        setShowImageMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowImageMenu(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePhotoMenu);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePhotoMenu);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showImageMenu]);

  function openService(serviceId) {
    navigate(`/technicians?service=${serviceId}`);
  }

  function goToSmartAssist() {
    const aiBox = document.querySelector(".services-ai-box");

    aiBox?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      aiInputRef.current?.focus();
    }, 450);
  }

  function handleImageSelected(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAiError(
        tr(
          "Please select a valid image.",
          "يرجى اختيار صورة صالحة."
        )
      );
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAiError(
        tr(
          "Please select an image smaller than 8 MB.",
          "يرجى اختيار صورة أصغر من 8 ميجابايت."
        )
      );
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
    setShowImageMenu(false);
    setAiError("");
    setAiResult(null);
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");
    setAiResult(null);
    setAiError("");

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  async function handleAISearch() {
    const trimmedProblem = problem.trim();

    if (!trimmedProblem && !selectedImage) {
      setAiError(
        tr(
          "Please describe the problem or add a photo.",
          "يرجى وصف المشكلة أو إضافة صورة."
        )
      );
      setAiResult(null);
      return;
    }

    setIsAnalyzing(true);
    setAiError("");
    setAiResult(null);

    try {
      let response;

      if (selectedImage) {
        const imageData = await prepareImageForAI(selectedImage);

        response = await fetch("/api/ai-diagnose-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            problem: trimmedProblem,
            image: imageData,
          }),
        });
      } else {
        response = await fetch("/api/ai-diagnose", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            problem: trimmedProblem,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success || !data.diagnosis) {
        throw new Error(
          data.error ||
            tr(
              "AI could not analyze the problem.",
              "لم يتمكن الذكاء الاصطناعي من تحليل المشكلة."
            )
        );
      }

      setAiResult(data.diagnosis);
    } catch (error) {
      console.error("AI search error:", error);

      setAiError(
        error.message ||
          tr(
            "AI Assistant is temporarily unavailable.",
            "مساعد الذكاء الاصطناعي غير متاح مؤقتًا."
          )
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function viewFixers() {
    if (!aiResult || aiResult.category === "UNKNOWN") return;

    const serviceId = serviceCategoryMap[aiResult.category];
    if (!serviceId) return;

    navigate(
      `/technicians?service=${serviceId}&problem=${encodeURIComponent(
        problem.trim()
      )}`
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="services-page"
    >
      {/* =========================
          EDITORIAL HERO
      ========================== */}
      <section className="services-hero services-hero-clean">
        <div className="services-hero-clean__inner">
          <h1 id="services-hero-title-v2" className="services-hero-clean__title">
            {tr("Services", "الخدمات")}
          </h1>
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
                <ServicesSmallLabelEffect
                  text={tr("WHAT DO YOU NEED?", "ماذا تحتاج؟")}
                />
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
          SMART ASSIST
      ========================== */}
      <section className="services-assist">
        <div className="services-shell">
          <div
            className="services-assist__head"
            data-services-reveal
          >
            <div>
              <p className="services-kicker">
                <ServicesSmallLabelEffect
                  text={tr(
                    "NOT SURE WHICH SERVICE?",
                    "لست متأكدًا من الخدمة؟"
                  )}
                />
              </p>

              <h2>
                {tr(
                  "Let Fixer AI help you choose the right one.",
                  "دع مساعد Fixer الذكي يساعدك في اختيار الخدمة المناسبة."
                )}
              </h2>

              <p>
                {tr(
                  "Describe the problem or attach a photo and we’ll point you to the closest service.",
                  "صف المشكلة أو أرفق صورة وسنوجّهك إلى الخدمة الأقرب لاحتياجك."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={goToSmartAssist}
              className="services-assist__button"
            >
              {tr("Try Smart Assist", "جرّب المساعد الذكي")}
            </button>
          </div>

          <div
            className={`services-ai-box ${
              showImageMenu ? "is-photo-menu-open" : ""
            }`}
          >
            <div className="services-ai-box__intro">
              <span>{tr("FIXER AI", "مساعد FIXER الذكي")}</span>

              <h3>
                {tr(
                  "Describe the problem. We’ll point you to the right service.",
                  "صف المشكلة وسنوجّهك إلى الخدمة المناسبة."
                )}
              </h3>
            </div>

            <div className="services-ai-composer">
              <div className="services-ai-bar">
                <input
                  ref={aiInputRef}
                  type="text"
                  maxLength="500"
                  placeholder={tr(
                    "What needs fixing?",
                    "ما المشكلة التي تحتاج إلى إصلاح؟"
                  )}
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAISearch();
                  }}
                  className="services-ai-input"
                />

                <div
                  ref={photoMenuRef}
                  className="services-ai-photo-wrap"
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={handleImageSelected}
                  />

                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageSelected}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowImageMenu((current) => !current)
                    }
                    className="services-ai-photo"
                  >
                    <i className="fa-regular fa-image"></i>
                    <span>{tr("Photo", "صورة")}</span>
                  </button>

                  {showImageMenu && (
                    <div className="services-ai-photo-menu">
                      <button
                        type="button"
                        onClick={() => {
                          setShowImageMenu(false);
                          cameraInputRef.current?.click();
                        }}
                      >
                        <i className="fa-solid fa-camera"></i>
                        {tr("Take a Photo", "التقاط صورة")}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowImageMenu(false);
                          uploadInputRef.current?.click();
                        }}
                      >
                        <i className="fa-regular fa-image"></i>
                        {tr("Upload Image", "رفع صورة")}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAISearch}
                  disabled={isAnalyzing}
                  className="services-ai-submit"
                >
                  {isAnalyzing ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>{tr("Checking...", "جارٍ التحقق...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{tr("Find service", "اعثر على الخدمة")}</span>
                      <i
                        className={`fa-solid ${
                          isArabic
                            ? "fa-arrow-left"
                            : "fa-arrow-right"
                        }`}
                      ></i>
                    </>
                  )}
                </button>
              </div>

              <div className="services-ai-examples">
                <span>{tr("Try", "جرّب")}</span>

                <button
                  type="button"
                  onClick={() =>
                    setProblem(
                      tr("Leaking faucet", "تسريب صنبور")
                    )
                  }
                >
                  {tr("Leaking faucet", "تسريب صنبور")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setProblem(
                      tr("AC not cooling", "المكيف لا يبرد")
                    )
                  }
                >
                  {tr("AC not cooling", "المكيف لا يبرد")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setProblem(
                      tr("Electrical issue", "مشكلة كهربائية")
                    )
                  }
                >
                  {tr("Electrical issue", "مشكلة كهربائية")}
                </button>
              </div>
            </div>

            {selectedImage && imagePreview && (
              <div className="services-ai-result services-ai-preview">
                <img
                  src={imagePreview}
                  alt={tr(
                    "Selected problem",
                    "صورة المشكلة المختارة"
                  )}
                />

                <div>
                  <span>
                    <i className="fa-solid fa-image"></i>
                    {tr("Photo attached", "تم إرفاق الصورة")}
                  </span>

                  <button
                    type="button"
                    onClick={removeImage}
                  >
                    {tr("Remove", "إزالة")}
                  </button>
                </div>
              </div>
            )}

            {aiError && (
              <div className="services-ai-result services-ai-error">
                <strong>
                  {tr(
                    "AI Assistant is temporarily unavailable.",
                    "مساعد الذكاء الاصطناعي غير متاح مؤقتًا."
                  )}
                </strong>
                <p>{aiError}</p>
              </div>
            )}

            {aiResult && (
              <div className="services-ai-result services-ai-result--home-match">
                {aiResult.category === "UNKNOWN" ? (
                  <>
                    <p className="services-ai-result-unknown-title">
                      {tr(
                        "We couldn't identify the issue.",
                        "لم نتمكن من تحديد المشكلة."
                      )}
                    </p>

                    <p className="services-ai-result-description">
                      {aiResult.explanation ||
                        tr(
                          "Please describe the problem more clearly or upload a clearer photo.",
                          "يرجى وصف المشكلة بشكل أوضح أو رفع صورة أوضح."
                        )}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="services-ai-result__top">
                      <div>
                        <p className="services-ai-result-label">
                          {tr(
                            "AI SERVICE MATCH",
                            "الخدمة المقترحة بالذكاء الاصطناعي"
                          )}
                        </p>

                        <h3 className="services-ai-result-title">
                          {translateServiceName(
                            aiResult.category,
                            language
                          )}
                        </h3>
                      </div>

                      <span className="services-ai-result-match">
                        {Math.min(
                          98,
                          Number(aiResult.confidence)
                        )}
                        % {tr("Match", "تطابق")}
                      </span>
                    </div>

                    <p className="services-ai-result-description">
                      {aiResult.explanation}
                    </p>

                    <button
                      type="button"
                      onClick={viewFixers}
                      className="services-ai-view"
                    >
                      {tr("View Fixers", "عرض الفنيين")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
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


function prepareImageForAI(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxDimension = 1024;

        let width = image.width;
        let height = image.height;

        if (
          width > maxDimension ||
          height > maxDimension
        ) {
          if (width > height) {
            height = Math.round(
              height * (maxDimension / width)
            );
            width = maxDimension;
          } else {
            width = Math.round(
              width * (maxDimension / height)
            );
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(
            new Error("Could not prepare the image.")
          );
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        resolve(
          canvas.toDataURL("image/jpeg", 0.82)
        );
      };

      image.onerror = () => {
        reject(
          new Error("Could not read the selected image.")
        );
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      reject(
        new Error("Could not read the selected image.")
      );
    };

    reader.readAsDataURL(file);
  });
}

export default Services;
