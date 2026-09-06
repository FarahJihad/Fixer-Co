const servicesContainer = document.getElementById("servicesContainer");
const techniciansContainer = document.getElementById("techniciansContainer");
const problemForm = document.getElementById("problemForm");
const problemInput = document.getElementById("problemInput");
const quickSearchButtons = document.querySelectorAll(".quick-search");


/* =========================
   SERVICE ICONS
========================= */

const serviceIcons = {
  1: '<i class="fa-solid fa-snowflake"></i>',
  2: '<i class="fa-solid fa-droplet"></i>',
  3: '<i class="fa-solid fa-bolt"></i>',
  4: '<i class="fa-solid fa-screwdriver-wrench"></i>',
  5: '<i class="fa-solid fa-hammer"></i>',
  6: '<i class="fa-solid fa-house"></i>'
};


/* =========================
   LOAD SERVICES - HOME
========================= */

async function loadServices() {

  if (!servicesContainer) return;

  try {

    const response = await fetch("/api/services");

    if (!response.ok) {
      throw new Error("Failed to load services");
    }

    const services = await response.json();

    servicesContainer.innerHTML = "";

    services.forEach((service) => {

      const card = document.createElement("article");

      card.classList.add("service-card");

      card.innerHTML = `
        <div class="service-icon">

          ${
            serviceIcons[service.id] ||
            '<i class="fa-solid fa-wrench"></i>'
          }

        </div>

        <h3>
          ${service.name}
        </h3>

        <p>
          Find trusted professionals for
          ${service.name.toLowerCase()}.
        </p>
      `;

      card.addEventListener("click", () => {

        window.location.href =
          `technicians.html?service=${service.id}`;

      });

      servicesContainer.appendChild(card);

    });

  } catch (error) {

    console.error(
      "Error loading services:",
      error
    );

    servicesContainer.innerHTML = `
      <p class="loading">
        Could not load services.
      </p>
    `;

  }

}


/* =========================
   LOAD SERVICES - SERVICES PAGE
========================= */

async function loadServicesPage() {

  const servicesPageContainer =
    document.getElementById(
      "servicesPageContainer"
    );

  if (!servicesPageContainer) return;

  try {

    const response =
      await fetch("/api/services");

    if (!response.ok) {

      throw new Error(
        "Failed to load services"
      );

    }

    const services =
      await response.json();

    servicesPageContainer.innerHTML = "";

    services.forEach((service) => {

      const card =
        document.createElement("article");

      card.classList.add(
        "service-card"
      );

      card.innerHTML = `

        <div class="service-icon">

          ${
            serviceIcons[service.id] ||
            '<i class="fa-solid fa-wrench"></i>'
          }

        </div>

        <h3>
          ${service.name}
        </h3>

        <p>
          Find trusted professionals for
          ${service.name.toLowerCase()}.
        </p>

      `;

      card.addEventListener(
        "click",
        () => {

          window.location.href =
            `technicians.html?service=${service.id}`;

        }
      );

      servicesPageContainer.appendChild(
        card
      );

    });

  } catch (error) {

    console.error(
      "Error loading services page:",
      error
    );

    servicesPageContainer.innerHTML = `
      <p class="loading">
        Could not load services.
      </p>
    `;

  }

}


/* =========================
   LOAD TOP FIXERS - HOME
========================= */

async function loadTopFixers() {

  if (!techniciansContainer) return;

  try {

    const response =
      await fetch("/api/technicians");

    if (!response.ok) {

      throw new Error(
        "Failed to load technicians"
      );

    }

    const technicians =
      await response.json();

    techniciansContainer.innerHTML = "";

    const topFixers = technicians
      .sort(
        (a, b) =>
          Number(b.rating) -
          Number(a.rating)
      )
      .slice(0, 3);

    topFixers.forEach(
      (technician) => {

        const initials =
          technician.name
            .split(" ")
            .map(
              (word) => word[0]
            )
            .join("")
            .substring(0, 2);

        const isAvailable =
          Number(
            technician.available
          ) === 1;

        const availabilityText =
          isAvailable
            ? "Available now"
            : "Currently unavailable";

        const availabilityClass =
          isAvailable
            ? "available"
            : "unavailable";

        const card =
          document.createElement(
            "article"
          );

        card.classList.add(
          "technician-card"
        );

        card.innerHTML = `

          <div class="technician-top">

            <div class="technician-avatar">

              ${initials}

            </div>

            <div>

              <p class="technician-name">

                ${technician.name}

                <span class="verified">

                  <i
                    class="fa-solid fa-circle-check"
                  ></i>

                </span>

              </p>

              <p class="technician-service">

                ${technician.service_name}

              </p>

            </div>

          </div>

          <div class="technician-info">

            <span>

              <i
                class="fa-solid fa-star"
              ></i>

              ${Number(
                technician.rating
              ).toFixed(1)}

            </span>

            <span>

              <i
                class="fa-solid fa-location-dot"
              ></i>

              ${technician.location}

            </span>

            <span
              class="${availabilityClass}"
            >

              <i
                class="fa-solid fa-circle"
              ></i>

              ${availabilityText}

            </span>

          </div>

          <div class="technician-footer">

            <div class="price">

              <strong>

                ${Number(
                  technician.price
                ).toFixed(0)} SAR

              </strong>

              <span>
                starting price
              </span>

            </div>

            <button
              type="button"
              class="request-tech-button"
            >

              View Profile

            </button>

          </div>

        `;

        const profileButton =
          card.querySelector(
            ".request-tech-button"
          );

        profileButton.addEventListener(
          "click",
          () => {

            window.location.href =
              `profile.html?id=${technician.id}`;

          }
        );

        techniciansContainer.appendChild(
          card
        );

      }
    );

  } catch (error) {

    console.error(
      "Error loading technicians:",
      error
    );

    techniciansContainer.innerHTML = `
      <p class="loading">
        Could not load fixers.
      </p>
    `;

  }

}


/* =========================
   SMART PROBLEM SEARCH
========================= */

function detectService(problem) {

  const text =
    problem.toLowerCase();

  const keywords = {

    1: [
      "ac",
      "air conditioner",
      "cooling",
      "cold",
      "مكيف",
      "تبريد"
    ],

    2: [
      "water",
      "leak",
      "pipe",
      "sink",
      "plumbing",
      "موية",
      "ماء",
      "تسريب"
    ],

    3: [
      "electric",
      "electricity",
      "power",
      "light",
      "socket",
      "كهرباء",
      "لمبة"
    ],

    4: [
      "washing machine",
      "washer",
      "fridge",
      "refrigerator",
      "oven",
      "appliance",
      "غسالة",
      "ثلاجة"
    ],

    5: [
      "door",
      "cabinet",
      "wood",
      "furniture",
      "carpentry",
      "باب",
      "خزانة",
      "نجارة"
    ]

  };

  for (const serviceId in keywords) {

    const found =
      keywords[serviceId].some(
        (keyword) =>
          text.includes(keyword)
      );

    if (found) {

      return serviceId;

    }

  }

  return null;

}


/* =========================
   HOME SEARCH FORM
========================= */

if (problemForm) {

  problemForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const problem =
        problemInput.value.trim();

      if (!problem) return;

      const serviceId =
        detectService(problem);

      if (!serviceId) {

        showUnknownServicePopup(problem);

        return;

      }

      window.location.href =
        `technicians.html?service=${serviceId}&problem=${encodeURIComponent(problem)}`;

    }
  );

}


