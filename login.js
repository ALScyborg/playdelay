/**
 * login.html — sign in / sign up via PlayDelayAuth; then player.html (free).
 */
(() => {
  const auth = window.PlayDelayAuth;
  if (!auth) {
    console.error("PlayDelayAuth missing");
    return;
  }

  const params = new URLSearchParams(location.search);
  let next = params.get("next") || "player.html";
  if (next === "login.html" || next.includes("://")) next = "player.html";

  let mode = "signin";

  const title = document.getElementById("login-title");
  const note = document.getElementById("authNote");
  const submitBtn = document.getElementById("submitBtn");
  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const password = document.getElementById("password");
  const err = document.getElementById("loginError");
  const info = document.getElementById("loginInfo");
  const form = document.getElementById("authForm");

  function setMode(m) {
    mode = m;
    const isUp = m === "signup";
    title.textContent = isUp ? "Create account" : "Sign in";
    note.textContent = isUp
      ? "Create an account with email and password (min 6 characters), then open the player."
      : "Use your email and password to open the player. Free while we test.";
    submitBtn.textContent = isUp ? "Create account" : "Sign in";
    password.autocomplete = isUp ? "new-password" : "current-password";
    tabSignIn.classList.toggle("is-active", !isUp);
    tabSignUp.classList.toggle("is-active", isUp);
    tabSignIn.setAttribute("aria-selected", String(!isUp));
    tabSignUp.setAttribute("aria-selected", String(isUp));
    err.hidden = true;
    info.hidden = true;
  }

  tabSignIn.addEventListener("click", () => setMode("signin"));
  tabSignUp.addEventListener("click", () => setMode("signup"));

  auth
    .getUser()
    .then((user) => {
      if (!user) return;
      location.replace(next);
    })
    .catch(() => {});

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    info.hidden = true;
    const email = document.getElementById("email").value.trim();
    const pw = password.value;
    if (!email || !email.includes("@")) {
      err.textContent = "Enter a valid email.";
      err.hidden = false;
      return;
    }
    if (!pw || pw.length < 6) {
      err.textContent = "Password must be at least 6 characters.";
      err.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === "signup" ? "Creating…" : "Signing in…";

    try {
      if (mode === "signup") {
        const data = await auth.signUp(email, pw);
        if (!data.session) {
          info.textContent =
            "Account created. If email confirmation is enabled, check your inbox, then sign in.";
          info.hidden = false;
          setMode("signin");
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign in";
          return;
        }
      } else {
        await auth.signIn(email, pw);
      }
      location.replace(next);
    } catch (ex) {
      err.textContent = (ex && ex.message) || "Something went wrong. Try again.";
      err.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = mode === "signup" ? "Create account" : "Sign in";
    }
  });
})();
