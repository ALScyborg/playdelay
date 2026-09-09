/**
 * PlayDelay — floating Help / support chat widget.
 * Posts to public.support_messages via Supabase REST (anon or user token).
 */
(() => {
  const SUPABASE_URL = "https://itcgsbzcopdkccobcfha.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Y2dzYnpjb3Bka2Njb2JjZmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MzEwOTksImV4cCI6MjEwNDQwNzA5OX0.OFiNUkxAV4XDIgGVzbcKhSywcibcXnNM8Xts1KnEVE8";
  const STORAGE_KEY = "playdelay.supabase.session";

  const CHIPS = [
    "Stream not playing",
    "Delay won’t sync",
    "Billing / credits",
  ];

  function readSessionLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function resolveSession() {
    if (window.PlayDelayAuth && typeof window.PlayDelayAuth.getSession === "function") {
      try {
        return await window.PlayDelayAuth.getSession();
      } catch {
        /* fall through */
      }
    }
    return readSessionLocal();
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        const v = attrs[k];
        if (v == null || v === false) return;
        if (k === "className") node.className = v;
        else if (k === "textContent") node.textContent = v;
        else if (k === "htmlFor") node.htmlFor = v;
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "hidden") node.hidden = !!v;
        else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function build() {
    if (document.getElementById("pd-support-root")) return;

    const root = el("div", { id: "pd-support-root", className: "pd-support-root" });

    const fab = el(
      "button",
      {
        type: "button",
        className: "pd-support-fab",
        id: "pdSupportFab",
        "aria-expanded": "false",
        "aria-controls": "pdSupportPanel",
        "aria-label": "Help — open customer service chat",
        title: "Help",
        textContent: "?",
      }
    );

    const panel = el("div", {
      id: "pdSupportPanel",
      className: "pd-support-panel",
      role: "dialog",
      "aria-labelledby": "pdSupportTitle",
      "aria-modal": "true",
      hidden: true,
    });

    const head = el("div", { className: "pd-support-head" }, [
      el("h2", { id: "pdSupportTitle", className: "pd-support-title", textContent: "Help" }),
      el("button", {
        type: "button",
        className: "pd-support-close",
        id: "pdSupportClose",
        "aria-label": "Close help",
        textContent: "×",
      }),
    ]);

    const form = el("form", { id: "pdSupportForm", className: "pd-support-form", novalidate: true });

    const chipsWrap = el("div", {
      className: "pd-support-chips",
      role: "group",
      "aria-label": "Quick topics",
    });
    CHIPS.forEach((label) => {
      chipsWrap.appendChild(
        el("button", {
          type: "button",
          className: "pd-support-chip",
          "data-chip": label,
          textContent: label,
        })
      );
    });

    const nameField = el("label", { className: "field pd-support-field" }, [
      el("span", { className: "field-label", textContent: "Name (optional)" }),
      el("input", {
        className: "field-input",
        id: "pdSupportName",
        name: "name",
        type: "text",
        autocomplete: "name",
        maxlength: "120",
        placeholder: "Your name",
      }),
    ]);

    const emailField = el("label", { className: "field pd-support-field" }, [
      el("span", { className: "field-label", textContent: "Email" }),
      el("input", {
        className: "field-input",
        id: "pdSupportEmail",
        name: "email",
        type: "email",
        autocomplete: "email",
        inputmode: "email",
        required: true,
        maxlength: "254",
        placeholder: "you@example.com",
      }),
    ]);

    const msgField = el("label", { className: "field pd-support-field" }, [
      el("span", { className: "field-label", textContent: "Message" }),
      el("textarea", {
        className: "field-input pd-support-textarea",
        id: "pdSupportMessage",
        name: "message",
        required: true,
        rows: "4",
        maxlength: "4000",
        placeholder: "What’s going wrong?",
      }),
    ]);

    const err = el("p", {
      id: "pdSupportError",
      className: "pd-support-error",
      role: "alert",
      hidden: true,
    });

    const success = el("div", {
      id: "pdSupportSuccess",
      className: "pd-support-success",
      role: "status",
      hidden: true,
    });
    success.appendChild(
      el("p", {
        textContent: "Thanks — we’ll reply by email.",
      })
    );
    success.appendChild(
      el("p", { className: "pd-support-success-mail" }, [
        el("a", {
          href: "mailto:support@playdelay.app",
          textContent: "support@playdelay.app",
        }),
      ])
    );

    const actions = el("div", { className: "pd-support-actions" }, [
      el("button", {
        type: "submit",
        className: "btn btn-cta pd-support-send",
        id: "pdSupportSend",
        textContent: "Send",
      }),
    ]);

    form.appendChild(chipsWrap);
    form.appendChild(nameField);
    form.appendChild(emailField);
    form.appendChild(msgField);
    form.appendChild(err);
    form.appendChild(actions);

    panel.appendChild(head);
    panel.appendChild(form);
    panel.appendChild(success);

    const backdrop = el("button", {
      type: "button",
      className: "pd-support-backdrop",
      id: "pdSupportBackdrop",
      "aria-label": "Close help",
      hidden: true,
    });

    root.appendChild(backdrop);
    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(root);

    const emailInput = document.getElementById("pdSupportEmail");
    const msgInput = document.getElementById("pdSupportMessage");
    const nameInput = document.getElementById("pdSupportName");
    const sendBtn = document.getElementById("pdSupportSend");

    function setOpen(open) {
      panel.hidden = !open;
      backdrop.hidden = !open;
      fab.setAttribute("aria-expanded", open ? "true" : "false");
      root.classList.toggle("is-open", open);
      fab.textContent = open ? "Help" : "?";
      if (open) {
        prefill().then(() => {
          (emailInput.value ? msgInput : emailInput).focus();
        });
      } else {
        fab.focus();
      }
    }

    function showError(text) {
      err.textContent = text || "";
      err.hidden = !text;
    }

    function showSuccess(on) {
      form.hidden = !!on;
      success.hidden = !on;
      if (on) showError("");
    }

    async function prefill() {
      const session = await resolveSession();
      const user = session && session.user;
      if (user && user.email && !emailInput.value) {
        emailInput.value = user.email;
      }
    }

    // Always start minimized/closed (panel CSS uses display:flex which can fight [hidden])
    setOpen(false);
    fab.textContent = "?";

    fab.addEventListener("click", () => {
      const open = panel.hidden;
      if (open) showSuccess(false);
      setOpen(open);
    });
    document.getElementById("pdSupportClose").addEventListener("click", () => setOpen(false));
    backdrop.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) {
        e.preventDefault();
        setOpen(false);
      }
    });

    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-chip]");
      if (!btn) return;
      const label = btn.getAttribute("data-chip") || "";
      msgInput.value = label;
      msgInput.focus();
      chipsWrap.querySelectorAll(".pd-support-chip").forEach((c) => {
        c.classList.toggle("is-active", c === btn);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showError("");
      showSuccess(false);

      const name = (nameInput.value || "").trim();
      const email = (emailInput.value || "").trim().toLowerCase();
      const message = (msgInput.value || "").trim();

      if (!email || !email.includes("@") || email.length < 3) {
        showError("Enter a valid email so we can reply.");
        emailInput.focus();
        return;
      }
      if (!message || message.length < 3) {
        showError("Write a short message about what’s wrong.");
        msgInput.focus();
        return;
      }
      if (message.length > 4000) {
        showError("Message is too long — keep it under 4000 characters.");
        msgInput.focus();
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = "Sending…";

      try {
        const session = await resolveSession();
        const token =
          (session && session.access_token) || SUPABASE_ANON_KEY;
        const userId = session && session.user && session.user.id;

        const body = {
          name: name || null,
          email,
          message,
          page_url: location.href,
          user_agent: navigator.userAgent || null,
        };
        if (userId) body.user_id = userId;

        const res = await fetch(SUPABASE_URL + "/rest/v1/support_messages", {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let detail = "";
          try {
            const data = await res.json();
            detail = data.message || data.error_description || data.msg || data.error || "";
          } catch (_) {}
          throw new Error(detail || "Couldn’t send — try again in a moment.");
        }

        form.reset();
        chipsWrap.querySelectorAll(".pd-support-chip").forEach((c) => c.classList.remove("is-active"));
        showSuccess(true);
        await prefill();
      } catch (ex) {
        showError((ex && ex.message) || "Couldn’t send — try again in a moment.");
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