/* =========================
   UNKNOWN SERVICE POPUP
========================= */

function showUnknownServicePopup(problem) {

  const oldPopup =
    document.getElementById(
      "unknownServicePopup"
    );

  if (oldPopup) {
    oldPopup.remove();
  }

  const popup =
    document.createElement("div");

  popup.id =
    "unknownServicePopup";

  popup.className =
    "service-popup-overlay";

  popup.innerHTML = `

    <div class="service-popup">

      <button
        type="button"
        class="service-popup-close"
        aria-label="Close popup"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

      <div class="service-popup-icon">

        <i class="fa-solid fa-circle-question"></i>

      </div>

      <h2>
        We couldn't identify the service
      </h2>

      <p>
        Sorry, we couldn't clearly understand
        which service matches your problem.
      </p>

      <p class="service-popup-help">
        You can send us a service request with
        more details and we'll help you find
        the right Fixer.
      </p>

      <div class="service-popup-actions">

        <button
          type="button"
          class="popup-try-again"
        >
          Try Again
        </button>

        <a
          href="request.html?problem=${encodeURIComponent(problem)}"
          class="popup-request-service"
        >

          Request Service

          <i class="fa-solid fa-arrow-right"></i>

        </a>

      </div>

    </div>

  `;

  document.body.appendChild(
    popup
  );

  const closeButton =
    popup.querySelector(
      ".service-popup-close"
    );

  const tryAgainButton =
    popup.querySelector(
      ".popup-try-again"
    );

  closeButton.addEventListener(
    "click",
    () => {

      popup.remove();

    }
  );

  tryAgainButton.addEventListener(
    "click",
    () => {

      popup.remove();

      problemInput.focus();

      problemInput.select();

    }
  );

  popup.addEventListener(
    "click",
    (event) => {

      if (
        event.target === popup
      ) {

        popup.remove();

      }

    }
  );

}


/* =========================
   QUICK SEARCH
========================= */

quickSearchButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const serviceId =
          button.dataset.service;

        window.location.href =
          `technicians.html?service=${serviceId}`;

      }
    );

  }
);


/* =========================
   FIND A FIXER PAGE
========================= */

