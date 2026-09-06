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


  
/* ==================================================
   AI HOME SEARCH FORM
   TEXT + IMAGE VISION
================================================== */

if (problemForm) {

  const aiSearchButton =
    document.getElementById("aiSearchButton");

  const aiDiagnosisResult =
    document.getElementById("aiDiagnosisResult");


  /*
    Map Fixer.Co service names
    to their database IDs.
  */
  const serviceCategoryMap = {
    "AC & Cooling": 1,
    "Plumbing": 2,
    "Electrical": 3,
    "Appliances": 4,
    "Carpentry & Furniture": 5,
    "General Maintenance": 6
  };


  problemForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const problem =
        problemInput.value.trim();


      /*
        The user must provide at least
        a description OR an image.
      */
      if (
        !problem &&
        !selectedProblemImage
      ) {

        alert(
          "Please describe the problem or add a photo."
        );

        return;

      }


      /* =========================
         LOADING STATE
      ========================= */

      aiSearchButton.disabled = true;

      aiSearchButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Analyzing...</span>
      `;


      aiDiagnosisResult.hidden = false;


      aiDiagnosisResult.innerHTML = `
        <div class="ai-result-loading">

          <i class="fa-solid fa-wand-magic-sparkles"></i>

          <div>

            <strong>
              AI is analyzing your problem...
            </strong>

            <p>
              ${
                selectedProblemImage
                  ? "Analyzing the photo and finding the best service match."
                  : "Finding the service that best matches your description."
              }
            </p>

          </div>

        </div>
      `;


      try {

        let response;


        /* =========================================
           IMAGE MODE
           Image only OR Image + Description
        ========================================= */

        if (selectedProblemImage) {

          /*
            Convert the selected image
            into a smaller Base64 image.

            This reduces request size
            and Workers AI usage.
          */
          const imageData =
            await prepareImageForAI(
              selectedProblemImage
            );


          response =
            await fetch(
              "/api/ai-diagnose-image",
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  problem,
                  image: imageData
                })

              }
            );

        }


        /* =========================================
           TEXT-ONLY MODE
        ========================================= */

        else {

          response =
            await fetch(
              "/api/ai-diagnose",
              {

                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  problem
                })

              }
            );

        }


        /* =========================
           READ RESPONSE
        ========================= */

        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success ||
          !data.diagnosis
        ) {

          throw new Error(
            data.error ||
            "AI could not analyze the problem."
          );

        }


        const diagnosis =
          data.diagnosis;


        const serviceId =
          serviceCategoryMap[
            diagnosis.category
          ];


        /*
          Never create a broken link
          from an invalid AI category.
        */
        if (!serviceId) {

          throw new Error(
            "The recommended service is not available."
          );

        }


        /* =========================
           RESULT CARD
        ========================= */

        aiDiagnosisResult.innerHTML = `

          <div class="ai-result-card">

            <div class="ai-result-top">

              <div>

                <span class="ai-result-label">

                  <i class="fa-solid fa-wand-magic-sparkles"></i>

                  AI SERVICE MATCH

                </span>


                <h3>
                  ${escapeHTML(
                    diagnosis.category
                  )}
                </h3>

              </div>


              <span class="ai-confidence">

                ${Number(
                  diagnosis.confidence
                )}% Match

              </span>

            </div>


            <p class="ai-result-explanation">

              ${escapeHTML(
                diagnosis.explanation
              )}

            </p>


            <div class="ai-result-footer">

              <p>

                <i class="fa-solid fa-circle-info"></i>

                AI suggestion — not a guaranteed
                technical diagnosis.

              </p>


              <a
                href="technicians.html?service=${serviceId}&problem=${encodeURIComponent(problem)}"
                class="ai-view-fixers"
              >

                View Fixers

                <i class="fa-solid fa-arrow-right"></i>

              </a>

            </div>

          </div>
        `;


      } catch (error) {

        console.error(
          "AI search error:",
          error
        );


        /* =========================
           ERROR STATE
        ========================= */

        aiDiagnosisResult.innerHTML = `

          <div class="ai-result-error">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <div>

              <strong>
                AI Assistant is temporarily unavailable.
              </strong>

              <p>
                ${escapeHTML(
                  error.message ||
                  "Please try again or choose a service category below."
                )}
              </p>

            </div>

          </div>
        `;


      } finally {

        /* =========================
           RESTORE BUTTON
        ========================= */

        aiSearchButton.disabled = false;


        aiSearchButton.innerHTML = `
          <span>Find My Service</span>
          <i class="fa-solid fa-arrow-right"></i>
        `;

      }

    }
  );

}


/* ==================================================
   PREPARE IMAGE FOR AI
================================================== */

/*
  Resize and compress the uploaded image
  before sending it to Workers AI.

  This keeps the request smaller and faster.
*/
function prepareImageForAI(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload = () => {

        const image =
          new Image();


        image.onload = () => {

          /*
            Maximum image dimension.
            Large photos do not need to be sent
            at their original camera resolution.
          */
          const maxDimension = 1024;


          let width =
            image.width;

          let height =
            image.height;


          /*
            Resize while keeping
            the original aspect ratio.
          */
          if (
            width > maxDimension ||
            height > maxDimension
          ) {

            if (width > height) {

              height =
                Math.round(
                  height *
                  (
                    maxDimension /
                    width
                  )
                );

              width =
                maxDimension;

            } else {

              width =
                Math.round(
                  width *
                  (
                    maxDimension /
                    height
                  )
                );

              height =
                maxDimension;

            }

          }


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            width;

          canvas.height =
            height;


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


          /*
            Draw the resized image.
          */
          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );


          /*
            Convert to JPEG Base64.

            0.82 gives good visual quality
            while keeping the request small.
          */
          const compressedImage =
            canvas.toDataURL(
              "image/jpeg",
              0.82
            );


          resolve(
            compressedImage
          );

        };


        image.onerror = () => {

          reject(
            new Error(
              "Could not read the selected image."
            )
          );

        };


        image.src =
          reader.result;

      };


      reader.onerror = () => {

        reject(
          new Error(
            "Could not read the selected image."
          )
        );

      };


      reader.readAsDataURL(
        file
      );

    }
  );

}
/* =========================
   ESCAPE HTML
========================= */

/*
  Prevent text returned by the API
  from being inserted as HTML.
*/
function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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


  formMessage.innerHTML =
  `<i class="fa-solid fa-circle-check"></i>
   Service request sent successfully!`;


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
// ========================================
// AUTHENTICATION STATE - GLOBAL
// ========================================

async function loadCurrentUser() {
  try {
    const response = await fetch(
      "/api/me",
      {
        method: "GET",
        credentials: "same-origin"
      }
    );

    if (!response.ok) {
      return null;
    }

    const data =
      await response.json();

    if (
      !data.success ||
      !data.authenticated ||
      !data.user
    ) {
      return null;
    }

    return data.user;

  } catch (error) {

    console.error(
      "Auth state error:",
      error
    );

    return null;
  }
}


// ========================================
// UPDATE NAVBAR ON EVERY PAGE
// ========================================

async function updateNavbarAuth() {

  const navActions =
    document.querySelector(
      ".nav-actions"
    );

  if (!navActions) {
    return;
  }

  const user =
    await loadCurrentUser();


  // Remove any generated account area
  const oldAuthArea =
    document.getElementById(
      "authUserArea"
    );

  if (oldAuthArea) {
    oldAuthArea.remove();
  }


  // Find existing login button
  const existingLoginLink =
    navActions.querySelector(
      'a[href="login.html"], a[href="/login"], a[href="/login.html"], #navLoginButton'
    );


  // ========================================
  // USER LOGGED OUT
  // ========================================

  if (!user) {

    if (existingLoginLink) {

      existingLoginLink.style.display =
        "";

      existingLoginLink.id =
        "navLoginButton";

      return;
    }


    const loginLink =
      document.createElement("a");


    loginLink.href =
      "login.html";

    loginLink.id =
      "navLoginButton";

    loginLink.className =
      "login-nav-button";

    loginLink.innerHTML = `
      <i class="fa-regular fa-user"></i>
      Log In
    `;


    navActions.appendChild(
      loginLink
    );

    return;
  }


  // ========================================
  // USER LOGGED IN
  // ========================================

  if (existingLoginLink) {
    existingLoginLink.remove();
  }


  const firstName =
    (
      user.name ||
      user.username ||
      "Account"
    )
      .trim()
      .split(/\s+/)[0];


  const authArea =
    document.createElement("div");


  authArea.id =
    "authUserArea";

  authArea.className =
    "auth-user-area";


  authArea.innerHTML = `
    <button
      type="button"
      class="auth-user-button"
      id="authUserButton"
      aria-expanded="false"
    >
      <i class="fa-regular fa-circle-user"></i>

      <span>
        ${firstName}
      </span>

      <i class="fa-solid fa-chevron-down"></i>
    </button>


    <div
      class="auth-user-menu"
      id="authUserMenu"
    >
      <a href="my-requests.html">
        <i class="fa-regular fa-clipboard"></i>
        My Requests
      </a>

    
<a href="#" id="navbarTrackService">
  <i class="fa-solid fa-location-dot"></i>
  Track Service
</a>
      <button
        type="button"
        id="logoutButton"
      >
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        Log Out
      </button>
    </div>
  `;


  navActions.appendChild(
    authArea
  );


  // ========================================
  // DROPDOWN
  // ========================================

  const userButton =
    document.getElementById(
      "authUserButton"
    );

  const userMenu =
    document.getElementById(
      "authUserMenu"
    );


  if (
    userButton &&
    userMenu
  ) {

    userButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        userMenu.classList.toggle(
          "show"
        );

        userButton.setAttribute(
          "aria-expanded",
          userMenu.classList.contains(
            "show"
          )
            ? "true"
            : "false"
        );

      }
    );


    document.addEventListener(
      "click",
      (event) => {

        if (
          !authArea.contains(
            event.target
          )
        ) {

          userMenu.classList.remove(
            "show"
          );

          userButton.setAttribute(
            "aria-expanded",
            "false"
          );

        }

      }
    );

  }
  const navbarTrackService =
  document.getElementById("navbarTrackService");

if (navbarTrackService) {
  navbarTrackService.addEventListener("click", async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/my-requests", {
        credentials: "same-origin"
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Could not load your requests."
        );
      }

      if (!data.requests || data.requests.length === 0) {
        window.location.href = "my-requests.html";
        return;
      }

      // The API returns the newest requests first.
      const latestRequest = data.requests[0];

      window.location.href =
        `track.html?request=${latestRequest.id}`;

    } catch (error) {
      console.error(
        "Track Service navigation error:",
        error
      );

      window.location.href = "my-requests.html";
    }
  });
}
// ========================================
// LOG OUT
// ========================================

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        logoutButton.disabled =
          true;


        const response =
          await fetch(
            "/api/logout",
            {
              method: "POST",
              credentials: "same-origin"
            }
          );


        if (!response.ok) {

          throw new Error(
            "Logout failed"
          );

        }


        window.location.href =
          "index.html";


      } catch (error) {

        console.error(
          "Logout error:",
          error
        );


        logoutButton.disabled =
          false;

      }

    }
  );

}

}


// ========================================
// RUN AUTH ON EVERY PAGE
// ========================================

updateNavbarAuth();

/* ========================================
   MY REQUESTS PAGE
======================================== */

async function loadMyRequestsPage() {

  const container =
    document.getElementById("myRequestsContainer");

  if (!container) return;


  const countElement =
    document.getElementById("myRequestsCount");


  try {

    const response =
      await fetch(
        "/api/my-requests",
        {
          method: "GET",
          credentials: "same-origin"
        }
      );


    const data =
      await response.json();


    // If the user is not logged in,
    // redirect them to the login page.
    if (response.status === 401) {

      localStorage.setItem(
        "redirectAfterLogin",
        "my-requests.html"
      );

      window.location.replace(
        "login.html"
      );

      return;
    }


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Could not load your requests."
      );

    }


    const requests =
      Array.isArray(data.requests)
        ? data.requests
        : [];


    /* ========================================
       REQUEST COUNT
    ======================================== */

    if (countElement) {

      countElement.textContent =
        `${requests.length} ${
          requests.length === 1
            ? "request"
            : "requests"
        }`;

    }


    /* ========================================
       EMPTY STATE
    ======================================== */

    if (requests.length === 0) {

      container.innerHTML = `

        <div class="my-requests-empty">

          <div class="my-requests-empty-icon">

            <i class="fa-solid fa-screwdriver-wrench"></i>

          </div>

          <h2>
            No service requests yet
          </h2>

          <p>
            When you request a Fixer,
            your service details and progress
            will appear here.
          </p>

          <a
            href="services.html"
            class="my-requests-primary-button"
          >

            Browse Services

            <i class="fa-solid fa-arrow-right"></i>

          </a>

        </div>

      `;

      return;
    }


    /* ========================================
       DISPLAY REQUESTS
    ======================================== */

    container.innerHTML = "";


    requests.forEach(
      (requestItem) => {

        const status =
          String(
            requestItem.status ||
            "requested"
          )
            .trim()
            .toLowerCase();


        const statusInfo =
          getRequestStatusInfo(
            status
          );


        /* Fixer initials */

        const initials =
          requestItem.technician_name
            ? requestItem.technician_name
                .split(" ")
                .map(
                  (word) => word[0]
                )
                .join("")
                .substring(0, 2)
                .toUpperCase()
            : "FX";


        /* Date */

        const createdDate =
          formatRequestDate(
            requestItem.created_at
          );


        /* Rating */

        const rating =
          requestItem.technician_rating !== null &&
          requestItem.technician_rating !== undefined

            ? Number(
                requestItem.technician_rating
              ).toFixed(1)

            : "—";


        /* Starting price */

        const price =
          requestItem.starting_price !== null &&
          requestItem.starting_price !== undefined

            ? `${Number(
                requestItem.starting_price
              ).toFixed(0)} SAR`

            : "—";


        const isCompleted =
          status === "completed";


        /* ========================================
           CREATE REQUEST CARD
        ======================================== */

        const card =
          document.createElement(
            "article"
          );


        card.className =
          "my-request-card";


        card.innerHTML = `

          <div class="my-request-card-top">


            <!-- SERVICE -->

            <div class="my-request-service">

              <div class="my-request-service-icon">

                ${
                  serviceIcons[
                    Number(
                      requestItem.service_id
                    )
                  ] ||
                  '<i class="fa-solid fa-wrench"></i>'
                }

              </div>


              <div>

                <p class="my-request-eyebrow">
                  SERVICE REQUEST
                </p>

                <h2>

                  ${
                    escapeMyRequestsHtml(
                      requestItem.service_name ||
                      "Home Service"
                    )
                  }

                </h2>

              </div>

            </div>


            <!-- STATUS -->

            <span
              class="
                my-request-status
                ${statusInfo.className}
              "
            >

              <i class="${statusInfo.icon}"></i>

              ${statusInfo.label}

            </span>


          </div>


          <!-- =========================
               PROGRESS
          ========================== -->

          <div class="my-request-progress">

            ${buildRequestProgress(status)}

          </div>


          <!-- =========================
               DETAILS
          ========================== -->

          <div class="my-request-details-grid">


            <!-- FIXER -->

            <div class="my-request-fixer">

              <div class="my-request-avatar">

                ${initials}

              </div>


              <div>

                <span>
                  YOUR FIXER
                </span>

                <strong>

                  ${
                    escapeMyRequestsHtml(
                      requestItem.technician_name ||
                      "Fixer pending"
                    )
                  }

                </strong>


                <p>

                  <i class="fa-solid fa-star"></i>

                  ${rating}


                  <span class="my-request-dot">
                    •
                  </span>


                  <i class="fa-solid fa-location-dot"></i>

                  ${
                    escapeMyRequestsHtml(
                      requestItem.technician_location ||
                      "Location unavailable"
                    )
                  }

                </p>

              </div>

            </div>


            <!-- DATE -->

            <div class="my-request-detail">

              <span>
                REQUESTED
              </span>

              <strong>
                ${createdDate}
              </strong>

            </div>


            <!-- PRICE -->

            <div class="my-request-detail">

              <span>
                STARTING PRICE
              </span>

              <strong>
                ${price}
              </strong>

            </div>


          </div>


          <!-- =========================
               PROBLEM
          ========================== -->

          <div class="my-request-problem">

            <span>

              <i class="fa-regular fa-message"></i>

              Problem details

            </span>


            <p>

              ${
                escapeMyRequestsHtml(
                  requestItem.problem ||
                  "No problem description."
                )
              }

            </p>

          </div>


          <!-- =========================
               ACTIONS
          ========================== -->

          <div class="my-request-card-footer">


            <a
              href="profile.html?id=${encodeURIComponent(
                requestItem.technician_id || ""
              )}"
              class="my-requests-secondary-button"
            >

              <i class="fa-regular fa-user"></i>

              View Fixer

            </a>


            ${
              isCompleted

                ? `

                  <button
                    type="button"
                    class="
                      my-requests-primary-button
                      review-request-button
                    "
                    data-request-id="${requestItem.id}"
                  >

                    <i class="fa-regular fa-star"></i>

                    Leave a Review

                  </button>

                `

                : `

                  <a
                    href="track.html?request=${encodeURIComponent(
                      requestItem.id
                    )}"
                    class="my-requests-primary-button"
                  >

                    Track Service

                    <i class="fa-solid fa-arrow-right"></i>

                  </a>

                `
            }


          </div>

        `;


        container.appendChild(
          card
        );

      }
    );


  } catch (error) {

    console.error(
      "My Requests page error:",
      error
    );


    if (countElement) {

      countElement.textContent =
        "Unavailable";

    }


    container.innerHTML = `

      <div class="my-requests-empty">


        <div
          class="
            my-requests-empty-icon
            error
          "
        >

          <i class="fa-solid fa-triangle-exclamation"></i>

        </div>


        <h2>
          We couldn't load your requests
        </h2>


        <p>
          Please refresh the page
          and try again.
        </p>


        <button
          type="button"
          class="my-requests-primary-button"
          onclick="window.location.reload()"
        >

          Try Again

        </button>


      </div>

    `;

  }

}


/* ========================================
   REQUEST STATUS
======================================== */

function getRequestStatusInfo(
  status
) {

  const statuses = {


    pending: {

      label:
        "Requested",

      className:
        "status-requested",

      icon:
        "fa-regular fa-clock"

    },


    requested: {

      label:
        "Requested",

      className:
        "status-requested",

      icon:
        "fa-regular fa-clock"

    },


    accepted: {

      label:
        "Accepted",

      className:
        "status-accepted",

      icon:
        "fa-solid fa-check"

    },


    on_the_way: {

      label:
        "On the way",

      className:
        "status-on-the-way",

      icon:
        "fa-solid fa-car-side"

    },


    arrived: {

      label:
        "Arrived",

      className:
        "status-arrived",

      icon:
        "fa-solid fa-location-dot"

    },


    in_progress: {

      label:
        "In progress",

      className:
        "status-in-progress",

      icon:
        "fa-solid fa-screwdriver-wrench"

    },


    completed: {

      label:
        "Completed",

      className:
        "status-completed",

      icon:
        "fa-solid fa-circle-check"

    }

  };


  return (
    statuses[status] ||
    {

      label:
        status
          .replaceAll(
            "_",
            " "
          )
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase()
          ),

      className:
        "status-requested",

      icon:
        "fa-regular fa-clock"

    }
  );

}


/* ========================================
   REQUEST PROGRESS
======================================== */

function buildRequestProgress(
  status
) {

  const steps = [

    {
      key:
        "requested",

      label:
        "Requested",

      icon:
        "fa-regular fa-file-lines"
    },


    {
      key:
        "accepted",

      label:
        "Accepted",

      icon:
        "fa-solid fa-check"
    },


    {
      key:
        "on_the_way",

      label:
        "On the way",

      icon:
        "fa-solid fa-car-side"
    },


    {
      key:
        "in_progress",

      label:
        "In progress",

      icon:
        "fa-solid fa-screwdriver-wrench"
    },


    {
      key:
        "completed",

      label:
        "Completed",

      icon:
        "fa-solid fa-flag-checkered"
    }

  ];


  const normalizedStatus =
    status === "pending"

      ? "requested"

      : status === "arrived"

        ? "on_the_way"

        : status;


  let currentIndex =
    steps.findIndex(
      (step) =>
        step.key ===
        normalizedStatus
    );


  if (currentIndex < 0) {

    currentIndex = 0;

  }


  return steps
    .map(
      (step, index) => {

        const isDone =
          index < currentIndex;


        const isCurrent =
          index === currentIndex;


        return `

          <div
            class="
              my-request-progress-step

              ${
                isDone

                  ? "done"

                  : isCurrent

                    ? "current"

                    : ""
              }
            "
          >

            <div
              class="
                my-request-progress-marker
              "
            >

              <i class="${step.icon}"></i>

            </div>


            <span>
              ${step.label}
            </span>


          </div>

        `;

      }
    )
    .join("");

}


/* ========================================
   FORMAT REQUEST DATE
======================================== */

function formatRequestDate(
  value
) {

  if (!value) {

    return "—";

  }


  const normalizedValue =
    String(value).includes("T")

      ? value

      : String(value).replace(
          " ",
          "T"
        ) + "Z";


  const date =
    new Date(
      normalizedValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

  }


  return new Intl.DateTimeFormat(
    "en",
    {

      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit"

    }
  ).format(date);

}


/* ========================================
   ESCAPE HTML
======================================== */

function escapeMyRequestsHtml(
  value
) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* ========================================
   RUN MY REQUESTS PAGE
======================================== */

loadMyRequestsPage();

/* ========================================
   TRACK SERVICE PAGE
======================================== */

async function loadTrackServicePage() {

  const trackDashboard =
    document.getElementById("trackDashboard");

  /* Stop if this is not the Track Service page */
  if (!trackDashboard) {
    return;
  }


  const trackLoading =
    document.getElementById("trackLoading");

  const params =
    new URLSearchParams(
      window.location.search
    );

  const requestId =
    params.get("request");


  /* ========================================
     CHECK REQUEST ID
  ======================================== */

  if (!requestId) {

    showTrackError(
      "No service request was selected."
    );

    return;
  }


  try {

    const response =
      await fetch(
        `/api/requests/${requestId}`,
        {
          method: "GET",
          credentials: "same-origin"
        }
      );


    /* User is not logged in */

    if (response.status === 401) {

      sessionStorage.setItem(
        "redirectAfterLogin",
        window.location.href
      );

      window.location.href =
        "login.html";

      return;
    }


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success ||
      !data.request
    ) {

      throw new Error(
        data.message ||
        "Unable to load service request."
      );

    }


    /* Hide loading */

    if (trackLoading) {
      trackLoading.hidden = true;
    }


    /* Show dashboard */

    trackDashboard.hidden = false;


    /* Render request */

    renderTrackService(
      data.request
    );


    /* Start map */

    initializeTrackMap(
      data.request
    );


    /* Start interactions */

    setupTrackInteractions();


    /* Save current status */

    trackDashboard.dataset.status =
      data.request.status;


    /* Auto refresh every 20 seconds */

    if (window.trackRefreshInterval) {

      clearInterval(
        window.trackRefreshInterval
      );

    }


    window.trackRefreshInterval =
      setInterval(
        () => {

          refreshTrackService(
            requestId,
            false
          );

        },
        20000
      );


  } catch (error) {

    console.error(
      "Track Service error:",
      error
    );


    showTrackError(
      error.message ||
      "Unable to load your service request."
    );

  }

}



/* ========================================
   RENDER TRACK SERVICE
======================================== */

function renderTrackService(request) {

  const status =
    normalizeTrackStatus(
      request.status
    );


  const statusInfo =
    getTrackStatusInfo(
      status
    );


  /* ========================================
     SERVICE
  ======================================== */

  setTrackText(
    "trackServiceName",
    request.service_name ||
    "Service Request"
  );


  /* Service icon */

  const serviceIcon =
    document.getElementById(
      "trackServiceIcon"
    );


  if (serviceIcon) {

    const iconMap = {

      1: "fa-solid fa-snowflake",
      2: "fa-solid fa-droplet",
      3: "fa-solid fa-bolt",
      4: "fa-solid fa-screwdriver-wrench",
      5: "fa-solid fa-hammer",
      6: "fa-solid fa-house"

    };


    serviceIcon.innerHTML =
      `<i class="${
        iconMap[request.service_id] ||
        "fa-solid fa-wrench"
      }"></i>`;

  }


  /* ========================================
     STATUS
  ======================================== */

  setTrackText(
    "trackStatusText",
    statusInfo.label
  );


  const statusBadge =
    document.getElementById(
      "trackStatusBadge"
    );


  if (statusBadge) {

    statusBadge.className =
      `track-status-badge status-${status.replaceAll("_", "-")}`;

  }


  /* ========================================
     RIGHT NOW
  ======================================== */

  const firstName =
    request.technician_name
      ? request.technician_name
          .trim()
          .split(/\s+/)[0]
      : "Your Fixer";


  let currentDescription =
    statusInfo.description;


  if (status === "requested") {

    currentDescription =
      `Waiting for ${firstName} to accept your request.`;

  }


  else if (status === "accepted") {

    currentDescription =
      `${firstName} accepted your request and is preparing for your service.`;

  }


  else if (status === "on_the_way") {

    currentDescription =
      `${firstName} is heading toward your service location.`;

  }


  else if (status === "in_progress") {

    currentDescription =
      `${firstName} is currently working on your service.`;

  }


  else if (status === "completed") {

    currentDescription =
      `Your service is complete. You can now leave a review for ${firstName}.`;

  }


  setTrackText(
    "trackNowTitle",
    statusInfo.title
  );


  setTrackText(
    "trackNowDescription",
    currentDescription
  );


  const nowIcon =
    document.getElementById(
      "trackNowIcon"
    );


  if (nowIcon) {

    nowIcon.innerHTML =
      `<i class="${statusInfo.icon}"></i>`;

  }


  /* ========================================
     FIXER INFORMATION
  ======================================== */

  setTrackText(
    "trackFixerName",
    request.technician_name ||
    "Assigned Fixer"
  );


  setTrackText(
    "trackFixerRating",
    request.technician_rating !== null &&
    request.technician_rating !== undefined
      ? Number(
          request.technician_rating
        ).toFixed(1)
      : "—"
  );


  setTrackText(
    "trackFixerPrice",
    request.starting_price !== null &&
    request.starting_price !== undefined
      ? `${Number(
          request.starting_price
        ).toFixed(0)} SAR`
      : "—"
  );


  setTrackText(
    "trackFixerLocation",
    request.technician_location ||
    "Location unavailable"
  );


  /* Fixer profile link */

  const profileButton =
    document.getElementById(
      "trackViewFixerButton"
    );


  if (
    profileButton &&
    request.technician_id
  ) {

    profileButton.href =
      `profile.html?id=${request.technician_id}`;

  }


  /* ========================================
     INITIALS
  ======================================== */

  const initials =
    getTrackInitials(
      request.technician_name
    );


  setTrackText(
    "trackFixerAvatar",
    initials
  );


  setTrackText(
    "trackMapAvatar",
    initials
  );


  setTrackText(
    "trackMapFixerName",
    request.technician_name ||
    "Fixer"
  );


  setTrackText(
    "trackMapLocation",
    request.technician_location ||
    "Location unavailable"
  );


  /* ========================================
     REQUEST DETAILS
  ======================================== */

  setTrackText(
    "trackProblemText",
    request.problem ||
    "No problem description provided."
  );


  setTrackText(
    "trackRequestDate",
    formatTrackDate(
      request.created_at
    )
  );


  /* ========================================
     TIMELINE
  ======================================== */

  updateTrackTimeline(
    status
  );


  /* ========================================
     WHAT'S NEXT
  ======================================== */

  updateTrackNextStep(
    status,
    request
  );


  /* ========================================
     REVIEW BUTTON
  ======================================== */

  updateTrackCompletedState(
    status,
    request
  );

}



