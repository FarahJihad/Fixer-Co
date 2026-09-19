import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import ScrollReveal from "../components/ScrollReveal.jsx";
import Footer from "../components/Footer.jsx";
import "./Home.css";


function SmallLabelTextEffect({
  text,
  className = "",
  enabled = true,
  baseDelay = 0,
}) {
  const textRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const isArabicText = /[\u0600-\u06FF]/.test(text);
  const pieces = isArabicText ? text.split(/(\s+)/) : Array.from(text);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return undefined;
    }

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
        threshold: 0.55,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [text, enabled]);

  return (
    <span
      ref={textRef}
      className={`home-small-text-effect ${
        isVisible ? "is-visible" : ""
      } ${isArabicText ? "is-arabic-effect" : ""} ${className}`}
      aria-label={text}
    >
      {pieces.map((piece, index) => {
        if (piece.trim() === "") {
          return (
            <span
              key={`space-${index}`}
              aria-hidden="true"
              className="home-small-text-effect-space"
            >
              {" "}
            </span>
          );
        }

        return (
          <span
            key={`${piece}-${index}`}
            aria-hidden="true"
            className="home-small-text-effect-piece"
            style={{
              "--text-effect-delay": `${
                baseDelay + index * (isArabicText ? 72 : 34)
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

function Home() {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();

  const tr = (en, ar) => (language === "ar" ? ar : en);

  function handleServiceCardMouseMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }

  function handleServiceCardMouseLeave(event) {
    event.currentTarget.style.removeProperty("--mouse-x");
    event.currentTarget.style.removeProperty("--mouse-y");
  }

  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const photoMenuRef = useRef(null);
  const servicesTrackRef = useRef(null);

  const [problem, setProblem] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showImageMenu, setShowImageMenu] = useState(false);

  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [services, setServices] = useState([]);
const [servicesLoading, setServicesLoading] = useState(true);
const [servicesError, setServicesError] = useState("");
const [technicians, setTechnicians] = useState([]);
const [techniciansLoading, setTechniciansLoading] = useState(true);
const [techniciansError, setTechniciansError] = useState("");
const [heroWordIndex, setHeroWordIndex] = useState(0);
const [heroAnimationReady, setHeroAnimationReady] = useState(
  () => sessionStorage.getItem("fixerIntroBeamsV1Seen") === "true"
);
const [servicesAtStart, setServicesAtStart] = useState(true);
const [servicesAtEnd, setServicesAtEnd] = useState(false);
const [activeServiceIndex, setActiveServiceIndex] = useState(0);
const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

const heroWords = isArabic
  ? ["أسهل", "أوثق", "أذكى"]
  : ["Simple", "Trusted", "Smarter"];

const heroWord = heroWords[heroWordIndex];

  useEffect(() => {
    const handleIntroComplete = () => {
      // Tiny pause after the intro disappears, then start the hero word motion.
      window.setTimeout(() => setHeroAnimationReady(true), 220);
    };

    window.addEventListener("fixer-intro-complete", handleIntroComplete);

    // If the intro was already seen in this session, start immediately.
    if (sessionStorage.getItem("fixerIntroBeamsV1Seen") === "true") {
      setHeroAnimationReady(true);
    }

    return () => {
      window.removeEventListener("fixer-intro-complete", handleIntroComplete);
    };
  }, []);

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

    const handlePhotoMenuEscape = (event) => {
      if (event.key === "Escape") {
        setShowImageMenu(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePhotoMenu);
    document.addEventListener("keydown", handlePhotoMenuEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePhotoMenu);
      document.removeEventListener("keydown", handlePhotoMenuEscape);
    };
  }, [showImageMenu]);

  useEffect(() => {
    if (!heroAnimationReady) {
      setHeroWordIndex(0);
      return undefined;
    }

    setHeroWordIndex(0);

    const timers = [
      window.setTimeout(() => setHeroWordIndex(1), 1500),
      window.setTimeout(() => setHeroWordIndex(2), 3000),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [language, heroAnimationReady]);

  const categories = [
    {
      id: 1,
      name: tr("AC & Cooling", "التكييف والتبريد"),
      icon: "fa-solid fa-snowflake",
    },
    {
      id: 2,
      name: tr("Plumbing", "السباكة"),
      icon: "fa-solid fa-droplet",
    },
    {
      id: 3,
      name: tr("Electrical", "الكهرباء"),
      icon: "fa-solid fa-bolt",
    },
    {
      id: 4,
      name: tr("Appliances", "الأجهزة المنزلية"),
      icon: "fa-solid fa-tv",
    },
    {
      id: 5,
      name: tr("Furniture", "الأثاث"),
      icon: "fa-solid fa-couch",
    },
    {
      id: 6,
      name: tr("General", "صيانة عامة"),
      icon: "fa-solid fa-house",
    },
  ];

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
      setServicesLoading(true);
      setServicesError("");

      const response = await fetch("/api/services");
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Could not load services.");
      }

      // Supports either an array directly
      // or an object containing a services array.
      const serviceList = Array.isArray(data)
        ? data
        : data.services || [];

      setServices(serviceList);
    } catch (error) {
      console.error("Services error:", error);

      setServicesError(
        tr("Services are temporarily unavailable.", "الخدمات غير متاحة مؤقتًا.")
      );
    } finally {
      setServicesLoading(false);
    }
  }

  loadServices();
}, []);

useEffect(() => {
  const track = servicesTrackRef.current;
  if (!track || servicesLoading || services.length === 0) return;

  function updateServiceSliderState() {
    const cards = Array.from(
      track.querySelectorAll(".home-service-story-card")
    );

    if (!cards.length) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const currentScroll = Math.abs(track.scrollLeft);

    setServicesAtStart(currentScroll <= 4);
    setServicesAtEnd(maxScroll - currentScroll <= 4);

    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - trackCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveServiceIndex(closestIndex);
  }

  updateServiceSliderState();

  track.addEventListener("scroll", updateServiceSliderState, {
    passive: true,
  });

  window.addEventListener("resize", updateServiceSliderState);

  return () => {
    track.removeEventListener("scroll", updateServiceSliderState);
    window.removeEventListener("resize", updateServiceSliderState);
  };
}, [services, servicesLoading, language]);

useEffect(() => {
  async function loadTechnicians() {
    try {
      setTechniciansLoading(true);
      setTechniciansError("");

      const response = await fetch("/api/technicians");
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Could not load technicians.");
      }

      const technicianList = Array.isArray(data)
        ? data
        : data.technicians || [];

      setTechnicians(
        [...technicianList]
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 4)
      );
    } catch (error) {
      console.error("Technicians error:", error);

      setTechniciansError(
        tr("Fixers are temporarily unavailable.", "الفنيون غير متاحين مؤقتًا.")
      );
    } finally {
      setTechniciansLoading(false);
    }
  }

  loadTechnicians();
}, []);

  function openService(id) {
    navigate(`/technicians?service=${id}`);
  }

  function scrollServices(direction) {
    const track = servicesTrackRef.current;
    if (!track) return;

    const card = track.querySelector(".home-service-story-card");
    const cardWidth = card?.getBoundingClientRect().width || 320;
    const gap = 16;

    track.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: "smooth",
    });
  }

  function handleImageSelected(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAiError(tr("Please select a valid image.", "يرجى اختيار صورة صالحة."));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAiError(tr("Please select an image smaller than 8 MB.", "يرجى اختيار صورة أصغر من 8 ميجابايت."));
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

    /*
      The user can search with:
      1. Text only
      2. Image only
      3. Text + image
    */
    if (!trimmedProblem && !selectedImage) {
      setAiError(
        tr("Please describe the problem or add a photo.", "يرجى وصف المشكلة أو إضافة صورة.")
      );
      setAiResult(null);
      return;
    }

    setIsAnalyzing(true);
    setAiError("");
    setAiResult(null);

    try {
      let response;

      /*
        IMAGE MODE
      */
      if (selectedImage) {
        const imageData =
          await prepareImageForAI(selectedImage);

        response = await fetch(
          "/api/ai-diagnose-image",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              problem: trimmedProblem,
              image: imageData,
            }),
          }
        );
      }

      /*
        TEXT-ONLY MODE
      */
      else {
        response = await fetch(
          "/api/ai-diagnose",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              problem: trimmedProblem,
            }),
          }
        );
      }

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.diagnosis
      ) {
        throw new Error(
          data.error ||
            tr("AI could not analyze the problem.", "لم يتمكن الذكاء الاصطناعي من تحليل المشكلة.")
        );
      }

      setAiResult(data.diagnosis);
    } catch (error) {
      console.error(
        "AI search error:",
        error
      );
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
    if (
      !aiResult ||
      aiResult.category === "UNKNOWN"
    ) {
      return;
    }

    const serviceId =
      serviceCategoryMap[aiResult.category];

    if (!serviceId) {
      return;
    }

    navigate(
      `/technicians?service=${serviceId}&problem=${encodeURIComponent(
        problem.trim()
      )}`
    );
  }


  useEffect(() => {
    const section = document.querySelector(".home-bridge-section");
    if (!section) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      section.classList.add("is-vita-visible");
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        section.classList.add("is-vita-visible");
        observer.unobserve(section);
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    const section = document.querySelector(".home-services-story-section");
    if (!section) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      section.classList.add("is-services-visible");
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        section.classList.add("is-services-visible");
        observer.unobserve(section);
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    if (techniciansLoading) return undefined;

    const lineGroups = document.querySelectorAll(
      ".home-top-fixers-editorial-grid"
    );

    if (!lineGroups.length) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      lineGroups.forEach((group) =>
        group.classList.add("is-lines-visible")
      );
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-lines-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    lineGroups.forEach((group) => observer.observe(group));

    return () => observer.disconnect();
  }, [techniciansLoading, technicians.length]);

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="home-page min-h-screen bg-[#f7f9f8] text-[#17252e]"
    >
      <ScrollReveal />

      {/* CINEMATIC HERO */}
      <section className="home-cinematic-hero">
        <img
          src="/media/hero/fixer-hero-bg.png"
          alt={tr("Professional Fixer ready to help", "فني محترف جاهز للمساعدة")}
          className="home-cinematic-hero-image"
        />

        <div className="home-cinematic-hero-shade" aria-hidden="true"></div>

        <div className="home-cinematic-hero-inner">
          <div className="home-cinematic-hero-content">
            <p className="home-cinematic-hero-kicker">
              <SmallLabelTextEffect
                text={tr(
                  "YOUR HOME. IN GOOD HANDS.",
                  "منزلك في أيدٍ موثوقة."
                )}
                enabled={heroAnimationReady}
              />
            </p>

            <h1 className="home-cinematic-hero-title">
              <span>{tr("Home repairs made", "صيانة المنزل أصبحت")}</span>
              <span className="home-cinematic-hero-word-wrap">
                <span
                  key={`${language}-${heroWordIndex}`}
                  className={`home-cinematic-hero-word ${
                    !isArabic && heroWord === "Smarter" ? "is-smarter" : ""
                  }`}
                >
                  {heroWord}
                </span>
              </span>
            </h1>

            <p className="home-cinematic-hero-copy">
              {isArabic ? (
                <>
                  <span className="home-cinematic-copy-line">
                    خدمات منزلية موثوقة، تناسب احتياجك الفعلي، مع فنيين موثوقين
                  </span>
                  <span className="home-cinematic-copy-line">
                    جاهزين لإنجاز العمل بالشكل الصحيح.
                  </span>
                </>
              ) : (
                <>
                  <span className="home-cinematic-copy-line">
                    Trusted home services, matched to what you actually need, with reliable Fixers
                  </span>
                  <span className="home-cinematic-copy-line">
                    ready to get the job done right.
                  </span>
                </>
              )}
            </p>

            <div className="home-cinematic-hero-actions">
              <button
                type="button"
                className="home-cinematic-primary"
                onClick={() => navigate("/services")}
              >
                <span>{tr("Explore services", "استكشف الخدمات")}</span>
              </button>

              <button
                type="button"
                className="home-cinematic-secondary"
                onClick={() => navigate("/technicians")}
              >
                {tr("Find a Fixer", "ابحث عن فني")}
              </button>
            </div>
          </div>

          <div className="home-cinematic-scroll" aria-hidden="true">
            <span>{tr("Scroll", "مرر")}</span>
            <span className="home-cinematic-scroll-line"></span>
          </div>
        </div>
      </section>

      {/* HOME BRIDGE */}
      <section className="home-bridge-section">
        <div className="home-bridge-shell">
          <div className="home-bridge-copy">
            <p className="home-bridge-kicker">
              <SmallLabelTextEffect
                text={tr(
                  "BUILT AROUND WHAT YOU NEED",
                  "مصمم حول احتياجك"
                )}
              />
            </p>

            <h2
              className="home-bridge-title"
              aria-label={tr(
                "Need something fixed? We’ll match you with the right person.",
                "تحتاج إصلاح شيء؟ سنوصلك بالشخص المناسب."
              )}
            >
              <span className="home-bridge-line-mask">
                <span className="home-bridge-line home-bridge-line--question">
                  {tr("Need something fixed?", "تحتاج إصلاح شيء؟")}
                </span>
              </span>

              <span className="home-bridge-line-mask">
                <span className="home-bridge-line home-bridge-line--answer">
                  {tr(
                    "We’ll match you with the right person.",
                    "سنوصلك بالشخص المناسب."
                  )}
                </span>
              </span>
            </h2>
          </div>

          <div className="home-bridge-points">
            <div
              className="home-bridge-point"
              style={{ "--bridge-delay": "0.46s" }}
            >
              <span className="home-bridge-point-number">01</span>
              <span>{tr("Smart Matching", "مطابقة ذكية")}</span>
            </div>

            <div
              className="home-bridge-point"
              style={{ "--bridge-delay": "0.58s" }}
            >
              <span className="home-bridge-point-number">02</span>
              <span>{tr("Trusted Fixers", "فنيون موثوقون")}</span>
            </div>

            <div
              className="home-bridge-point"
              style={{ "--bridge-delay": "0.70s" }}
            >
              <span className="home-bridge-point-number">03</span>
              <span>{tr("Simple Booking", "حجز بسيط")}</span>
            </div>
          </div>
        </div>
      </section>

{/* SERVICES */}
<section className="home-services-story-section" data-reveal="up">
  <div className="home-services-story-shell">
    <div data-reveal="up" className={`home-services-story-heading ${isArabic ? "text-right" : "text-left"}`}>
      <div>
        <p className="home-services-story-kicker">
          <SmallLabelTextEffect
            text={tr("OUR SERVICES", "خدماتنا")}
          />
        </p>

        <h2 className="home-services-story-title">
          {tr("What can we fix for you?", "ما الذي يمكننا إصلاحه لك؟")}
        </h2>

        <p className="home-services-story-copy">
          {tr(
            "Choose the service you need and find trusted technicians ready to help.",
            "اختر الخدمة التي تحتاجها واعثر على فنيين موثوقين جاهزين للمساعدة."
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate("/services")}
        className="home-services-story-all"
      >
        <span>{tr("View all services", "عرض جميع الخدمات")}</span>
        <i className={`fa-solid ${isArabic ? "fa-arrow-left" : "fa-arrow-right"}`}></i>
      </button>
    </div>

    {servicesLoading && (
      <div className="flex items-center gap-3 py-10 text-[#66757f]">
        <i className="fa-solid fa-spinner fa-spin text-[#3d9276]"></i>
        {tr("Loading services...", "جارٍ تحميل الخدمات...")}
      </div>
    )}

    {servicesError && !servicesLoading && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {servicesError}
      </div>
    )}

    {!servicesLoading && !servicesError && services.length > 0 && (
      <div className="home-services-story-wrap">
        <div
          ref={servicesTrackRef}
          className="home-services-story-track"
          dir={isArabic ? "rtl" : "ltr"}
        >
          {services.slice(0, 6).map((service, index) => (
            <button
              key={service.id}
              type="button"
              onClick={() => openService(service.id)}
              className="home-service-story-card"
              style={{
                "--service-delay": `${index * 85}ms`,
              }}
            >
              <img
                src={getServiceImage(service.name)}
                alt={translateServiceName(service.name, language)}
                className="home-service-story-image"
                style={{
                  objectPosition:
                    service.name === "Electrical" ? "30% center" : "center",
                }}
              />

              <span className="home-service-story-shade" aria-hidden="true"></span>

              <span className="home-service-story-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="home-service-story-content">
                <span className="home-service-story-name">
                  {translateServiceName(service.name, language)}
                </span>

                <span className="home-service-story-description">
                  {translateServiceDescription(
                    service.description || "",
                    service.name,
                    language
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="home-services-story-controls home-services-story-controls-reveal">
          <button
            type="button"
            className={`home-services-story-nav home-services-story-nav-prev ${
              (isArabic ? servicesAtEnd : servicesAtStart) ? "is-hidden" : ""
            }`}
            onClick={() => scrollServices(isArabic ? 1 : -1)}
            aria-label={tr("Previous services", "الخدمات السابقة")}
          >
            <span aria-hidden="true">‹</span>
          </button>

          <div
            className="home-services-story-dots"
            aria-label={tr("Service slider position", "موضع شريط الخدمات")}
          >
            {services.slice(0, 6).map((service, index) => (
              <span
                key={`service-dot-${service.id}`}
                className={`home-services-story-dot ${
                  activeServiceIndex === index ? "is-active" : ""
                }`}
                aria-hidden="true"
              ></span>
            ))}
          </div>

          <button
            type="button"
            className={`home-services-story-nav home-services-story-nav-next ${
              (isArabic ? servicesAtStart : servicesAtEnd) ? "is-hidden" : ""
            }`}
            onClick={() => scrollServices(isArabic ? -1 : 1)}
            aria-label={tr("Next services", "الخدمات التالية")}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    )}

    {!servicesLoading && !servicesError && services.length === 0 && (
      <p className="py-8 text-[#66757f]">
        {tr(
          "No services are available right now.",
          "لا توجد خدمات متاحة حاليًا."
        )}
      </p>
    )}

    <div
      id="fixer-ai-guide"
      className={`home-services-ai-drawer ${
        isAiAssistantOpen ? "is-open" : ""
      }`}
    >
      <button
        type="button"
        className="home-services-ai-drawer-trigger"
        onClick={() => setIsAiAssistantOpen((current) => !current)}
        aria-expanded={isAiAssistantOpen}
        aria-controls="fixer-ai-drawer-content"
      >
        <span className="home-services-ai-drawer-heading">
          <span className="home-services-ai-drawer-kicker">
            {tr("NOT SURE WHICH SERVICE?", "غير متأكد أي خدمة تحتاج؟")}
          </span>

          <span className="home-services-ai-drawer-title">
            {tr(
              "Let Fixer AI help you choose the right one.",
              "دع مساعد Fixer الذكي يساعدك في اختيار الخدمة المناسبة."
            )}
          </span>
        </span>

        <span className="home-services-ai-drawer-action">
          <span>
            {isAiAssistantOpen
              ? tr("Close assistant", "إغلاق المساعد")
              : tr("Ask Fixer AI", "اسأل مساعد Fixer الذكي")}
          </span>

          <i
            className={`fa-solid ${
              isAiAssistantOpen ? "fa-xmark" : "fa-plus"
            }`}
            aria-hidden="true"
          ></i>
        </span>
      </button>

      <div
        id="fixer-ai-drawer-content"
        className="home-services-ai-drawer-content"
        aria-hidden={!isAiAssistantOpen}
      >
        <div className="home-services-ai-drawer-inner">
          <div className="home-services-ai-intro">
            <p>{tr("FIXER AI", "مساعد FIXER الذكي")}</p>

            <h3>
              {isArabic ? (
                "صف المشكلة وسنوجّهك إلى الخدمة المناسبة."
              ) : (
                <>
                  <span className="home-services-ai-heading-line">
                    Describe the problem
                  </span>
                  <span className="home-services-ai-heading-line home-services-ai-heading-line--nowrap">
                    We’ll point you to the right service.
                  </span>
                </>
              )}
            </h3>

            <span>
              {tr(
                "You can also attach a photo if that’s easier.",
                "ويمكنك أيضًا إرفاق صورة إذا كان ذلك أسهل."
              )}
            </span>
          </div>

          <div className="home-service-finder home-services-ai-composer">
            <div className="home-service-finder-bar">
              <input
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
                className="home-service-finder-input"
              />

              <div ref={photoMenuRef} className="home-service-finder-photo-wrap">
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
                  aria-label={tr("Add a photo", "إضافة صورة")}
                  onClick={() =>
                    setShowImageMenu((current) => !current)
                  }
                  className="home-service-finder-photo"
                >
                  <i className="fa-regular fa-image"></i>
                  <span>{tr("Photo", "صورة")}</span>
                </button>

                {showImageMenu && (
                  <div className="home-service-finder-menu">
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
                className="home-service-finder-submit"
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
                        isArabic ? "fa-arrow-left" : "fa-arrow-right"
                      }`}
                      aria-hidden="true"
                    ></i>
                  </>
                )}
              </button>
            </div>

            <div className="home-service-finder-examples">
              <span>{tr("Try", "جرّب")}</span>

              <button
                type="button"
                onClick={() =>
                  setProblem(tr("Leaking faucet", "تسريب صنبور"))
                }
              >
                {tr("Leaking faucet", "تسريب صنبور")}
              </button>

              <button
                type="button"
                onClick={() =>
                  setProblem(tr("AC not cooling", "المكيف لا يبرد"))
                }
              >
                {tr("AC not cooling", "المكيف لا يبرد")}
              </button>

              <button
                type="button"
                onClick={() =>
                  setProblem(tr("Electrical issue", "مشكلة كهربائية"))
                }
              >
                {tr("Electrical issue", "مشكلة كهربائية")}
              </button>
            </div>
          </div>

          {selectedImage && imagePreview && (
            <div className="home-hero-feedback-card home-services-ai-feedback">
              <img
                src={imagePreview}
                alt={tr(
                  "Selected problem",
                  "صورة المشكلة المختارة"
                )}
                className="max-h-[220px] w-full rounded-xl object-cover"
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#66757f]">
                  <i className="fa-solid fa-image text-[#3d9276]"></i>
                  {tr("Photo attached", "تم إرفاق الصورة")}
                </span>

                <button
                  type="button"
                  onClick={removeImage}
                  className="text-sm font-bold text-[#173b57]"
                >
                  {tr("Remove", "إزالة")}
                </button>
              </div>
            </div>
          )}

          {aiError && (
            <div className="home-hero-feedback-card home-hero-feedback-error home-services-ai-feedback">
              <strong>
                {tr(
                  "AI Assistant is temporarily unavailable.",
                  "مساعد الذكاء الاصطناعي غير متاح مؤقتًا."
                )}
              </strong>
              <p className="mt-1">{aiError}</p>
            </div>
          )}

          {aiResult && (
            <div className="home-hero-feedback-card home-services-ai-feedback">
              {aiResult.category === "UNKNOWN" ? (
                <>
                  <p className="font-extrabold text-[#102d43]">
                    {tr(
                      "We couldn't identify the issue.",
                      "لم نتمكن من تحديد المشكلة."
                    )}
                  </p>

                  <p className="mt-2 text-sm text-[#66757f]">
                    {aiResult.explanation ||
                      tr(
                        "Please describe the problem more clearly or upload a clearer photo.",
                        "يرجى وصف المشكلة بشكل أوضح أو رفع صورة أوضح."
                      )}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#3d9276]">
                        {tr(
                          "AI SERVICE MATCH",
                          "الخدمة المقترحة بالذكاء الاصطناعي"
                        )}
                      </p>

                      <h3 className="mt-2 text-[22px] font-bold text-[#102d43]">
                        {translateServiceName(
                          aiResult.category,
                          language
                        )}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#edf7f3] px-3 py-2 text-sm font-extrabold text-[#3d9276]">
                      {Math.min(98, Number(aiResult.confidence))}%{" "}
                      {tr("Match", "تطابق")}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-[#66757f]">
                    {aiResult.explanation}
                  </p>

                  <button
                    type="button"
                    onClick={viewFixers}
                    className="mt-4 text-sm font-extrabold text-[#173b57]"
                  >
                    {tr("View Fixers", "عرض الفنيين")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</section>


      {/* TOP FIXERS */}
<section className="home-top-fixers-editorial" data-reveal="up">
  <div className="home-top-fixers-editorial-shell">

    <div className="home-top-fixers-editorial-head" data-reveal="up">
      <div>
        <p className="home-top-fixers-editorial-kicker">
          <SmallLabelTextEffect
            text={tr("TOP FIXERS", "أفضل الفنيين")}
          />
        </p>

        <h2 className="home-top-fixers-editorial-title">
          {tr("Trusted by homeowners", "موثوقون لدى أصحاب المنازل")}
        </h2>

        <p className="home-top-fixers-editorial-copy">
          {tr(
            "Meet four of our highest-rated technicians, selected from our trusted network.",
            "تعرّف على أربعة من أعلى الفنيين تقييمًا ضمن شبكة الفنيين الموثوقين لدينا."
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate("/technicians")}
        className="home-top-fixers-editorial-all"
      >
        <span>{tr("View All Fixers", "عرض جميع الفنيين")}</span>
        <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
      </button>
    </div>

    {techniciansLoading && (
      <div className="home-top-fixers-editorial-state">
        <i className="fa-solid fa-spinner fa-spin"></i>
        {tr("Loading fixers...", "جارٍ تحميل الفنيين...")}
      </div>
    )}

    {techniciansError && !techniciansLoading && (
      <div className="home-top-fixers-editorial-error">
        {techniciansError}
      </div>
    )}

    {!techniciansLoading &&
      !techniciansError &&
      technicians.length > 0 && (
        <div className="home-top-fixers-editorial-grid">
          {technicians.slice(0, 4).map((technician, index) => {
            const technicianPhoto =
              technician.profile_image ||
              technician.image ||
              technician.photo ||
              technician.avatar ||
              technician.image_url ||
              technician.photo_url ||
              "";

            return (
              <article
                key={technician.id}
                className="home-top-fixer-editorial"
                data-reveal="up"
                style={{ "--reveal-delay": `${index * 120}ms` }}
              >
                <div className="home-top-fixer-content">
                  <div className="home-top-fixer-name-row">
                    <h3>{technician.name}</h3>

                    {Number(technician.verified) === 1 && (
                      <i
                        className="fa-solid fa-circle-check"
                        title={tr("Verified Fixer", "فني موثّق")}
                      ></i>
                    )}
                  </div>

                  <p className="home-top-fixer-specialty">
                    {translateServiceName(
                      technician.service_name,
                      language
                    )}
                  </p>

                  <div className="home-top-fixer-details">
                    <div className="home-top-fixer-detail">
                      <span>{tr("Rating", "التقييم")}</span>
                      <strong>
                        <i className="fa-solid fa-star"></i>
                        {Number(technician.rating).toFixed(1)}
                      </strong>
                    </div>

                    <div className="home-top-fixer-detail">
                      <span>{tr("Location", "الموقع")}</span>
                      <strong>
                        <i className="fa-solid fa-location-dot"></i>
                        {technician.location}
                      </strong>
                    </div>

                    <div className="home-top-fixer-detail">
                      <span>{tr("Starting from", "يبدأ من")}</span>
                      <strong>
                        {technician.starting_price ?? technician.price} {tr("SAR", "ر.س")}
                      </strong>
                    </div>

                    <div className="home-top-fixer-detail">
                      <span>{tr("Status", "الحالة")}</span>
                      <strong
                        className={
                          Number(technician.available) === 1
                            ? "is-available"
                            : ""
                        }
                      >
                        {Number(technician.available) === 1
                          ? tr("Available", "متاح")
                          : tr("Busy", "مشغول")}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/technicians/${technician.id}`)
                    }
                    className="home-top-fixer-profile"
                  >
                    <span>{tr("View Profile", "عرض الملف")}</span>
                    <span aria-hidden="true">
                      {isArabic ? "←" : "→"}
                    </span>
                  </button>
                </div>

                <div className="home-top-fixer-visual">
                  {technicianPhoto ? (
                    <img
                      src={technicianPhoto}
                      alt={technician.name}
                      className="home-top-fixer-photo"
                    />
                  ) : (
                    <div className="home-top-fixer-photo-fallback">
                      <span className="home-top-fixer-rank">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="home-top-fixer-watermark">
                        <i
                          className={getServiceIcon(
                            technician.service_id
                          )}
                        ></i>
                      </span>

                      <div className="home-top-fixer-initials">
                        {getInitials(technician.name)}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

    {!techniciansLoading &&
      !techniciansError &&
      technicians.length === 0 && (
        <p className="home-top-fixers-editorial-state">
          {tr(
            "No fixers are available right now.",
            "لا يوجد فنيون متاحون حاليًا."
          )}
        </p>
      )}
  </div>
</section>

{/* HOW IT WORKS */}
<section className="home-how-clean-section" data-reveal="up">
  <div className="home-how-clean-shell">

    <div className="home-how-clean-head" data-reveal="up">
      <p className="home-how-clean-kicker">
        <SmallLabelTextEffect
          text={tr("HOW IT WORKS", "كيف تعمل المنصة")}
        />
      </p>

      <h2 className="home-how-clean-title">
        {tr("Home repairs made simple", "صيانة المنزل أصبحت أسهل")}
      </h2>

      <p className="home-how-clean-copy">
        {tr(
          "From problem to the right fixer in three clear steps.",
          "من المشكلة إلى الفني المناسب خلال ثلاث خطوات واضحة."
        )}
      </p>
    </div>

    <div className="home-how-clean-flow">
      {[
        {
          number: "01",
          icon: "fa-solid fa-message",
          enTitle: "Describe the problem",
          arTitle: "صف المشكلة",
          enText: "Tell us what is wrong, add a photo, or choose a service.",
          arText: "أخبرنا بالمشكلة أو أضف صورة أو اختر الخدمة.",
        },
        {
          number: "02",
          icon: "fa-solid fa-user-check",
          enTitle: "Compare trusted fixers",
          arTitle: "قارن الفنيين",
          enText: "Review ratings, availability, location, and starting price.",
          arText: "راجع التقييم والتوفر والموقع والسعر الابتدائي.",
        },
        {
          number: "03",
          icon: "fa-solid fa-calendar-check",
          enTitle: "Request the service",
          arTitle: "اطلب الخدمة",
          enText: "Choose your fixer, send the request, and track its status.",
          arText: "اختر الفني وأرسل الطلب ثم تابع حالته.",
        },
      ].map((step, index) => (
        <article
          key={step.number}
          className="home-how-clean-step"
          data-reveal="up"
          style={{ "--reveal-delay": `${index * 120}ms` }}
        >
          <div className="home-how-clean-marker">
            <span className="home-how-clean-number">{step.number}</span>
            <span className="home-how-clean-icon">
              <i className={step.icon}></i>
            </span>
          </div>

          <div className="home-how-clean-content">
            <h3>{tr(step.enTitle, step.arTitle)}</h3>
            <p>{tr(step.enText, step.arText)}</p>
          </div>
        </article>
      ))}
    </div>

  </div>
</section>

{/* CTA — OLD FIXER.CO COLORS */}
<section className="home-cta-section" data-reveal="up">
  <div
    data-reveal="up"
    className={`
      mx-auto
      flex
      w-[90%]
      max-w-[1160px]
      flex-col
      justify-between
      gap-10
      md:items-center
      ${isArabic ? "md:flex-row-reverse" : "md:flex-row"}
    `}
  >
    <div className={isArabic ? "text-right" : "text-left"}>
      <p className="mb-5 text-xs font-bold uppercase tracking-[1.6px] text-[#3d9276]">
        <SmallLabelTextEffect
          text={tr("READY TO GET STARTED?", "جاهز للبدء؟")}
        />
      </p>

      <h2 className="max-w-[760px] text-[36px] font-bold leading-[1.16] tracking-[-1.5px] sm:text-[42px] md:text-[48px]">
        <span className="block text-[#102d43]">
          {tr("Stop searching around", "توقف عن البحث في كل مكان")}
        </span>
        <span className="mt-1 block text-[#3d9276]">
          {tr(
            "Find the right help in one place",
            "اعثر على المساعدة المناسبة في مكان واحد"
          )}
        </span>
      </h2>
    </div>

    <button
      type="button"
      onClick={() => navigate("/services")}
      className="home-cta-button home-liquid-button flex shrink-0 items-center justify-center"
    >
      <span className="home-liquid-sheen" aria-hidden="true"></span>

      <span className="home-liquid-content">
        {tr("Request a Service", "اطلب خدمة")}
      </span>
    </button>
  </div>
</section>

<Footer />
    </main>
  );
}


/*
  Resize and compress the image before
  sending it to Cloudflare Workers AI.
*/
function prepareImageForAI(file) {
  return new Promise(
    (resolve, reject) => {

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
                height *
                  (maxDimension / width)
              );

              width = maxDimension;
            } else {
              width = Math.round(
                width *
                  (maxDimension / height)
              );

              height = maxDimension;
            }
          }

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

          if (!context) {
            reject(
              new Error(
                "Could not prepare the image."
              )
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

          const compressedImage =
            canvas.toDataURL(
              "image/jpeg",
              0.82
            );

          resolve(compressedImage);
        };

        image.onerror = () => {
          reject(
            new Error(
              "Could not read the selected image."
            )
          );
        };

        image.src = reader.result;
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Could not read the selected image."
          )
        );
      };

      reader.readAsDataURL(file);
    }
  );
}

function getServiceImage(serviceName) {
  const images = {
    "AC & Cooling": "/media/services/ac-cooling.png",
    Plumbing: "/media/services/plumbing.png",
    Electrical: "/media/services/electrical.png",
    Appliances: "/media/services/appliances.png",
    "Carpentry & Furniture": "/media/services/carpentry-furniture.png",
    "General Maintenance": "/media/services/general-maintenance.png",
  };

  return images[serviceName] || "/media/services/general-maintenance.png";
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

function getInitials(name) {
  if (!name) {
    return "F";
  }

  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
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
    "Carpentry & Furniture": "النجارة والأثاث",
    General: "صيانة عامة",
    "General Maintenance": "الصيانة العامة",
  };

  return names[name] || name;
}

function translateServiceDescription(
  description,
  serviceName,
  language
) {
  if (language !== "ar") {
    return description;
  }

  const descriptions = {
    "AC & Cooling":
      "خدمات إصلاح وصيانة أجهزة التكييف والتبريد.",
    Plumbing:
      "خدمات السباكة وإصلاح مشاكل المياه والتسريبات.",
    Electrical:
      "خدمات إصلاح وصيانة الأنظمة الكهربائية المنزلية.",
    Appliances:
      "خدمات إصلاح وصيانة الأجهزة المنزلية.",
    Furniture:
      "خدمات النجارة وإصلاح وصيانة الأثاث.",
    "Carpentry & Furniture":
      "خدمات النجارة وإصلاح وصيانة الأثاث.",
    General:
      "خدمات الصيانة المنزلية العامة.",
    "General Maintenance":
      "خدمات الصيانة المنزلية العامة.",
  };

  return descriptions[serviceName] || description;
}

export default Home;