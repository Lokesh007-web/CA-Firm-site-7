/* =========================================================
   CA Harshit Dudeja & Co. — script.js
   ========================================================= */

/* ---------- SETTINGS (edit only this block) ---------- */
const CONFIG = {
  whatsapp: "918010917581",                 // country code + number, no + or spaces
  // Get a free access key at https://web3forms.com (enter harshitdudeja.co@gmail.com)
  // and paste it below. Until then, the form falls back to opening WhatsApp.
  web3formsKey: "YOUR_WEB3FORMS_ACCESS_KEY",
};

// Pages share one script, so a missing element returns a harmless dummy instead of null
const NULL_EL = document.createElement("div");
const $ = (sel, root = document) => root.querySelector(sel) || NULL_EL;
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/* ---------- WhatsApp links with pre-filled messages ---------- */
$$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); });

/* ---------- Header: scroll shadow, mobile menu, back to top ---------- */
const header = $(".site-header");
const toTop = $("#toTop");
const nav = $("#nav");
const menuToggle = $("#menuToggle");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 10);
  toTop.hidden = window.scrollY < 700;
}, { passive: true });

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* Dropdown submenus (click/tap; hover also works on desktop via CSS) */
function closeSubs(except) {
  $$(".has-sub.open").forEach((li) => {
    if (li === except) return;
    li.classList.remove("open");
    $(".sub-toggle", li).setAttribute("aria-expanded", "false");
  });
}
$$(".sub-toggle").forEach((btn) => btn.addEventListener("click", () => {
  const li = btn.parentElement;
  const willOpen = !li.classList.contains("open");
  closeSubs(li);
  li.classList.toggle("open", willOpen);
  btn.setAttribute("aria-expanded", String(willOpen));
}));
document.addEventListener("click", (e) => { if (!e.target.closest(".has-sub")) closeSubs(); });
$$(".sub a").forEach((a) => a.addEventListener("click", () => closeSubs()));

function setMenu(open) {
  if (!open) closeSubs();
  nav.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menuToggle.innerHTML = `<svg class="i"><use href="#i-${open ? "x" : "menu"}"/></svg>`;
}
menuToggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

$("#year").textContent = new Date().getFullYear();

/* =========================================================
   INCOME TAX CALCULATOR  (FY 2026-27, resident individual < 60)
   New regime : 0-4L nil, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%,
                20-24L 25%, above 24L 30%. Std deduction 75,000.
                Rebate 87A: nil tax up to 12L taxable income (+ marginal relief).
   Old regime : 0-2.5L nil, 2.5-5L 5%, 5-10L 20%, above 10L 30%.
                Std deduction 50,000. Rebate 87A: nil tax up to 5L taxable income.
   Cess 4% on both. Surcharge, capital gains and special-rate income are NOT included.
   ========================================================= */
const NEW_SLABS = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
const OLD_SLABS = [[250000, 0], [500000, .05], [1000000, .20], [Infinity, .30]];

function slabTax(income, slabs) {
  let tax = 0, prev = 0;
  for (const [limit, rate] of slabs) {
    if (income > prev) tax += (Math.min(income, limit) - prev) * rate;
    prev = limit;
  }
  return tax;
}

function newRegimeTax(taxable) {
  let tax = slabTax(taxable, NEW_SLABS);
  if (taxable <= 1200000) tax = 0;
  else tax = Math.min(tax, taxable - 1200000);          // marginal relief
  return tax * 1.04;
}

function oldRegimeTax(taxable) {
  let tax = slabTax(taxable, OLD_SLABS);
  if (taxable <= 500000) tax = 0;
  return tax * 1.04;
}