/* ========================================
   NORMALIZE STATUS
======================================== */

function normalizeTrackStatus(status) {

  const value =
    String(
      status || "requested"
    )
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_");


  if (value === "pending") {
    return "requested";
  }


  if (value === "arrived") {
    return "on_the_way";
  }


  return value;

}



/* ========================================
   STATUS INFORMATION
======================================== */

function getTrackStatusInfo(status) {

  const statuses = {

    requested: {

      label:
        "Requested",

      title:
        "Request received",

      description:
        "Your service request has been sent successfully.",

      icon:
        "fa-solid fa-paper-plane"

    },


    accepted: {

      label:
        "Accepted",

      title:
        "Request accepted",

      description:
        "Your Fixer accepted the service request.",

      icon:
        "fa-solid fa-circle-check"

    },


    on_the_way: {

      label:
        "On the way",

      title:
        "Your Fixer is on the way",

      description:
        "Your Fixer is heading toward your location.",

      icon:
        "fa-solid fa-route"

    },


    in_progress: {

      label:
        "In progress",

      title:
        "Service in progress",

      description:
        "Your Fixer is currently working on your request.",

      icon:
        "fa-solid fa-screwdriver-wrench"

    },


    completed: {

      label:
        "Completed",

      title:
        "Service completed",

      description:
        "Your service has been completed successfully.",

      icon:
        "fa-solid fa-circle-check"

    }

  };


  return (
    statuses[status] ||
    statuses.requested
  );

}
/* ========================================
   TIMELINE
======================================== */

