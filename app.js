const STORAGE_KEYS = {
  customers: "up2date_customers_v1",
  jobs: "up2date_jobs_v1",
  expenses: "up2date_expenses_v1",
  settings: "up2date_settings_v1"
};

const state = {
  customers: [],
  jobs: [],
  expenses: [],
  settings: {
    businessName: "Up2Date",
    ownerName: "",
    phone: "",
    defaultPrice: 55
  },
  currentView: "home",
  jobFilter: "upcoming",
  customerSearch: ""
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function makeId(prefix) {
  if (window.crypto && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readFromStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  state.customers = readFromStorage(
    STORAGE_KEYS.customers,
    []
  );

  state.jobs = readFromStorage(
    STORAGE_KEYS.jobs,
    []
  );

  state.expenses = readFromStorage(
    STORAGE_KEYS.expenses,
    []
  );

  state.settings = {
    ...state.settings,
    ...readFromStorage(
      STORAGE_KEYS.settings,
      {}
    )
  };
}

function saveAll() {
  saveToStorage(
    STORAGE_KEYS.customers,
    state.customers
  );

  saveToStorage(
    STORAGE_KEYS.jobs,
    state.jobs
  );

  saveToStorage(
    STORAGE_KEYS.expenses,
    state.expenses
  );

  saveToStorage(
    STORAGE_KEYS.settings,
    state.settings
  );
}

function todayString() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function currency(value) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD"
    }
  ).format(Number(value || 0));
}