function updateTax() {
  const gross = Math.max(0, parseFloat($("#taxIncome").value) || 0);
  const ded = Math.max(0, parseFloat($("#taxDeductions").value) || 0);
  const salaried = $("#taxSalaried").checked;

  const newTaxable = Math.max(0, gross - (salaried ? 75000 : 0));
  const oldTaxable = Math.max(0, gross - (salaried ? 50000 : 0) - ded);

  const tNew = newRegimeTax(newTaxable);
  const tOld = oldRegimeTax(oldTaxable);

  $("#taxNew").textContent = inr(tNew);
  $("#taxOld").textContent = inr(tOld);

  const diff = Math.abs(tNew - tOld);
  const v = $("#taxVerdict");
  if (Math.round(diff) === 0) v.innerHTML = "Both regimes give the <b>same tax</b> for these numbers.";
  else if (tNew < tOld) v.innerHTML = `New regime is cheaper by <b>${inr(diff)}</b> for these numbers.`;
  else v.innerHTML = `Old regime is cheaper by <b>${inr(diff)}</b> for these numbers.`;
}
["#taxIncome", "#taxDeductions", "#taxSalaried"].forEach((s) => $(s).addEventListener("input", updateTax));
updateTax();

/* =========================================================
   GST CALCULATOR  (rates after GST 2.0: 0 / 5 / 18 / 40)
   ========================================================= */
let gstMode = "add";
function updateGst() {
  const amount = Math.max(0, parseFloat($("#gstAmount").value) || 0);
  const rate = parseFloat($("#gstRate").value) || 0;
  let base, gst, total;

  if (gstMode === "add") {
    base = amount; gst = base * rate / 100; total = base + gst;
    $("#gstTotalLabel").textContent = "Total amount";
  } else {
    total = amount; base = total / (1 + rate / 100); gst = total - base;
    $("#gstTotalLabel").textContent = "Amount before GST";
  }

  $("#gstValue").textContent = inr(gst);
  $("#gstTotal").textContent = gstMode === "add" ? inr(total) : inr(base);

  const half = (gst / 2).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  $("#gstSplit").textContent = rate === 0
    ? "Nil-rated: no GST applies."
    : `Intra-state: CGST ₹${half} + SGST ₹${half}. Inter-state: IGST ₹${gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}.`;
}
$("#gstAmount").addEventListener("input", updateGst);
$("#gstRate").addEventListener("change", updateGst);
$$(".seg").forEach((b) => b.addEventListener("click", () => {
  gstMode = b.dataset.mode;
  $$(".seg").forEach((x) => x.classList.toggle("active", x === b));
  updateGst();
}));
updateGst();

/* =========================================================
   COMPLIANCE CALENDAR (builds itself from today's date)
   TDS/TCS deposit: 7th | GSTR-1 (monthly): 11th | GSTR-3B (monthly): 20th
   Advance tax: 15 Jun, 15 Sep, 15 Dec, 15 Mar
   ========================================================= */
function buildDeadlines() {
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const items = [];

  for (let k = 0; k < 4; k++) {
    const d = new Date(today.getFullYear(), today.getMonth() + k, 1);
    const y = d.getFullYear(), m = d.getMonth();
    const prev = MONTHS[(m + 11) % 12];

    // TDS deposit for March deductions is due on 30 April
    if (m === 3) items.push({ date: new Date(y, 3, 30), title: "TDS / TCS deposit", sub: `For deductions made in ${prev}` });
    else items.push({ date: new Date(y, m, 7), title: "TDS / TCS deposit", sub: `For deductions made in ${prev}` });

    items.push({ date: new Date(y, m, 11), title: "GSTR-1 filing", sub: `Monthly filers · for ${prev}` });
    items.push({ date: new Date(y, m, 20), title: "GSTR-3B filing", sub: `Monthly filers · for ${prev}` });
  }

  [[5, 15, "Advance tax – 1st instalment"], [8, 15, "Advance tax – 2nd instalment"], [11, 15, "Advance tax – 3rd instalment"], [2, 15, "Advance tax – 4th instalment"]]
    .forEach(([m, day, title]) => {
      for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
        items.push({ date: new Date(y, m, day), title, sub: "For taxpayers liable to pay advance tax" });
      }
    });

  const upcoming = items
    .filter((i) => i.date >= today)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  $("#deadlines").innerHTML = upcoming.map((i) => {
    const day = String(i.date.getDate()).padStart(2, "0");
    const mon = MONTHS[i.date.getMonth()].slice(0, 3);
    const label = `${i.date.getDate()} ${MONTHS[i.date.getMonth()]} ${i.date.getFullYear()}`;
    const msg = waLink(`Hello, please remind me about: ${i.title} (due ${label}).`);
    return `<li>
      <div class="date-box"><b>${day}</b><span>${mon}</span></div>
      <div class="deadline-text"><strong>${i.title}</strong><small>${i.sub}</small></div>
      <a class="wa-mini" href="${msg}" target="_blank" rel="noopener" aria-label="Remind me about ${i.title} on WhatsApp"><svg class="i"><use href="#i-whatsapp"/></svg></a>
    </li>`;
  }).join("");
}
buildDeadlines();