function updateTrackTimeline(status) {

  const timeline =
    document.getElementById(
      "trackTimeline"
    );


  if (!timeline) {
    return;
  }


  const stages = [
    "requested",
    "accepted",
    "on_the_way",
    "in_progress",
    "completed"
  ];


  let currentIndex =
    stages.indexOf(status);


  if (currentIndex < 0) {
    currentIndex = 0;
  }


  const progress =
    (
      currentIndex /
      (stages.length - 1)
    ) * 100;


  timeline.style.setProperty(
    "--track-progress",
    `${progress}%`
  );


  const steps =
    timeline.querySelectorAll(
      ".track-step"
    );


  steps.forEach(
    (step, index) => {

      step.classList.remove(
        "done",
        "current"
      );


      const marker =
        step.querySelector(
          ".track-step-marker"
        );


      /* Completed previous stages */

      if (index < currentIndex) {

        step.classList.add(
          "done"
        );


        if (marker) {

          marker.innerHTML =
            `<i class="fa-solid fa-check"></i>`;

        }

      }


      /* Current stage */

      else if (
        index === currentIndex
      ) {

        step.classList.add(
          "current"
        );


        if (marker) {

          marker.innerHTML =
            `<i class="fa-solid fa-circle"></i>`;

        }

      }


      /* Future stage */

      else {

        if (marker) {

          marker.innerHTML =
            `<i class="fa-solid fa-circle"></i>`;

        }

      }

    }
  );

}



