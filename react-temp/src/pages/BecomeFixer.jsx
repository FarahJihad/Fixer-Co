import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./BecomeFixer.css";

const benefitItems = [
  {
    icon: "fa-solid fa-location-dot",
    enTitle: "Get discovered",
    arTitle: "خلّ العملاء يلاقوك",
    enText:
      "Customers looking for your specialty can discover your profile based on service and location.",
    arText:
      "يقدر العملاء الباحثون عن تخصصك العثور على ملفك حسب الخدمة والموقع.",
  },
  {
    icon: "fa-solid fa-calendar-check",
    enTitle: "Work your way",
    arTitle: "اشتغل بطريقتك",
    enText:
      "Set your starting price, update your availability, and keep your professional details clear.",
    arText:
      "حدد سعرك الابتدائي وحدّث توفرك وحافظ على معلوماتك المهنية واضحة.",
  },
  {
    icon: "fa-solid fa-star",
    enTitle: "Build your reputation",
    arTitle: "ابنِ سمعتك",
    enText:
      "Great service helps strengthen your profile through customer ratings and reviews.",
    arText:
      "الخدمة الممتازة تقوي ملفك من خلال تقييمات ومراجعات العملاء.",
  },
];

const steps = [
  {
    number: "01",
    icon: "fa-solid fa-file-lines",
    enTitle: "Read the policy",
    arTitle: "اقرأ السياسة",
    enText:
      "Review our quality standards, requirements, and professional policy.",
    arText:
      "راجع معايير الجودة والمتطلبات وسياسة المحترفين.",
  },
  {
    number: "02",
    icon: "fa-solid fa-user-pen",
    enTitle: "Create your profile",
    arTitle: "أنشئ ملفك",
    enText:
      "Tell us about your specialty, experience, location, and pricing.",
    arText:
      "أخبرنا عن تخصصك وخبرتك وموقعك وتسعيرك.",
  },
  {
    number: "03",
    icon: "fa-solid fa-shield-halved",
    enTitle: "Get reviewed",
    arTitle: "تتم المراجعة",
    enText:
      "Your application stays pending while Fixer.Co reviews your information.",
    arText:
      "يبقى طلبك قيد المراجعة حتى يراجع فريق Fixer.Co معلوماتك.",
  },
  {
    number: "04",
    icon: "fa-solid fa-screwdriver-wrench",
    enTitle: "Start fixing",
    arTitle: "ابدأ العمل",
    enText:
      "Once approved, your profile can be listed for customers to discover.",
    arText:
      "بعد الموافقة، يظهر ملفك للعملاء ليتمكنوا من العثور عليك.",
  },
];

const policyItems = [
  {
    icon: "fa-solid fa-id-card",
    enTitle: "Accurate information",
    arTitle: "معلومات دقيقة",
    enText:
      "Your profile, specialty, experience, location, and prices must be accurate.",
    arText:
      "يجب أن تكون معلومات ملفك وتخصصك وخبرتك وموقعك وأسعارك دقيقة.",
  },
  {
    icon: "fa-solid fa-clock",
    enTitle: "Professional service",
    arTitle: "خدمة احترافية",
    enText:
      "Respect appointments, communicate clearly, and treat customers professionally.",
    arText:
      "التزم بالمواعيد وتواصل بوضوح وتعامل مع العملاء باحترافية.",
  },
  {
    icon: "fa-solid fa-tag",
    enTitle: "Transparent pricing",
    arTitle: "أسعار واضحة",
    enText:
      "Starting prices must be clearly communicated and kept up to date.",
    arText:
      "يجب توضيح الأسعار الابتدائية والمحافظة على تحديثها.",
  },
];

