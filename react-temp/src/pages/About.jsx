import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./About.css";

const values = [
  {
    icon: "fa-solid fa-user-check",
    enTitle: "Trusted choices",
    arTitle: "خيارات موثوقة",
    enText:
      "Clear fixer profiles help you compare specialty, rating, location, availability, and price.",
    arText:
      "ملفات واضحة للفنيين تساعدك على مقارنة التخصص والتقييم والموقع والتوفر والسعر.",
  },
  {
    icon: "fa-solid fa-bolt",
    enTitle: "Less searching",
    arTitle: "بحث أقل",
    enText:
      "Move from describing the problem to finding the right service and professional in fewer steps.",
    arText:
      "انتقل من وصف المشكلة إلى الوصول للخدمة والفني المناسب بخطوات أقل.",
  },
  {
    icon: "fa-solid fa-scale-balanced",
    enTitle: "More clarity",
    arTitle: "وضوح أكثر",
    enText:
      "See the information that matters before sending a service request.",
    arText:
      "اطّلع على المعلومات المهمة قبل إرسال طلب الخدمة.",
  },
];

const steps = [
  {
    number: "01",
    enTitle: "Describe",
    arTitle: "صف المشكلة",
    enText: "Tell us what needs fixing or add a photo.",
    arText: "أخبرنا بما يحتاج إلى إصلاح أو أضف صورة.",
  },
  {
    number: "02",
    enTitle: "Discover",
    arTitle: "اكتشف",
    enText: "Find the service category that fits your problem.",
    arText: "اعثر على فئة الخدمة المناسبة لمشكلتك.",
  },
  {
    number: "03",
    enTitle: "Compare",
    arTitle: "قارن",
    enText: "Review available fixers and their key details.",
    arText: "قارن الفنيين المتاحين وتفاصيلهم المهمة.",
  },
  {
    number: "04",
    enTitle: "Request",
    arTitle: "اطلب",
    enText: "Send your request to the fixer you prefer.",
    arText: "أرسل طلبك إلى الفني الذي تفضله.",
  },
];