/* ========================================
   WHAT'S NEXT
======================================== */

function updateTrackNextStep(
  status,
  request
) {

  const fixerName =
    request.technician_name
      ? request.technician_name
          .trim()
          .split(/\s+/)[0]
      : "Your Fixer";


  const nextSteps = {

    requested: {

      title:
        `Waiting for ${fixerName} to accept`,

      description:
        `Once ${fixerName} accepts your request, the next service update will appear here.`,

      stage:
        "Accepted",

      icon:
        "fa-solid fa-user-check"

    },


    accepted: {

      title:
        `${fixerName} is preparing`,

      description:
        `The next update will appear when ${fixerName} starts heading to your location.`,

      stage:
        "On the way",

      icon:
        "fa-solid fa-route"

    },


    on_the_way: {

      title:
        `${fixerName} is heading your way`,

      description:
        `The next update will appear when ${fixerName} starts working on your service.`,

      stage:
        "In progress",

      icon:
        "fa-solid fa-location-arrow"

    },


    in_progress: {

      title:
        "Service completion",

      description:
        `Once ${fixerName} finishes the job, you'll be able to leave your review.`,

      stage:
        "Completed",

      icon:
        "fa-solid fa-check-double"

    },


    completed: {

      title:
        "Service completed",

      description:
        `Your service is complete. You can now review ${fixerName} and share your experience.`,

      stage:
        "Leave a review",

      icon:
        "fa-solid fa-star"

    }

  };


  const info =
    nextSteps[status] ||
    nextSteps.requested;


  setTrackText(
    "trackNextTitle",
    info.title
  );


  setTrackText(
    "trackNextDescription",
    info.description
  );


  setTrackText(
    "trackNextStage",
    info.stage
  );


  const icon =
    document.getElementById(
      "trackNextIcon"
    );


  if (icon) {

    icon.className =
      info.icon;

  }

}



