/** Character and value limits aligned with product rules. Export for maxLength on inputs. */
export const LIMITS = {
  SUBSCRIPTION_TITLE: 50,
  SUBSCRIPTION_CONTENT: 5000,
  /** Max characters allowed in the price field (as typed). */
  SUBSCRIPTION_PRICE_CHARS: 6,
  /** Max characters allowed in the duration field (as typed). */
  SUBSCRIPTION_DURATION_CHARS: 6,

  REFERRAL_CODE: 100,
  REFERRAL_DISCOUNT_MAX_AMOUNT: 100000,

  PROFESSION_NAME: 50,

  /** cms.title column (DB) */
  CMS_TITLE: 100,

  NOTIFY_TITLE: 50,
  NOTIFY_MSG: 2000,

  LOGIN_EMAIL: 254,
  /** Password: min 6, max 12 (login + change password). */
  LOGIN_PASSWORD_MIN: 6,
  LOGIN_PASSWORD_MAX: 12,

  SEARCH_QUERY: 255,

  /** Profile display name (edit profile). */
  PROFILE_NAME_MAX: 50,
};

/** @returns {Record<string, string>} */
export function subscriptionPlanFieldErrors(form) {
  const errors = {};
  const title = String(form.title ?? "").trim();
  if (!title) errors.title = "Title is required.";
  else if (title.length > LIMITS.SUBSCRIPTION_TITLE) {
    errors.title = `Title must be at most ${LIMITS.SUBSCRIPTION_TITLE} characters.`;
  }

  const content = String(form.content ?? "");
  if (content.length > LIMITS.SUBSCRIPTION_CONTENT) {
    errors.content = `Content must be at most ${LIMITS.SUBSCRIPTION_CONTENT} characters.`;
  }

  const priceRaw = form.price;
  const priceStr = priceRaw === null || priceRaw === undefined ? "" : String(priceRaw).trim();
  if (priceStr.length > LIMITS.SUBSCRIPTION_PRICE_CHARS) {
    errors.price = `Price must be at most ${LIMITS.SUBSCRIPTION_PRICE_CHARS} characters.`;
  } else {
    const price = typeof priceRaw === "string" ? parseFloat(priceRaw) : Number(priceRaw);
    if (
      priceRaw === "" ||
      priceRaw === null ||
      priceRaw === undefined ||
      Number.isNaN(price) ||
      !Number.isFinite(price)
    ) {
      errors.price = "Enter a valid price.";
    } else if (price < 0) {
      errors.price = "Price cannot be negative.";
    }
  }

  const durRaw = form.duration;
  const durStr = durRaw === null || durRaw === undefined ? "" : String(durRaw).trim();
  if (durStr.length > LIMITS.SUBSCRIPTION_DURATION_CHARS) {
    errors.duration = `Duration must be at most ${LIMITS.SUBSCRIPTION_DURATION_CHARS} characters.`;
  } else {
    const durNum = typeof durRaw === "string" ? Number(durRaw) : Number(durRaw);
    if (durRaw === "" || durRaw === null || durRaw === undefined || Number.isNaN(durNum)) {
      errors.duration = "Duration is required (whole days).";
    } else if (!Number.isInteger(durNum)) {
      errors.duration = "Use a whole number of days.";
    } else if (durNum < 0) {
      errors.duration = "Duration cannot be negative.";
    }
  }

  return errors;
}

export function subscriptionPlanIsValid(form) {
  return Object.keys(subscriptionPlanFieldErrors(form)).length === 0;
}

const REFERRAL_ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function todayUtcYmd() {
  return new Date().toISOString().slice(0, 10);
}

