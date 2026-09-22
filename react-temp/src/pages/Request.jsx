import { useEffect, useMemo, useRef, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import "./Request.css";


function RequestSmallLabelEffect({ text }) {
  const textRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const isArabicText = /[\u0600-\u06FF]/.test(text);

  const pieces = isArabicText
    ? text.split(/(\s+)/)
    : Array.from(text);

  useEffect(() => {
    const element = textRef.current;

    if (!element) return undefined;

    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            return;
          }

          setIsVisible(true);
          observer.unobserve(element);
        },
        {
          threshold: 0.5,
          rootMargin:
            "0px 0px -6% 0px",
        }
      );

    observer.observe(element);

    return () =>
      observer.disconnect();
  }, [text]);

  return (
    <span
      ref={textRef}
      className={`request-small-text-effect ${
        isVisible
          ? "is-visible"
          : ""
      } ${
        isArabicText
          ? "is-arabic-effect"
          : ""
      }`}
      aria-label={text}
    >
      {pieces.map(
        (piece, index) => {
          if (
            piece.trim() === ""
          ) {
            return (
              <span
                key={`space-${index}`}
                className="request-small-text-effect-space"
                aria-hidden="true"
              >
                {" "}
              </span>
            );
          }

          return (
            <span
              key={`${piece}-${index}`}
              className="request-small-text-effect-piece"
              aria-hidden="true"
              style={{
                "--request-text-delay":
                  `${
                    index *
                    (
                      isArabicText
                        ? 70
                        : 34
                    )
                  }ms`,
              }}
            >
              {piece}
            </span>
          );
        }
      )}
    </span>
  );
}