/* ========================================
   LEAFLET MAP
======================================== */

let trackMap = null;
let trackMarker = null;


function initializeTrackMap(request) {

  const mapElement =
    document.getElementById(
      "trackMap"
    );


  if (
    !mapElement ||
    typeof L === "undefined"
  ) {

    return;

  }


  const latitude =
    Number(
      request.technician_latitude
    );


  const longitude =
    Number(
      request.technician_longitude
    );


  /* No saved coordinates */

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    mapElement.innerHTML =
      `
      <div
        style="
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-direction:column;
          gap:10px;
          color:#7c8b94;
          font-size:12px;
          text-align:center;
          padding:25px;
        "
      >

        <i
          class="fa-solid fa-location-dot"
          style="
            color:#4faf8f;
            font-size:22px;
          "
        ></i>

        <span>
          Fixer location is currently unavailable.
        </span>

      </div>
      `;

    return;

  }


  /* Remove previous map */

  if (trackMap) {

    trackMap.remove();

    trackMap = null;

  }


  /* Create map */

  trackMap =
    L.map(
      "trackMap",
      {
        zoomControl: false
      }
    )
      .setView(
        [
          latitude,
          longitude
        ],
        14
      );


  /* OpenStreetMap tiles */

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {

      maxZoom: 19,

      attribution:
        "&copy; OpenStreetMap contributors"

    }
  )
    .addTo(
      trackMap
    );


  /* Zoom controls */

  L.control
    .zoom({
      position:
        "bottomright"
    })
    .addTo(
      trackMap
    );


  /* Custom marker */

  const fixerIcon =
    L.divIcon({

      className:
        "fixer-map-marker-shell",

      html:
        `
        <div
          class="fixer-map-pulse"
        ></div>

        <div
          class="fixer-map-marker"
        >

          <i
            class="fa-solid fa-screwdriver-wrench"
          ></i>

        </div>
        `,

      iconSize:
        [52, 52],

      iconAnchor:
        [26, 26]

    });


  trackMarker =
    L.marker(
      [
        latitude,
        longitude
      ],
      {
        icon:
          fixerIcon
      }
    )
      .addTo(
        trackMap
      );


  trackMarker.bindPopup(
    `
    <strong>
      ${escapeTrackHTML(
        request.technician_name ||
        "Your Fixer"
      )}
    </strong>

    <br>

    <span>
      ${escapeTrackHTML(
        request.technician_location ||
        "Fixer location"
      )}
    </span>
    `
  );


  /* Center map button */

  const centerButton =
    document.getElementById(
      "trackCenterMap"
    );


  if (centerButton) {

    centerButton.onclick =
      () => {

        trackMap.flyTo(
          [
            latitude,
            longitude
          ],
          16,
          {
            duration: 1.2
          }
        );


        setTimeout(
          () => {

            if (trackMarker) {
              trackMarker.openPopup();
            }

          },
          800
        );

      };

  }


  setTimeout(
    () => {

      if (trackMap) {
        trackMap.invalidateSize();
      }

    },
    250
  );

}



/* ========================================
   UPDATE MAP LOCATION
======================================== */

function updateTrackMapPosition(
  request
) {

  if (
    !trackMap ||
    !trackMarker
  ) {

    return;

  }


  const latitude =
    Number(
      request.technician_latitude
    );


  const longitude =
    Number(
      request.technician_longitude
    );


  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    return;

  }


  const currentPosition =
    trackMarker.getLatLng();


  const locationChanged =
    currentPosition.lat !== latitude ||
    currentPosition.lng !== longitude;


  if (locationChanged) {

    trackMarker.setLatLng(
      [
        latitude,
        longitude
      ]
    );


    trackMap.panTo(
      [
        latitude,
        longitude
      ],
      {
        animate: true,
        duration: 1
      }
    );

  }

}
/* ========================================
   REFRESH TRACKING
======================================== */