/* ---------- Document checklist tabs ---------- */
const tabs = $$(".tab");
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $("#panel-" + t.dataset.tab).hidden = !on;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(next); next.focus();
  });
});

/* =========================================================
   ARTICLES + PRIVACY POLICY (modal)
   ========================================================= */
const ARTICLES = {
  regime: {
    title: "New vs Old Tax Regime: How to Choose the Right One",
    wa: "Hello, I want help choosing between the old and new tax regime.",
    html: `
      <p>Every individual taxpayer has to pick one of two regimes each year. The right choice depends on how much you can claim in deductions.</p>
      <h4>New regime (default)</h4>
      <ul>
        <li>Lower slab rates: nil up to ₹4 lakh, then 5% to 30% across seven slabs.</li>
        <li>Standard deduction of ₹75,000 for salaried individuals and pensioners.</li>
        <li>Taxable income up to ₹12 lakh attracts no tax because of the Section 87A rebate. For a salaried person this means salary up to ₹12.75 lakh.</li>
        <li>Most deductions such as 80C, 80D and HRA are not available.</li>
      </ul>
      <h4>Old regime</h4>
      <ul>
        <li>Higher slab rates: nil up to ₹2.5 lakh, then 5%, 20% and 30%.</li>
        <li>Standard deduction of ₹50,000 for salaried individuals.</li>
        <li>Lets you claim 80C, 80D, HRA, home loan interest and other deductions.</li>
        <li>Rebate applies only up to ₹5 lakh of taxable income.</li>
      </ul>
      <h4>How to decide</h4>
      <p>If your total deductions and exemptions are large (for example a home loan, high HRA and full 80C), the old regime can still win. If you claim little, the new regime is usually cheaper. Use our calculator above for a quick comparison and talk to us before you submit your declaration to your employer.</p>
      <p><small>Rates shown are for FY 2026-27 and can change with each Budget.</small></p>`
  },
  gst: {
    title: "5 Common GST Filing Mistakes Small Businesses Should Avoid",
    wa: "Hello, I want help to make sure my GST filing is correct.",
    html: `
      <p>Small errors in GST returns can lead to notices, interest and blocked credit. These are the five we see most often.</p>
      <ul>
        <li><b>Mismatch between GSTR-1 and GSTR-3B.</b> Sales reported in one return should agree with the tax paid in the other.</li>
        <li><b>Claiming input tax credit that is not in GSTR-2B.</b> Credit should be claimed only for invoices that your supplier has actually reported.</li>
        <li><b>Wrong GSTIN, HSN/SAC code or tax rate on invoices.</b> After the GST rate changes of 2025, old rates still show up in billing software.</li>
        <li><b>Filing late.</b> Late fees apply per day and interest is charged on tax paid late. Even nil returns must be filed on time.</li>
        <li><b>Ignoring notices and portal messages.</b> Replies have time limits. A missed reply can turn a small query into an order.</li>
      </ul>
      <h4>A simple habit</h4>
      <p>Reconcile your purchase register with GSTR-2B every month before filing GSTR-3B. It catches most of these problems early.</p>`
  },
  structure: {
    title: "Private Limited or LLP: Which Structure Fits Your Business?",
    wa: "Hello, I need advice on Private Limited vs LLP for my business.",
    html: `
      <p>Both structures give you limited liability and a separate legal identity. The difference is in funding, compliance and how you plan to grow.</p>
      <h4>Private Limited Company</h4>
      <ul>
        <li>Needs at least two directors and two shareholders.</li>
        <li>Can raise equity from investors, so it suits startups planning to take funding.</li>
        <li>Statutory audit and annual ROC filings are compulsory every year.</li>
      </ul>
      <h4>Limited Liability Partnership (LLP)</h4>
      <ul>
        <li>Needs at least two partners.</li>
        <li>Lighter compliance and lower running cost, which suits professionals and small family businesses.</li>
        <li>Audit is required only above prescribed turnover or contribution limits.</li>
        <li>Cannot issue shares, so equity funding is harder.</li>
      </ul>
      <h4>Which one to pick</h4>
      <p>Choose a Private Limited Company if you expect investors, ESOPs or fast scaling. Choose an LLP if you want simpler compliance and no outside equity. Tax treatment also differs, so get advice on your numbers before deciding.</p>`
  },
  privacy: {
    title: "Privacy Policy",
    wa: "Hello, I have a question about your privacy policy.",
    html: `
      <p>CA Harshit Dudeja &amp; Co. respects your privacy. This page explains in simple words what we do with the information you share on this website.</p>
      <h4>What we collect</h4>
      <p>Only what you type into the query form: your name, phone number, email (optional), the service you need and your message.</p>
      <h4>How we use it</h4>
      <p>We use it only to reply to your query and to provide the service you ask for. We do not sell or share your details with third parties for marketing.</p>
      <h4>How it reaches us</h4>
      <p>Form submissions are sent to our email through a form-delivery service (Web3Forms). If you choose WhatsApp or phone instead, your conversation is handled through those apps under their own privacy terms.</p>
      <h4>Cookies and tracking</h4>
      <p>This website does not use advertising cookies. The embedded map and fonts are loaded from Google and follow Google's privacy policy.</p>
      <h4>Contact</h4>
      <p>To ask us to delete your details, email harshitdudeja.co@gmail.com.</p>`
  }
};

