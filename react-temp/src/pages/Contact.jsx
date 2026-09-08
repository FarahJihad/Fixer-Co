import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./Contact.css";

function Contact() {
  const { language, isArabic } = useLanguage();

  const tr = (en, ar) =>
    language === "ar" ? ar : en;

  const contactTitleRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [formMessage, setFormMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll(
        "[data-contact-reveal]"
      )
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) =>
        item.classList.add("contact-show")
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
              "contact-show"
            );

            observer.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.1,
          rootMargin:
            "0px 0px -55px 0px",
        }
      );

    items.forEach((item) => {
      observer.observe(item);
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  useEffect(() => {
    const contactTitle = contactTitleRef.current;

    if (!contactTitle) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      contactTitle.classList.add("contact-play");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          contactTitle.classList.add("contact-play");
          observer.unobserve(contactTitle);
        });
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(contactTitle);

    return () => {
      observer.disconnect();
    };
  }, [language]);

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormMessage("");
    setMessageType("");

    const nameValue =
      formData.name.trim();

    const emailValue =
      formData.email.trim();

    const subjectValue =
      formData.subject.trim();

    const messageValue =
      formData.message.trim();

    if (
      !nameValue ||
      !emailValue ||
      !messageValue
    ) {
      setFormMessage(
        tr(
          "Please fill in all required fields.",
          "يرجى تعبئة جميع الحقول المطلوبة."
        )
      );

      setMessageType("error");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(emailValue)
    ) {
      setFormMessage(
        tr(
          "Please enter a valid email address.",
          "يرجى إدخال بريد إلكتروني صحيح."
        )
      );

      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/contact",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: nameValue,
            email: emailValue,
            subject: subjectValue,
            message: messageValue,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            tr(
              "Could not send message",
              "تعذر إرسال الرسالة"
            )
        );
      }

      setFormMessage(
        tr(
          "Message sent successfully.",
          "تم إرسال الرسالة بنجاح."
        )
      );

      setMessageType("success");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error(
        "Contact form error:",
        error
      );

      setFormMessage(
        tr(
          "Something went wrong. Please try again.",
          "حدث خطأ ما. يرجى المحاولة مرة أخرى."
        )
      );

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="contact-page"
    >
      <section className="contact-main-section">
        <div className="contact-container contact-grid">

          {/* LEFT SIDE */}
          <div className="contact-copy">
            <p
              className="contact-label contact-reveal"
              data-contact-reveal
              style={{
                "--contact-delay": "0ms",
              }}
            >
              {tr(
                "CONTACT US",
                "تواصل معنا"
              )}
            </p>

            {/* Exact creative animation from the old Contact page */}
            <h1
              ref={contactTitleRef}
              className="contact-title contact-title-animated"
              aria-label={tr(
                "We'd love to hear from you.",
                "يسعدنا أن نسمع منك."
              )}
            >
              <span className="contact-word contact-love">
                {tr(
                  "We'd love to",
                  "يسعدنا أن"
                )}
              </span>

              <span className="contact-word contact-hear">
                {tr("hear", "نسمع")}
              </span>

              <span className="contact-word contact-you">
                {isArabic ? (
                  <span className="contact-shiny-you">منك</span>
                ) : (
                  <>
                    <span className="contact-from">from </span>
                    <span className="contact-shiny-you">you</span>
                  </>
                )}
              </span>

              <span className="contact-word contact-dot">
                .
              </span>
            </h1>

            <p
              className="contact-intro contact-reveal"
              data-contact-reveal
              style={{
                "--contact-delay": "240ms",
              }}
            >
              {tr(
                "Have a question, suggestion, or need help with Fixer.Co? Send us a message and we'll be happy to help.",
                "لديك سؤال أو اقتراح أو تحتاج إلى مساعدة مع Fixer.Co؟ أرسل لنا رسالة وسنسعد بمساعدتك."
              )}
            </p>

            <div className="contact-details">
              <ContactDetail
                icon="fa-solid fa-envelope"
                label={tr(
                  "Email",
                  "البريد الإلكتروني"
                )}
                value="hello@fixer.co"
                delay="0ms"
              />

              <ContactDetail
                icon="fa-solid fa-phone"
                label={tr(
                  "Phone",
                  "الهاتف"
                )}
                value="+966 590873032"
                delay="80ms"
              />

              <ContactDetail
                icon="fa-solid fa-location-dot"
                label={tr(
                  "Location",
                  "الموقع"
                )}
                value={tr(
                  "Jeddah, Saudi Arabia",
                  "جدة، المملكة العربية السعودية"
                )}
                delay="160ms"
              />
            </div>
          </div>

          {/* FORM */}
          <div
            className="contact-form-card contact-reveal"
            data-contact-reveal
            style={{
              "--contact-delay": "120ms",
            }}
          >
            <div>
              <p className="contact-form-label">
                {tr(
                  "SEND A MESSAGE",
                  "أرسل رسالة"
                )}
              </p>

              <h2>
                {tr(
                  "How can we help?",
                  "كيف يمكننا مساعدتك؟"
                )}
              </h2>

              <p>
                {tr(
                  "Fill in the form and send your message to the Fixer.Co team.",
                  "املأ النموذج وأرسل رسالتك إلى فريق Fixer.Co."
                )}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="contact-form"
            >
              <FormField
                label={tr(
                  "Your Name",
                  "اسمك"
                )}
                id="contactName"
              >
                <input
                  type="text"
                  id="contactName"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={tr(
                    "Enter your name",
                    "أدخل اسمك"
                  )}
                />
              </FormField>

              <FormField
                label={tr(
                  "Email Address",
                  "البريد الإلكتروني"
                )}
                id="contactEmail"
              >
                <input
                  type="email"
                  id="contactEmail"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                />
              </FormField>

              <FormField
                label={tr(
                  "Subject",
                  "الموضوع"
                )}
                id="contactSubject"
              >
                <input
                  type="text"
                  id="contactSubject"
                  name="subject"
                  value={
                    formData.subject
                  }
                  onChange={handleChange}
                  placeholder={tr(
                    "What is your message about?",
                    "ما موضوع رسالتك؟"
                  )}
                />
              </FormField>

              <FormField
                label={tr(
                  "Message",
                  "الرسالة"
                )}
                id="contactMessage"
              >
                <textarea
                  id="contactMessage"
                  name="message"
                  rows="6"
                  value={
                    formData.message
                  }
                  onChange={handleChange}
                  placeholder={tr(
                    "Write your message here...",
                    "اكتب رسالتك هنا..."
                  )}
                ></textarea>
              </FormField>

              <button
                type="submit"
                disabled={submitting}
                className="contact-submit"
              >
                {submitting
                  ? tr(
                      "Sending...",
                      "جارٍ الإرسال..."
                    )
                  : tr(
                      "Send Message",
                      "إرسال الرسالة"
                    )}

                <i className="fa-solid fa-paper-plane"></i>
              </button>

              {formMessage && (
                <div
                  className={`contact-form-message ${messageType}`}
                >
                  {messageType ===
                    "success" && (
                    <i className="fa-solid fa-circle-check"></i>
                  )}

                  {messageType ===
                    "error" && (
                    <i className="fa-solid fa-circle-exclamation"></i>
                  )}

                  {formMessage}
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

function ContactDetail({
  icon,
  label,
  value,
  delay,
}) {
  return (
    <div
      className="contact-detail contact-reveal"
      data-contact-reveal
      style={{
        "--contact-delay": delay,
      }}
    >
      <div className="contact-detail-icon">
        <i className={icon}></i>
      </div>

      <div>
        <p>{label}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

function FormField({
  label,
  id,
  children,
}) {
  return (
    <div className="contact-field">
      <label htmlFor={id}>
        {label}
      </label>

      {children}
    </div>
  );
}

export default Contact;