function BecomeFixer() {
  const { language, isArabic } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service_id: "",
    location: "",
    experience: "",
    price: "",
    available: "true",
    bio: "",
    policy_accepted: false,
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        setServicesLoading(true);

        const response = await fetch("/api/services");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            tr(
              "Could not load services.",
              "تعذر تحميل الخدمات."
            )
          );
        }

        const serviceList = Array.isArray(data)
          ? data
          : data.services || [];

        setServices(serviceList);
      } catch (error) {
        console.error("Services error:", error);
      } finally {
        setServicesLoading(false);
      }
    }

    loadServices();
  }, [language]);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll("[data-fixer-reveal]")
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("fixer-show"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("fixer-show");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [language, servicesLoading]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const phonePattern = /^05\d{8}$/;

    if (!phonePattern.test(formData.phone.trim())) {
      setMessage(
        tr(
          "Please enter a valid Saudi phone number starting with 05.",
          "يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05."
        )
      );
      setMessageType("error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email.trim())) {
      setMessage(
        tr(
          "Please enter a valid email address.",
          "يرجى إدخال بريد إلكتروني صحيح."
        )
      );
      setMessageType("error");
      return;
    }

    if (!formData.policy_accepted) {
      setMessage(
        tr(
          "Please agree to the Professional Policy.",
          "يرجى الموافقة على سياسة المحترفين."
        )
      );
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/fixer-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          service_id: Number(formData.service_id),
          location: formData.location.trim(),
          experience: Number(formData.experience),
          price: Number(formData.price),
          available: formData.available === "true",
          bio: formData.bio.trim(),
          policy_accepted: formData.policy_accepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            tr(
              "Could not submit application.",
              "تعذر إرسال الطلب."
            )
        );
      }

      setMessage(
        tr(
          "Application submitted successfully! Your application is now pending review.",
          "تم إرسال طلبك بنجاح! طلبك الآن قيد المراجعة."
        )
      );
      setMessageType("success");

      setFormData({
        name: "",
        phone: "",
        email: "",
        service_id: "",
        location: "",
        experience: "",
        price: "",
        available: "true",
        bio: "",
        policy_accepted: false,
      });
    } catch (error) {
      console.error("Application error:", error);
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="become-fixer-page"
    >
      {/* HERO */}
      <section className="bf-hero bf-hero-editorial-v2">
        <div className="bf-container bf-hero-v2-grid">
          <div
            className="bf-hero-v2-copy bf-reveal"
            data-fixer-reveal
          >
            <p className="bf-label">
              {tr("FOR PROFESSIONALS", "للمحترفين")}
            </p>

            <h1>
              {tr(
                "Grow with Fixer.Co.",
                "نمّي عملك مع Fixer.Co."
              )}
            </h1>

            <p className="bf-hero-copy">
              {tr(
                "Create a professional profile, reach customers looking for your service, and manage your availability and starting price in one place.",
                "أنشئ ملفًا مهنيًا، ووصل للعملاء الباحثين عن خدمتك، وأدر توفرك وسعرك الابتدائي من مكان واحد."
              )}
            </p>

            <div className="bf-hero-v2-actions">
              <a
                href="#fixerApplication"
                className="bf-primary-button bf-liquid-button"
              >
                <span className="bf-liquid-sheen"></span>
                <span className="bf-liquid-content">
                  {tr("Apply to Join", "قدّم للانضمام")}
                </span>
              </a>

              <span className="bf-hero-v2-note">
                <i className="fa-solid fa-circle-check"></i>
                {tr(
                  "No payment required to apply",
                  "لا يلزم الدفع عند التقديم"
                )}
              </span>
            </div>
          </div>

          <div
            className="bf-hero-v2-fee bf-reveal"
            data-fixer-reveal
            style={{ "--bf-delay": "100ms" }}
          >
            <p className="bf-label">
              {tr("ONE-TIME REGISTRATION", "تسجيل لمرة واحدة")}
            </p>

            <div className="bf-hero-v2-price">
              <strong>99</strong>
              <span>{tr("SAR", "ر.س")}</span>
            </div>

            <p>
              {tr(
                "Collected only after your application is approved.",
                "يتم تحصيلها فقط بعد الموافقة على طلبك."
              )}
            </p>

            <div className="bf-hero-v2-mini">
              <span>01</span>
              <strong>{tr("Apply", "قدّم")}</strong>
              <span>02</span>
              <strong>{tr("Review", "مراجعة")}</strong>
              <span>03</span>
              <strong>{tr("Start", "ابدأ")}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bf-section bf-benefits-v2">
        <div className="bf-container bf-benefits-v2-grid">
          <div
            className="bf-benefits-v2-copy bf-reveal"
            data-fixer-reveal
          >
            <p className="bf-label">
              {tr("WHY FIXER.CO", "لماذا FIXER.CO")}
            </p>

            <h2>
              {tr(
                "Everything you need to present your service clearly.",
                "كل ما تحتاجه لعرض خدمتك بشكل واضح."
              )}
            </h2>

            <p>
              {tr(
                "Your profile keeps the important details customers look for together — your specialty, location, availability, starting price, ratings, and reviews.",
                "يجمع ملفك أهم المعلومات التي يبحث عنها العملاء في مكان واحد: تخصصك، موقعك، توفرك، سعرك الابتدائي، تقييماتك ومراجعاتك."
              )}
            </p>
          </div>

          <div className="bf-benefits-v2-list">
            {benefitItems.map((item, index) => (
              <article
                key={item.enTitle}
                className="bf-benefits-v2-item bf-card-reveal"
                data-fixer-reveal
                style={{ "--bf-delay": `${index * 80}ms` }}
              >
                <span className="bf-benefits-v2-number">
                  0{index + 1}
                </span>

                <div className="bf-benefits-v2-icon">
                  <i className={item.icon}></i>
                </div>

                <div>
                  <h3>{tr(item.enTitle, item.arTitle)}</h3>
                  <p>{tr(item.enText, item.arText)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bf-section bf-section-white">
        <div className="bf-container">
          <div
            className="bf-motion-heading bf-reveal"
            data-fixer-reveal
          >
            <div className="bf-motion-marquee" aria-hidden="true">
              <div className="bf-motion-marquee-track">
                <span>APPLY • BUILD • GROW • FIX •</span>
                <span>APPLY • BUILD • GROW • FIX •</span>
              </div>
            </div>

            <div className="bf-motion-heading-content">
              <p className="bf-label">
                {tr("HOW IT WORKS", "كيف تعمل")}
              </p>

              <h2>
                {tr(
                  "Your path to becoming a ",
                  "طريقك لتصبح "
                )}
                <span>
                  {tr("Fixer.", "فنيًا في Fixer.Co.")}
                </span>
              </h2>

              <p>
                {tr(
                  "Four simple steps before your profile becomes visible to customers.",
                  "أربع خطوات بسيطة قبل أن يصبح ملفك ظاهرًا للعملاء."
                )}
              </p>
            </div>
          </div>

          <div className="bf-steps-wrap">
            <div className="bf-step-line"></div>

            <div className="bf-step-grid">
              {steps.map((step, index) => (
                <article
                  key={step.number}
                  className="bf-step bf-card-reveal"
                  data-fixer-reveal
                  style={{
                    "--bf-delay": `${index * 100}ms`,
                  }}
                >
                  <span>{step.number}</span>

                  <div className="bf-step-icon">
                    <i className={step.icon}></i>
                  </div>

                  <h3>
                    {tr(step.enTitle, step.arTitle)}
                  </h3>

                  <p>
                    {tr(step.enText, step.arText)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POLICY */}
      <section className="bf-section">
        <div className="bf-container bf-policy-grid">
          <div
            className="bf-reveal"
            data-fixer-reveal
          >
            <p className="bf-label">
              {tr(
                "PROFESSIONAL POLICY",
                "سياسة المحترفين"
              )}
            </p>

            <h2>
              {tr(
                "Trust comes first.",
                "الثقة أولًا."
              )}
            </h2>

            <p className="bf-policy-copy">
              {tr(
                "Every professional on Fixer.Co is expected to provide respectful, reliable, and transparent service.",
                "نتوقع من كل محترف في Fixer.Co تقديم خدمة محترمة وموثوقة وواضحة."
              )}
            </p>
          </div>

          <div className="bf-policy-list bf-hover-focus-group">
            {policyItems.map((item, index) => (
              <PolicyItem
                key={item.enTitle}
                icon={item.icon}
                title={tr(item.enTitle, item.arTitle)}
                delay={`${index * 70}ms`}
              >
                {tr(item.enText, item.arText)}
              </PolicyItem>
            ))}

            <PolicyItem
              icon="fa-solid fa-triangle-exclamation"
              title={tr(
                "Quality protection policy",
                "سياسة حماية الجودة"
              )}
              warning
              delay="210ms"
            >
              {tr(
                "A fixer who receives 4 verified negative customer reviews may have their profile automatically suspended from public listings and reviewed by Fixer.Co.",
                "قد يتم تعليق ظهور الفني تلقائيًا ومراجعة حسابه إذا تلقى 4 مراجعات سلبية موثقة من العملاء."
              )}
            </PolicyItem>
          </div>
        </div>
      </section>

      {/* APPLICATION */}
      <section
        id="fixerApplication"
        className="bf-section bf-section-white"
      >
        <div className="bf-container bf-application-grid">
          <div
            className="bf-application-copy bf-reveal"
            data-fixer-reveal
          >
            <p className="bf-label">
              {tr(
                "YOUR APPLICATION",
                "طلب الانضمام"
              )}
            </p>

            <h2 className="bf-ready-title">
              {tr("Ready to ", "جاهز لـ")}
              <span className="bf-shiny-join">
                {tr("join?", "الانضمام؟")}
              </span>
            </h2>

            <p>
              {tr(
                "Complete your professional information. Submitting this form does not immediately publish your profile.",
                "أكمل معلوماتك المهنية. إرسال هذا النموذج لا يعني نشر ملفك مباشرة."
              )}
            </p>

            <div className="bf-info-stack bf-hover-focus-group">
              <InfoBox
                icon="fa-solid fa-circle-info"
                title={tr(
                  "99 SAR one-time registration fee",
                  "رسوم تسجيل 99 ر.س لمرة واحدة"
                )}
              >
                {tr(
                  "Collected only after your application is approved.",
                  "يتم تحصيلها فقط بعد الموافقة على طلبك."
                )}
              </InfoBox>

              <InfoBox
                icon="fa-solid fa-clock"
                title={tr(
                  "Applications start as Pending",
                  "تبدأ الطلبات بحالة قيد المراجعة"
                )}
                neutral
              >
                {tr(
                  "Your profile is listed only after approval.",
                  "يظهر ملفك للعملاء فقط بعد الموافقة."
                )}
              </InfoBox>
            </div>
          </div>

          <div
            className="bf-form-card bf-reveal"
            data-fixer-reveal
            style={{ "--bf-delay": "90ms" }}
          >
            <form onSubmit={handleSubmit}>
              <div className="bf-form-grid-two">
                <FormGroup label={tr("Full Name", "الاسم الكامل")}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={tr(
                      "Your full name",
                      "أدخل اسمك الكامل"
                    )}
                    required
                  />
                </FormGroup>

                <FormGroup label={tr("Phone Number", "رقم الجوال")}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05XXXXXXXX"
                    required
                  />
                </FormGroup>
              </div>

              <FormGroup label={tr("Email Address", "البريد الإلكتروني")}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                />
              </FormGroup>

              <FormGroup label={tr("Service Specialty", "التخصص")}>
                <select
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleChange}
                  required
                  disabled={servicesLoading}
                >
                  <option value="">
                    {servicesLoading
                      ? tr(
                          "Loading services...",
                          "جارٍ تحميل الخدمات..."
                        )
                      : tr(
                          "Select your specialty",
                          "اختر تخصصك"
                        )}
                  </option>

                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {translateServiceName(
                        service.name,
                        language
                      )}
                    </option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup label={tr("Location", "الموقع")}>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={tr(
                    "Example: Jeddah - Al Safa",
                    "مثال: جدة - الصفا"
                  )}
                  required
                />
              </FormGroup>

              <div className="bf-form-grid-two">
                <FormGroup
                  label={tr(
                    "Years of Experience",
                    "سنوات الخبرة"
                  )}
                >
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    max="60"
                    placeholder={tr("Example: 5", "مثال: 5")}
                    required
                  />
                </FormGroup>

                <FormGroup
                  label={tr(
                    "Starting Price (SAR)",
                    "السعر الابتدائي (ر.س)"
                  )}
                >
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="1"
                    placeholder={tr("Example: 70", "مثال: 70")}
                    required
                  />
                </FormGroup>
              </div>

              <FormGroup label={tr("Availability", "التوفر")}>
                <select
                  name="available"
                  value={formData.available}
                  onChange={handleChange}
                >
                  <option value="true">
                    {tr("Available now", "متاح الآن")}
                  </option>

                  <option value="false">
                    {tr(
                      "Currently unavailable",
                      "غير متاح حاليًا"
                    )}
                  </option>
                </select>
              </FormGroup>

              <FormGroup label={tr("About You", "نبذة عنك")}>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="5"
                  placeholder={tr(
                    "Tell customers about your experience and the services you provide...",
                    "عرّف العملاء بخبرتك والخدمات التي تقدمها..."
                  )}
                ></textarea>
              </FormGroup>

              <label className="bf-policy-check">
                <input
                  type="checkbox"
                  name="policy_accepted"
                  checked={formData.policy_accepted}
                  onChange={handleChange}
                  required
                />

                <span>
                  {tr(
                    "I have read and agree to the Fixer.Co Professional Policy and understand the quality standards required to remain on the platform.",
                    "لقد قرأت وأوافق على سياسة المحترفين في Fixer.Co وأفهم معايير الجودة المطلوبة للاستمرار على المنصة."
                  )}
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="bf-submit"
              >
                {submitting
                  ? tr(
                      "Submitting...",
                      "جارٍ الإرسال..."
                    )
                  : tr(
                      "Submit Application",
                      "إرسال الطلب"
                    )}

                {!submitting && (
                  <i
                    className={`fa-solid fa-arrow-right ${
                      isArabic ? "bf-rtl-arrow" : ""
                    }`}
                  ></i>
                )}
              </button>

              {message && (
                <div
                  className={`bf-form-message ${messageType}`}
                >
                  <i
                    className={
                      messageType === "success"
                        ? "fa-solid fa-circle-check"
                        : "fa-solid fa-circle-exclamation"
                    }
                  ></i>

                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PolicyItem({
  icon,
  title,
  children,
  warning = false,
  delay = "0ms",
}) {
  return (
    <div
      className={`bf-policy-item bf-focus-item bf-card-reveal ${
        warning ? "warning" : ""
      }`}
      data-fixer-reveal
      style={{ "--bf-delay": delay }}
    >
      <div className="bf-policy-icon">
        <i className={icon}></i>
      </div>

      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}

function InfoBox({
  icon,
  title,
  children,
  neutral = false,
}) {
  return (
    <div
      className={`bf-info-box bf-focus-item ${
        neutral ? "neutral" : ""
      }`}
    >
      <i className={icon}></i>

      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="bf-form-group">
      <label>{label}</label>
      {children}
    </div>
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

export default BecomeFixer;