const modal = $("#modal");
function openArticle(key) {
  const a = ARTICLES[key];
  if (!a) return;
  $("#modalTitle").textContent = a.title;
  $("#modalBody").innerHTML = a.html;
  const wa = $("#modalWa");
  wa.href = waLink(a.wa);
  wa.hidden = key === "privacy";
  modal.showModal();
  $(".modal-inner", modal).scrollTop = 0;
}
$$("[data-article]").forEach((b) => b.addEventListener("click", () => openArticle(b.dataset.article)));
$("#modalClose").addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

/* =========================================================
   QUERY FORM
   - Sends to your email through Web3Forms when a key is set
   - Otherwise opens WhatsApp with the query pre-filled
   ========================================================= */
const form = $("#queryForm");
const statusEl = $("#formStatus");

function setError(id, msg) {
  const input = $("#" + id);
  const field = input.closest(".field");
  field.classList.toggle("invalid", !!msg);
  $(`.error[data-for="${id}"]`).textContent = msg || "";
}

function cleanPhone(raw) {
  let p = raw.replace(/[\s\-()]/g, "");
  p = p.replace(/^(\+?91|0)/, "");
  return p;
}

function validate() {
  let ok = true;
  const name = $("#qName").value.trim();
  const phone = cleanPhone($("#qPhone").value);
  const email = $("#qEmail").value.trim();
  const service = $("#qService").value;
  const msg = $("#qMessage").value.trim();

  if (name.length < 2) { setError("qName", "Please enter your full name."); ok = false; } else setError("qName");
  if (!/^[6-9]\d{9}$/.test(phone)) { setError("qPhone", "Enter a valid 10-digit mobile number."); ok = false; } else setError("qPhone");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError("qEmail", "Enter a valid email address."); ok = false; } else setError("qEmail");
  if (!service) { setError("qService", "Please select a service."); ok = false; } else setError("qService");
  if (msg.length < 5) { setError("qMessage", "Please describe your query briefly."); ok = false; } else setError("qMessage");

  return ok ? { name, phone, email, service, message: msg } : null;
}

