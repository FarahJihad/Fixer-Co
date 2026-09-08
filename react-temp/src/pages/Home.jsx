import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import ScrollReveal from "../components/ScrollReveal.jsx";
import Footer from "../components/Footer.jsx";

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

const heroWords = isArabic
  ? ["أسهل", "أوثق", "أذكى"]
  : ["Simple", "Trusted", "Smarter"];

const heroWord = heroWords[heroWordIndex];

  useEffect(() => {
    setHeroWordIndex(0);

    const timers = [
      window.setTimeout(() => setHeroWordIndex(1), 1500),
      window.setTimeout(() => setHeroWordIndex(2), 3000),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [language]);

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

      setTechnicians(technicianList.slice(0, 3));
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

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f9f8] text-[#17252e]"
    >
      <ScrollReveal />

      {/* HERO */}
      <section className="py-16 lg:py-[90px]" data-reveal="up">

        <div className="mx-auto grid w-[90%] max-w-[1160px] gap-12 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-[42px]">

          {/* LEFT SIDE */}
          <div data-reveal="up">

            <p className="mb-[18px] text-xs font-bold uppercase tracking-[1.5px] text-[#3d9276]">
              {tr("Trusted local home services", "خدمات منزلية محلية موثوقة")}
            </p>

            <h1
              className="
                home-hero-heading
                max-w-[780px]
                text-[40px]
                font-bold
                leading-[1.08]
                tracking-[-1.5px]
                text-[#102d43]
                sm:text-[46px]
                md:text-[54px]
                lg:text-[60px]
                lg:tracking-[-2px]
              "
            >
              <span className="block">
                {tr("Home repairs made", "صيانة المنزل أصبحت")}
              </span>

              <span className="home-hero-word-wrap mt-2 block">
                <span key={`${language}-${heroWordIndex}`} className="home-hero-word">
                  {heroWord}
                </span>
              </span>
            </h1>

            <p className="my-6 max-w-[720px] whitespace-normal text-[14px] leading-6 text-[#66757f] lg:whitespace-nowrap lg:text-[15px]">
              {tr(
                "Describe your problem or choose a service to discover trusted technicians near you.",
                "صف المشكلة أو اختر خدمة للعثور على فنيين موثوقين بالقرب منك."
              )}
            </p>

            {/* AI LABEL */}
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#173b57]">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>{tr("AI POWERED", "مدعوم بالذكاء الاصطناعي")}</span>
            </div>

            {/* AI SEARCH */}
            <div className="home-ai-box flex max-w-[680px] items-center gap-2 rounded-[14px] border border-[#e2e9e6] bg-white p-[7px] shadow-[0_12px_35px_rgba(23,59,87,0.08)]">

              <input
                type="text"
                maxLength="500"
                placeholder={tr("Describe what's wrong...", "صف المشكلة...")}
                value={problem}
                onChange={(event) =>
                  setProblem(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAISearch();
                  }
                }}
                className="min-w-0 flex-1 bg-transparent px-[15px] py-[13px] text-[#17252e] outline-none"
              />

              {/* CAMERA / UPLOAD */}
              <div className="relative">

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
                    setShowImageMenu(
                      (current) => !current
                    )
                  }
                  className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-[10px] bg-[#edf7f3] text-[#3d9276] transition hover:bg-[#dceee7]"
                >
                  <i className="fa-solid fa-camera"></i>
                </button>

                {showImageMenu && (
                  <div className="absolute right-0 top-[58px] z-30 w-[190px] overflow-hidden rounded-xl border border-[#e2e9e6] bg-white p-2 shadow-xl">

                    <button
                      type="button"
                      onClick={() => {
                        setShowImageMenu(false);
                        cameraInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#173b57] transition hover:bg-[#edf7f3]"
                    >
                      <i className="fa-solid fa-camera w-5 text-[#3d9276]"></i>
                      {tr("Take a Photo", "التقاط صورة")}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowImageMenu(false);
                        uploadInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#173b57] transition hover:bg-[#edf7f3]"
                    >
                      <i className="fa-regular fa-image w-5 text-[#3d9276]"></i>
                      {tr("Upload Image", "رفع صورة")}
                    </button>

                  </div>
                )}

              </div>

              {/* SEARCH BUTTON */}
              <button
                type="button"
                onClick={handleAISearch}
                disabled={isAnalyzing}
                className="flex shrink-0 items-center gap-2 rounded-[10px] bg-[#173b57] px-[22px] py-[13px] font-bold text-white transition hover:bg-[#102d43] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    {tr("Analyzing...", "جارٍ التحليل...")}
                  </>
                ) : (
                  <>
                    {tr("Find My Service", "اعثر على خدمتي")}
                    <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>

            </div>

            {/* IMAGE PREVIEW */}
            {selectedImage && imagePreview && (
              <div className="mt-4 max-w-[680px] overflow-hidden rounded-2xl border border-[#e2e9e6] bg-white p-3 shadow-sm">

                <img
                  src={imagePreview}
                  alt={tr("Selected problem", "صورة المشكلة المختارة")}
                  className="max-h-[260px] w-full rounded-xl object-cover"
                />

                <div className="mt-3 flex items-center justify-between gap-3">

                  <span className="flex items-center gap-2 text-sm font-semibold text-[#66757f]">
                    <i className="fa-solid fa-image text-[#3d9276]"></i>
                    {tr("Photo attached", "تم إرفاق الصورة")}
                  </span>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="flex items-center gap-2 text-sm font-bold text-[#173b57] transition hover:text-red-600"
                  >
                    <i className="fa-solid fa-xmark"></i>
                    {tr("Remove", "إزالة")}
                  </button>

                </div>
              </div>
            )}

            {/* ERROR */}
            {aiError && (
              <div className="mt-4 max-w-[680px] rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <strong>
                  {tr("AI Assistant is temporarily unavailable.", "مساعد الذكاء الاصطناعي غير متاح مؤقتًا.")}
                </strong>

                <p className="mt-1">
                  {aiError}
                </p>

              </div>
            )}

            {/* AI RESULT */}
            {aiResult && (
              <div className="mt-4 max-w-[680px] rounded-2xl border border-[#e2e9e6] bg-white p-5 shadow-sm">

                {aiResult.category === "UNKNOWN" ? (
                  <>
                    <div className="flex items-start gap-3">

                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf7f3] text-[#3d9276]">
                        <i className="fa-solid fa-circle-question"></i>
                      </div>

                      <div>
                        <p className="font-extrabold text-[#102d43]">
                          {tr("We couldn't identify the issue.", "لم نتمكن من تحديد المشكلة.")}
                        </p>

                        <p className="mt-2 text-sm text-[#66757f]">
                          {aiResult.explanation ||
                            tr("Please describe the problem more clearly or upload a clearer photo so we can find the right service.", "يرجى وصف المشكلة بشكل أوضح أو رفع صورة أوضح حتى نتمكن من تحديد الخدمة المناسبة.")}
                        </p>
                      </div>

                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#3d9276]">
                          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                          {tr("AI SERVICE MATCH", "الخدمة المقترحة بالذكاء الاصطناعي")}
                        </p>

                        <h3 className="mt-2 text-[22px] font-bold text-[#102d43]">
                          {translateServiceName(aiResult.category, language)}
                        </h3>
                      </div>

                      <span className="rounded-full bg-[#edf7f3] px-3 py-2 text-sm font-extrabold text-[#3d9276]">
                        {Math.min(
                          98,
                          Number(aiResult.confidence)
                        )}% {tr("Match", "تطابق")}
                      </span>

                    </div>

                    <p className="mt-4 text-sm text-[#66757f]">
                      {aiResult.explanation}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#e2e9e6] pt-4">

                      <p className="text-xs text-[#66757f]">
                        <i className="fa-solid fa-circle-info mr-2"></i>
                        {tr("AI suggestion — not a guaranteed technical diagnosis.", "اقتراح بالذكاء الاصطناعي — وليس تشخيصًا فنيًا مضمونًا.")}
                      </p>

                      <button
                        type="button"
                        onClick={viewFixers}
                        className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-[#173b57] transition hover:text-[#3d9276]"
                      >
                        {tr("View Fixers", "عرض الفنيين")}
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>

                    </div>
                  </>
                )}

              </div>
            )}

            {/* QUICK CATEGORIES */}
            <div className="mt-5">

              <p className="mb-3 text-xs font-semibold text-[#66757f]">
                {tr("Or choose a category", "أو اختر فئة")}
              </p>

              <div className="home-category-row flex items-center gap-2">

                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      openService(category.id)
                    }
                    className="category-pill rounded-full border border-[#e2e9e6] px-4 py-2.5 text-xs font-semibold text-[#66757f]"
                  >
                    <span className="category-pill__particle category-pill__particle--one"></span>
                    <span className="category-pill__particle category-pill__particle--two"></span>
                    <span className="category-pill__content">
                      <i className={`${category.icon} category-pill__icon`}></i>
                      <span>{category.name}</span>
                    </span>
                  </button>
                ))}

              </div>
            </div>

          </div>

          {/* EMERGENCY CARD */}
          <div data-reveal="up" className="home-emergency-card w-full justify-self-end rounded-[24px] lg:translate-x-[24px] border border-[#e2e9e6] bg-white p-[34px] lg:max-w-[460px] lg:p-[40px] shadow-[0_20px_50px_rgba(23,59,87,0.08)]">
            <span className="emergency-particle emergency-particle--one"></span>
            <span className="emergency-particle emergency-particle--two"></span>
            <span className="emergency-particle emergency-particle--three"></span>
            <span className="emergency-particle emergency-particle--four"></span>

            <div className="home-emergency-icon mb-7 grid h-12 w-12 place-items-center rounded-xl bg-[#edf7f3] text-xl text-[#3d9276]">
              <i className="fa-solid fa-bolt"></i>
            </div>

            <p className="home-emergency-label mb-[10px] text-[11px] font-extrabold tracking-[1.3px] text-[#e9984a]">
              {tr("NEED HELP NOW?", "تحتاج مساعدة الآن؟")}
            </p>

            <h2 className="home-emergency-title mb-3 text-[25px] font-bold text-[#102d43]">
              {tr("Urgent problem?", "مشكلة عاجلة؟")}
            </h2>

            <p className="home-emergency-text mb-6 text-sm text-[#66757f]">
              {tr("Find fixers who are currently available near you.", "اعثر على فنيين متاحين حاليًا بالقرب منك.")}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/technicians?available=true"
                )
              }
              className="home-emergency-link soft-text-link text-sm font-extrabold text-[#173b57]"
            >
             {tr(
  "Find Available Fixers",
  "اعثر على فنيين متاحين"
)}
            </button>

          </div>

        </div>
      </section>