async function loadAllTechniciansPage() {

  const container =
    document.getElementById(
      "allTechniciansContainer"
    );

  if (!container) return;


  const serviceFilter =
    document.getElementById(
      "filterService"
    );

  const availabilityFilter =
    document.getElementById(
      "filterAvailability"
    );

  const sortFilter =
    document.getElementById(
      "filterSort"
    );

  const useLocationButton =
    document.getElementById(
      "useLocationButton"
    );

  const clearFiltersButton =
    document.getElementById(
      "clearFilters"
    );

  const fixerCount =
    document.getElementById(
      "fixerCount"
    );

  const resultsTitle =
    document.getElementById(
      "fixerResultsTitle"
    );

  const locationStatus =
    document.getElementById(
      "locationStatus"
    );


  let services = [];
  let technicians = [];

  let customerLocation = null;


  /* =========================
     LOAD SERVICES
  ========================= */

  try {

    const servicesResponse =
      await fetch("/api/services");


    if (!servicesResponse.ok) {

      throw new Error(
        "Could not load services"
      );

    }


    services =
      await servicesResponse.json();


    services.forEach(
      (service) => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          service.id;

        option.textContent =
          service.name;

        serviceFilter.appendChild(
          option
        );

      }
    );


  } catch (error) {

    console.error(
      "Error loading services:",
      error
    );

  }


  /* =========================
     READ URL FILTERS
  ========================= */

  const params =
    new URLSearchParams(
      window.location.search
    );


  const serviceFromURL =
    params.get("service");


  const availableFromURL =
    params.get("available");


  serviceFilter.value =
    serviceFromURL || "";


  availabilityFilter.value =
    availableFromURL === "true"
      ? "available"
      : "";


  sortFilter.value =
    "recommended";


  /* =========================
     FETCH FIXERS
  ========================= */

  async function fetchTechnicians() {

    container.innerHTML = `
      <p class="loading">
        Loading Fixers...
      </p>
    `;


    fixerCount.textContent =
      "Loading...";


    const query =
      new URLSearchParams();


    if (serviceFilter.value) {

      query.set(
        "service",
        serviceFilter.value
      );

    }


    if (sortFilter.value) {

      query.set(
        "sort",
        sortFilter.value
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


    try {

      const response =
        await fetch(url);


      if (!response.ok) {

        throw new Error(
          "Could not load technicians"
        );

      }


      technicians =
        await response.json();


      renderTechnicians();


    } catch (error) {

      console.error(
        "Error loading technicians page:",
        error
      );


      container.innerHTML = `
        <p class="loading">
          Could not load Fixers.
        </p>
      `;


      fixerCount.textContent =
        "Could not load results";

    }

  }


  /* =========================
     RENDER FIXERS
  ========================= */

  function renderTechnicians() {

    let filteredTechnicians =
      [...technicians];


    /* Availability filter */

    if (
      availabilityFilter.value ===
      "available"
    ) {

      filteredTechnicians =
        filteredTechnicians.filter(
          (technician) =>

            Number(
              technician.available
            ) === 1
        );

    }


    /* Page title */

    const selectedService =
      services.find(
        (service) =>

          String(service.id) ===
          String(serviceFilter.value)
      );


    if (selectedService) {

      resultsTitle.textContent =
        customerLocation
          ? `${selectedService.name} Fixers Near You`
          : `${selectedService.name} Fixers`;

    } else {

      resultsTitle.textContent =
        customerLocation
          ? "Fixers Near You"
          : "All Fixers";

    }


    /* Results count */

    fixerCount.textContent =
      `${filteredTechnicians.length} Fixer${
        filteredTechnicians.length === 1
          ? ""
          : "s"
      } found`;


    container.innerHTML = "";


    /* No results */

    if (
      filteredTechnicians.length === 0
    ) {

      container.innerHTML = `

        <div class="no-results">

          <i
            class="fa-solid fa-magnifying-glass"
          ></i>

          <h3>
            No Fixers found
          </h3>

          <p>
            Try changing your filters.
          </p>

        </div>

      `;

      return;

    }


    /* Create Fixer cards */

    filteredTechnicians.forEach(
      (technician, index) => {


        const initials =
          technician.name
            .split(" ")
            .map(
              (word) => word[0]
            )
            .join("")
            .substring(0, 2);


        const isAvailable =
          Number(
            technician.available
          ) === 1;


        const availabilityClass =
          isAvailable
            ? "available"
            : "unavailable";


        const availabilityText =
          isAvailable
            ? "Available now"
            : "Currently unavailable";


        /* =========================
           DISTANCE
        ========================= */

        const hasDistance =
          technician.distance !== null &&
          technician.distance !== undefined &&
          technician.distance !== "";


        const distanceText =
          hasDistance
            ? `
              <span class="technician-distance">

                <i class="fa-solid fa-route"></i>

                ${Number(
                  technician.distance
                ).toFixed(1)} km away

              </span>
            `
            : "";


        /* =========================
           BEST MATCH
        ========================= */

        const showBestMatch =
          customerLocation &&
          sortFilter.value ===
            "recommended" &&
          index === 0;


        const bestMatchBadge =
          showBestMatch
            ? `
              <span class="best-match-badge">

                <i class="fa-solid fa-sparkles"></i>

                Best Match

              </span>
            `
            : "";


        /* =========================
           CREATE CARD
        ========================= */

        const card =
          document.createElement(
            "article"
          );


        card.classList.add(
          "technician-card"
        );


        if (showBestMatch) {

          card.classList.add(
            "best-match-card"
          );

        }


        card.innerHTML = `

          ${bestMatchBadge}


          <div class="technician-top">

            <div class="technician-avatar">

              ${initials}

            </div>


            <div>

              <p class="technician-name">

                ${technician.name}


                <span class="verified">

                  <i
                    class="fa-solid fa-circle-check"
                  ></i>

                </span>

              </p>


              <p class="technician-service">

                ${technician.service_name}

              </p>

            </div>

          </div>


          <div class="technician-info">


            <span>

              <i
                class="fa-solid fa-star"
              ></i>

              ${Number(
                technician.rating
              ).toFixed(1)}

            </span>


            <span>

              <i
                class="fa-solid fa-location-dot"
              ></i>

              ${technician.location}

            </span>


            ${distanceText}


            <span
              class="${availabilityClass}"
            >

              <i
                class="fa-solid fa-circle"
              ></i>

              ${availabilityText}

            </span>


          </div>


          <div class="technician-footer">


            <div class="price">

              <strong>

                ${Number(
                  technician.price
                ).toFixed(0)} SAR

              </strong>


              <span>
                starting price
              </span>

            </div>


            <button
              type="button"
              class="request-tech-button"
            >

              View Profile

            </button>


          </div>

        `;


        /* Profile button */

        const profileButton =
          card.querySelector(
            ".request-tech-button"
          );


        profileButton.addEventListener(
          "click",
          () => {


            let profileUrl =
              `profile.html?id=${technician.id}`;


            /*
              Keep the customer's location
              when opening the Fixer profile.
            */

            if (customerLocation) {

              profileUrl +=
                `&lat=${encodeURIComponent(
                  customerLocation.latitude
                )}` +
                `&lng=${encodeURIComponent(
                  customerLocation.longitude
                )}`;

            }


            window.location.href =
              profileUrl;

          }
        );


        container.appendChild(
          card
        );

      }
    );

  }


  /* =========================
     GET USER LOCATION
  ========================= */

  function requestCustomerLocation() {


    /* Browser does not support location */

    if (!navigator.geolocation) {

      locationStatus.textContent =
        "Location is not supported by this browser.";


      locationStatus.className =
        "location-status error";


      return;

    }


    /* Loading state */

    useLocationButton.disabled =
      true;


    useLocationButton.innerHTML = `

      <i
        class="fa-solid fa-spinner fa-spin"
      ></i>

      Getting Location...

    `;


    locationStatus.textContent =
      "Waiting for location permission...";


    locationStatus.className =
      "location-status";


    /* Ask browser for permission */

    navigator.geolocation.getCurrentPosition(


      /* =========================
         LOCATION SUCCESS
      ========================= */

      async (position) => {


        customerLocation = {

          latitude:
            position.coords.latitude,

          longitude:
            position.coords.longitude

        };


        useLocationButton.disabled =
          false;


        useLocationButton.innerHTML = `

          <i
            class="fa-solid fa-location-crosshairs"
          ></i>

          Update Location

        `;


        useLocationButton.classList.add(
          "location-active"
        );


        locationStatus.innerHTML = `

          <i
            class="fa-solid fa-circle-check"
          ></i>

          Location enabled. Distances are now shown from your current location.

        `;


        locationStatus.className =
          "location-status success";


        /*
          Load Fixers again.
          This time latitude and longitude
          are sent to the backend.
        */

        await fetchTechnicians();

      },


      /* =========================
         LOCATION ERROR
      ========================= */

      (error) => {


        customerLocation =
          null;


        useLocationButton.disabled =
          false;


        useLocationButton.innerHTML = `

          <i
            class="fa-solid fa-location-crosshairs"
          ></i>

          Use My Location

        `;


        let message =
          "We could not access your location.";


        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {

          message =
            "Location permission was denied. You can still browse Fixers normally.";

        }

        else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {

          message =
            "Your location is currently unavailable.";

        }

        else if (
          error.code ===
          error.TIMEOUT
        ) {

          message =
            "Getting your location took too long. Please try again.";

        }


        locationStatus.textContent =
          message;


        locationStatus.className =
          "location-status error";


        /*
          Nearest cannot work without
          a customer location.
        */

        if (
          sortFilter.value ===
          "nearest"
        ) {

          sortFilter.value =
            "recommended";

        }

      },


      /* Location settings */

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }

    );

  }


  /* =========================
     SERVICE FILTER
  ========================= */

  serviceFilter.addEventListener(
    "change",
    async () => {


      const newUrl =
        new URL(
          window.location.href
        );


      if (serviceFilter.value) {

        newUrl.searchParams.set(
          "service",
          serviceFilter.value
        );

      } else {

        newUrl.searchParams.delete(
          "service"
        );

      }


      window.history.replaceState(
        {},
        "",
        `${newUrl.pathname}${newUrl.search}`
      );


      await fetchTechnicians();

    }
  );


  /* =========================
     AVAILABILITY FILTER
  ========================= */

  availabilityFilter.addEventListener(
    "change",
    renderTechnicians
  );


  /* =========================
     SORT FILTER
  ========================= */

  sortFilter.addEventListener(
    "change",
    async () => {


      /*
        Nearest needs the customer's
        current location.
      */

      if (
        sortFilter.value ===
          "nearest" &&
        !customerLocation
      ) {

        requestCustomerLocation();

        return;

      }


      await fetchTechnicians();

    }
  );


  /* =========================
     LOCATION BUTTON
  ========================= */

  useLocationButton.addEventListener(
    "click",
    requestCustomerLocation
  );


  /* =========================
     CLEAR FILTERS
  ========================= */

  clearFiltersButton.addEventListener(
    "click",
    async () => {


      serviceFilter.value =
        "";


      availabilityFilter.value =
        "";


      sortFilter.value =
        "recommended";


      customerLocation =
        null;


      useLocationButton.classList.remove(
        "location-active"
      );


      useLocationButton.disabled =
        false;


      useLocationButton.innerHTML = `

        <i
          class="fa-solid fa-location-crosshairs"
        ></i>

        Use My Location

      `;


      locationStatus.textContent =
        "";


      locationStatus.className =
        "location-status";


      window.history.replaceState(
        {},
        "",
        "technicians.html"
      );


      await fetchTechnicians();

    }
  );


  /* =========================
     INITIAL LOAD
  ========================= */

  await fetchTechnicians();

}

/* =========================
   TECHNICIAN PROFILE PAGE
========================= */

