import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./About.css";

const values = [
  {
    icon: "fa-solid fa-user-check",
    enTitle: "Trusted Fixers",
    arTitle: "فنيون موثوقون",
    enText:
      "Compare professionals using clear information such as ratings, specialty, location, and availability.",
    arText:
      "قارن بين الفنيين باستخدام معلومات واضحة مثل التقييم والتخصص والموقع والتوفر.",
  },
  {
    icon: "fa-solid fa-bolt",
    enTitle: "Simple & Fast",
    arTitle: "بسيط وسريع",
    enText:
      "Go from describing your problem to requesting the right professional in just a few steps.",
    arText:
      "انتقل من وصف المشكلة إلى طلب الفني المناسب خلال خطوات بسيطة فقط.",
  },
  {
    icon: "fa-solid fa-scale-balanced",
    enTitle: "Clear Choices",
    arTitle: "خيارات واضحة",
    enText:
      "Compare ratings, prices, services, and availability before deciding who is right for the job.",
    arText:
      "قارن التقييمات والأسعار والخدمات والتوفر قبل اختيار الفني المناسب للمهمة.",
  },
];

const steps = [
  {
    number: "01",
    icon: "fa-solid fa-magnifying-glass",
    enTitle: "Describe",
    arTitle: "صف المشكلة",
    enText: "Tell Fixer.Co what needs to be fixed.",
    arText: "أخبر Fixer.Co بما يحتاج إلى إصلاح.",
  },
  {
    number: "02",
    icon: "fa-solid fa-list-check",
    enTitle: "Compare",
    arTitle: "قارن",
    enText:
      "Explore professionals based on the service and their details.",
    arText:
      "استعرض الفنيين حسب الخدمة وتفاصيلهم.",
  },
  {
    number: "03",
    icon: "fa-solid fa-user",
    enTitle: "Choose",
    arTitle: "اختر",
    enText:
      "Open a fixer profile and choose the professional you prefer.",
    arText:
      "افتح ملف الفني واختر الشخص الذي تفضله.",
  },
  {
    number: "04",
    icon: "fa-solid fa-paper-plane",
    enTitle: "Request",
    arTitle: "اطلب",
    enText:
      "Submit your service request directly through the platform.",
    arText:
      "أرسل طلب الخدمة مباشرة عبر المنصة.",
  },
];