function ProcessFlowCarousel({ language, tr }) {
  const [active, setActive] = useState(0);

  const next = () =>
    setActive((current) => (current + 1) % steps.length);

  const previous = () =>
    setActive(
      (current) => (current - 1 + steps.length) % steps.length
    );

  const getPosition = (index) => {
    if (index === active) return "is-active";
    if (index === (active - 1 + steps.length) % steps.length) {
      return "is-left";
    }
    if (index === (active + 1) % steps.length) {
      return "is-right";
    }
    return "is-hidden";
  };

  return (
    <div className="about-process-carousel" data-about-reveal>
      <div className="about-process-orbit" aria-hidden="true"></div>

      <div className="about-process-stage">
        {steps.map((step, index) => (
          <article
            key={step.number}
            className={`about-process-card ${getPosition(index)}`}
            onClick={() => setActive(index)}
          >
            <div className="about-process-card-top">
              <span className="about-process-card-number">
                {step.number}
              </span>
              <span className="about-process-card-label">
                {tr("Step", "الخطوة")}
              </span>
            </div>

            <h3>{tr(step.enTitle, step.arTitle)}</h3>
            <p>{tr(step.enText, step.arText)}</p>

            <div className="about-process-card-meta">
              <strong>{tr("Simple and clear", "بسيطة وواضحة")}</strong>
              <span>
                {tr(
                  `${index + 1} of ${steps.length}`,
                  `${step.number} / ${steps.length.toString().padStart(2, "0")}`
                )}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="about-process-controls process-nav-v2">
        <button
          type="button"
          onClick={previous}
          aria-label={tr("Previous step", "الخطوة السابقة")}
        >
          <i
            className={`fa-solid ${
              language === "ar" ? "fa-arrow-right" : "fa-arrow-left"
            }`}
          ></i>
        </button>

        <div className="about-process-dots">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              className={active === index ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={tr(
                `Show step ${index + 1}`,
                `عرض الخطوة ${index + 1}`
              )}
            ></button>
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label={tr("Next step", "الخطوة التالية")}
        >
          <i
            className={`fa-solid ${
              language === "ar" ? "fa-arrow-left" : "fa-arrow-right"
            }`}
          ></i>
        </button>
      </div>
    </div>
  );
}


function AboutSmallLabelEffect({ text }) {
  const textRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const isArabicText = /[\u0600-\u06FF]/.test(text);
  const pieces = isArabicText
    ? text.split(/(\s+)/)
    : Array.from(text);

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
        threshold: 0.45,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [text]);

  return (
    <span
      ref={textRef}
      className={`about-small-text-effect ${
        isVisible ? "is-visible" : ""
      } ${isArabicText ? "is-arabic-effect" : ""}`}
      aria-label={text}
    >
      {pieces.map((piece, index) => {
        if (piece.trim() === "") {
          return (
            <span
              key={`space-${index}`}
              className="about-small-text-effect-space"
              aria-hidden="true"
            >
              {" "}
            </span>
          );
        }

        return (
          <span
            key={`${piece}-${index}`}
            className="about-small-text-effect-piece"
            aria-hidden="true"
            style={{
              "--about-text-delay": `${
                index * (isArabicText ? 80 : 36)
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

function About() {
  const { language, isArabic } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll("[data-about-reveal]")
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("show"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [language]);

  return (
    <main
      className="about-page"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* HERO — LAYERED TEXT */}
      <section className="about-hero about-layered-hero">
        <div
          className="about-layered-hero-grid"
          aria-hidden="true"
        ></div>

        <div className="about-container about-layered-hero-inner">
          <div className="about-layered-hero-top">
            <p className="about-eyebrow">
              <AboutSmallLabelEffect
                text={tr("ABOUT FIXER.CO", "عن FIXER.CO")}
              />
            </p>

            <span className="about-layered-hero-index">
              {tr("01 / ABOUT", "٠١ / من نحن")}
            </span>
          </div>

          <div
            className="about-layered-title-wrap"
            role="heading"
            aria-level="1"
            aria-label={tr("ABOUT US", "من نحن")}
          >
            <div className="about-layered-title">
              {[4, 3, 2, 1, 0].map((layer) => (
                <span
                  key={layer}
                  className={`about-layered-title-layer ${
                    layer === 0 ? "is-front" : ""
                  }`}
                  style={{ "--about-layer": layer }}
                  aria-hidden="true"
                >
                  {tr("ABOUT US", "من نحن")}
                </span>
              ))}
            </div>
          </div>

          <div className="about-layered-hero-bottom">
            <p className="about-layered-hero-copy">
              {tr(
                "Fixer.Co brings home maintenance into one clear experience — understand the issue, find the right service, compare trusted fixers, and send your request.",
                "تجمع Fixer.Co صيانة المنزل في تجربة واضحة واحدة — افهم المشكلة، اختر الخدمة المناسبة، قارن الفنيين الموثوقين، ثم أرسل طلبك."
              )}
            </p>

            <div className="about-layered-hero-notes">
              <span>{tr("CLEAR SERVICES", "خدمات واضحة")}</span>
              <i></i>
              <span>{tr("TRUSTED FIXERS", "فنيون موثوقون")}</span>
              <i></i>
              <span>{tr("SIMPLE REQUESTS", "طلبات أبسط")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO STRIP */}
      <section className="about-intro-strip">
        <div className="about-container about-intro-grid">
          <div>
            <span>{tr("01", "٠١")}</span>
            <strong>{tr("One clear platform", "منصة واحدة واضحة")}</strong>
          </div>
          <div>
            <span>{tr("02", "٠٢")}</span>
            <strong>{tr("Six service categories", "ست فئات للخدمات")}</strong>
          </div>
          <div>
            <span>{tr("03", "٠٣")}</span>
            <strong>{tr("Trusted fixer", "فني موثوق")}</strong>
          </div>
        </div>
      </section>

      {/* WHY FIXER.CO — TEXT ONLY */}
      <section className="about-story about-story-text-only">
        <div className="about-container">
          <div className="about-story-editorial">
            <div
              className="about-story-editorial-main"
              data-about-reveal
            >
              <p className="about-eyebrow">
                <AboutSmallLabelEffect
                  text={tr("WHY FIXER.CO", "لماذا FIXER.CO")}
                />
              </p>

              <h2>
                {tr(
                  "Finding the right fixer shouldn't feel like another problem.",
                  "العثور على الفني المناسب لا يجب أن يصبح مشكلة أخرى."
                )}
              </h2>

              <p className="about-story-lead">
                {tr(
                  "Home maintenance is already stressful. Searching across different places, comparing incomplete information, and trying to decide who to trust only makes it harder.",
                  "صيانة المنزل مرهقة بما يكفي. التنقل بين أماكن مختلفة ومقارنة معلومات ناقصة ومحاولة معرفة من يمكن الوثوق به يجعل الأمر أصعب."
                )}
              </p>
            </div>

            <div className="about-story-editorial-side">
              <article data-about-reveal>
                <div className="about-story-icon">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <div>
                  <h3>{tr("Everything in one place", "كل شيء في مكان واحد")}</h3>
                  <p>
                    {tr(
                      "Discover services, compare fixer profiles, and send a request without jumping between different platforms.",
                      "اكتشف الخدمات وقارن ملفات الفنيين وأرسل طلبك دون التنقل بين منصات مختلفة."
                    )}
                  </p>
                </div>
              </article>

              <article data-about-reveal>
                <div className="about-story-icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <h3>{tr("Clearer information", "معلومات أوضح")}</h3>
                  <p>
                    {tr(
                      "See the details that matter — service, rating, location, availability, and price — before you decide.",
                      "شاهد التفاصيل المهمة مثل الخدمة والتقييم والموقع والتوفر والسعر قبل اتخاذ قرارك."
                    )}
                  </p>
                </div>
              </article>

              <article data-about-reveal>
                <div className="about-story-icon">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h3>{tr("A more local experience", "تجربة أقرب إليك")}</h3>
                  <p>
                    {tr(
                      "Find professionals that match the service you need and the location you are searching from.",
                      "اعثر على فنيين يناسبون الخدمة التي تحتاجها والموقع الذي تبحث منه."
                    )}
                  </p>
                </div>
              </article>

              <article data-about-reveal>
                <div className="about-story-icon">
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <h3>{tr("A simpler next step", "خطوة تالية أبسط")}</h3>
                  <p>
                    {tr(
                      "Once you find the right person, you can continue directly to the service request.",
                      "بعد العثور على الفني المناسب، يمكنك الانتقال مباشرة إلى طلب الخدمة."
                    )}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION + VISION */}
      <section className="about-purpose">
        <div className="about-container">
          <div
            className="about-purpose-row"
            data-about-reveal
          >
            <div className="about-purpose-number">01</div>

            <div>
              <p className="about-eyebrow">
                <AboutSmallLabelEffect
                  text={tr("OUR MISSION", "مهمتنا")}
                />
              </p>
              <h2>
                {tr(
                  "Make home maintenance easier to navigate.",
                  "جعل صيانة المنزل أسهل في كل خطوة."
                )}
              </h2>
            </div>

            <p>
              {tr(
                "We want people to spend less time figuring out where to look and more time choosing the service and professional that fit their needs.",
                "نريد أن يقضي المستخدم وقتًا أقل في البحث عن المكان المناسب، ووقتًا أكثر في اختيار الخدمة والفني الأنسب لاحتياجه."
              )}
            </p>
          </div>

          <div
            className="about-purpose-row"
            data-about-reveal
          >
            <div className="about-purpose-number">02</div>

            <div>
              <p className="about-eyebrow">
                <AboutSmallLabelEffect
                  text={tr("OUR VISION", "رؤيتنا")}
                />
              </p>
              <h2>
                {tr(
                  "A more dependable way to manage everyday home repairs.",
                  "طريقة أكثر موثوقية لإدارة إصلاحات المنزل اليومية."
                )}
              </h2>
            </div>

            <p>
              {tr(
                "A service experience where useful information, nearby professionals, and clear choices are easy to access whenever something needs fixing.",
                "تجربة خدمة تكون فيها المعلومات المهمة والفنيون القريبون والخيارات الواضحة سهلة الوصول كلما احتاج المنزل إلى إصلاح."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="about-process">
        <div className="about-container">
          <div
            className="about-process-head"
            data-about-reveal
          >
            <div>
              <p className="about-eyebrow">
                <AboutSmallLabelEffect
                  text={tr("HOW IT WORKS", "كيف تعمل المنصة")}
                />
              </p>
              <h2>
                {tr(
                  "From a problem at home to the right fixer.",
                  "من مشكلة في المنزل إلى الفني المناسب."
                )}
              </h2>
            </div>

            <p>
              {tr(
                "A simple flow designed to keep the experience clear from start to request.",
                "رحلة بسيطة تحافظ على وضوح التجربة من البداية وحتى إرسال الطلب."
              )}
            </p>
          </div>

          <ProcessFlowCarousel
            language={language}
            tr={tr}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-container">
          <div
            className="about-cta-box"
            data-about-reveal
          >
            <div>
              <p className="about-eyebrow">
                <AboutSmallLabelEffect
                  text={tr("NEED SOMETHING FIXED?", "تحتاج إلى إصلاح شيء؟")}
                />
              </p>

              <h2>
                {tr(
                  "Find the right fixer for the job.",
                  "اعثر على الفني المناسب للمهمة."
                )}
              </h2>
            </div>

            <Link
              to="/technicians"
              className="about-cta-button"
            >
              {tr("Find a Fixer", "ابحث عن فني")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default About;