async function loadTechnicianProfile() {

  const profileContainer =
    document.getElementById("profileContainer");

  if (!profileContainer) return;

  const params =
    new URLSearchParams(window.location.search);

  const technicianId =
    params.get("id");

  if (!technicianId) {

    profileContainer.innerHTML = `
      <p class="loading">
        Technician not found.
      </p>
    `;

    return;
  }

  try {

    const response =
      await fetch(
        `/api/technicians/${technicianId}`
      );

    if (!response.ok) {

      throw new Error(
        "Technician not found"
      );

    }

    const technician =
      await response.json();

    const initials =
      technician.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2);

    const isAvailable =
      Number(technician.available) === 1;

    const availabilityClass =
      isAvailable
        ? "available"
        : "unavailable";

    const availabilityText =
      isAvailable
        ? "Available now"
        : "Currently unavailable";

    profileContainer.innerHTML = `

      <div class="profile-card">

        <!-- FIXER INFORMATION -->

        <div class="profile-main">

          <div class="profile-avatar">
            ${initials}
          </div>

          <div class="profile-details">

            <p class="section-label">
              FIXER PROFILE
            </p>

            <h1>

              ${technician.name}

              <span class="verified">

                <i
                  class="fa-solid fa-circle-check"
                ></i>

              </span>

            </h1>

            <p class="profile-specialty">
              ${technician.service_name}
            </p>

            <div class="profile-meta">

              <span>

                <i
                  class="fa-solid fa-star"
                ></i>

                ${Number(
                  technician.rating
                ).toFixed(1)}
                Rating

              </span>

              <span>

                <i
                  class="fa-solid fa-location-dot"
                ></i>

                ${technician.location}

              </span>

              <span
                class="${availabilityClass}"
              >

                <i
                  class="fa-solid fa-circle"
                ></i>

                ${availabilityText}

              </span>

              <span class="profile-price">

                <i
                  class="fa-solid fa-tag"
                ></i>

                From
                ${Number(
                  technician.price
                ).toFixed(0)}
                SAR

              </span>

            </div>

          </div>

        </div>

        <!-- ABOUT -->

        <div class="profile-about">

          <h2>
            About this Fixer
          </h2>

          <p>
            Experienced professional specializing in
            ${technician.service_name.toLowerCase()}.
            Provides reliable home maintenance services
            with a focus on quality and customer
            satisfaction.
          </p>

        </div>

        <!-- REVIEWS -->

        <div class="profile-reviews">

          <div class="reviews-heading">

            <div>

              <p class="section-label">
                CUSTOMER REVIEWS
              </p>

              <h2>
                What customers say
              </h2>

            </div>

            <span class="review-score">

              <i
                class="fa-solid fa-star"
              ></i>

              ${Number(
                technician.rating
              ).toFixed(1)}

            </span>

          </div>

          <div class="reviews-grid">

            <article class="review-card">

              <div class="review-top">

                <div class="review-avatar">
                  SA
                </div>

                <div>

                  <h3>
                    Sarah Ahmed
                  </h3>

                  <div class="review-stars">

                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>

                  </div>

                </div>

              </div>

              <p>
                Very professional and arrived on time.
                The issue was fixed quickly and everything
                was explained clearly.
              </p>

            </article>

            <article class="review-card">

              <div class="review-top">

                <div class="review-avatar">
                  MK
                </div>

                <div>

                  <h3>
                    Mohammed Khalid
                  </h3>

                  <div class="review-stars">

                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>

                  </div>

                </div>

              </div>

              <p>
                Great service and fair price.
                I would definitely request this fixer again.
              </p>

            </article>

          </div>

        </div>

        <!-- REQUEST AREA -->

        <div class="profile-request-area">

          <div>

            <p>
              Need this service?
            </p>

            <h2>
              Request ${technician.name}
            </h2>

          </div>

          <a
            href="request.html?technician=${technician.id}&service=${technician.service_id}"
            class="cta-button"
          >

            Request This Fixer

            <i
              class="fa-solid fa-arrow-right"
            ></i>

          </a>

        </div>

      </div>

    `;

  } catch (error) {

    console.error(
      "Error loading technician profile:",
      error
    );

    profileContainer.innerHTML = `
      <p class="loading">
        Could not load fixer profile.
      </p>
    `;

  }

}


/* =========================
   INITIAL LOAD
========================= */

loadServices();

loadServicesPage();

loadTopFixers();

loadAllTechniciansPage();

loadTechnicianProfile();


/* =========================
   REQUEST SERVICE PAGE
========================= */