function formatDate(
  dateString,
  options = {}
) {
  if (!dateString) return "";

  const date = new Date(
    `${dateString}T12:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: options.year
        ? "numeric"
        : undefined
    }
  ).format(date);
}

function formatTime(timeString) {
  if (!timeString) {
    return "Any time";
  }

  const [hours, minutes] =
    timeString
      .split(":")
      .map(Number);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(
    () => {
      toast.classList.remove(
        "show"
      );
    },
    2200
  );
}

function openModal(id) {
  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.hidden = false;

  document.body.style.overflow =
    "hidden";
}

function closeModal(id) {
  const modal =
    document.getElementById(id);

  if (!modal) return;

  modal.hidden = true;

  document.body.style.overflow =
    "";
}

function switchView(viewName) {
  state.currentView = viewName;

  $$(".view").forEach(
    (view) => {
      view.classList.toggle(
        "active",
        view.dataset.view ===
          viewName
      );
    }
  );

  $$(".nav-item").forEach(
    (button) => {
      button.classList.toggle(
        "active",
        button.dataset.navView ===
          viewName
      );
    }
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (viewName === "home") {
    renderHome();
  }

  if (
    viewName === "customers"
  ) {
    renderCustomers();
  }

  if (viewName === "jobs") {
    renderJobs();
  }

  if (viewName === "settings") {
    renderSettings();
  }
}

function customerById(id) {
  return state.customers.find(
    (customer) =>
      customer.id === id
  );
}

function jobBadge(job) {
  if (
    job.status === "Completed"
  ) {
    return `
      <span class="badge completed">
        Completed
      </span>
    `;
  }

  if (
    job.status === "Canceled"
  ) {
    return `
      <span class="badge canceled">
        Canceled
      </span>
    `;
  }

  if (
    job.date < todayString()
  ) {
    return `
      <span class="badge overdue">
        Overdue
      </span>
    `;
  }

  return `
    <span class="badge">
      Scheduled
    </span>
  `;
}

function renderHome() {
  const completedJobs =
    state.jobs.filter(
      (job) =>
        job.status ===
        "Completed"
    );

  const revenue =
    completedJobs.reduce(
      (sum, job) =>
        sum +
        Number(job.price || 0),
      0
    );

  const expenses =
    state.expenses.reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.amount || 0
        ),
      0
    );

  const profit =
    revenue - expenses;

  const today = todayString();

  const todayJobs =
    state.jobs
      .filter(
        (job) =>
          job.date === today &&
          job.status !==
            "Canceled"
      )
      .sort((a, b) =>
        (a.time || "23:59")
          .localeCompare(
            b.time || "23:59"
          )
      );

  $("#revenueStat").textContent =
    currency(revenue);

  $("#expensesStat").textContent =
    currency(expenses);

  $("#profitStat").textContent =
    currency(profit);

  $("#todayJobsStat").textContent =
    String(todayJobs.length);

  const todayJobsList =
    $("#todayJobsList");

  if (!todayJobs.length) {
    todayJobsList.innerHTML = `
      <div class="empty-state">
        <strong>
          No jobs scheduled today
        </strong>

        <p>
          Add a job from the Jobs
          tab when you are ready.
        </p>
      </div>
    `;
  } else {
    todayJobsList.innerHTML =
      todayJobs
        .map((job) => {
          const customer =
            customerById(
              job.customerId
            );

          return `
            <div class="list-row">
              <div class="list-main">
                <p class="list-title">
                  ${escapeHTML(
                    customer?.name ||
                      "Unknown customer"
                  )}
                </p>

                <p class="list-subtitle">
                  ${escapeHTML(
                    job.service
                  )}
                  ·
                  ${escapeHTML(
                    formatTime(
                      job.time
                    )
                  )}
                  ${
                    job.status ===
                    "Completed"
                      ? " · Completed"
                      : ""
                  }
                </p>
              </div>

              <span class="list-amount">
                ${currency(
                  job.price
                )}
              </span>
            </div>
          `;
        })
        .join("");
  }

  const recentExpenses =
    [...state.expenses]
      .sort((a, b) =>
        b.date.localeCompare(
          a.date
        )
      )
      .slice(0, 5);

  const recentExpensesList =
    $("#recentExpensesList");

  if (!recentExpenses.length) {
    recentExpensesList.innerHTML = `
      <div class="empty-state">
        <strong>
          No expenses yet
        </strong>

        <p>
          Record fuel, repairs,
          supplies, and other
          business costs here.
        </p>
      </div>
    `;
  } else {
    recentExpensesList.innerHTML =
      recentExpenses
        .map(
          (expense) => `
            <div class="list-row">
              <div class="list-main">
                <p class="list-title">
                  ${escapeHTML(
                    expense.description
                  )}
                </p>

                <p class="list-subtitle">
                  ${escapeHTML(
                    expense.category
                  )}
                  ·
                  ${escapeHTML(
                    formatDate(
                      expense.date
                    )
                  )}
                </p>
              </div>

              <div>
                <div class="list-amount">
                  -${currency(
                    expense.amount
                  )}
                </div>

                <button
                  class="text-button"
                  type="button"
                  data-delete-expense="${expense.id}"
                >
                  Delete
                </button>
              </div>
            </div>
          `
        )
        .join("");
  }

  $$(
    "#recentExpensesList [data-delete-expense]"
  ).forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        deleteExpense(
          button.dataset
            .deleteExpense
        )
    );
  });
}

function renderCustomers() {
  const query =
    state.customerSearch
      .trim()
      .toLowerCase();

  const customers =
    [...state.customers]
      .filter((customer) => {
        if (!query) {
          return true;
        }

        return [
          customer.name,
          customer.phone,
          customer.email,
          customer.address
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) =>
        a.name.localeCompare(
          b.name
        )
      );

  const list =
    $("#customersList");

  if (!customers.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>
          ${
            query
              ? "No customers match that search"
              : "No customers yet"
          }
        </strong>

        <p>
          ${
            query
              ? "Try a different name, phone number, or address."
              : "Tap + Customer to add your first customer."
          }
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    customers
      .map((customer) => {
        const jobs =
          state.jobs.filter(
            (job) =>
              job.customerId ===
              customer.id
          );

        const completed =
          jobs.filter(
            (job) =>
              job.status ===
              "Completed"
          );

        const revenue =
          completed.reduce(
            (sum, job) =>
              sum +
              Number(
                job.price || 0
              ),
            0
          );

        return `
          <article class="customer-card">
            <div class="card-top">
              <div>
                <h3 class="card-title">
                  ${escapeHTML(
                    customer.name
                  )}
                </h3>

                <div class="card-meta">
                  ${
                    customer.phone
                      ? `
                        <p>
                          ${escapeHTML(
                            customer.phone
                          )}
                        </p>
                      `
                      : ""
                  }

                  ${
                    customer.address
                      ? `
                        <p>
                          ${escapeHTML(
                            customer.address
                          )}
                        </p>
                      `
                      : ""
                  }

                  <p>
                    ${jobs.length}
                    job${
                      jobs.length === 1
                        ? ""
                        : "s"
                    }
                    ·
                    ${currency(
                      revenue
                    )}
                    completed revenue
                  </p>
                </div>
              </div>
            </div>

            ${
              customer.notes
                ? `
                  <p class="muted">
                    ${escapeHTML(
                      customer.notes
                    )}
                  </p>
                `
                : ""
            }

            <div class="card-footer">
              <button
                class="button small primary"
                type="button"
                data-add-job-customer="${customer.id}"
              >
                Add Job
              </button>

              <button
                class="button small secondary"
                type="button"
                data-edit-customer="${customer.id}"
              >
                Edit
              </button>

              <button
                class="button small danger"
                type="button"
                data-delete-customer="${customer.id}"
              >
                Delete
              </button>
            </div>
          </article>
        `;
      })
      .join("");

  $$(
    "[data-add-job-customer]"
  ).forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        openJobForm({
          customerId:
            button.dataset
              .addJobCustomer
        })
    );
  });

  $$(
    "[data-edit-customer]"
  ).forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        openCustomerForm(
          button.dataset
            .editCustomer
        )
    );
  });

  $$(
    "[data-delete-customer]"
  ).forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        deleteCustomer(
          button.dataset
            .deleteCustomer
        )
    );
  });
}

function renderJobs() {
  let jobs = [...state.jobs];

  if (
    state.jobFilter ===
    "upcoming"
  ) {
    jobs = jobs.filter(
      (job) =>
        job.status ===
        "Scheduled"
    );

    jobs.sort((a, b) =>
      `${a.date} ${
        a.time || "23:59"
      }`.localeCompare(
        `${b.date} ${
          b.time || "23:59"
        }`
      )
    );
  } else if (
    state.jobFilter ===
    "completed"
  ) {
    jobs = jobs.filter(
      (job) =>
        job.status ===
        "Completed"
    );

    jobs.sort((a, b) =>
      `${b.date} ${
        b.time || "23:59"
      }`.localeCompare(
        `${a.date} ${
          a.time || "23:59"
        }`
      )
    );
  } else {
    jobs.sort((a, b) =>
      `${b.date} ${
        b.time || "23:59"
      }`.localeCompare(
        `${a.date} ${
          a.time || "23:59"
        }`
      )
    );
  }

  $$(".segment").forEach(
    (button) => {
      button.classList.toggle(
        "active",
        button.dataset
          .jobFilter ===
          state.jobFilter
      );
    }
  );

  const list = $("#jobsList");

  if (!jobs.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>
          No ${
            state.jobFilter ===
            "all"
              ? ""
              : state.jobFilter
          } jobs
        </strong>

        <p>
          ${
            state.customers.length
              ? "Tap + Job to schedule work."
              : "Add a customer first, then schedule a job."
          }
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    jobs
      .map((job) => {
        const customer =
          customerById(
            job.customerId
          );

        return `
          <article class="job-card">
            <div class="card-top">
              <div>
                <h3 class="card-title">
                  ${escapeHTML(
                    customer?.name ||
                      "Unknown customer"
                  )}
                </h3>

                <div class="card-meta">
                  <p>
                    ${escapeHTML(
                      job.service
                    )}
                  </p>

                  <p>
                    ${escapeHTML(
                      formatDate(
                        job.date,
                        {
                          year: true
                        }
                      )
                    )}
                    ·
                    ${escapeHTML(
                      formatTime(
                        job.time
                      )
                    )}
                  </p>

                  ${
                    customer?.address
                      ? `
                        <p>
                          ${escapeHTML(
                            customer.address
                          )}
                        </p>
                      `
                      : ""
                  }

                  ${
                    job.notes
                      ? `
                        <p>
                          ${escapeHTML(
                            job.notes
                          )}
                        </p>
                      `
                      : ""
                  }
                </div>
              </div>

              <div>
                <div class="list-amount">
                  ${currency(
                    job.price
                  )}
                </div>

                ${jobBadge(job)}
              </div>
            </div>

            <div class="card-footer">
              ${
                job.status ===
                "Scheduled"
                  ? `
                    <button
                      class="button small primary"
                      type="button"
                      data-complete-job="${job.id}"
                    >
                      Mark Complete
                    </button>
                  `
                  : ""
              }

              <button
                class="button small secondary"
                type="button"
                data-edit-job="${job.id}"
              >
                Edit
              </button>

              <button
                class="button small danger"
                type="button"
                data-delete-job="${job.id}"
              >
                Delete
              </button>
            </div>
          </article>
        `;
      })
      .join("");

  $$(
    "[data-complete-job]"
  ).forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        completeJob(
          button.dataset
            .completeJob
        )
    );
  });

  $$(
    "[data-edit-job]"
  ).forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        openJobForm({
          jobId:
            button.dataset
              .editJob
        })
    );
  });

  $$(
    "[data-delete-job]"
  ).forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        deleteJob(
          button.dataset
            .deleteJob
        )
    );
  });
}

function renderSettings() {
  $("#businessNameInput").value =
    state.settings
      .businessName || "";

  $("#ownerNameInput").value =
    state.settings
      .ownerName || "";

  $("#businessPhoneInput").value =
    state.settings
      .phone || "";

  $("#defaultPriceInput").value =
    Number(
      state.settings
        .defaultPrice || 0
    );

  $("#brandName").textContent =
    state.settings
      .businessName || "Up2Date";
}

function renderAll() {
  renderHome();
  renderCustomers();
  renderJobs();
  renderSettings();
}

function populateCustomerSelect(
  selectedId = ""
) {
  const select =
    $("#jobCustomer");

  if (!state.customers.length) {
    select.innerHTML = `
      <option value="">
        Add a customer first
      </option>
    `;

    return;
  }

  select.innerHTML = `
    <option value="">
      Choose a customer
    </option>

    ${[...state.customers]
      .sort((a, b) =>
        a.name.localeCompare(
          b.name
        )
      )
      .map(
        (customer) => `
          <option value="${customer.id}">
            ${escapeHTML(
              customer.name
            )}
          </option>
        `
      )
      .join("")}
  `;

  if (selectedId) {
    select.value = selectedId;
  }
}

function openCustomerForm(
  customerId = ""
) {
  const form =
    $("#customerForm");

  form.reset();

  $("#customerId").value = "";

  $("#customerModalTitle")
    .textContent =
    customerId
      ? "Edit Customer"
      : "Add Customer";

  if (customerId) {
    const customer =
      customerById(
        customerId
      );

    if (!customer) return;

    $("#customerId").value =
      customer.id;

    $("#customerName").value =
      customer.name || "";

    $("#customerPhone").value =
      customer.phone || "";

    $("#customerEmail").value =
      customer.email || "";

    $("#customerAddress").value =
      customer.address || "";

    $("#customerNotes").value =
      customer.notes || "";
  }

  openModal("customerModal");

  setTimeout(
    () =>
      $("#customerName").focus(),
    20
  );
}

function openJobForm({
  jobId = "",
  customerId = ""
} = {}) {
  if (!state.customers.length) {
    showToast(
      "Add a customer before creating a job."
    );

    switchView("customers");

    return;
  }

  const form = $("#jobForm");

  form.reset();

  $("#jobId").value = "";

  $("#jobModalTitle")
    .textContent =
    jobId
      ? "Edit Job"
      : "Add Job";

  $("#jobDate").value =
    todayString();

  $("#jobStatus").value =
    "Scheduled";

  $("#jobPrice").value =
    Number(
      state.settings
        .defaultPrice || 0
    );

  populateCustomerSelect(
    customerId
  );

  if (jobId) {
    const job =
      state.jobs.find(
        (item) =>
          item.id === jobId
      );

    if (!job) return;

    $("#jobId").value =
      job.id;

    populateCustomerSelect(
      job.customerId
    );

    $("#jobService").value =
      job.service || "Mowing";

    $("#jobDate").value =
      job.date ||
      todayString();

    $("#jobTime").value =
      job.time || "";

    $("#jobPrice").value =
      Number(
        job.price || 0
      );

    $("#jobStatus").value =
      job.status ||
      "Scheduled";

    $("#jobNotes").value =
      job.notes || "";
  }

  openModal("jobModal");
}

function openExpenseForm() {
  $("#expenseForm").reset();

  $("#expenseDate").value =
    todayString();

  openModal("expenseModal");

  setTimeout(
    () =>
      $("#expenseDescription")
        .focus(),
    20
  );
}

function saveCustomer(event) {
  event.preventDefault();

  const id =
    $("#customerId").value;

  const customer = {
    id:
      id ||
      makeId("customer"),

    name:
      $("#customerName")
        .value
        .trim(),

    phone:
      $("#customerPhone")
        .value
        .trim(),

    email:
      $("#customerEmail")
        .value
        .trim(),

    address:
      $("#customerAddress")
        .value
        .trim(),

    notes:
      $("#customerNotes")
        .value
        .trim()
  };

  if (!customer.name) {
    return;
  }

  if (id) {
    state.customers =
      state.customers.map(
        (item) =>
          item.id === id
            ? customer
            : item
      );

    showToast(
      "Customer updated."
    );
  } else {
    state.customers.push(
      customer
    );

    showToast(
      "Customer added."
    );
  }

  saveAll();

  closeModal(
    "customerModal"
  );

  renderAll();

  switchView(
    "customers"
  );
}

function saveJob(event) {
  event.preventDefault();

  const id =
    $("#jobId").value;

  const job = {
    id:
      id ||
      makeId("job"),

    customerId:
      $("#jobCustomer").value,

    service:
      $("#jobService").value,

    date:
      $("#jobDate").value,

    time:
      $("#jobTime").value,

    price:
      Number(
        $("#jobPrice").value ||
          0
      ),

    status:
      $("#jobStatus").value,

    notes:
      $("#jobNotes")
        .value
        .trim()
  };

  if (
    !job.customerId ||
    !job.date
  ) {
    return;
  }

  if (id) {
    state.jobs =
      state.jobs.map(
        (item) =>
          item.id === id
            ? job
            : item
      );

    showToast(
      "Job updated."
    );
  } else {
    state.jobs.push(job);

    showToast(
      "Job added."
    );
  }

  saveAll();

  closeModal(
    "jobModal"
  );

  renderAll();

  switchView("jobs");
}

function saveExpense(event) {
  event.preventDefault();

  const expense = {
    id: makeId("expense"),

    description:
      $("#expenseDescription")
        .value
        .trim(),

    category:
      $("#expenseCategory")
        .value,

    amount:
      Number(
        $("#expenseAmount")
          .value || 0
      ),

    date:
      $("#expenseDate").value
  };

  if (
    !expense.description ||
    !expense.date ||
    expense.amount < 0
  ) {
    return;
  }

  state.expenses.push(
    expense
  );

  saveAll();

  closeModal(
    "expenseModal"
  );

  renderAll();

  switchView("home");

  showToast(
    "Expense saved."
  );
}

function completeJob(jobId) {
  const job =
    state.jobs.find(
      (item) =>
        item.id === jobId
    );

  if (!job) return;

  job.status =
    "Completed";

  saveAll();

  renderAll();

  showToast(
    "Job marked complete."
  );
}

function deleteCustomer(
  customerId
) {
  const customer =
    customerById(
      customerId
    );

  if (!customer) return;

  const relatedJobs =
    state.jobs.filter(
      (job) =>
        job.customerId ===
        customerId
    );

  const message =
    relatedJobs.length
      ? `Delete ${customer.name} and ${relatedJobs.length} related job${relatedJobs.length === 1 ? "" : "s"}?`
      : `Delete ${customer.name}?`;

  if (!confirm(message)) {
    return;
  }

  state.customers =
    state.customers.filter(
      (item) =>
        item.id !==
        customerId
    );

  state.jobs =
    state.jobs.filter(
      (job) =>
        job.customerId !==
        customerId
    );

  saveAll();

  renderAll();

  showToast(
    "Customer deleted."
  );
}

function deleteJob(jobId) {
  if (
    !confirm(
      "Delete this job?"
    )
  ) {
    return;
  }

  state.jobs =
    state.jobs.filter(
      (job) =>
        job.id !== jobId
    );

  saveAll();

  renderAll();

  showToast(
    "Job deleted."
  );
}

function deleteExpense(
  expenseId
) {
  if (
    !confirm(
      "Delete this expense?"
    )
  ) {
    return;
  }

  state.expenses =
    state.expenses.filter(
      (expense) =>
        expense.id !==
        expenseId
    );

  saveAll();

  renderAll();

  showToast(
    "Expense deleted."
  );
}

function saveSettings(event) {
  event.preventDefault();

  state.settings = {
    businessName:
      $("#businessNameInput")
        .value
        .trim() ||
      "Up2Date",

    ownerName:
      $("#ownerNameInput")
        .value
        .trim(),

    phone:
      $("#businessPhoneInput")
        .value
        .trim(),

    defaultPrice:
      Number(
        $("#defaultPriceInput")
          .value || 0
      )
  };

  saveAll();

  renderSettings();

  showToast(
    "Settings saved."
  );
}

function exportData() {
  const backup = {
    app: "Up2Date",
    version: 1,
    exportedAt:
      new Date().toISOString(),

    customers:
      state.customers,

    jobs:
      state.jobs,

    expenses:
      state.expenses,

    settings:
      state.settings
  };

  const blob = new Blob(
    [
      JSON.stringify(
        backup,
        null,
        2
      )
    ],
    {
      type: "application/json"
    }
  );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    `up2date-backup-${todayString()}.json`;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  showToast(
    "Backup exported."
  );
}

function deleteAllData() {
  const typed = prompt(
    'This permanently deletes all Up2Date data on this device. Type DELETE to continue.'
  );

  if (typed !== "DELETE") {
    return;
  }

  state.customers = [];
  state.jobs = [];
  state.expenses = [];

  state.settings = {
    businessName: "Up2Date",
    ownerName: "",
    phone: "",
    defaultPrice: 55
  };

  saveAll();

  renderAll();

  switchView("home");

  showToast(
    "All data deleted."
  );
}

function attachEvents() {
  $$("[data-nav-view]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () =>
          switchView(
            button.dataset
              .navView
          )
      );
    });

  $$("[data-open-view]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () =>
          switchView(
            button.dataset
              .openView
          )
      );
    });

  $$("[data-close-modal]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () =>
          closeModal(
            button.dataset
              .closeModal
          )
      );
    });

  $$(".modal-backdrop")
    .forEach((backdrop) => {
      backdrop.addEventListener(
        "click",
        (event) => {
          if (
            event.target ===
            backdrop
          ) {
            closeModal(
              backdrop.id
            );
          }
        }
      );
    });

  $("#addCustomerBtn")
    .addEventListener(
      "click",
      () =>
        openCustomerForm()
    );

  $("#addJobBtn")
    .addEventListener(
      "click",
      () =>
        openJobForm()
    );

  $("#addExpenseBtn")
    .addEventListener(
      "click",
      openExpenseForm
    );

  $("#customerForm")
    .addEventListener(
      "submit",
      saveCustomer
    );

  $("#jobForm")
    .addEventListener(
      "submit",
      saveJob
    );

  $("#expenseForm")
    .addEventListener(
      "submit",
      saveExpense
    );

  $("#settingsForm")
    .addEventListener(
      "submit",
      saveSettings
    );

  $("#customerSearch")
    .addEventListener(
      "input",
      (event) => {
        state.customerSearch =
          event.target.value;

        renderCustomers();
      }
    );

  $$("[data-job-filter]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          state.jobFilter =
            button.dataset
              .jobFilter;

          renderJobs();
        }
      );
    });

  $("#exportDataBtn")
    .addEventListener(
      "click",
      exportData
    );

  $("#deleteAllDataBtn")
    .addEventListener(
      "click",
      deleteAllData
    );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      $$(".modal-backdrop")
        .forEach((modal) => {
          if (!modal.hidden) {
            closeModal(
              modal.id
            );
          }
        });
    }
  );
}

function init() {
  loadState();

  attachEvents();

  renderAll();

  switchView("home");
}

init();