{/* SERVICES */}
<section className="border-t border-[#e2e9e6] bg-white py-20" data-reveal="up">
  <div className="mx-auto w-[90%] max-w-[1160px]">

    {/* Section heading */}
    <div
      
      className={`
        mb-10
        flex
        flex-col
        justify-between
        gap-5
        md:items-end
        ${isArabic ? "md:flex-row-reverse" : "md:flex-row"}
      `}
    >
      <div className={isArabic ? "text-right" : "text-left"}>
        <p className="home-top-fixers-label mb-3 inline-flex rounded-full border border-[#cfe2da] bg-[#e8f4ef] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[1.5px] text-[#2f8067]">
          {tr("OUR SERVICES", "خدماتنا")}
        </p>

        <h2 className="text-[30px] font-bold tracking-[-1px] text-[#102d43] md:text-[36px]">
          {tr("What can we fix for you?", "ما الذي يمكننا إصلاحه لك؟")}
        </h2>

        <p className="mt-3 max-w-[570px] text-[#66757f]">
          {tr(
            "Choose the service you need and find trusted technicians ready to help.",
            "اختر الخدمة التي تحتاجها واعثر على فنيين موثوقين جاهزين للمساعدة."
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate("/services")}
        className="soft-text-link group flex w-fit items-center gap-2 text-sm font-extrabold text-[#173b57]"
      >
        {tr("View All Services", "عرض جميع الخدمات")}
      </button>
    </div>

    {/* Loading */}
    {servicesLoading && (
      <div className="flex items-center gap-3 py-10 text-[#66757f]">
        <i className="fa-solid fa-spinner fa-spin text-[#3d9276]"></i>
        {tr("Loading services...", "جارٍ تحميل الخدمات...")}
      </div>
    )}

    {/* Error */}
    {servicesError && !servicesLoading && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {servicesError}
      </div>
    )}

    {/* Service cards */}
    {!servicesLoading &&
      !servicesError &&
      services.length > 0 && (
        <div className="home-services-grid">
          {services.slice(0, 6).map((service, index) => (
            <button
              key={service.id}
              type="button"
              onClick={() => openService(service.id)}
              onMouseMove={handleServiceCardMouseMove}
              onMouseLeave={handleServiceCardMouseLeave}
              className={`
                home-service-grid-card
                ${isArabic ? "text-right" : "text-left"}
              `}
            >
              <span className="home-service-hover-glow" aria-hidden="true"></span>

              <div className="home-service-grid-icon">
                <i className={getServiceIcon(service.id)}></i>
              </div>

              <div>
                <h3 className="home-service-grid-title">
                  {translateServiceName(service.name, language)}
                </h3>

                {service.description && (
                  <p className="home-service-grid-description">
                    {translateServiceDescription(
                      service.description,
                      service.name,
                      language
                    )}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

    {/* Empty database */}
    {!servicesLoading &&
      !servicesError &&
      services.length === 0 && (
        <p className="py-8 text-[#66757f]">
          {tr(
            "No services are available right now.",
            "لا توجد خدمات متاحة حاليًا."
          )}
        </p>
      )}
  </div>
</section>

{/* {tr("TOP FIXERS", "أفضل الفنيين")} */}
<section className="bg-[#f7f9f8] py-20" data-reveal="up">

  <div className="mx-auto w-[90%] max-w-[1160px]">

    {/* Heading */}
    <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[1.5px] text-[#3d9276]">
          {tr("TOP FIXERS", "أفضل الفنيين")}
        </p>

        <h2 className="home-text-shimmer text-[30px] font-bold tracking-[-1px] md:text-[36px]">
          {tr("Trusted by homeowners", "موثوقون لدى أصحاب المنازل")}
        </h2>

        <p className="mt-3 max-w-[570px] text-[#66757f]">
          {tr("Meet some of our highest-rated technicians ready to help with your home.", "تعرّف على بعض فنيينا الأعلى تقييمًا والجاهزين لمساعدتك في منزلك.")}
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate("/technicians")}
        className="soft-text-link flex w-fit items-center gap-2 text-sm font-extrabold text-[#173b57]"
      >
        {tr("View All Fixers", "عرض جميع الفنيين")}
      </button>

    </div>

    {/* Loading */}
    {techniciansLoading && (
      <div className="flex items-center gap-3 py-10 text-[#66757f]">
        <i className="fa-solid fa-spinner fa-spin text-[#3d9276]"></i>
        {tr("Loading fixers...", "جارٍ تحميل الفنيين...")}
      </div>
    )}

    {/* Error */}
    {techniciansError && !techniciansLoading && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {techniciansError}
      </div>
    )}

    {/* Cards */}
    {!techniciansLoading &&
      !techniciansError &&
      technicians.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          {technicians.map((technician, index) => (
            <div
              data-reveal="up"
              style={{ "--reveal-delay": `${index * 90}ms` }}
              key={technician.id}
              className="technician-hover-card rounded-[18px] border border-[#e2e9e6] bg-white p-[26px]"
            >

              {/* Top */}
              <div className="flex items-start gap-4">

                {/* Avatar */}
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#edf7f3] text-xl font-extrabold text-[#3d9276]">
                  {getInitials(technician.name)}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">

                    <h3 className="truncate text-[17px] font-bold text-[#102d43]">
                      {technician.name}
                    </h3>

                    {Number(technician.verified) === 1 && (
                      <i
                        className="fa-solid fa-circle-check text-[#3d9276]"
                        title={tr("Verified Fixer", "فني موثّق")}
                      ></i>
                    )}

                  </div>

                  <p className="mt-1 text-sm font-semibold text-[#3d9276]">
                    {translateServiceName(technician.service_name, language)}
                  </p>

                </div>

              </div>

              {/* Rating + availability */}
              <div className="mt-5 flex items-center justify-between gap-3">

                <div className="flex items-center gap-2 text-sm font-bold text-[#173b57]">
                  <i className="fa-solid fa-star text-[#e9984a]"></i>
                  {Number(technician.rating).toFixed(1)}
                </div>

                {Number(technician.available) === 1 ? (
                  <span className="rounded-full bg-[#edf7f3] px-3 py-1 text-xs font-bold text-[#3d9276]">
                    {tr("Available", "متاح")}
                  </span>
                ) : (
                  <span className="rounded-full bg-[#f1f3f4] px-3 py-1 text-xs font-bold text-[#7b858b]">
                    {tr("Unavailable", "غير متاح")}
                  </span>
                )}

              </div>

              {/* Location */}
              <p className="mt-4 flex items-center gap-2 text-sm text-[#66757f]">
                <i className="fa-solid fa-location-dot text-[#3d9276]"></i>
                {technician.location}
              </p>

              {/* Bio */}
              <p className="mt-4 min-h-[48px] text-sm leading-6 text-[#66757f]">
                {technician.bio}
              </p>

              {/* Bottom */}
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#e2e9e6] pt-5">

                <div>
                  <p className="text-xs text-[#66757f]">
                    {tr("Starting from", "يبدأ من")}
                  </p>

                  <p className="mt-1 text-[18px] font-bold text-[#102d43]">
                    {technician.starting_price} {tr("SAR", "ر.س")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/technicians/${technician.id}`
                    )
                  }
                  className="flex items-center gap-2 rounded-[10px] bg-[#173b57] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#102d43]"
                >
                  {tr("View Profile", "عرض الملف")}
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

    {/* Empty */}
    {!techniciansLoading &&
      !techniciansError &&
      technicians.length === 0 && (
        <p className="py-8 text-[#66757f]">
          {tr("No fixers are available right now.", "لا يوجد فنيون متاحون حاليًا.")}
        </p>
      )}

  </div>

</section>

{/* HOW IT WORKS */}
<section className="border-t border-[#e2e9e6] bg-white py-20" data-reveal="up">
  <div className="mx-auto w-[90%] max-w-[1160px]">
    <div className="mx-auto mb-12 max-w-[650px] text-center">
      <p className="mb-2 text-xs font-bold uppercase tracking-[1.5px] text-[#3d9276]">
        {tr("HOW IT WORKS", "كيف تعمل المنصة")}
      </p>

      <h2 className="text-[30px] font-bold tracking-[-1px] text-[#102d43] md:text-[36px]">
        {tr("Home repairs made simple", "صيانة المنزل أصبحت أسهل")}
      </h2>

      <p className="mt-3 text-[#66757f]">
        {tr(
          "From problem to the right fixer in three clear steps.",
          "من المشكلة إلى الفني المناسب خلال ثلاث خطوات واضحة."
        )}
      </p>
    </div>

    <div className="home-how-flow">
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
          data-reveal="up"
          style={{ "--reveal-delay": `${index * 110}ms` }}
          className="home-how-step"
        >
          <div className="home-how-step__top">
            <span className="home-how-step__number">{step.number}</span>
            <div className="home-how-step__icon">
              <i className={step.icon}></i>
            </div>
          </div>

          <h3>{tr(step.enTitle, step.arTitle)}</h3>
          <p>{tr(step.enText, step.arText)}</p>
        </article>
      ))}
    </div>
  </div>
</section>

{/* CTA — OLD FIXER.CO COLORS */}
<section className="bg-[#eef5f2] py-[92px] md:py-[110px]" data-reveal="up">
  <div
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
        {tr("READY TO GET STARTED?", "جاهز للبدء؟")}
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