async function loadRequestPage() {

  const requestForm =
    document.getElementById("requestForm");

  if (!requestForm) return;


  const customerName =
    document.getElementById("customerName");

  const phone =
    document.getElementById("phone");

  const serviceSelect =
    document.getElementById("serviceSelect");

  const technicianSelect =
    document.getElementById("technicianSelect");

  const problemDescription =
    document.getElementById("problemDescription");

  const formMessage =
    document.getElementById("formMessage");


  let technicians = [];


  try {

    const [
      servicesResponse,
      techniciansResponse
    ] = await Promise.all([

      fetch("/api/services"),

      fetch("/api/technicians")

    ]);


    if (
      !servicesResponse.ok ||
      !techniciansResponse.ok
    ) {

      throw new Error(
        "Could not load request data"
      );

    }


    const services =
      await servicesResponse.json();

    technicians =
      await techniciansResponse.json();


    /* =========================
       LOAD SERVICES
    ========================= */

    services.forEach((service) => {

      const option =
        document.createElement("option");

      option.value =
        service.id;

      option.textContent =
        service.name;

      serviceSelect.appendChild(option);

    });


    /* =========================
       LOAD TECHNICIANS
    ========================= */

    function updateTechnicians() {

      const selectedService =
        serviceSelect.value;


      technicianSelect.innerHTML = `
        <option value="">
          Select a fixer
        </option>
      `;


      let filteredTechnicians =
        technicians;


      if (selectedService) {

        filteredTechnicians =
          technicians.filter(
            (technician) =>

              String(
                technician.service_id
              ) ===

              String(
                selectedService
              )
          );

      }


      filteredTechnicians.forEach(
        (technician) => {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            technician.id;


          option.textContent =
            `${technician.name} — ${technician.service_name}`;


          technicianSelect.appendChild(
            option
          );

        }
      );

    }


    /* =========================
       READ URL
    ========================= */

    const params =
      new URLSearchParams(
        window.location.search
      );


    const serviceFromURL =
      params.get("service");


    const technicianFromURL =
      params.get("technician");


    const problemFromURL =
      params.get("problem");


    if (serviceFromURL) {

      serviceSelect.value =
        serviceFromURL;

    }


    updateTechnicians();


    if (technicianFromURL) {

      technicianSelect.value =
        technicianFromURL;

    }


    if (problemFromURL) {

      problemDescription.value =
        problemFromURL;

    }


    /* =========================
       SERVICE CHANGE
    ========================= */

    serviceSelect.addEventListener(
      "change",
      () => {

        updateTechnicians();

      }
    );


    /* =========================
       SUBMIT REQUEST
    ========================= */

    requestForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        formMessage.textContent = "";

        formMessage.className =
          "form-message";


        const nameValue =
          customerName.value.trim();


        const phoneValue =
          phone.value.trim();


        const problemValue =
          problemDescription.value.trim();


        const serviceValue =
          serviceSelect.value;


        const technicianValue =
          technicianSelect.value;


        if (
          !nameValue ||
          !phoneValue ||
          !problemValue ||
          !serviceValue
        ) {

          formMessage.textContent =
            "Please fill in all required fields.";

          formMessage.classList.add(
            "error"
          );

          return;

        }


        if (
          !/^05\d{8}$/.test(phoneValue)
        ) {

          formMessage.textContent =
            "Please enter a valid phone number starting with 05.";

          formMessage.classList.add(
            "error"
          );

          return;

        }


        try {

          const response =
            await fetch(
              "/api/requests",
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({

                  customer_name:
                    nameValue,

                  phone:
                    phoneValue,

                  problem:
                    problemValue,

                  service_id:
                    Number(serviceValue),

                  technician_id:
                    technicianValue
                      ? Number(
                          technicianValue
                        )
                      : null

                })

              }
            );


          const result =
            await response.json();


          if (!response.ok) {

            throw new Error(
              result.error ||
              "Request failed"
            );

          }


          formMessage.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Service request sent successfully!
            Request #${result.request_id}
          `;


          formMessage.classList.add(
            "success"
          );


          requestForm.reset();


          technicianSelect.innerHTML = `
            <option value="">
              Select a fixer
            </option>
          `;


        } catch (error) {

          console.error(
            "Request error:",
            error
          );


          formMessage.textContent =
            "Something went wrong. Please try again.";

          formMessage.classList.add(
            "error"
          );

        }

      }
    );


  } catch (error) {

    console.error(
      "Error loading request page:",
      error
    );


    formMessage.textContent =
      "Could not load services. Please refresh the page.";

    formMessage.classList.add(
      "error"
    );

  }

}


/* Start Request Page */

loadRequestPage();
/* =========================
   CONTACT PAGE
========================= */

function setupContactForm() {

  const contactForm =
    document.getElementById("contactForm");

  if (!contactForm) return;


  const contactName =
    document.getElementById("contactName");

  const contactEmail =
    document.getElementById("contactEmail");

  const contactSubject =
    document.getElementById("contactSubject");

  const contactMessage =
    document.getElementById("contactMessage");

  const formMessage =
    document.getElementById(
      "contactFormMessage"
    );


  contactForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (formMessage) {

        formMessage.textContent = "";

        formMessage.className =
          "form-message";

      }


      const nameValue =
        contactName
          ? contactName.value.trim()
          : "";

      const emailValue =
        contactEmail
          ? contactEmail.value.trim()
          : "";

      const subjectValue =
        contactSubject
          ? contactSubject.value.trim()
          : "";

      const messageValue =
        contactMessage
          ? contactMessage.value.trim()
          : "";


      if (
        !nameValue ||
        !emailValue ||
        !messageValue
      ) {

        if (formMessage) {

          formMessage.textContent =
            "Please fill in all required fields.";

          formMessage.classList.add(
            "error"
          );

        }

        return;

      }


      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailPattern.test(
          emailValue
        )
      ) {

        if (formMessage) {

          formMessage.textContent =
            "Please enter a valid email address.";

          formMessage.classList.add(
            "error"
          );

        }

        return;

      }


      try {

        const response =
          await fetch(
            "/api/contact",
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body: JSON.stringify({

                name:
                  nameValue,

                email:
                  emailValue,

                subject:
                  subjectValue,

                message:
                  messageValue

              })

            }
          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(
            result.error ||
            "Could not send message"
          );

        }


        if (formMessage) {

          formMessage.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Message sent successfully.
          `;

          formMessage.classList.add(
            "success"
          );

        }


        contactForm.reset();


      } catch (error) {

        console.error(
          "Contact form error:",
          error
        );


        if (formMessage) {

          formMessage.textContent =
            "Something went wrong. Please try again.";

          formMessage.classList.add(
            "error"
          );

        }

      }

    }
  );

}


setupContactForm();



/* =========================
   BECOME A FIXER PAGE
========================= */

async function setupFixerApplication() {

  const applicationForm =
    document.getElementById(
      "fixerApplicationForm"
    );

  if (!applicationForm) return;


  const fixerName =
    document.getElementById(
      "fixerName"
    );

  const fixerPhone =
    document.getElementById(
      "fixerPhone"
    );

  const fixerEmail =
    document.getElementById(
      "fixerEmail"
    );

  const fixerService =
    document.getElementById(
      "fixerService"
    );

  const fixerLocation =
    document.getElementById(
      "fixerLocation"
    );

  const fixerExperience =
    document.getElementById(
      "fixerExperience"
    );

  const fixerPrice =
    document.getElementById(
      "fixerPrice"
    );

  const fixerAvailability =
    document.getElementById(
      "fixerAvailability"
    );

  const fixerBio =
    document.getElementById(
      "fixerBio"
    );

  const fixerPolicy =
    document.getElementById(
      "fixerPolicy"
    );

  const applicationMessage =
    document.getElementById(
      "fixerApplicationMessage"
    );


  /* =========================
     LOAD SERVICES
  ========================= */

  try {

    const response =
      await fetch(
        "/api/services"
      );


    if (!response.ok) {

      throw new Error(
        "Could not load services"
      );

    }


    const services =
      await response.json();


    services.forEach(
      (service) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          service.id;


        option.textContent =
          service.name;


        fixerService.appendChild(
          option
        );

      }
    );


  } catch (error) {

    console.error(
      "Fixer services error:",
      error
    );

  }


  /* =========================
     SUBMIT APPLICATION
  ========================= */

  applicationForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      applicationMessage.textContent =
        "";

      applicationMessage.className =
        "form-message";


      const nameValue =
        fixerName.value.trim();

      const phoneValue =
        fixerPhone.value.trim();

      const emailValue =
        fixerEmail.value.trim();

      const serviceValue =
        fixerService.value;

      const locationValue =
        fixerLocation.value.trim();

      const experienceValue =
        fixerExperience.value;

      const priceValue =
        fixerPrice.value;

      const availabilityValue =
        fixerAvailability
          ? fixerAvailability.checked
          : true;

      const bioValue =
        fixerBio
          ? fixerBio.value.trim()
          : "";

      const policyAccepted =
        fixerPolicy.checked;


      /* =========================
         VALIDATION
      ========================= */

      if (
        !nameValue ||
        !phoneValue ||
        !emailValue ||
        !serviceValue ||
        !locationValue ||
        experienceValue === "" ||
        !priceValue
      ) {

        applicationMessage.textContent =
          "Please complete all required fields.";

        applicationMessage.classList.add(
          "error"
        );

        return;

      }


      if (
        !/^05\d{8}$/.test(
          phoneValue
        )
      ) {

        applicationMessage.textContent =
          "Please enter a valid Saudi phone number starting with 05.";

        applicationMessage.classList.add(
          "error"
        );

        return;

      }


      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailPattern.test(
          emailValue
        )
      ) {

        applicationMessage.textContent =
          "Please enter a valid email address.";

        applicationMessage.classList.add(
          "error"
        );

        return;

      }


      if (
        Number(experienceValue) < 0
      ) {

        applicationMessage.textContent =
          "Experience cannot be negative.";

        applicationMessage.classList.add(
          "error"
        );

        return;

      }


      if (
        Number(priceValue) <= 0
      ) {

        applicationMessage.textContent =
          "Please enter a valid starting price.";

        applicationMessage.classList.add(
          "error"
        );

        return;

      }


      if (!policyAccepted) {

        applicationMessage.textContent =
          "You must accept the Fixer.Co policy before submitting.";

        applicationMessage.classList.add(
          "error"
        );

        return;

      }


      try {

        const response =
          await fetch(
            "/api/fixer-applications",
            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body: JSON.stringify({

                name:
                  nameValue,

                phone:
                  phoneValue,

                email:
                  emailValue,

                service_id:
                  Number(
                    serviceValue
                  ),

                location:
                  locationValue,

                experience:
                  Number(
                    experienceValue
                  ),

                price:
                  Number(
                    priceValue
                  ),

                available:
                  availabilityValue,

                bio:
                  bioValue,

                policy_accepted:
                  policyAccepted

              })

            }
          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(
            result.error ||
            "Application failed"
          );

        }


        applicationMessage.innerHTML = `

          <i
            class="fa-solid fa-circle-check"
          ></i>

          Application submitted successfully.
          Your application is now under review.

        `;


        applicationMessage.classList.add(
          "success"
        );


        applicationForm.reset();


      } catch (error) {

        console.error(
          "Fixer application error:",
          error
        );


        applicationMessage.textContent =
          error.message ||
          "Something went wrong. Please try again.";


        applicationMessage.classList.add(
          "error"
        );

      }

    }
  );

}