async function refreshTrackService(
  requestId,
  manual = true
) {

  const refreshButton =
    document.getElementById(
      "trackRefreshButton"
    );


  if (
    manual &&
    refreshButton
  ) {

    refreshButton.classList.add(
      "spinning"
    );

  }


  try {

    const response =
      await fetch(
        `/api/requests/${requestId}`,
        {
          method: "GET",
          credentials: "same-origin"
        }
      );


    if (response.status === 401) {

      sessionStorage.setItem(
        "redirectAfterLogin",
        window.location.href
      );

      window.location.href =
        "login.html";

      return;

    }


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success ||
      !data.request
    ) {

      return;

    }


    const dashboard =
      document.getElementById(
        "trackDashboard"
      );


    const oldStatus =
      dashboard
        ? dashboard.dataset.status
        : "";


    const newStatus =
      data.request.status;


    /* Refresh all information */

    renderTrackService(
      data.request
    );


    /* Update marker if location changed */

    updateTrackMapPosition(
      data.request
    );


    if (dashboard) {

      dashboard.dataset.status =
        newStatus;

    }


    /* ========================================
       SHOW STATUS CHANGE TOAST
    ======================================== */

    if (
      oldStatus &&
      normalizeTrackStatus(
        oldStatus
      ) !==
      normalizeTrackStatus(
        newStatus
      )
    ) {

      const info =
        getTrackStatusInfo(
          normalizeTrackStatus(
            newStatus
          )
        );


      showTrackToast(
        `Status updated: ${info.label}`
      );

    }


    setTrackText(
      "trackLastUpdated",
      "Updated just now"
    );


  } catch (error) {

    console.error(
      "Track refresh error:",
      error
    );

  } finally {

    if (refreshButton) {

      setTimeout(
        () => {

          refreshButton.classList.remove(
            "spinning"
          );

        },
        550
      );

    }

  }

}



/* ========================================
   TRACK PAGE INTERACTIONS
======================================== */

function setupTrackInteractions() {

  /* Start scroll animations */

  setupTrackScrollReveal();


  const params =
    new URLSearchParams(
      window.location.search
    );


  const requestId =
    params.get(
      "request"
    );


  /* ========================================
     REFRESH BUTTON
  ======================================== */

  const refreshButton =
    document.getElementById(
      "trackRefreshButton"
    );


  if (refreshButton) {

    refreshButton.onclick =
      () => {

        refreshTrackService(
          requestId,
          true
        );

      };

  }


  /* ========================================
     EXPAND MAP
  ======================================== */

  const expandButton =
    document.getElementById(
      "trackExpandMap"
    );


  const mapCard =
    document.getElementById(
      "trackMapCard"
    );


  if (
    expandButton &&
    mapCard
  ) {

    expandButton.onclick =
      () => {

        const expanded =
          mapCard.classList.toggle(
            "expanded"
          );


        document.body.classList.toggle(
          "track-map-open",
          expanded
        );


        expandButton.innerHTML =
          expanded
            ? `<i class="fa-solid fa-compress"></i>`
            : `<i class="fa-solid fa-expand"></i>`;


        setTimeout(
          () => {

            if (trackMap) {
              trackMap.invalidateSize();
            }

          },
          300
        );

      };

  }


  /* ========================================
     REQUEST DETAILS COLLAPSE
  ======================================== */

  const collapseButton =
    document.getElementById(
      "trackProblemToggle"
    );


  const collapseBody =
    document.getElementById(
      "trackProblemBody"
    );


  if (
    collapseButton &&
    collapseBody
  ) {

    collapseButton.onclick =
      () => {

        const collapsed =
          collapseBody.classList.toggle(
            "collapsed"
          );


        collapseButton.setAttribute(
          "aria-expanded",
          String(!collapsed)
        );


        const arrow =
          collapseButton.querySelector(
            ".fa-chevron-up, .fa-chevron-down"
          );


        if (arrow) {

          arrow.classList.toggle(
            "rotated"
          );

        }

      };

  }


  /* ========================================
     TIMELINE STAGE CLICKS
  ======================================== */

  document
    .querySelectorAll(
      ".track-step"
    )
    .forEach(
      step => {

        step.addEventListener(
          "click",
          () => {

            const stage =
              step.dataset.stage;


            openTrackStageModal(
              stage
            );

          }
        );

      }
    );


  /* ========================================
     CLOSE MODAL BUTTON
  ======================================== */

  const closeModalButton =
    document.getElementById(
      "trackModalClose"
    );


  if (closeModalButton) {

    closeModalButton.onclick =
      closeTrackStageModal;

  }


  /* ========================================
     CLOSE MODAL BY BACKDROP
  ======================================== */

  const modal =
    document.getElementById(
      "trackStageModal"
    );


  if (modal) {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          closeTrackStageModal();

        }

      }
    );

  }


  /* ========================================
     ESC KEY
  ======================================== */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeTrackStageModal();

      }

    }
  );

}



/* ========================================
   SCROLL REVEAL
======================================== */

function setupTrackScrollReveal() {

  const elements =
    document.querySelectorAll(
      ".track-scroll-reveal"
    );


  if (!elements.length) {
    return;
  }


  /* Fallback for older browsers */

  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(
      element => {

        element.classList.add(
          "visible"
        );

      }
    );

    return;

  }


  const observer =
    new IntersectionObserver(

      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target
                .classList
                .add(
                  "visible"
                );


              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },

      {
        threshold: 0.15,
        rootMargin:
          "0px 0px -30px 0px"
      }

    );


  elements.forEach(
    (element, index) => {

      element.style.transitionDelay =
        `${Math.min(
          index * 70,
          280
        )}ms`;


      observer.observe(
        element
      );

    }
  );

}
/* ========================================
   TIMELINE STAGE MODAL
======================================== */

function openTrackStageModal(stage) {

  const modal =
    document.getElementById(
      "trackStageModal"
    );


  if (!modal) {
    return;
  }


  const normalizedStage =
    normalizeTrackStatus(
      stage
    );


  const info =
    getTrackStatusInfo(
      normalizedStage
    );


  setTrackText(
    "trackModalLabel",
    info.label.toUpperCase()
  );


  setTrackText(
    "trackModalTitle",
    info.title
  );


  setTrackText(
    "trackModalDescription",
    info.description
  );


  const icon =
    document.getElementById(
      "trackModalIcon"
    );


  if (icon) {

    icon.innerHTML =
      `<i class="${info.icon}"></i>`;

  }


  modal.hidden = false;


  requestAnimationFrame(
    () => {

      modal.classList.add(
        "show"
      );

    }
  );

}



/* ========================================
   CLOSE STAGE MODAL
======================================== */

function closeTrackStageModal() {

  const modal =
    document.getElementById(
      "trackStageModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "show"
  );


  setTimeout(
    () => {

      modal.hidden = true;

    },
    220
  );

}



/* ========================================
   REVIEW BUTTON
   ONLY AFTER COMPLETED
======================================== */

function updateTrackCompletedState(
  status,
  request
) {

  const reviewButton =
    document.getElementById(
      "trackReviewButton"
    );


  if (!reviewButton) {
    return;
  }


  /* ========================================
     NOT COMPLETED
  ======================================== */

  if (
    status !== "completed"
  ) {

    reviewButton.hidden = true;

    reviewButton.style.display =
      "none";

    reviewButton.classList.remove(
      "review-ready"
    );

    reviewButton.onclick =
      null;

    return;

  }


  /* ========================================
     COMPLETED
  ======================================== */

  reviewButton.hidden =
    false;


  reviewButton.style.display =
    "inline-flex";


  reviewButton.classList.add(
    "review-ready"
  );


  reviewButton.onclick =
    () => {

      window.location.href =
        `profile.html?id=${request.technician_id}#reviews`;

    };

}