function Request() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const {
    language,
    isArabic,
  } = useLanguage();

  const tr = (
    en,
    ar
  ) =>
    language === "ar"
      ? ar
      : en;


  const [
    services,
    setServices,
  ] = useState([]);

  const [
    technicians,
    setTechnicians,
  ] = useState([]);


  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");


  const [
    serviceId,
    setServiceId,
  ] = useState(
    searchParams.get("service") ||
      ""
  );


  const [
    technicianId,
    setTechnicianId,
  ] = useState(
    searchParams.get(
      "technician"
    ) || ""
  );


  const [
    problem,
    setProblem,
  ] = useState(
    searchParams.get(
      "problem"
    ) || ""
  );


  const [
    firstImages,
    setFirstImages,
  ] = useState([]);


  const [
    secondServiceEnabled,
    setSecondServiceEnabled,
  ] = useState(false);


  const [
    secondServiceId,
    setSecondServiceId,
  ] = useState("");


  const [
    secondTechnicianId,
    setSecondTechnicianId,
  ] = useState("");


  const [
    secondProblem,
    setSecondProblem,
  ] = useState("");


  const [
    secondImages,
    setSecondImages,
  ] = useState([]);


  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    messageType,
    setMessageType,
  ] = useState("");


  const [
    showLoginRequired,
    setShowLoginRequired,
  ] = useState(false);


  const [
    showSuccess,
    setShowSuccess,
  ] = useState(false);


  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  const [
    authChecked,
    setAuthChecked,
  ] = useState(false);



  /* ========================================
     RESTORE PHOTOS
  ======================================== */

  useEffect(() => {
    const savedImages =
      window
        .__fixerRequestImageDraft;

    if (!savedImages) {
      return;
    }

    setFirstImages(
      Array.isArray(
        savedImages.firstImages
      )
        ? savedImages.firstImages
        : []
    );

    setSecondImages(
      Array.isArray(
        savedImages.secondImages
      )
        ? savedImages.secondImages
        : []
    );
  }, []);



  /* ========================================
     RESTORE REQUEST DRAFT
  ======================================== */

  useEffect(() => {
    const savedDraft =
      sessionStorage.getItem(
        "requestDraft"
      );

    if (!savedDraft) {
      return;
    }

    try {
      const draft =
        JSON.parse(savedDraft);


      if (draft.customerName) {
        setCustomerName(
          draft.customerName
        );
      }


      if (draft.phone) {
        setPhone(
          draft.phone
        );
      }


      if (draft.serviceId) {
        setServiceId(
          String(
            draft.serviceId
          )
        );
      }


      if (draft.technicianId) {
        setTechnicianId(
          String(
            draft.technicianId
          )
        );
      }


      if (draft.problem) {
        setProblem(
          draft.problem
        );
      }


      if (
        draft.secondServiceEnabled
      ) {
        setSecondServiceEnabled(
          true
        );
      }


      if (
        draft.secondServiceId
      ) {
        setSecondServiceId(
          String(
            draft.secondServiceId
          )
        );
      }


      if (
        draft.secondTechnicianId
      ) {
        setSecondTechnicianId(
          String(
            draft.secondTechnicianId
          )
        );
      }


      if (
        draft.secondProblem
      ) {
        setSecondProblem(
          draft.secondProblem
        );
      }


      sessionStorage.removeItem(
        "requestDraft"
      );
    }

    catch (error) {
      console.error(
        "Could not restore request draft:",
        error
      );

      sessionStorage.removeItem(
        "requestDraft"
      );
    }
  }, []);



  /* ========================================
     CURRENT USER
  ======================================== */

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response =
          await fetch(
            "/api/me",
            {
              method:
                "GET",

              credentials:
                "same-origin",
            }
          );


        const data =
          await response.json();


        if (
          response.ok &&
          data.authenticated &&
          data.user
        ) {
          setCurrentUser(
            data.user
          );


          localStorage.setItem(
            "isLoggedIn",
            "true"
          );


          localStorage.removeItem(
            "guestMode"
          );


          const accountName =
            String(
              data.user.name ||
              data.user.username ||
              ""
            ).trim();


          const accountPhone =
            String(
              data.user.phone ||
              ""
            ).trim();


          setCustomerName(
            (previousName) =>
              previousName.trim()
                ? previousName
                : accountName
          );


          setPhone(
            (previousPhone) =>
              previousPhone.trim()
                ? previousPhone
                : accountPhone
          );
        }

        else {
          setCurrentUser(
            null
          );

          localStorage.removeItem(
            "isLoggedIn"
          );
        }
      }

      catch (error) {
        console.error(
          "Could not load current user:",
          error
        );


        setCurrentUser(
          null
        );


        localStorage.removeItem(
          "isLoggedIn"
        );
      }

      finally {
        setAuthChecked(
          true
        );
      }
    }


    loadCurrentUser();
  }, []);



  /* ========================================
     LOAD SERVICES + FIXERS
  ======================================== */

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(
          true
        );


        const [
          servicesResponse,
          techniciansResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/services"
            ),

            fetch(
              "/api/technicians"
            ),
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
          await servicesResponse
            .json();


        const techniciansData =
          await techniciansResponse
            .json();


        setServices(
          Array.isArray(
            servicesData
          )
            ? servicesData
            : servicesData.services ||
                []
        );


        setTechnicians(
          Array.isArray(
            techniciansData
          )
            ? techniciansData
            : techniciansData
                .technicians ||
                []
        );
      }

      catch (error) {
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


        setMessageType(
          "error"
        );
      }

      finally {
        setIsLoading(
          false
        );
      }
    }


    loadData();
  }, [language]);



  /* ========================================
     SELECTED FIXERS
  ======================================== */

  const selectedTechnician =
    useMemo(
      () =>
        technicians.find(
          (technician) =>
            String(
              technician.id
            ) ===
            String(
              technicianId
            )
        ) || null,

      [
        technicians,
        technicianId,
      ]
    );


  const secondSelectedTechnician =
    useMemo(
      () =>
        technicians.find(
          (technician) =>
            String(
              technician.id
            ) ===
            String(
              secondTechnicianId
            )
        ) || null,

      [
        technicians,
        secondTechnicianId,
      ]
    );



  /* ========================================
     REVEAL ANIMATIONS
  ======================================== */

  useEffect(() => {
    const items =
      Array.from(
        document.querySelectorAll(
          "[data-request-reveal]"
        )
      );


    if (
      !(
        "IntersectionObserver"
        in window
      )
    ) {
      items.forEach(
        (item) =>
          item.classList.add(
            "request-show"
          )
      );

      return;
    }


    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (
                !entry.isIntersecting
              ) {
                return;
              }


              entry.target
                .classList.add(
                  "request-show"
                );


              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold:
            0.08,

          rootMargin:
            "0px 0px -45px 0px",
        }
      );


    items.forEach(
      (item) =>
        observer.observe(
          item
        )
    );


    return () =>
      observer.disconnect();
  }, [
    language,
    isLoading,
  ]);



  /* ========================================
     SERVICE CHANGE
  ======================================== */

  function handleServiceChange(
    event
  ) {
    const newServiceId =
      event.target.value;


    setServiceId(
      newServiceId
    );


    const fixer =
      technicians.find(
        (technician) =>
          String(
            technician.id
          ) ===
          String(
            technicianId
          )
      );


    if (
      fixer &&
      String(
        fixer.service_id
      ) !==
        String(
          newServiceId
        )
    ) {
      setTechnicianId("");
    }
  }



  function handleSecondServiceChange(
    event
  ) {
    const newServiceId =
      event.target.value;


    setSecondServiceId(
      newServiceId
    );


    const fixer =
      technicians.find(
        (technician) =>
          String(
            technician.id
          ) ===
          String(
            secondTechnicianId
          )
      );


    if (
      fixer &&
      String(
        fixer.service_id
      ) !==
        String(
          newServiceId
        )
    ) {
      setSecondTechnicianId(
        ""
      );
    }
  }



  /* ========================================
     IMAGES
  ======================================== */

  function validateAndAddImages(
    event,
    currentImages,
    setImages
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ||
          []
      );


    if (
      !selectedFiles.length
    ) {
      return;
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


    const maxFileSize =
      1_500_000;


    for (
      const file of
      selectedFiles
    ) {
      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setMessage(
          tr(
            "Only JPG, PNG, and WebP images are allowed.",
            "يسمح فقط بصور JPG وPNG وWebP."
          )
        );


        setMessageType(
          "error"
        );


        event.target.value =
          "";


        return;
      }


      if (
        file.size >
        maxFileSize
      ) {
        setMessage(
          tr(
            "Each image must be 1.5 MB or smaller.",
            "يجب ألا يتجاوز حجم كل صورة 1.5 ميجابايت."
          )
        );


        setMessageType(
          "error"
        );


        event.target.value =
          "";


        return;
      }
    }


    const nextImages = [
      ...currentImages,
      ...selectedFiles,
    ];


    if (
      nextImages.length >
      3
    ) {
      setMessage(
        tr(
          "You can add up to 3 images for each service.",
          "يمكنك إضافة حتى 3 صور لكل خدمة."
        )
      );


      setMessageType(
        "error"
      );


      event.target.value =
        "";


      return;
    }


    setMessage("");
    setMessageType("");


    setImages(
      nextImages
    );


    event.target.value =
      "";
  }



  function removeImage(
    index,
    currentImages,
    setImages
  ) {
    setImages(
      currentImages.filter(
        (
          _,
          imageIndex
        ) =>
          imageIndex !==
          index
      )
    );
  }



  function removeSecondService() {
    setSecondServiceEnabled(
      false
    );

    setSecondServiceId(
      ""
    );

    setSecondTechnicianId(
      ""
    );

    setSecondProblem(
      ""
    );

    setSecondImages(
      []
    );
  }



  /* ========================================
     SAVE DRAFT
  ======================================== */

  function saveRequestImagesInMemory() {
    window
      .__fixerRequestImageDraft =
      {
        firstImages,
        secondImages,
      };
  }



  function saveRequestDraft() {
    saveRequestImagesInMemory();


    sessionStorage.setItem(
      "requestDraft",

      JSON.stringify({
        customerName,
        phone,
        serviceId,
        technicianId,
        problem,

        secondServiceEnabled,
        secondServiceId,
        secondTechnicianId,
        secondProblem,
      })
    );
  }



  /* ========================================
     FIXER PICKER
  ======================================== */

  function openFixerPicker(
    slot
  ) {
    const selectedServiceId =
      slot === 2
        ? secondServiceId
        : serviceId;


    if (
      !selectedServiceId
    ) {
      setMessage(
        tr(
          "Choose the service first, then select a fixer.",
          "اختر الخدمة أولًا، ثم اختر الفني."
        )
      );


      setMessageType(
        "error"
      );


      return;
    }


    saveRequestDraft();
    saveRequestImagesInMemory();


    const query =
      new URLSearchParams();


    query.set(
      "service",
      selectedServiceId
    );


    query.set(
      "chooseFor",
      "request"
    );


    query.set(
      "slot",
      String(slot)
    );


    navigate(
      `/technicians?${query.toString()}`
    );
  }



  function openSelectedFixerProfile(
    technician,
    slot
  ) {
    if (
      !technician
    ) {
      return;
    }


    saveRequestDraft();
    saveRequestImagesInMemory();


    const query =
      new URLSearchParams();


    query.set(
      "chooseFor",
      "request"
    );


    query.set(
      "slot",
      String(slot)
    );


    query.set(
      "service",
      String(
        technician.service_id
      )
    );


    navigate(
      `/technicians/${technician.id}?${query.toString()}`
    );
  }



  /* ========================================
     LOGIN REQUIRED
  ======================================== */

  function openLoginRequired() {
    setShowLoginRequired(
      true
    );
  }



  function handleLoginFromModal() {
    saveRequestDraft();


    localStorage.setItem(
      "redirectAfterLogin",

      window.location.pathname +
        window.location.search
    );


    setShowLoginRequired(
      false
    );


    navigate(
      "/login"
    );
  }



  /* ========================================
     SUBMIT
  ======================================== */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    setMessage("");
    setMessageType("");


    if (
      !authChecked
    ) {
      setMessage(
        tr(
          "Please wait while we verify your account.",
          "يرجى الانتظار حتى نتحقق من حسابك."
        )
      );


      setMessageType(
        "error"
      );


      return;
    }


    if (
      !currentUser
    ) {
      openLoginRequired();
      return;
    }


    const nameValue =
      customerName.trim();


    const phoneValue =
      phone.trim();


    const problemValue =
      problem.trim();



    /* ========================================
       FIRST SERVICE
    ======================================== */

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


      setMessageType(
        "error"
      );


      return;
    }


    if (
      nameValue.length <
        2 ||
      nameValue.length >
        60
    ) {
      setMessage(
        tr(
          "Name must be between 2 and 60 characters.",
          "يجب أن يكون الاسم بين حرفين و60 حرفًا."
        )
      );


      setMessageType(
        "error"
      );


      return;
    }


    if (
      !/^05\d{8}$/.test(
        phoneValue
      )
    ) {
      setMessage(
        tr(
          "Please enter a valid Saudi phone number starting with 05.",
          "يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05."
        )
      );


      setMessageType(
        "error"
      );


      return;
    }


    if (
      problemValue.length <
        10 ||
      problemValue.length >
        1000
    ) {
      setMessage(
        tr(
          "Problem description must be between 10 and 1000 characters.",
          "يجب أن يكون وصف المشكلة بين 10 و1000 حرف."
        )
      );


      setMessageType(
        "error"
      );


      return;
    }


    const selectedService =
      services.find(
        (service) =>
          String(
            service.id
          ) ===
          String(
            serviceId
          )
      );


    if (
      !selectedService
    ) {
      setMessage(
        tr(
          "Please select a valid service.",
          "يرجى اختيار خدمة صحيحة."
        )
      );


      setMessageType(
        "error"
      );


      return;
    }



    if (
      technicianId
    ) {
      const fixer =
        technicians.find(
          (technician) =>
            String(
              technician.id
            ) ===
            String(
              technicianId
            )
        );


      if (
        !fixer ||
        String(
          fixer.service_id
        ) !==
          String(
            serviceId
          )
      ) {
        setMessage(
          tr(
            "Please select a fixer that matches the selected service.",
            "يرجى اختيار فني يتوافق مع الخدمة المحددة."
          )
        );


        setMessageType(
          "error"
        );


        return;
      }
    }



    /* ========================================
       SECOND SERVICE
    ======================================== */

    if (
      secondServiceEnabled
    ) {
      const secondProblemValue =
        secondProblem.trim();


      if (
        !secondServiceId ||
        !secondProblemValue
      ) {
        setMessage(
          tr(
            "Please complete the second service details.",
            "يرجى إكمال تفاصيل الخدمة الثانية."
          )
        );


        setMessageType(
          "error"
        );


        return;
      }


      if (
        secondProblemValue
          .length <
          10 ||
        secondProblemValue
          .length >
          1000
      ) {
        setMessage(
          tr(
            "The second problem description must be between 10 and 1000 characters.",
            "يجب أن يكون وصف المشكلة الثانية بين 10 و1000 حرف."
          )
        );


        setMessageType(
          "error"
        );


        return;
      }


      if (
        String(
          secondServiceId
        ) ===
        String(
          serviceId
        )
      ) {
        setMessage(
          tr(
            "Please choose a different service for Service 02.",
            "يرجى اختيار خدمة مختلفة للخدمة الثانية."
          )
        );


        setMessageType(
          "error"
        );


        return;
      }


      const secondSelectedService =
        services.find(
          (service) =>
            String(
              service.id
            ) ===
            String(
              secondServiceId
            )
        );


      if (
        !secondSelectedService
      ) {
        setMessage(
          tr(
            "Please select a valid second service.",
            "يرجى اختيار خدمة ثانية صحيحة."
          )
        );


        setMessageType(
          "error"
        );


        return;
      }


      if (
        secondTechnicianId
      ) {
        const fixer =
          technicians.find(
            (technician) =>
              String(
                technician.id
              ) ===
              String(
                secondTechnicianId
              )
          );


        if (
          !fixer ||
          String(
            fixer.service_id
          ) !==
            String(
              secondServiceId
            )
        ) {
          setMessage(
            tr(
              "Please select a fixer that matches Service 02.",
              "يرجى اختيار فني يتوافق مع الخدمة الثانية."
            )
          );


          setMessageType(
            "error"
          );


          return;
        }
      }
    }



    /* ========================================
       SEND REQUEST
    ======================================== */

    try {
      setIsSubmitting(
        true
      );


      const serviceItems = [
        {
          slot: 1,

          service_id:
            Number(
              serviceId
            ),

          technician_id:
            technicianId
              ? Number(
                  technicianId
                )
              : null,

          problem:
            problemValue,
        },
      ];


      if (
        secondServiceEnabled
      ) {
        serviceItems.push({
          slot: 2,

          service_id:
            Number(
              secondServiceId
            ),

          technician_id:
            secondTechnicianId
              ? Number(
                  secondTechnicianId
                )
              : null,

          problem:
            secondProblem.trim(),
        });
      }



      const formData =
        new FormData();


      formData.append(
        "services",

        JSON.stringify(
          serviceItems
        )
      );


      formData.append(
        "phone",
        phoneValue
      );



      firstImages.forEach(
        (image) => {
          formData.append(
            "service_1_images",
            image,
            image.name
          );
        }
      );



      if (
        secondServiceEnabled
      ) {
        secondImages.forEach(
          (image) => {
            formData.append(
              "service_2_images",
              image,
              image.name
            );
          }
        );
      }



      const response =
        await fetch(
          "/api/requests",
          {
            method:
              "POST",

            credentials:
              "same-origin",

            body:
              formData,
          }
        );


      const result =
        await response.json();



      if (
        response.status ===
        401
      ) {
        localStorage.removeItem(
          "isLoggedIn"
        );


        setCurrentUser(
          null
        );


        openLoginRequired();


        return;
      }



      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            result.message ||
            tr(
              "Request failed.",
              "فشل إرسال الطلب."
            )
        );
      }



      /* ========================================
         SUCCESS
      ======================================== */

      setMessage("");
      setMessageType("");


      setShowSuccess(
        true
      );



      /* ========================================
         RESET
      ======================================== */

      setCustomerName(
        String(
          currentUser?.name ||
            currentUser?.username ||
            ""
        ).trim()
      );


      setPhone(
        String(
          currentUser?.phone ||
            phoneValue ||
            ""
        ).trim()
      );


      setServiceId("");
      setTechnicianId("");
      setProblem("");
      setFirstImages([]);


      setSecondServiceEnabled(
        false
      );

      setSecondServiceId("");
      setSecondTechnicianId("");
      setSecondProblem("");
      setSecondImages([]);


      sessionStorage.removeItem(
        "requestDraft"
      );


      delete window
        .__fixerRequestImageDraft;
    }

    catch (error) {
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


      setMessageType(
        "error"
      );
    }

    finally {
      setIsSubmitting(
        false
      );
    }
  }



  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="request-page"
    >
      <section className="request-main-section">
        <div className="request-container request-grid">


          {/* ========================================
              LEFT
          ======================================== */}

          <div className="request-copy">
            <p
              className="request-label request-reveal"
              data-request-reveal
            >
              <RequestSmallLabelEffect
                text={tr(
                  "REQUEST A SERVICE",
                  "اطلب خدمة"
                )}
              />
            </p>


            <h1 className="request-static-title">
              {tr(
                "Tell us what needs ",
                "أخبرنا بما يحتاج "
              )}

              <span className="request-dia-text">
                <span className="request-dia-text-base">
                  {tr(
                    "fixing",
                    "إصلاحه"
                  )}
                </span>
              </span>
            </h1>


            <p
              className="request-intro request-reveal"
              data-request-reveal
              style={{
                "--request-delay":
                  "150ms",
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



          {/* ========================================
              FORM
          ======================================== */}

          <div
            className="request-form-card request-reveal"
            data-request-reveal
            style={{
              "--request-delay":
                "100ms",
            }}
          >
            <div className="request-form-heading">
              <p className="request-label">
                <RequestSmallLabelEffect
                  text={tr(
                    "SERVICE DETAILS",
                    "تفاصيل الخدمة"
                  )}
                />
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



            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="request-form-grid-two">
                <FormGroup
                  label={tr(
                    "Your Name",
                    "اسمك"
                  )}
                >
                  <input
                    type="text"
                    value={
                      customerName
                    }
                    required
                    minLength={2}
                    maxLength={60}
                    autoComplete="name"
                    onChange={(
                      event
                    ) =>
                      setCustomerName(
                        event.target
                          .value
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
                    value={
                      phone
                    }
                    required
                    inputMode="numeric"
                    pattern="05[0-9]{8}"
                    autoComplete="tel"
                    onChange={(
                      event
                    ) =>
                      setPhone(
                        event.target
                          .value
                      )
                    }
                    placeholder="05XXXXXXXX"
                    maxLength={10}
                  />
                </FormGroup>
              </div>



              {/* SERVICE 01 */}

              <div
                className={`request-service-block ${
                  secondServiceEnabled
                    ? ""
                    : "is-single"
                }`}
              >
                {secondServiceEnabled && (
                  <div className="request-service-block-head">
                    <div>
                      <span className="request-service-number">
                        {tr(
                          "SERVICE 01",
                          "الخدمة 01"
                        )}
                      </span>


                      <h3>
                        {tr(
                          "First service",
                          "الخدمة الأولى"
                        )}
                      </h3>
                    </div>
                  </div>
                )}



                <FormGroup
                  label={tr(
                    "Service",
                    "الخدمة"
                  )}
                >
                  <select
                    value={
                      serviceId
                    }
                    required
                    onChange={
                      handleServiceChange
                    }
                    disabled={
                      isLoading
                    }
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
                          key={
                            service.id
                          }
                          value={
                            service.id
                          }
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



                <FixerPickerField
                  technician={
                    selectedTechnician
                  }
                  hasTechnicianId={
                    Boolean(
                      technicianId
                    )
                  }
                  onFind={() =>
                    openFixerPicker(
                      1
                    )
                  }
                  onChange={() =>
                    openFixerPicker(
                      1
                    )
                  }
                  onView={() =>
                    openSelectedFixerProfile(
                      selectedTechnician,
                      1
                    )
                  }
                  tr={tr}
                  language={
                    language
                  }
                />



                <FormGroup
                  label={tr(
                    "Describe the Problem",
                    "صف المشكلة"
                  )}
                >
                  <textarea
                    rows="5"
                    value={
                      problem
                    }
                    required
                    minLength={
                      10
                    }
                    maxLength={
                      1000
                    }
                    onChange={(
                      event
                    ) =>
                      setProblem(
                        event.target
                          .value
                      )
                    }
                    placeholder={tr(
                      "Tell us what is wrong...",
                      "أخبرنا ما المشكلة..."
                    )}
                  />
                </FormGroup>



                <ImageUploadField
                  label={tr(
                    "Photos",
                    "الصور"
                  )}
                  helper={tr(
                    "Optional · Up to 3 images · JPG, PNG or WebP · Max 1.5 MB each",
                    "اختياري · حتى 3 صور · JPG أو PNG أو WebP · الحد 1.5 ميجابايت لكل صورة"
                  )}
                  images={
                    firstImages
                  }
                  onChange={(
                    event
                  ) =>
                    validateAndAddImages(
                      event,
                      firstImages,
                      setFirstImages
                    )
                  }
                  onRemove={(
                    index
                  ) =>
                    removeImage(
                      index,
                      firstImages,
                      setFirstImages
                    )
                  }
                  tr={tr}
                />
              </div>



              {/* SERVICE 02 */}

              {secondServiceEnabled ? (
                <div className="request-service-block request-service-block-second">
                  <div className="request-service-block-head">
                    <div>
                      <span className="request-service-number">
                        {tr(
                          "SERVICE 02",
                          "الخدمة 02"
                        )}
                      </span>


                      <h3>
                        {tr(
                          "Second service",
                          "الخدمة الثانية"
                        )}
                      </h3>
                    </div>


                    <button
                      type="button"
                      className="request-remove-service"
                      onClick={
                        removeSecondService
                      }
                    >
                      <i className="fa-solid fa-xmark"></i>

                      {tr(
                        "Remove",
                        "إزالة"
                      )}
                    </button>
                  </div>



                  <FormGroup
                    label={tr(
                      "Service",
                      "الخدمة"
                    )}
                  >
                    <select
                      value={
                        secondServiceId
                      }
                      required
                      onChange={
                        handleSecondServiceChange
                      }
                      disabled={
                        isLoading
                      }
                    >
                      <option value="">
                        {tr(
                          "Select another service",
                          "اختر خدمة أخرى"
                        )}
                      </option>


                      {services
                        .filter(
                          (
                            service
                          ) =>
                            String(
                              service.id
                            ) !==
                            String(
                              serviceId
                            )
                        )
                        .map(
                          (
                            service
                          ) => (
                            <option
                              key={
                                service.id
                              }
                              value={
                                service.id
                              }
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



                  <FixerPickerField
                    technician={
                      secondSelectedTechnician
                    }
                    hasTechnicianId={
                      Boolean(
                        secondTechnicianId
                      )
                    }
                    onFind={() =>
                      openFixerPicker(
                        2
                      )
                    }
                    onChange={() =>
                      openFixerPicker(
                        2
                      )
                    }
                    onView={() =>
                      openSelectedFixerProfile(
                        secondSelectedTechnician,
                        2
                      )
                    }
                    tr={tr}
                    language={
                      language
                    }
                  />



                  <FormGroup
                    label={tr(
                      "Describe the Problem",
                      "صف المشكلة"
                    )}
                  >
                    <textarea
                      rows="5"
                      value={
                        secondProblem
                      }
                      required
                      minLength={
                        10
                      }
                      maxLength={
                        1000
                      }
                      onChange={(
                        event
                      ) =>
                        setSecondProblem(
                          event.target
                            .value
                        )
                      }
                      placeholder={tr(
                        "Describe the second issue...",
                        "صف المشكلة الثانية..."
                      )}
                    />
                  </FormGroup>



                  <ImageUploadField
                    label={tr(
                      "Photos",
                      "الصور"
                    )}
                    helper={tr(
                      "Optional · Up to 3 images · JPG, PNG or WebP · Max 1.5 MB each",
                      "اختياري · حتى 3 صور · JPG أو PNG أو WebP · الحد 1.5 ميجابايت لكل صورة"
                    )}
                    images={
                      secondImages
                    }
                    onChange={(
                      event
                    ) =>
                      validateAndAddImages(
                        event,
                        secondImages,
                        setSecondImages
                      )
                    }
                    onRemove={(
                      index
                    ) =>
                      removeImage(
                        index,
                        secondImages,
                        setSecondImages
                      )
                    }
                    tr={tr}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="request-add-service"
                  onClick={() =>
                    setSecondServiceEnabled(
                      true
                    )
                  }
                >
                  <span className="request-add-service-icon">
                    <i className="fa-solid fa-plus"></i>
                  </span>


                  <span>
                    <strong>
                      {tr(
                        "Add another service",
                        "إضافة خدمة أخرى"
                      )}
                    </strong>


                    <small>
                      {tr(
                        "Add one more service to the same request",
                        "أضف خدمة ثانية ضمن نفس الطلب"
                      )}
                    </small>
                  </span>
                </button>
              )}



              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isLoading ||
                  !authChecked
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



              {/* ERROR MESSAGE */}

              {message && (
                <div
                  className={`request-message ${messageType}`}
                >
                  <i className="fa-solid fa-circle-exclamation"></i>

                  <span>
                    {message}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>



      {/* ========================================
          LOGIN REQUIRED POPUP
      ======================================== */}

      {showLoginRequired && (
        <div
          className="login-required-overlay"
          onClick={() =>
            setShowLoginRequired(
              false
            )
          }
        >
          <div
            className="login-required-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-required-title"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="login-required-close"
              onClick={() =>
                setShowLoginRequired(
                  false
                )
              }
              aria-label={tr(
                "Close",
                "إغلاق"
              )}
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
                  setShowLoginRequired(
                    false
                  )
                }
              >
                {tr(
                  "Keep Browsing",
                  "متابعة التصفح"
                )}
              </button>


              <button
                type="button"
                className="login-required-login"
                onClick={
                  handleLoginFromModal
                }
              >
                <span>
                  {tr(
                    "Log In to Continue",
                    "تسجيل الدخول والمتابعة"
                  )}
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



      {/* ========================================
          SUCCESS POPUP
      ======================================== */}

      {showSuccess && (
        <div
          className="request-success-overlay"
          onClick={() =>
            setShowSuccess(
              false
            )
          }
        >
          <div
            className="request-success-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-success-title"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="request-success-icon">
              <i className="fa-solid fa-check"></i>
            </div>


            <p className="request-success-kicker">
              {tr(
                "REQUEST SENT",
                "تم إرسال الطلب"
              )}
            </p>


            <h3 id="request-success-title">
              {tr(
                "Request Submitted!",
                "تم إرسال طلبك!"
              )}
            </h3>


            <p className="request-success-copy">
              {tr(
                "Your service request was created successfully. Would you like to view your requests?",
                "تم إنشاء طلب الخدمة بنجاح. هل ترغب في عرض طلباتك؟"
              )}
            </p>


            <div className="request-success-actions">
              <button
                type="button"
                className="request-success-stay"
                onClick={() =>
                  setShowSuccess(
                    false
                  )
                }
              >
                {tr(
                  "Stay Here",
                  "البقاء هنا"
                )}
              </button>


              <button
                type="button"
                className="request-success-view"
                onClick={() => {
                  setShowSuccess(
                    false
                  );

                  navigate(
                    "/my-requests"
                  );
                }}
              >
                <span>
                  {tr(
                    "View My Requests",
                    "عرض طلباتي"
                  )}
                </span>


                <i
                  className={`fa-solid ${
                    isArabic
                      ? "fa-arrow-left"
                      : "fa-arrow-right"
                  }`}
                ></i>
              </button>
            </div>
          </div>
        </div>
      )}


      <Footer />
    </main>
  );
}



/* ========================================
   FIXER PICKER
======================================== */

function FixerPickerField({
  technician,
  hasTechnicianId,
  onFind,
  onChange,
  onView,
  tr,
  language,
}) {
  if (!technician) {
    return (
      <div className="request-fixer-field">
        <div className="request-fixer-field-label">
          <label>
            {tr(
              "Fixer",
              "الفني"
            )}
          </label>


          <span>
            {tr(
              "Compare ratings, prices and profiles before choosing.",
              "قارن التقييمات والأسعار والملفات قبل الاختيار."
            )}
          </span>
        </div>


        <button
          type="button"
          className="request-find-fixer-button"
          onClick={
            onFind
          }
        >
          <span className="request-find-fixer-icon">
            <i className="fa-solid fa-user-magnifying-glass"></i>
          </span>


          <span>
            <strong>
              {hasTechnicianId
                ? tr(
                    "Loading selected fixer...",
                    "جارٍ تحميل الفني المختار..."
                  )
                : tr(
                    "Find a Fixer",
                    "اختر فنيًا"
                  )}
            </strong>


            <small>
              {tr(
                "See ratings, price and availability",
                "شاهد التقييم والسعر والتوفر"
              )}
            </small>
          </span>


          <i
            className={`fa-solid ${
              language === "ar"
                ? "fa-arrow-left"
                : "fa-arrow-right"
            } request-find-fixer-arrow`}
          ></i>
        </button>
      </div>
    );
  }


  return (
    <div className="request-fixer-field">
      <div className="request-fixer-field-label">
        <label>
          {tr(
            "Selected Fixer",
            "الفني المختار"
          )}
        </label>


        <span>
          {tr(
            "You can view the profile or change your selection.",
            "يمكنك عرض الملف أو تغيير اختيارك."
          )}
        </span>
      </div>


      <div className="request-selected-fixer">
        <div className="request-selected-fixer-avatar">
          {getInitials(
            technician.name
          )}
        </div>


        <div className="request-selected-fixer-copy">
          <div className="request-selected-fixer-name">
            <strong>
              {technician.name}
            </strong>


            <span className="request-selected-fixer-rating">
              <i className="fa-solid fa-star"></i>

              {Number(
                technician.rating ||
                  0
              ).toFixed(1)}
            </span>
          </div>


          <span>
            {translateServiceName(
              technician.service_name,
              language
            )}
          </span>


          <div className="request-selected-fixer-meta">
            <span>
              {Number(
                technician.price ??
                  technician.starting_price ??
                  0
              ).toFixed(0)}{" "}

              {tr(
                "SAR",
                "ر.س"
              )}
            </span>


            <span className="request-selected-fixer-dot">
              •
            </span>


            <span
              className={
                Number(
                  technician.available
                ) === 1
                  ? "is-available"
                  : "is-unavailable"
              }
            >
              {Number(
                technician.available
              ) === 1
                ? tr(
                    "Available",
                    "متاح"
                  )
                : tr(
                    "Unavailable",
                    "غير متاح"
                  )}
            </span>
          </div>
        </div>


        <div className="request-selected-fixer-actions">
          <button
            type="button"
            onClick={
              onView
            }
          >
            {tr(
              "View Profile",
              "عرض الملف"
            )}
          </button>


          <button
            type="button"
            onClick={
              onChange
            }
          >
            {tr(
              "Change",
              "تغيير"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}



/* ========================================
   IMAGE UPLOAD
======================================== */

function ImageUploadField({
  label,
  helper,
  images,
  onChange,
  onRemove,
  tr,
}) {
  return (
    <div className="request-image-field">
      <div className="request-image-field-label">
        <label>
          {label}
        </label>

        <span>
          {helper}
        </span>
      </div>


      <label className="request-image-dropzone">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={
            onChange
          }
        />


        <span className="request-image-dropzone-icon">
          <i className="fa-regular fa-image"></i>
        </span>


        <span>
          <strong>
            {tr(
              "Add photos",
              "إضافة صور"
            )}
          </strong>


          <small>
            {tr(
              "Show the fixer more details about the problem",
              "ساعد الفني على رؤية تفاصيل المشكلة"
            )}
          </small>
        </span>
      </label>


      {images.length > 0 && (
        <div className="request-image-list">
          {images.map(
            (
              image,
              index
            ) => (
              <div
                className="request-image-chip"
                key={`${image.name}-${image.size}-${index}`}
              >
                <span className="request-image-chip-icon">
                  <i className="fa-regular fa-file-image"></i>
                </span>


                <span className="request-image-chip-copy">
                  <strong
                    title={
                      image.name
                    }
                  >
                    {image.name}
                  </strong>


                  <small>
                    {formatFileSize(
                      image.size
                    )}
                  </small>
                </span>


                <button
                  type="button"
                  aria-label={tr(
                    "Remove image",
                    "حذف الصورة"
                  )}
                  onClick={() =>
                    onRemove(
                      index
                    )
                  }
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}



/* ========================================
   FORM GROUP
======================================== */

function FormGroup({
  label,
  children,
}) {
  return (
    <div className="request-form-group">
      <label>
        {label}
      </label>

      {children}
    </div>
  );
}



/* ========================================
   BENEFIT
======================================== */

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
        "--request-delay":
          delay,
      }}
    >
      <div className="request-benefit-icon">
        <i className={icon}></i>
      </div>


      <div>
        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>
      </div>
    </div>
  );
}



/* ========================================
   HELPERS
======================================== */

function getInitials(
  name
) {
  if (!name) {
    return "FX";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word[0]
    )
    .join("")
    .toUpperCase();
}



function formatFileSize(
  bytes
) {
  if (
    !Number.isFinite(
      bytes
    )
  ) {
    return "";
  }


  if (
    bytes <
    1024 * 1024
  ) {
    return `${Math.max(
      1,
      Math.round(
        bytes / 1024
      )
    )} KB`;
  }


  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(1)} MB`;
}



function translateServiceName(
  name,
  language
) {
  if (
    language !== "ar"
  ) {
    return name;
  }


  const names = {
    "AC & Cooling":
      "التكييف والتبريد",

    Plumbing:
      "السباكة",

    Electrical:
      "الكهرباء",

    Appliances:
      "الأجهزة المنزلية",

    Furniture:
      "الأثاث",

    "Carpentry & Furniture":
      "النجارة والأثاث",

    General:
      "الصيانة العامة",

    "General Maintenance":
      "الصيانة العامة",
  };


  return (
    names[name] ||
    name
  );
}


export default Request;