setupFixerApplication();

/* =========================
   WEBSITE INTRO
========================= */

function startWebsiteIntro() {
  const intro = document.getElementById("siteIntro");
  const introText = document.getElementById("introText");
  const tagline = document.getElementById("introTagline");
  const cursor = document.querySelector(".intro-cursor");

  if (!intro || !introText || !tagline) {
    return;
  }

  const introStorageKey = "fixerIntroPlayed_v5";

  const introAlreadyPlayed =
    sessionStorage.getItem(introStorageKey);

  if (introAlreadyPlayed === "true") {
    intro.remove();
    return;
  }

  sessionStorage.setItem(
    introStorageKey,
    "true"
  );

  const brandText = "Fixer.Co";
  let currentIndex = 0;

  introText.textContent = "";

  function typeBrand() {
    if (currentIndex < brandText.length) {
      introText.textContent +=
        brandText[currentIndex];

      currentIndex++;

      setTimeout(
        typeBrand,
        140
      );

      return;
    }

    introText.innerHTML = `
      Fixer<span class="intro-green">.Co</span>
    `;

    setTimeout(() => {
      if (cursor) {
        cursor.classList.add("finished");
      }
    }, 250);

    setTimeout(() => {
      tagline.classList.add("show");
    }, 500);

    setTimeout(() => {
      intro.classList.add("hide");
    }, 2300);

    setTimeout(() => {
      intro.remove();
    }, 3100);
  }

  setTimeout(
    typeBrand,
    400
  );
}

startWebsiteIntro();

/* =========================
   SCROLL REVEAL
========================= */

const revealElements =
  document.querySelectorAll(
    ".reveal"
  );


if (
  revealElements.length > 0
) {

  const revealObserver =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "show"
              );


              revealObserver.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {

        threshold: 0.15

      }
    );


  revealElements.forEach(
    (element) => {

      revealObserver.observe(
        element
      );

    }
  );

}


/* =========================
   GLOBAL PAGE INTERACTIONS
   FIXER.CO
========================= */

function setupGlobalInteractions() {

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* =========================
     PAGE ENTER
  ========================= */

  document.body.classList.add(
    "page-ready"
  );


  /* =========================
     NAVBAR ENTER
  ========================= */

  const navbar =
    document.querySelector(".navbar");

  if (navbar) {

    requestAnimationFrame(() => {

      navbar.classList.add(
        "navbar-show"
      );

    });

  }


  /* =========================
     ELEMENT SELECTORS
  ========================= */

  const motionSelectors = [

    /* Home */
    ".hero-content",
    ".hero-side-card",
    ".search-category",
    ".service-card",
    ".technician-card",
    ".step",
    ".home-cta",

    /* Services */
    ".services-hero",
    ".services-page-header",

    /* Find a Fixer */
    ".filters",
    ".filter-bar",
    ".technicians-header",
    ".results-header",
    ".no-results",

    /* Profile */
    ".profile-main",
    ".profile-about",
    ".profile-reviews",
    ".profile-request-area",
    ".review-card",

    /* Request */
    "#requestForm",
    ".request-form",
    ".request-info",
    ".request-card",
    ".form-card",

    /* About */
    ".about-hero",
    ".about-section",
    ".about-card",
    ".mission-card",
    ".value-card",
    ".values-card",
    ".about-content",

    /* Contact */
    "#contactForm",
    ".contact-form",
    ".contact-info",
    ".contact-card",
    ".contact-details",

    /* Become a Fixer */
    "#fixerApplicationForm",
    ".fixer-form",
    ".fixer-info",
    ".fixer-benefit",
    ".benefit-card",
    ".policy-box",

    /* General */
    ".section-heading",
    ".center-heading",
    ".page-header",
    ".page-hero",
    ".info-card"

  ];


  const motionSelector =
    motionSelectors.join(",");


  /* =========================
     OBSERVER
  ========================= */

  const motionObserver =
    new IntersectionObserver(

      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "motion-show"
              );

              motionObserver.unobserve(
                entry.target
              );

            }

          }
        );

      },

      {

        threshold: 0.12,

        rootMargin:
          "0px 0px -35px 0px"

      }

    );


  /* =========================
     PREPARE ELEMENT
  ========================= */

  let globalMotionIndex = 0;


  function prepareMotionElement(
    element
  ) {

    if (
      !element ||
      element.classList.contains(
        "motion-ready"
      )
    ) {

      return;

    }


    element.classList.add(
      "motion-ready",
      "motion-item"
    );


    const delay =
      (globalMotionIndex % 6) * 75;


    element.style.setProperty(
      "--motion-delay",
      `${delay}ms`
    );


    /*
      Alternate movement direction
      for a more natural animation.
    */

    if (
      globalMotionIndex % 3 === 1
    ) {

      element.classList.add(
        "motion-from-left"
      );

    } else if (
      globalMotionIndex % 3 === 2
    ) {

      element.classList.add(
        "motion-from-right"
      );

    }


    globalMotionIndex++;


    if (
      prefersReducedMotion
    ) {

      element.classList.add(
        "motion-show"
      );

      return;

    }


    motionObserver.observe(
      element
    );

  }


  /* =========================
     CURRENT ELEMENTS
  ========================= */

  document
    .querySelectorAll(
      motionSelector
    )
    .forEach(
      prepareMotionElement
    );


  /* =========================
     FORM GROUP ANIMATION
  ========================= */

  const forms = [
    document.getElementById(
      "requestForm"
    ),
    document.getElementById(
      "contactForm"
    ),
    document.getElementById(
      "fixerApplicationForm"
    )
  ];


  forms.forEach(
    (form) => {

      if (!form) return;


      const groups =
        form.querySelectorAll(
          ".form-group, .input-group"
        );


      groups.forEach(
        (group, index) => {

          group.classList.add(
            "form-motion-item"
          );

          group.style.setProperty(
            "--form-delay",
            `${100 + index * 65}ms`
          );

        }
      );


      requestAnimationFrame(
        () => {

          form.classList.add(
            "form-visible"
          );

        }
      );

    }
  );


  /* =========================
     INPUT INTERACTION
  ========================= */

  const formControls =
    document.querySelectorAll(
      "input, textarea, select"
    );


  formControls.forEach(
    (control) => {

      control.addEventListener(
        "focus",
        () => {

          const parent =
            control.closest(
              ".form-group, .input-group"
            );

          if (parent) {

            parent.classList.add(
              "field-active"
            );

          }

        }
      );


      control.addEventListener(
        "blur",
        () => {

          const parent =
            control.closest(
              ".form-group, .input-group"
            );

          if (parent) {

            parent.classList.remove(
              "field-active"
            );

          }

        }
      );

    }
  );


  /* =========================
     BUTTON CLICK FEEDBACK
  ========================= */

  document.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "button, .nav-button, .cta-button, .request-tech-button"
        );


      if (!button) return;


      button.classList.remove(
        "button-clicked"
      );


      void button.offsetWidth;


      button.classList.add(
        "button-clicked"
      );


      setTimeout(
        () => {

          button.classList.remove(
            "button-clicked"
          );

        },
        350
      );

    }
  );


  /* =========================
     WATCH DYNAMIC CONTENT
     Database cards + profile
  ========================= */

  const mutationObserver =
    new MutationObserver(
      (mutations) => {

        mutations.forEach(
          (mutation) => {

            mutation.addedNodes.forEach(
              (node) => {

                if (
                  node.nodeType !== 1
                ) {

                  return;

                }


                if (
                  node.matches &&
                  node.matches(
                    motionSelector
                  )
                ) {

                  prepareMotionElement(
                    node
                  );

                }


                if (
                  node.querySelectorAll
                ) {

                  node
                    .querySelectorAll(
                      motionSelector
                    )
                    .forEach(
                      prepareMotionElement
                    );

                }

              }
            );

          }
        );

      }
    );


  mutationObserver.observe(
    document.body,
    {

      childList: true,

      subtree: true

    }
  );


  /* =========================
     PAGE EXIT TRANSITION
  ========================= */

  document.addEventListener(
    "click",
    (event) => {

      const link =
        event.target.closest("a");


      if (!link) return;


      const href =
        link.getAttribute("href");


      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        link.target === "_blank"
      ) {

        return;

      }


      /*
        Only animate navigation
        between our HTML pages.
      */

      if (
        !href.includes(".html")
      ) {

        return;

      }


      event.preventDefault();


      document.body.classList.add(
        "page-leaving"
      );


      setTimeout(
        () => {

          window.location.href =
            link.href;

        },
        220
      );

    }
  );

}