/* ========================================
   ERROR MESSAGE
======================================== */

function showTrackError(message) {

  const loading =
    document.getElementById(
      "trackLoading"
    );


  const dashboard =
    document.getElementById(
      "trackDashboard"
    );


  const error =
    document.getElementById(
      "trackError"
    );


  if (loading) {
    loading.hidden = true;
  }


  if (dashboard) {
    dashboard.hidden = true;
  }


  if (error) {

    error.hidden = false;


    const messageElement =
      error.querySelector(
        "p"
      );


    if (messageElement) {

      messageElement.textContent =
        message;

    }

  }

}



/* ========================================
   TOAST MESSAGE
======================================== */

function showTrackToast(message) {

  let toast =
    document.getElementById(
      "trackToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );


    toast.id =
      "trackToast";


    toast.className =
      "track-toast";


    document.body.appendChild(
      toast
    );

  }


  toast.innerHTML =
    `
    <i class="fa-solid fa-circle-check"></i>

    <span>
      ${escapeTrackHTML(message)}
    </span>
    `;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.trackToastTimer
  );


  window.trackToastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}



/* ========================================
   SET TEXT HELPER
======================================== */

function setTrackText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value ?? "";

  }

}



/* ========================================
   FIXER INITIALS
======================================== */

function getTrackInitials(name) {

  if (!name) {
    return "FX";
  }


  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      word =>
        word.charAt(0)
    )
    .join("")
    .toUpperCase();

}



/* ========================================
   FORMAT REQUEST DATE
======================================== */

function formatTrackDate(dateString) {

  if (!dateString) {
    return "—";
  }


  const normalized =
    String(dateString)
      .replace(
        " ",
        "T"
      );


  const date =
    new Date(
      normalized
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }


  return date.toLocaleString(
    "en-US",
    {

      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit"

    }
  );

}



/* ========================================
   ESCAPE HTML
======================================== */

function escapeTrackHTML(value) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}



/* ========================================
   CLEANUP WHEN LEAVING PAGE
======================================== */

window.addEventListener(
  "beforeunload",
  () => {

    if (
      window.trackRefreshInterval
    ) {

      clearInterval(
        window.trackRefreshInterval
      );

    }

  }
);



/* ========================================
   START TRACK SERVICE PAGE
======================================== */

loadTrackServicePage();
/* =========================================================
   TRACK SERVICE - NEW UI INTERACTIONS
   ========================================================= */


/* ========================================
   UPDATE NEW TRACK UI
======================================== */

function updateNewTrackUI(request) {

  if (!request) {
    return;
  }


  const status =
    normalizeTrackStatus(
      request.status
    );


  const fixerName =
    request.technician_name ||
    "Your Fixer";


  const fixerFirstName =
    fixerName
      .trim()
      .split(/\s+/)[0];


  /* ========================================
     HERO FIXER
  ======================================== */

  setTrackText(
    "trackHeroFixerName",
    fixerName
  );


  const heroAvatar =
    document.getElementById(
      "trackHeroFixerAvatar"
    );


  if (heroAvatar) {

    heroAvatar.textContent =
      getTrackInitials(
        fixerName
      );

  }


  /* ========================================
     MAP PROFILE BUTTON
  ======================================== */

  const mapProfileButton =
    document.getElementById(
      "trackMapProfileButton"
    );


  if (
    mapProfileButton &&
    request.technician_id
  ) {

    mapProfileButton.href =
      `profile.html?id=${request.technician_id}`;

  }


  /* ========================================
     STATUS-SPECIFIC CONTENT
  ======================================== */

  const states = {


    requested: {

      heroTitle:
        "Request received",

      heroDescription:
        `Waiting for ${fixerFirstName} to accept your request.`,

      nextTitle:
        `Waiting for ${fixerFirstName} to accept`,

      nextDescription:
        `Once ${fixerFirstName} accepts your request, we'll move you to the next stage.`,

      nextStage:
        "Accepted",

      nextIcon:
        "fa-solid fa-user-check"

    },


    accepted: {

      heroTitle:
        "Your Fixer accepted",

      heroDescription:
        `${fixerFirstName} accepted your request and is preparing for your service.`,

      nextTitle:
        `${fixerFirstName} is getting ready`,

      nextDescription:
        `Your next update will appear when ${fixerFirstName} starts heading your way.`,

      nextStage:
        "On the way",

      nextIcon:
        "fa-solid fa-route"

    },


    on_the_way: {

      heroTitle:
        "Your Fixer is on the way",

      heroDescription:
        `${fixerFirstName} is heading toward your service location.`,

      nextTitle:
        `${fixerFirstName} is heading your way`,

      nextDescription:
        "The next stage begins when your service work starts.",

      nextStage:
        "In progress",

      nextIcon:
        "fa-solid fa-car-side"

    },


    in_progress: {

      heroTitle:
        "Your service is in progress",

      heroDescription:
        `${fixerFirstName} is currently working on your service.`,

      nextTitle:
        "Almost there",

      nextDescription:
        "Once the work is finished, your review will become available.",

      nextStage:
        "Completed",

      nextIcon:
        "fa-solid fa-screwdriver-wrench"

    },


    completed: {

      heroTitle:
        "Service completed",

      heroDescription:
        `${fixerFirstName} finished your service. We hope everything went smoothly.`,

      nextTitle:
        "Your service is complete",

      nextDescription:
        `Tell us how your experience with ${fixerFirstName} went.`,

      nextStage:
        "Leave a review",

      nextIcon:
        "fa-solid fa-star"

    }

  };


  const state =
    states[status] ||
    states.requested;


  /* HERO */

  setTrackText(
    "trackNowTitle",
    state.heroTitle
  );


  setTrackText(
    "trackNowDescription",
    state.heroDescription
  );


  /* WHAT'S NEXT */

  setTrackText(
    "trackNextTitle",
    state.nextTitle
  );


  setTrackText(
    "trackNextDescription",
    state.nextDescription
  );


  setTrackText(
    "trackNextStage",
    state.nextStage
  );


  const nextIcon =
    document.getElementById(
      "trackNextIcon"
    );


  if (nextIcon) {

    nextIcon.className =
      state.nextIcon;

  }


  /* ========================================
     REVIEW SECTION
  ======================================== */

  const reviewSection =
    document.getElementById(
      "trackReviewSection"
    );


  const reviewButton =
    document.getElementById(
      "trackReviewButton"
    );


  if (
    reviewSection &&
    reviewButton
  ) {

    if (status === "completed") {

      reviewSection.hidden = false;
      reviewButton.hidden = false;


      reviewButton.onclick =
        () => {

          if (
            request.technician_id
          ) {

            window.location.href =
              `profile.html?id=${request.technician_id}#reviews`;

          }

        };


      requestAnimationFrame(
        () => {

          reviewSection.classList.add(
            "visible"
          );

        }
      );

    } else {

      reviewSection.hidden = true;
      reviewButton.hidden = true;
      reviewButton.onclick = null;

    }

  }

}



/* ========================================
   JOURNEY SCROLL BUTTON
======================================== */

function setupNewTrackExploreButton() {

  const exploreButton =
    document.getElementById(
      "trackExploreButton"
    );


  const journey =
    document.getElementById(
      "trackJourneyContent"
    );


  if (
    !exploreButton ||
    !journey ||
    exploreButton.dataset.ready === "true"
  ) {
    return;
  }


  exploreButton.dataset.ready =
    "true";


  exploreButton.addEventListener(
    "click",
    () => {

      journey.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }
  );

}