function showStatus(type, text) {
  statusEl.className = "form-status " + type;
  statusEl.textContent = text;
}

["qName", "qPhone", "qEmail", "qService", "qMessage"].forEach((id) =>
  $("#" + id).addEventListener("input", () => setError(id)));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.className = "form-status"; statusEl.textContent = "";
  const data = validate();
  if (!data) return;
  if (form.elements.botcheck.checked) return;               // spam trap

  const btn = $("#qSubmit"), btnText = $("#qSubmitText");
  const keyMissing = !CONFIG.web3formsKey || CONFIG.web3formsKey.startsWith("YOUR_");

  // Fallback: no email key yet -> open WhatsApp with the query
  if (keyMissing) {
    const text = `Hello, I am ${data.name}.\nService: ${data.service}\nPhone: ${data.phone}\n${data.email ? "Email: " + data.email + "\n" : ""}Query: ${data.message}`;
    window.open(waLink(text), "_blank", "noopener");
    showStatus("ok", "Thank you! Your query is ready on WhatsApp. Please press Send there and we will contact you shortly.");
    return;
  }

  btn.disabled = true; btnText.textContent = "Sending...";
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey,
        subject: `New website query: ${data.service} (${data.name})`,
        from_name: "CA Harshit Dudeja & Co. website",
        name: data.name,
        phone: data.phone,
        email: data.email || "Not provided",
        service: data.service,
        message: data.message,
      }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      form.reset();
      showStatus("ok", "Thank you! We have received your query and will contact you shortly.");
    } else {
      throw new Error(json.message || "Request failed");
    }
  } catch (err) {
    showStatus("err", "Sorry, we could not send your query. Please message us on WhatsApp or call +91 80109 17581.");
  } finally {
    btn.disabled = false; btnText.textContent = "Submit Query";
  }
});


/* =========================================================
   PRACTICE AREA DETAILS (opens in the same popup)
   ========================================================= */
const SERVICE_DETAILS = {
  "Accounting & Bookkeeping": {
    what: ["Day-to-day bookkeeping and ledger maintenance", "Bank reconciliation", "Monthly MIS and management reports", "Preparation and finalisation of annual accounts"],
    who: "Shops, small and medium businesses, professionals and firms that want clean, up-to-date books.",
    docs: ["Bank statements", "Sales and purchase invoices", "Expense bills and vouchers", "Previous year's financial statements"]
  },
  "GST Compliance": {
    what: ["GST registration, amendment and cancellation", "Monthly and quarterly return filing (GSTR-1, GSTR-3B and others)", "Input tax credit reconciliation", "Replies to GST notices"],
    who: "Businesses that are registered under GST or need to register.",
    docs: ["GST portal login details", "Sales and purchase data", "Invoices and e-way bills, if any", "Bank statements"]
  },
  "Income Tax Filing": {
    what: ["ITR filing for salaried individuals, professionals and businesses", "Capital gains reporting", "Advance tax calculation", "Help with income tax notices and rectification"],
    who: "Salaried people, professionals, business owners, investors and anyone who has received an income tax notice.",
    docs: ["PAN and Aadhaar", "Form 16 / salary slips", "Form 26AS and AIS", "Bank statements and investment proofs"]
  },
  "Audit & Assurance": {
    what: ["Tax audit support where applicable", "GST and accounts review", "Certification work", "Internal checks to reduce errors and risk"],
    who: "Businesses and professionals whose turnover or activity requires an audit, or who want an independent review of their books.",
    docs: ["Complete books of accounts", "Trial balance and bank statements", "Loan, stock and fixed asset details", "Previous audit reports, if any"]
  },
  "Company / LLP Registration": {
    what: ["Choosing between Private Limited, LLP and other structures", "Name approval and incorporation filings", "PAN, TAN and GST registration", "Guidance on first-year compliance"],
    who: "Founders, startups and family businesses planning to move to a company or LLP structure.",
    docs: ["PAN and Aadhaar of all directors / partners", "Address proof and photographs", "Registered office proof with owner's NOC", "Proposed names"]
  },
  "Tax Planning & Advisory": {
    what: ["Old vs new tax regime comparison", "Planning of deductions and investments", "Advance tax and cash-flow planning", "Advice on structure for a growing business"],
    who: "Individuals and business owners who want to pay the right tax, legally, and plan ahead instead of at the last minute.",
    docs: ["Income details for the year", "Investment and loan details", "Previous year's returns"]
  }
};