setupGlobalInteractions();
/* =========================
   PLATFORM TITLE ANIMATION
========================= */

function setupPlatformAnimation() {

  const platformSection =
    document.querySelector(
      ".platform-animated"
    );


  if (!platformSection) return;


  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              platformSection.classList.add(
                "platform-play"
              );


              observer.unobserve(
                platformSection
              );

            }

          }
        );

      },
      {

        threshold: 0.45

      }
    );


  observer.observe(
    platformSection
  );

}


setupPlatformAnimation();
/* =========================
   ABOUT PLATFORM ANIMATION
========================= */

function setupAboutPlatformAnimation() {

  const platform =
    document.querySelector(
      ".platform-animated"
    );


  if (!platform) return;


  const observer =
    new IntersectionObserver(

      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              platform.classList.add(
                "platform-play"
              );

              observer.unobserve(
                platform
              );

            }

          }
        );

      },

      {
        threshold: 0.45
      }

    );


  observer.observe(
    platform
  );

}


setupAboutPlatformAnimation();
/* ========================================
   CONTACT TITLE ANIMATION
======================================== */

function setupContactTitleAnimation() {

  const contactTitle =
    document.querySelector(
      ".contact-title-animated"
    );


  if (!contactTitle) {
    return;
  }


  const observer =
    new IntersectionObserver(

      (entries) => {

        entries.forEach(
          (entry) => {

            if (!entry.isIntersecting) {
              return;
            }


            contactTitle.classList.add(
              "contact-play"
            );


            observer.unobserve(
              contactTitle
            );

          }
        );

      },

      {
        threshold: 0.45
      }

    );


  observer.observe(
    contactTitle
  );

}


setupContactTitleAnimation();
/* ========================================
   ABOUT PLATFORM FLOW
======================================== */

function setupPlatformFlowAnimation() {

  const section =
    document.querySelector(
      ".platform-flow-section"
    );


  if (!section) {
    return;
  }


  const observer =
    new IntersectionObserver(

      (entries) => {

        entries.forEach(
          (entry) => {

            if (!entry.isIntersecting) {
              return;
            }


            section.classList.add(
              "flow-play"
            );


            observer.unobserve(
              section
            );

          }
        );

      },

      {
        threshold: 0.28
      }

    );


  observer.observe(
    section
  );

}


setupPlatformFlowAnimation();

/* ========================================
   HOW FIXER.CO WORKS ANIMATION
======================================== */

function setupHowSectionAnimation() {

  const howSection =
    document.querySelector(
      ".how-section"
    );

  if (!howSection) return;


  const howObserver =
    new IntersectionObserver(

      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              !entry.isIntersecting
            ) {

              return;

            }


            howSection.classList.add(
              "how-play"
            );


            howObserver.unobserve(
              howSection
            );

          }
        );

      },

      {
        threshold: 0.3
      }

    );


  howObserver.observe(
    howSection
  );

}


setupHowSectionAnimation();

/* ========================================
   BECOME A FIXER ANIMATIONS
======================================== */

function setupBecomeFixerAnimations() {
  const page = document.querySelector(".become-fixer-page");

  if (!page) return;

  const animatedItems = page.querySelectorAll(
    `
    .fixer-join-copy,
    .fixer-fee-card,
    .fixer-benefits-heading,
    .fixer-benefit-card,
    .fixer-guide-card,
    .policy-item,
    .fixer-application-copy,
    .fixer-application-card
    `
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("become-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18
    }
  );

  animatedItems.forEach((item) => {
    observer.observe(item);
  });
}

setupBecomeFixerAnimations();
/* ========================================
   PASSWORD SHOW / HIDE
======================================== */

function setupPasswordToggle(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (!input || !button) return;

  const icon = button.querySelector("i");

  button.addEventListener("click", () => {
    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";

    if (icon) {
      icon.classList.toggle("fa-eye", !isPassword);
      icon.classList.toggle("fa-eye-slash", isPassword);
    }

    button.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password"
    );
  });
}


/* Login password */
setupPasswordToggle(
  "loginPassword",
  "togglePassword"
);


/* Register password */
setupPasswordToggle(
  "registerPassword",
  "toggleRegisterPassword"
);


/* Confirm password */
setupPasswordToggle(
  "confirmPassword",
  "toggleConfirmPassword"
);


/* ========================================
   REGISTER PASSWORD VALIDATION
======================================== */

const registerPassword =
  document.getElementById("registerPassword");

const confirmPassword =
  document.getElementById("confirmPassword");

const lengthRule =
  document.getElementById("lengthRule");

const uppercaseRule =
  document.getElementById("uppercaseRule");

const lowercaseRule =
  document.getElementById("lowercaseRule");

const numberRule =
  document.getElementById("numberRule");

const specialRule =
  document.getElementById("specialRule");

const passwordMatchMessage =
  document.getElementById("passwordMatchMessage");


function updatePasswordRule(element, valid) {
  if (!element) return;

  element.classList.toggle("valid", valid);

  const icon = element.querySelector("i");

  if (!icon) return;

  if (valid) {
    icon.className = "fa-solid fa-circle-check";
  } else {
    icon.className = "fa-solid fa-circle";
  }
}