/* ========================================
   CONNECT NEW UI TO EXISTING RENDER
======================================== */

function connectNewTrackUI() {

  const dashboard =
    document.getElementById(
      "trackDashboard"
    );


  if (!dashboard) {
    return;
  }


  setupNewTrackExploreButton();


  /*
    The existing Track Service code stores
    the request data through renderTrackService().
    We watch the dashboard until the request
    has been rendered.
  */

  const observer =
    new MutationObserver(
      () => {

        const serviceName =
          document.getElementById(
            "trackServiceName"
          );


        if (
          serviceName &&
          !dashboard.hidden
        ) {

          setupNewTrackExploreButton();

        }

      }
    );


  observer.observe(
    dashboard,
    {
      attributes: true,
      childList: true,
      subtree: true
    }
  );

}



/* ========================================
   NEW SCROLL REVEAL
======================================== */

function setupNewTrackReveal() {

  const elements =
    document.querySelectorAll(
      ".track-scroll-reveal"
    );


  if (!elements.length) {
    return;
  }


  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(
      element => {

        element.classList.add(
          "visible"
        );

      }
    );

    return;
  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "visible"
              );


              observer.unobserve(
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


  elements.forEach(
    (element, index) => {

      element.style.transitionDelay =
        `${Math.min(index * 60, 240)}ms`;


      observer.observe(
        element
      );

    }
  );

}



/* ========================================
   RUN NEW TRACK UI
======================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (
      document.getElementById(
        "trackDashboard"
      )
    ) {

      connectNewTrackUI();

      setupNewTrackReveal();

    }

  }
);

/* ==================================================
   PROBLEM IMAGE - CAMERA / UPLOAD
================================================== */

const imageActionButton =
  document.getElementById("imageActionButton");

const imageActionMenu =
  document.getElementById("imageActionMenu");

const takePhotoButton =
  document.getElementById("takePhotoButton");

const uploadPhotoButton =
  document.getElementById("uploadPhotoButton");

const cameraImageInput =
  document.getElementById("cameraImageInput");

const uploadImageInput =
  document.getElementById("uploadImageInput");

const problemImagePreview =
  document.getElementById("problemImagePreview");

const problemImagePreviewImg =
  document.getElementById("problemImagePreviewImg");

const removeProblemImage =
  document.getElementById("removeProblemImage");


/*
  Keep the selected image available
  so we can send it to AI Vision later.
*/
let selectedProblemImage = null;


/* =========================
   OPEN / CLOSE IMAGE MENU
========================= */

if (
  imageActionButton &&
  imageActionMenu
) {

  imageActionButton.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      imageActionMenu.hidden =
        !imageActionMenu.hidden;

    }
  );


  /*
    Close the menu when clicking
    anywhere outside it.
  */
  document.addEventListener(
    "click",
    (event) => {

      if (
        !imageActionMenu.hidden &&
        !imageActionMenu.contains(event.target) &&
        !imageActionButton.contains(event.target)
      ) {

        imageActionMenu.hidden = true;

      }

    }
  );

}


/* =========================
   TAKE A PHOTO
========================= */

if (
  takePhotoButton &&
  cameraImageInput
) {

  takePhotoButton.addEventListener(
    "click",
    () => {

      imageActionMenu.hidden = true;

      cameraImageInput.click();

    }
  );


  cameraImageInput.addEventListener(
    "change",
    () => {

      const file =
        cameraImageInput.files[0];

      handleProblemImage(file);

    }
  );

}


/* =========================
   UPLOAD IMAGE
========================= */

if (
  uploadPhotoButton &&
  uploadImageInput
) {

  uploadPhotoButton.addEventListener(
    "click",
    () => {

      imageActionMenu.hidden = true;

      uploadImageInput.click();

    }
  );


  uploadImageInput.addEventListener(
    "change",
    () => {

      const file =
        uploadImageInput.files[0];

      handleProblemImage(file);

    }
  );

}


/* =========================
   HANDLE SELECTED IMAGE
========================= */

function handleProblemImage(file) {

  if (!file) {
    return;
  }


  /*
    Only allow image files.
  */
  if (!file.type.startsWith("image/")) {

    alert(
      "Please choose a valid image file."
    );

    return;
  }


  /*
    Limit image size to 5 MB.
  */
  const maxImageSize =
    5 * 1024 * 1024;


  if (file.size > maxImageSize) {

    alert(
      "Please choose an image smaller than 5 MB."
    );

    return;
  }


  selectedProblemImage =
    file;


  /*
    Create a temporary preview URL.
  */
  const imageUrl =
    URL.createObjectURL(file);


  problemImagePreviewImg.src =
    imageUrl;


  problemImagePreview.hidden =
    false;

}


/* =========================
   REMOVE IMAGE
========================= */

if (removeProblemImage) {

  removeProblemImage.addEventListener(
    "click",
    () => {

      selectedProblemImage = null;


      if (
        problemImagePreviewImg.src
      ) {

        URL.revokeObjectURL(
          problemImagePreviewImg.src
        );

      }


      problemImagePreviewImg.src =
        "";


      problemImagePreview.hidden =
        true;


      /*
        Clear both file inputs so the
        same image can be selected again.
      */
      cameraImageInput.value = "";

      uploadImageInput.value = "";

    }
  );

}

/* =========================================
   LOGIN REQUIRED POPUP
========================================= */

function showLoginRequiredPopup(
  redirectUrl
) {

  const oldPopup =
    document.getElementById(
      "loginRequiredPopup"
    );

  if (oldPopup) {
    oldPopup.remove();
  }


  const overlay =
    document.createElement("div");

  overlay.id =
    "loginRequiredPopup";

  overlay.className =
    "login-required-overlay";


  overlay.innerHTML = `
    <div class="login-required-card">

      <div class="login-required-icon">
        <i class="fa-solid fa-lock"></i>
      </div>

      <h3>
        Login Required
      </h3>

      <p>
        You need to log in before
        continuing with this action.
      </p>

      <div class="login-required-actions">

        <button
          type="button"
          class="login-required-cancel"
          id="loginRequiredCancel"
        >
          Cancel
        </button>

        <button
          type="button"
          class="login-required-login"
          id="loginRequiredLogin"
        >
          Log In
          <i class="fa-solid fa-arrow-right"></i>
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    overlay
  );


  const cancelButton =
    document.getElementById(
      "loginRequiredCancel"
    );


  const loginButton =
    document.getElementById(
      "loginRequiredLogin"
    );


  cancelButton.addEventListener(
    "click",
    () => {

      overlay.remove();

    }
  );


  loginButton.addEventListener(
    "click",
    () => {

      /*
        Save the page/action
        the user wanted to open.
      */
      localStorage.setItem(
        "redirectAfterLogin",
        redirectUrl
      );


      window.location.href =
        "login.html";

    }
  );


  overlay.addEventListener(
    "click",
    (event) => {

      if (
        event.target === overlay
      ) {

        overlay.remove();

      }

    }
  );

}


/* =========================================
   REQUIRE LOGIN BEFORE ACTION
========================================= */

async function requireLogin(
  redirectUrl
) {

  const user =
    await loadCurrentUser();


  if (user) {

    window.location.href =
      redirectUrl;

    return true;

  }


  showLoginRequiredPopup(
    redirectUrl
  );


  return false;

}