function About() {
  const { language, isArabic } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);
  const [activeValue, setActiveValue] = useState(0);

  function showPreviousValue() {
    setActiveValue((current) =>
      current === 0 ? values.length - 1 : current - 1
    );
  }

  function showNextValue() {
    setActiveValue((current) =>
      current === values.length - 1 ? 0 : current + 1
    );
  }

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll("[data-about-reveal]")
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) =>
        item.classList.add("show")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -70px 0px",
      }
    );

    items.forEach((item) => {
      observer.observe(item);
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="about-old-page"
    >
      {/* ABOUT HERO — scroll reveal */}
      <section className="about-hero">
        <div className="about-container about-hero-content">
          <p
            className="section-label about-reveal"
            data-about-reveal
            style={{ "--about-delay": "0ms" }}
          >
            {tr("ABOUT FIXER.CO", "عن FIXER.CO")}
          </p>

          <h1
            className="about-reveal"
            data-about-reveal
            style={{ "--about-delay": "90ms" }}
          >
            {tr(
              "Home repairs should be ",
              "صيانة المنزل يجب أن تكون "
            )}
            <span>{tr("simple.", "بسيطة.")}</span>
          </h1>

          <p
            className="about-hero-text about-reveal"
            data-about-reveal
            style={{ "--about-delay": "180ms" }}
          >
            {tr(
              "Fixer.Co helps people find the right home maintenance professional based on the service they need, location, availability, rating, and price.",
              "تساعد Fixer.Co المستخدمين في العثور على فني الصيانة المناسب حسب الخدمة المطلوبة والموقع والتوفر والتقييم والسعر."
            )}
          </p>
        </div>
      </section>

      {/* OUR STORY */}
      <section
        className="about-story"
      >
        <div className="about-container about-story-grid">
          <div
            className="about-story-content"
          >
            <p
              className="section-label about-reveal"
              data-about-reveal
              style={{ "--about-delay": "0ms" }}
            >
              {tr("WHY FIXER.CO", "لماذا FIXER.CO")}
            </p>

            <h2
              className="about-reveal"
              data-about-reveal
              style={{ "--about-delay": "80ms" }}
            >
              {tr(
                "Finding the right fixer shouldn't be complicated.",
                "العثور على الفني المناسب لا يجب أن يكون معقدًا."
              )}
            </h2>

            <p
              className="about-reveal"
              data-about-reveal
              style={{ "--about-delay": "150ms" }}
            >
              {tr(
                "When something breaks at home, finding a reliable professional can take time. People often have to search through different platforms, ask for recommendations, and compare options manually.",
                "عندما يتعطل شيء في المنزل، قد يستغرق العثور على فني موثوق وقتًا. غالبًا ما يضطر المستخدمون إلى البحث في منصات مختلفة وطلب الترشيحات ومقارنة الخيارات يدويًا."
              )}
            </p>

            <p
              className="about-reveal"
              data-about-reveal
              style={{ "--about-delay": "220ms" }}
            >
              {tr(
                "Fixer.Co brings this process into one simple platform. Users can describe their problem, discover the relevant service, compare available fixers, view their profiles, and send a service request.",
                "تجمع Fixer.Co هذه العملية في منصة واحدة بسيطة. يمكن للمستخدم وصف المشكلة وتحديد الخدمة المناسبة ومقارنة الفنيين المتاحين وعرض ملفاتهم وإرسال طلب الخدمة."
              )}
            </p>
          </div>

          <div
            className="about-highlight-card about-reveal"
            data-about-reveal
          >
            <div className="about-highlight-icon">
              <i className="fa-solid fa-location-dot"></i>
            </div>

            <p>
              {tr("OUR PROMISE", "وعدنا")}
            </p>

            <h3>
              {tr("The right fix.", "الإصلاح المناسب.")}
              <br />
              {tr("Right around you.", "بالقرب منك.")}
            </h3>

            <span>
              {tr(
                "A simpler way to connect with trusted home-service professionals.",
                "طريقة أبسط للتواصل مع فنيي الخدمات المنزلية الموثوقين."
              )}
            </span>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section
        className="about-values"
      >
        <div className="about-container">
          <div
            className="about-section-heading"
          >
            <p
              className="section-label about-reveal"
              data-about-reveal
              style={{ "--about-delay": "0ms" }}
            >
              {tr(
                "WHAT MATTERS TO US",
                "ما الذي يهمنا"
              )}
            </p>

            <h2
              className="about-reveal"
              data-about-reveal
              style={{ "--about-delay": "90ms" }}
            >
              {tr(
                "Built around a better service experience.",
                "مصممة لتقديم تجربة خدمة أفضل."
              )}
            </h2>
          </div>

          <div
            className="about-values-carousel about-reveal"
            data-about-reveal
          >
            <div className="about-carousel-controls">
              <button
                type="button"
                onClick={showPreviousValue}
                aria-label={tr("Previous card", "البطاقة السابقة")}
              >
                <i
                  className={`fa-solid fa-arrow-left ${
                    isArabic ? "rotate-180" : ""
                  }`}
                ></i>
              </button>

              <div className="about-carousel-dots">
                {values.map((value, index) => (
                  <button
                    key={value.enTitle}
                    type="button"
                    onClick={() => setActiveValue(index)}
                    className={
                      activeValue === index ? "active" : ""
                    }
                    aria-label={tr(
                      `Show ${value.enTitle}`,
                      `عرض ${value.arTitle}`
                    )}
                  ></button>
                ))}
              </div>

              <button
                type="button"
                onClick={showNextValue}
                aria-label={tr("Next card", "البطاقة التالية")}
              >
                <i
                  className={`fa-solid fa-arrow-right ${
                    isArabic ? "rotate-180" : ""
                  }`}
                ></i>
              </button>
            </div>

            <div className="about-carousel-stage">
              {values.map((value, index) => {
                let position = "is-hidden";

                if (index === activeValue) {
                  position = "is-active";
                } else if (
                  index ===
                  (activeValue - 1 + values.length) %
                    values.length
                ) {
                  position = "is-prev";
                } else if (
                  index ===
                  (activeValue + 1) % values.length
                ) {
                  position = "is-next";
                }

                return (
                  <article
                    key={value.enTitle}
                    className={`about-carousel-card ${position}`}
                    onClick={() => setActiveValue(index)}
                  >
                    <div className="about-value-icon">
                      <i className={value.icon}></i>
                    </div>

                    <span className="about-carousel-index">
                      0{index + 1}
                    </span>

                    <h3>
                      {tr(value.enTitle, value.arTitle)}
                    </h3>

                    <p>
                      {tr(value.enText, value.arText)}
                    </p>

                    <div className="about-card-accent"></div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* HOW PLATFORM WORKS */}
      <section
        className="about-process"
      >
        <div className="about-container">
          <div className="about-section-heading">
            <p
              className="section-label about-reveal"
              data-about-reveal
              style={{ "--about-delay": "0ms" }}
            >
              {tr("THE PLATFORM", "المنصة")}
            </p>

            <h2
              className="about-reveal"
              data-about-reveal
              style={{ "--about-delay": "90ms" }}
            >
              {tr(
                "From problem to fixer.",
                "من المشكلة إلى الفني."
              )}
            </h2>
          </div>

          <div
            className="about-process-wrap about-reveal"
            data-about-reveal
          >
            <div className="about-process-track">
              <span className="about-process-track-fill"></span>
            </div>

            <div className="about-process-grid">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="about-process-item about-step-animated"
                  data-about-reveal
                  style={{
                    "--about-delay": `${index * 130}ms`,
                  }}
                >
                  <span className="about-process-number">
                    {step.number}
                  </span>

                  <div className="about-process-icon">
                    <i className={step.icon}></i>
                  </div>

                  <h3>
                    {tr(step.enTitle, step.arTitle)}
                  </h3>

                  <p>
                    {tr(step.enText, step.arText)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="about-cta"
      >
        <div className="about-container">
          <div className="about-cta-box about-reveal" data-about-reveal>
            <div
              className="about-reveal"
              data-about-reveal
              style={{ "--about-delay": "0ms" }}
            >
              <p className="section-label">
                {tr(
                  "NEED SOMETHING FIXED?",
                  "تحتاج إلى إصلاح شيء؟"
                )}
              </p>

              <h2>
                {tr(
                  "Find the right fixer today.",
                  "اعثر على الفني المناسب اليوم."
                )}
              </h2>
            </div>

            <Link
              to="/technicians"
              className="about-cta-button about-reveal"
              data-about-reveal
              style={{ "--about-delay": "110ms" }}
            >
              {tr("Find a Fixer", "ابحث عن فني")}

              <i
                className={`fa-solid fa-arrow-right ${
                  isArabic ? "rtl-arrow" : ""
                }`}
              ></i>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default About;
