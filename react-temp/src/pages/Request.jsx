import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./Request.css";

function Request() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { language, isArabic } = useLanguage();
  const tr = (en, ar) => (language === "ar" ? ar : en);

  const [services, setServices] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  const [serviceId, setServiceId] = useState(
    searchParams.get("service") || ""
  );

  const [technicianId, setTechnicianId] = useState(
    searchParams.get("technician") || ""
  );

  const [problem, setProblem] = useState(
    searchParams.get("problem") || ""
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [showLoginRequired, setShowLoginRequired] = useState(false);


  useEffect(() => {
    const savedDraft = sessionStorage.getItem("requestDraft");

    if (!savedDraft) return;

    try {
      const draft = JSON.parse(savedDraft);

      if (draft.customerName) setCustomerName(draft.customerName);
      if (draft.phone) setPhone(draft.phone);
      if (draft.serviceId) setServiceId(String(draft.serviceId));
      if (draft.technicianId) setTechnicianId(String(draft.technicianId));
      if (draft.problem) setProblem(draft.problem);

      sessionStorage.removeItem("requestDraft");
    } catch (error) {
      console.error("Could not restore request draft:", error);
      sessionStorage.removeItem("requestDraft");
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        const [
          servicesResponse,
          techniciansResponse,
        ] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/technicians"),
        ]);

        if (
          !servicesResponse.ok ||
          !techniciansResponse.ok
        ) {
          throw new Error(
            tr(
              "Could not load service information.",
              "تعذر تحميل معلومات الخدمة."
            )
          );
        }

        const servicesData =
          await servicesResponse.json();

        const techniciansData =
          await techniciansResponse.json();

        setServices(
          Array.isArray(servicesData)
            ? servicesData
            : servicesData.services || []
        );

        setTechnicians(
          Array.isArray(techniciansData)
            ? techniciansData
            : techniciansData.technicians || []
        );
      } catch (error) {
        console.error(
          "Request page loading error:",
          error
        );

        setMessage(
          tr(
            "Could not load service information.",
            "تعذر تحميل معلومات الخدمة."
          )
        );

        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [language]);

  const filteredTechnicians = useMemo(() => {
    if (!serviceId) {
      return technicians;
    }

    return technicians.filter(
      (technician) =>
        String(technician.service_id) ===
        String(serviceId)
    );
  }, [technicians, serviceId]);

  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll(
        "[data-request-reveal]"
      )
    );

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) =>
        item.classList.add("request-show")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add(
            "request-show"
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
  }, [language, isLoading]);

  function handleServiceChange(event) {
    const newServiceId = event.target.value;

    setServiceId(newServiceId);

    const selectedTechnician =
      technicians.find(
        (technician) =>
          String(technician.id) ===
          String(technicianId)
      );

    if (
      selectedTechnician &&
      String(selectedTechnician.service_id) !==
        String(newServiceId)
    ) {
      setTechnicianId("");
    }
  }


  function saveRequestDraft() {
    sessionStorage.setItem(
      "requestDraft",
      JSON.stringify({
        customerName,
        phone,
        serviceId,
        technicianId,
        problem,
      })
    );
  }

  function openLoginRequired() {
    setShowLoginRequired(true);
  }

  function handleLoginFromModal() {
    saveRequestDraft();

    localStorage.setItem(
      "redirectAfterLogin",
      window.location.pathname +
        window.location.search
    );

    setShowLoginRequired(false);
    navigate("/login");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const loggedIn =
      localStorage.getItem("isLoggedIn") === "true";

    if (!loggedIn) {
      openLoginRequired();
      return;
    }

    const nameValue = customerName.trim();
    const phoneValue = phone.trim();
    const problemValue = problem.trim();

    if (
      !nameValue ||
      !phoneValue ||
      !problemValue ||
      !serviceId
    ) {
      setMessage(
        tr(
          "Please fill in all required fields.",
          "يرجى تعبئة جميع الحقول المطلوبة."
        )
      );

      setMessageType("error");
      return;
    }

    if (!/^05\d{8}$/.test(phoneValue)) {
      setMessage(
        tr(
          "Please enter a valid phone number starting with 05.",
          "يرجى إدخال رقم جوال صحيح يبدأ بـ 05."
        )
      );

      setMessageType("error");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        "/api/requests",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            customer_name: nameValue,
            phone: phoneValue,
            problem: problemValue,
            service_id: Number(serviceId),

            technician_id: technicianId
              ? Number(technicianId)
              : null,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("isLoggedIn");
        openLoginRequired();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            tr(
              "Request failed.",
              "فشل إرسال الطلب."
            )
        );
      }

      setRequestId(
        result.request_id || null
      );

      setMessage(
        result.request_id
          ? tr(
              `Service request sent successfully! Request #${result.request_id}`,
              `تم إرسال طلب الخدمة بنجاح! رقم الطلب #${result.request_id}`
            )
          : tr(
              "Service request sent successfully!",
              "تم إرسال طلب الخدمة بنجاح!"
            )
      );

      setMessageType("success");

      setCustomerName("");
      setPhone("");
      setServiceId("");
      setTechnicianId("");
      setProblem("");

      sessionStorage.removeItem("requestDraft");
      setShowSuccess(true);
    } catch (error) {
      console.error(
        "Request error:",
        error
      );

      setMessage(
        error.message ||
          tr(
            "Something went wrong. Please try again.",
            "حدث خطأ ما. يرجى المحاولة مرة أخرى."
          )
      );

      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="request-page"
    >
      <section className="request-main-section">
        <div className="request-container request-grid">
          {/* LEFT */}
          <div className="request-copy">
            <p
              className="request-label request-reveal"
              data-request-reveal
            >
              {tr(
                "REQUEST A SERVICE",
                "اطلب خدمة"
              )}
            </p>

            <h1
              className="request-static-title"
            >
              {tr(
                "Tell us what needs ",
                "أخبرنا بما يحتاج "
              )}

              <span className="request-dia-text">
                <span className="request-dia-text-base">
                  {tr("fixing", "إصلاحه")}
                </span>
              </span>
            </h1>

            <p
              className="request-intro request-reveal"
              data-request-reveal
              style={{
                "--request-delay": "150ms",
              }}
            >
              {tr(
                "Share a few details about your problem and we'll connect your request with the right fixer.",
                "شاركنا بعض التفاصيل عن المشكلة وسنساعدك في توصيل الطلب بالفني المناسب."
              )}
            </p>

            <div className="request-benefits">
              <Benefit
                icon="fa-solid fa-screwdriver-wrench"
                title={tr(
                  "Choose your service",
                  "اختر الخدمة"
                )}
                text={tr(
                  "Select the type of home service you need.",
                  "حدد نوع الخدمة المنزلية التي تحتاجها."
                )}
                delay="0ms"
              />

              <Benefit
                icon="fa-solid fa-user-check"
                title={tr(
                  "Select a fixer",
                  "اختر الفني"
                )}
                text={tr(
                  "Choose a trusted professional for your request.",
                  "اختر محترفًا موثوقًا لطلبك."
                )}
                delay="80ms"
              />

              <Benefit
                icon="fa-solid fa-circle-check"
                title={tr(
                  "Send your request",
                  "أرسل طلبك"
                )}
                text={tr(
                  "Your request will be saved and ready for review.",
                  "سيتم حفظ طلبك ليصبح جاهزًا للمراجعة."
                )}
                delay="160ms"
              />
            </div>
          </div>

          {/* FORM */}
          <div
            className="request-form-card request-reveal"
            data-request-reveal
            style={{
              "--request-delay": "100ms",
            }}
          >
            <div className="request-form-heading">
              <p className="request-label">
                {tr(
                  "SERVICE DETAILS",
                  "تفاصيل الخدمة"
                )}
              </p>

              <h2>
                {tr(
                  "Request a Fixer",
                  "اطلب فنيًا"
                )}
              </h2>

              <p>
                {tr(
                  "Fill in the information below to submit your service request.",
                  "أدخل المعلومات أدناه لإرسال طلب الخدمة."
                )}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="request-form-grid-two">
                <FormGroup
                  label={tr(
                    "Your Name",
                    "اسمك"
                  )}
                >
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerName(
                        event.target.value
                      )
                    }
                    placeholder={tr(
                      "Enter your name",
                      "أدخل اسمك"
                    )}
                  />
                </FormGroup>

                <FormGroup
                  label={tr(
                    "Phone Number",
                    "رقم الجوال"
                  )}
                >
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    placeholder="05XXXXXXXX"
                    maxLength={10}
                  />
                </FormGroup>
              </div>

              <FormGroup
                label={tr(
                  "Service",
                  "الخدمة"
                )}
              >
                <select
                  value={serviceId}
                  onChange={
                    handleServiceChange
                  }
                  disabled={isLoading}
                >
                  <option value="">
                    {isLoading
                      ? tr(
                          "Loading services...",
                          "جارٍ تحميل الخدمات..."
                        )
                      : tr(
                          "Select a service",
                          "اختر خدمة"
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
              </FormGroup>

              <FormGroup
                label={tr(
                  "Fixer",
                  "الفني"
                )}
              >
                <select
                  value={technicianId}
                  onChange={(event) =>
                    setTechnicianId(
                      event.target.value
                    )
                  }
                  disabled={isLoading}
                >
                  <option value="">
                    {tr(
                      "Select a fixer",
                      "اختر فنيًا"
                    )}
                  </option>

                  {filteredTechnicians.map(
                    (technician) => (
                      <option
                        key={technician.id}
                        value={technician.id}
                      >
                        {technician.name} —{" "}
                        {translateServiceName(
                          technician.service_name,
                          language
                        )}
                      </option>
                    )
                  )}
                </select>
              </FormGroup>

              <FormGroup
                label={tr(
                  "Describe the Problem",
                  "صف المشكلة"
                )}
              >
                <textarea
                  rows="5"
                  value={problem}
                  onChange={(event) =>
                    setProblem(
                      event.target.value
                    )
                  }
                  placeholder={tr(
                    "Tell us what is wrong...",
                    "أخبرنا ما المشكلة..."
                  )}
                />
              </FormGroup>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isLoading
                }
                className="request-submit-standard"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    {tr(
                      "Sending Request...",
                      "جارٍ إرسال الطلب..."
                    )}
                  </>
                ) : (
                  tr(
                    "Send Service Request",
                    "إرسال طلب الخدمة"
                  )
                )}
              </button>

              {message && (
                <div
                  className={`request-message ${messageType}`}
                >
                  <i
                    className={
                      messageType === "success"
                        ? "fa-solid fa-circle-check"
                        : "fa-solid fa-circle-exclamation"
                    }
                  ></i>

                  <span>{message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>


      {showLoginRequired && (
        <div
          className="login-required-overlay"
          onClick={() =>
            setShowLoginRequired(false)
          }
        >
          <div
            className="login-required-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-required-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="login-required-close"
              onClick={() =>
                setShowLoginRequired(false)
              }
              aria-label={tr("Close", "إغلاق")}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="login-required-icon-wrap">
              <div className="login-required-icon">
                <i className="fa-solid fa-lock"></i>
              </div>
              <span className="login-required-pulse"></span>
            </div>

            <p className="login-required-kicker">
              {tr(
                "ACCOUNT REQUIRED",
                "يلزم تسجيل الدخول"
              )}
            </p>

            <h3 id="login-required-title">
              {tr(
                "Log in to send your request",
                "سجّل الدخول لإرسال طلبك"
              )}
            </h3>

<p className="login-required-copy">
  {tr(
    <>
      Your service details are ready.
      <br />
      Log in to continue, and we'll bring you right back here.
    </>,
    <>
      تفاصيل طلبك جاهزة.
      <br />
      سجّل الدخول للمتابعة، وسنعيدك مباشرة إلى هنا.
    </>
  )}
</p>

            <div className="login-required-note">
              <i className="fa-regular fa-circle-check"></i>
              <span>
                {tr(
                  "Your form details will be saved while you log in.",
                  "سنحتفظ ببيانات النموذج أثناء تسجيل الدخول."
                )}
              </span>
            </div>

            <div className="login-required-actions">
              <button
                type="button"
                className="login-required-cancel"
                onClick={() =>
                  setShowLoginRequired(false)
                }
              >
                {tr("Keep Browsing", "متابعة التصفح")}
              </button>

              <button
                type="button"
                className="login-required-login"
                onClick={handleLoginFromModal}
              >
                <span>
                  {tr("Log In to Continue", "تسجيل الدخول والمتابعة")}
                </span>
              </button>
            </div>

            <p className="login-required-footer">
              {tr(
                "New to Fixer.Co? You can create an account from the login page.",
                "جديد على Fixer.Co؟ يمكنك إنشاء حساب من صفحة تسجيل الدخول."
              )}
            </p>
          </div>
        </div>
      )}

      {showSuccess && (
        <div
          className="request-modal-overlay"
          onClick={() =>
            setShowSuccess(false)
          }
        >
          <div
            className="request-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="request-modal-icon">
              <i className="fa-solid fa-circle-check"></i>
            </div>

            <h3>
              {tr(
                "Request Submitted!",
                "تم إرسال الطلب!"
              )}
            </h3>

            <p>
              {tr(
                "Your service request was created successfully.",
                "تم إنشاء طلب الخدمة بنجاح."
              )}
            </p>

            {requestId && (
              <span className="request-id-chip">
                {tr(
                  `Request #${requestId}`,
                  `طلب #${requestId}`
                )}
              </span>
            )}

            <p className="request-modal-question">
              {tr(
                "Would you like to view your requests?",
                "هل تريد عرض طلباتك؟"
              )}
            </p>

            <div className="request-modal-actions">
              <button
                type="button"
                onClick={() =>
                  setShowSuccess(false)
                }
                className="request-secondary-button"
              >
                {tr(
                  "Stay Here",
                  "البقاء هنا"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/my-requests")
                }
                className="request-primary-button"
              >
                {tr(
                  "View My Requests",
                  "عرض طلباتي"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

function FormGroup({
  label,
  children,
}) {
  return (
    <div className="request-form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Benefit({
  icon,
  title,
  text,
  delay,
}) {
  return (
    <div
      className="request-benefit request-reveal"
      data-request-reveal
      style={{
        "--request-delay": delay,
      }}
    >
      <div className="request-benefit-icon">
        <i className={icon}></i>
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function translateServiceName(
  name,
  language
) {
  if (language !== "ar") return name;

  const names = {
    "AC & Cooling":
      "التكييف والتبريد",
    Plumbing: "السباكة",
    Electrical: "الكهرباء",
    Appliances: "الأجهزة المنزلية",
    Furniture: "الأثاث",
    "Carpentry & Furniture":
      "النجارة والأثاث",
    General: "الصيانة العامة",
    "General Maintenance":
      "الصيانة العامة",
  };

  return names[name] || name;
}

export default Request;