/** @returns {Record<string, string>} */
export function referralFormFieldErrors(form) {
  const errors = {};
  const code = String(form.code ?? "").trim();
  if (!code) errors.code = "Code is required.";
  else if (code.length > LIMITS.REFERRAL_CODE) {
    errors.code = `Code must be at most ${LIMITS.REFERRAL_CODE} characters.`;
  }

  const typeRaw = form.discount_type;
  const typeNum = Number(typeRaw);
  if (
    typeRaw === "" ||
    typeRaw === null ||
    typeRaw === undefined ||
    Number.isNaN(typeNum) ||
    (typeNum !== 1 && typeNum !== 2)
  ) {
    errors.discount_type = "Discount type is required.";
  }

  const discRaw = form.discount;
  const discount = typeof discRaw === "string" ? parseFloat(discRaw) : Number(discRaw);
  if (
    discRaw === "" ||
    discRaw === null ||
    discRaw === undefined ||
    Number.isNaN(discount) ||
    !Number.isFinite(discount)
  ) {
    errors.discount = "Discount value is required.";
  } else if (discount < 0) {
    errors.discount = "Discount cannot be negative.";
  } else {
    const t = typeNum === 2 ? 2 : 1;
    if (t === 1 && discount > 100) errors.discount = "Percent discount cannot exceed 100.";
    if (t === 2 && discount > LIMITS.REFERRAL_DISCOUNT_MAX_AMOUNT) {
      errors.discount = `Amount cannot exceed ${LIMITS.REFERRAL_DISCOUNT_MAX_AMOUNT}.`;
    }
  }

  const start = String(form.start_date ?? "").trim().slice(0, 10);
  const end = String(form.end_date ?? "").trim().slice(0, 10);
  const today = todayUtcYmd();

  if (!start) {
    errors.start_date = "Start date is required.";
  } else if (!REFERRAL_ISO_DATE.test(start)) {
    errors.start_date = "Start date must use YYYY-MM-DD format.";
  } else if (start < today) {
    errors.start_date = "Start date cannot be before today.";
  }

  if (!end) {
    errors.end_date = "End date is required.";
  } else if (!REFERRAL_ISO_DATE.test(end)) {
    errors.end_date = "End date must use YYYY-MM-DD format.";
  } else if (start && REFERRAL_ISO_DATE.test(start) && end < start) {
    errors.end_date = "End date must be on or after start date.";
  }

  return errors;
}

export function referralFormIsValid(form) {
  return Object.keys(referralFormFieldErrors(form)).length === 0;
}

export function professionNameFieldError(name) {
  const t = String(name ?? "").trim();
  if (!t) return "Name is required.";
  if (t.length > LIMITS.PROFESSION_NAME) {
    return `Name must be at most ${LIMITS.PROFESSION_NAME} characters.`;
  }
  return "";
}

function stripRichText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cmsFieldErrors(title, contentHtml) {
  const errors = {};
  const t = String(title ?? "").trim();
  if (!t) errors.title = "Title is required.";
  else if (t.length > LIMITS.CMS_TITLE) {
    errors.title = `Title must be at most ${LIMITS.CMS_TITLE} characters.`;
  }

  const plain = stripRichText(contentHtml);
  if (!plain) errors.content = "Content is required.";

  return errors;
}

export function cmsFormIsValid(title, contentHtml) {
  return Object.keys(cmsFieldErrors(title, contentHtml)).length === 0;
}

/** @returns {Record<string, string>} */
export function notificationFieldErrors(title, msg) {
  const errors = {};
  const ti = String(title ?? "");
  if (!ti.trim()) errors.title = "Title is required.";
  else if (ti.length > LIMITS.NOTIFY_TITLE) {
    errors.title = `Title must be at most ${LIMITS.NOTIFY_TITLE} characters.`;
  }

  const m = String(msg ?? "");
  if (!m.trim()) errors.msg = "Message is required.";
  else if (m.length > LIMITS.NOTIFY_MSG) {
    errors.msg = `Message must be at most ${LIMITS.NOTIFY_MSG} characters.`;
  }

  return errors;
}

export function notificationFormIsValid(title, msg) {
  return Object.keys(notificationFieldErrors(title, msg)).length === 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function loginEmailError(email) {
  const v = String(email ?? "").trim();
  if (!v) return "Email is required.";
  if (v.length > LIMITS.LOGIN_EMAIL) {
    return `Email must be at most ${LIMITS.LOGIN_EMAIL} characters.`;
  }
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}

export function loginPasswordError(password) {
  const v = String(password ?? "");
  if (!v) return "Password is required.";
  if (v.length < LIMITS.LOGIN_PASSWORD_MIN) {
    return `Password must be at least ${LIMITS.LOGIN_PASSWORD_MIN} characters.`;
  }
  if (v.length > LIMITS.LOGIN_PASSWORD_MAX) {
    return `Password must be at most ${LIMITS.LOGIN_PASSWORD_MAX} characters.`;
  }
  return "";
}
