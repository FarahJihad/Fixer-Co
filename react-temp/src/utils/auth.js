export function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

export function isGuest() {
  return localStorage.getItem("guestMode") === "true";
}

export function startGuestMode() {
  localStorage.setItem("guestMode", "true");
  localStorage.removeItem("isLoggedIn");
}

export function markLoggedIn() {
  localStorage.setItem("isLoggedIn", "true");
  localStorage.removeItem("guestMode");
}

export function clearAuthState() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("guestMode");
}

export function requireLogin(navigate, currentPath = "/") {
  if (isLoggedIn()) {
    return true;
  }

  localStorage.setItem("redirectAfterLogin", currentPath);

  if (!isGuest()) {
    localStorage.setItem("guestMode", "true");
  }

  navigate("/login");
  return false;
}