$$(".service").forEach((card) => {
  const title = $("h3", card).textContent.trim();
  const d = SERVICE_DETAILS[title];
  if (!d) return;
  const key = "svc-" + title.toLowerCase().replace(/[^a-z]+/g, "-");
  ARTICLES[key] = {
    title,
    wa: `Hello, I want to know more about: ${title}.`,
    html: `<h4>What we do</h4><ul>${d.what.map((x) => `<li>${x}</li>`).join("")}</ul>
           <h4>Who it is for</h4><p>${d.who}</p>
           <h4>Documents usually needed</h4><ul>${d.docs.map((x) => `<li>${x}</li>`).join("")}</ul>
           <p><small>Exact requirements depend on your case. Message us and we will confirm.</small></p>`
  };
  const box = document.createElement("div");
  box.className = "svc-detail";
  box.innerHTML = ARTICLES[key].html;
  card.insertBefore(box, $("a.link-blue", card));
});

/* =========================================================
   GALLERY: add photos here. The Gallery section and menu
   link stay hidden until this list has at least one photo.
   Example: { src: "images/office-1.jpg", caption: "Our office" }
   ========================================================= */
const GALLERY = [];

if (GALLERY.length) {
  $("#galleryGrid").innerHTML = GALLERY.map((g) =>
    `<figure><img src="${g.src}" alt="${g.caption || "Photo"}" loading="lazy">${g.caption ? `<figcaption>${g.caption}</figcaption>` : ""}</figure>`).join("");
  $("#gallery").hidden = false;
  $("#navGallery").hidden = false;
}


/* =========================================================
   MULTI-PAGE: inline articles, privacy page, active menu link
   ========================================================= */
const articleList = $("#articleList");
if (articleList.isConnected) {
  ["regime", "gst", "structure"].forEach((k) => {
    const a = ARTICLES[k];
    articleList.insertAdjacentHTML("beforeend",
      `<article class="card long-article" id="${k}"><h2>${a.title}</h2>${a.html}<a class="btn btn-wa" href="${waLink(a.wa)}" target="_blank" rel="noopener"><svg class="i"><use href="#i-whatsapp"/></svg> Ask us about this</a></article>`);
  });
}
const policyBody = $("#policyBody");
if (policyBody.isConnected) policyBody.innerHTML = ARTICLES.privacy.html;

const here = (location.pathname.split("/").pop() || "index.html");
$$(".menu a[href]").forEach((a) => {
  const href = a.getAttribute("href");
  if (href === here) a.setAttribute("aria-current", "page");
});
$$(".has-sub").forEach((li) => {
  if (here !== "index.html" && $$(".sub a", li).some((a) => a.getAttribute("href").split("#")[0] === here)) $(".sub-toggle", li).classList.add("current");
});


/* =========================================================
   PAGE TRANSITIONS: short fade-out when leaving for another page
   (the loading screen itself is pure CSS, see style.css)
   ========================================================= */
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target === "_blank" || a.hasAttribute("download")) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !/(\.html?|\/)$/.test(url.pathname)) return;
  if (url.pathname === location.pathname) return;          // same page: normal instant jump
  e.preventDefault();
  document.body.classList.add("leaving");
  setTimeout(() => { location.href = a.href; }, 260);
});
window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("leaving"); });
