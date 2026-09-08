const GOOGLE_SCRIPT_ID = "google-identity-services";


// ========================================
// GET GOOGLE CLIENT ID
// ========================================

function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
}


// ========================================
// LOAD GOOGLE IDENTITY SCRIPT
// ========================================

function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }

    const existingScript =
      document.getElementById(
        GOOGLE_SCRIPT_ID
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => {
          resolve(window.google);
        },
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => {
          reject(
            new Error(
              "Unable to load Google authentication."
            )
          );
        },
        { once: true }
      );

      return;
    }

    const script =
      document.createElement("script");

    script.id =
      GOOGLE_SCRIPT_ID;

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(window.google);
    };

    script.onerror = () => {
      reject(
        new Error(
          "Unable to load Google authentication."
        )
      );
    };

    document.head.appendChild(script);
  });
}


// ========================================
// REQUEST GOOGLE ACCESS TOKEN
// ========================================

function requestGoogleAccessToken(
  google,
  clientId
) {
  return new Promise(
    (resolve, reject) => {
      const tokenClient =
        google.accounts.oauth2
          .initTokenClient({
            client_id:
              clientId,

            scope:
              "openid email profile",

            callback:
              (response) => {
                if (
                  response?.error
                ) {
                  reject(
                    new Error(
                      response.error_description ||
                        response.error
                    )
                  );

                  return;
                }

                if (
                  !response?.access_token
                ) {
                  reject(
                    new Error(
                      "Google did not return an access token."
                    )
                  );

                  return;
                }

                resolve(
                  response.access_token
                );
              },

            error_callback:
              (error) => {
                console.error(
                  "Google popup error:",
                  error
                );

                reject(
                  new Error(
                    "Google sign-in was closed or blocked."
                  )
                );
              },
          });

      tokenClient.requestAccessToken({
        prompt:
          "select_account",
      });
    }
  );
}


// ========================================
// LOGIN WITH GOOGLE
// ========================================

export async function loginWithGoogle() {
  const clientId =
    getGoogleClientId();

  if (!clientId) {
    throw new Error(
      "Google login is not configured yet."
    );
  }

  const google =
    await loadGoogleIdentityScript();

  if (
    !google?.accounts?.oauth2
  ) {
    throw new Error(
      "Google authentication could not be loaded."
    );
  }


  // Get Google access token
  const accessToken =
    await requestGoogleAccessToken(
      google,
      clientId
    );


  // Send token to Fixer.Co backend
  const response =
    await fetch(
      "/api/google-login",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials:
          "same-origin",

        body:
          JSON.stringify({
            access_token:
              accessToken,
          }),
      }
    );


  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Invalid response from the server."
    );
  }


  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        "Unable to continue with Google."
    );
  }


  return data;
}