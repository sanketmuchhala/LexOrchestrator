"use client";

import { useEffect, useState } from "react";

export function useAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setLoggedIn(document.cookie.includes("lex_session="));
    setChecked(true);
  }, []);

  return { loggedIn, checked };
}