function validateRegisterPassword() {
  if (!registerPassword) return false;

  const password = registerPassword.value;

  const hasLength =
    password.length >= 8;

  const hasUppercase =
    /[A-Z]/.test(password);

  const hasLowercase =
    /[a-z]/.test(password);

  const hasNumber =
    /[0-9]/.test(password);

  const hasSpecial =
    /[^A-Za-z0-9]/.test(password);


  updatePasswordRule(
    lengthRule,
    hasLength
  );

  updatePasswordRule(
    uppercaseRule,
    hasUppercase
  );

  updatePasswordRule(
    lowercaseRule,
    hasLowercase
  );

  updatePasswordRule(
    numberRule,
    hasNumber
  );

  updatePasswordRule(
    specialRule,
    hasSpecial
  );


  return (
    hasLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial
  );
}


function checkPasswordMatch() {
  if (
    !registerPassword ||
    !confirmPassword ||
    !passwordMatchMessage
  ) {
    return false;
  }

  if (confirmPassword.value === "") {
    passwordMatchMessage.textContent = "";
    passwordMatchMessage.className =
      "password-match-message";

    return false;
  }


  if (
    registerPassword.value ===
    confirmPassword.value
  ) {
    passwordMatchMessage.textContent =
      "Passwords match";

    passwordMatchMessage.className =
      "password-match-message match";

    return true;
  }


  passwordMatchMessage.textContent =
    "Passwords do not match";

  passwordMatchMessage.className =
    "password-match-message no-match";

  return false;
}


if (registerPassword) {
  registerPassword.addEventListener(
    "input",
    () => {
      validateRegisterPassword();
      checkPasswordMatch();
    }
  );
}


if (confirmPassword) {
  confirmPassword.addEventListener(
    "input",
    checkPasswordMatch
  );
}
// ========================================
// REGISTER FORM
// ========================================

const registerForm =
  document.getElementById("registerForm");

const registerMessage =
  document.getElementById("registerMessage");


if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      // Get form fields
  const name =
  document
    .getElementById("registerName")
    .value
    .trim();

const username =
  document
    .getElementById("registerUsername")
    .value
    .trim()
    .toLowerCase();



      const email =
        document
          .getElementById("registerEmail")
          .value
          .trim();

      const phone =
        document
          .getElementById("registerPhone")
          .value
          .trim();

      const password =
        document
          .getElementById("registerPassword")
          .value;

      const confirmPasswordValue =
        document
          .getElementById("confirmPassword")
          .value;


      // Clear previous message
      if (registerMessage) {

        registerMessage.textContent = "";

        registerMessage.className =
          "login-message";

      }


      // ========================================
      // FRONTEND PASSWORD CHECK
      // ========================================

      const passwordIsValid =
        validateRegisterPassword();


      if (!passwordIsValid) {

        if (registerMessage) {

          registerMessage.textContent =
            "Please make sure your password meets all requirements.";

          registerMessage.className =
            "login-message error";

        }

        return;

      }


      // ========================================
      // CONFIRM PASSWORD
      // ========================================

      if (
        password !==
        confirmPasswordValue
      ) {

        if (registerMessage) {

          registerMessage.textContent =
            "Passwords do not match.";

          registerMessage.className =
            "login-message error";

        }

        return;

      }


      // ========================================
      // SUBMIT BUTTON
      // ========================================

      const submitButton =
        registerForm.querySelector(
          'button[type="submit"]'
        );


      const originalButtonHTML =
        submitButton
          ? submitButton.innerHTML
          : "";


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML = `
          <span>Creating Account...</span>
          <i class="fa-solid fa-spinner fa-spin"></i>
        `;

      }


      try {

        // ========================================
        // SEND DATA TO API
        // ========================================

        const response =
          await fetch(
            "/api/register",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

  body:
  JSON.stringify({
    name,
    username,
    email,
    phone,
    password
  })
            }
          );


        const data =
          await response.json();


        // ========================================
        // API ERROR
        // ========================================

        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to create account."
          );

        }


        // ========================================
        // SUCCESS
        // ========================================

        if (registerMessage) {

          registerMessage.textContent =
            "Account created successfully! Redirecting to login...";

          registerMessage.className =
            "login-message success";

        }


        registerForm.reset();


        // Reset password rules
        validateRegisterPassword();

        checkPasswordMatch();


        // Go to login page
        setTimeout(
          () => {

            window.location.href =
              "login.html";

          },
          1500
        );


      } catch (error) {

        console.error(
          "Register error:",
          error
        );


        if (registerMessage) {

          registerMessage.textContent =
            error.message ||
            "Something went wrong. Please try again.";

          registerMessage.className =
            "login-message error";

        }

      } finally {

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.innerHTML =
            originalButtonHTML;

        }

      }

    }
  );

}
// ========================================
// LOGIN FORM
// ========================================

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      // ========================================
      // GET LOGIN DATA
      // ========================================

      const username =
        document
          .getElementById("loginUsername")
          .value
          .trim();

      const password =
        document
          .getElementById("loginPassword")
          .value;


      // Clear old message
      if (loginMessage) {

        loginMessage.textContent = "";

        loginMessage.className =
          "login-message";

      }


      // ========================================
      // VALIDATION
      // ========================================

      if (
        !username ||
        !password
      ) {

        if (loginMessage) {

          loginMessage.textContent =
            "Please enter your username and password.";

          loginMessage.className =
            "login-message error";

        }

        return;
      }


      // ========================================
      // LOGIN BUTTON
      // ========================================

      const submitButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );


      const originalButtonHTML =
        submitButton
          ? submitButton.innerHTML
          : "";


      if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML = `
          <span>Logging In...</span>
          <i class="fa-solid fa-spinner fa-spin"></i>
        `;

      }


      try {

        // ========================================
        // SEND LOGIN REQUEST
        // ========================================

        const response =
          await fetch(
            "/api/login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              credentials: "same-origin",

              body:
                JSON.stringify({
                  username,
                  password
                })
            }
          );


        const data =
          await response.json();


        // ========================================
        // LOGIN FAILED
        // ========================================

        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to log in."
          );

        }


        // ========================================
        // LOGIN SUCCESS
        // ========================================

        if (loginMessage) {

          loginMessage.textContent =
            "Login successful! Redirecting...";

          loginMessage.className =
            "login-message success";

        }


        // ========================================
        // REDIRECT
        // ========================================

        /*
          If the user tried to open a protected
          page before logging in, return them
          to that page after successful login.
        */

        const redirectAfterLogin =
          localStorage.getItem(
            "redirectAfterLogin"
          );


        // Remove the temporary redirect value
        localStorage.removeItem(
          "redirectAfterLogin"
        );


        setTimeout(
          () => {

            if (redirectAfterLogin) {

              window.location.href =
                redirectAfterLogin;

            } else {

              window.location.href =
                "index.html";

            }

          },
          1000
        );


      } catch (error) {

        console.error(
          "Login error:",
          error
        );


        // ========================================
        // SHOW ERROR
        // ========================================

        if (loginMessage) {

          loginMessage.textContent =
            error.message ||
            "Something went wrong. Please try again.";

          loginMessage.className =
            "login-message error";

        }


      } finally {

        // ========================================
        // RESTORE BUTTON
        // ========================================

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.innerHTML =
            originalButtonHTML;

        }

      }

    }
  );

}