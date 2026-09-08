import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  requireLogin,
} from "../utils/auth";

export default function useRequireLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  return function checkLogin() {
    return requireLogin(
      navigate,
      `${location.pathname}${location.search}`
    );
  };
}