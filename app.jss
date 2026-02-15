let totalBudget = parseFloat(localStorage.getItem("totalBudget")) || 1200000;

let categories = JSON.parse(localStorage.getItem("categoryBudgets")) || {
  "Venue & Catering": 400000,
  "Decor": 100000,
  "Photography": 120000,
  "Apparel": 100000,
  "Jewellery": 150000,
  "Travel": 80000,
  "Gifts": 70000,
  "Ritual": 50000,
  "Misc": 50000,
  "Contingency": 80000
};

let expenses = JSON.parse(localStorage.getItem("weddingExpenses")) || [];

const categorySelect = document.getElementById("category");

function saveAll() {
  localStorage.setItem("weddingExpenses", JSON.stringify(expenses));
  localStorage.setItem("totalBudget", totalBudget);
  localStorage.setItem("categoryBudgets", JSON.stringify(categories));
}

function updateTotalBudget() {
  totalBudget = parseFloat(document.getElementById("totalBudgetInput").value);
  saveAll();
  render();
}

function populateCategories() {
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  Object.keys(categories).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function calculateMonthDayDiff(from, to) {
  let months = (to.getFullYear() - from.getFullYear()) * 12;
  months += to.getMonth() - from.getMonth();
  if (to.getDate() < from.getDate()) months--;

  const temp = new Date(from);
  temp.setMonth(temp.getMonth() + months);

  const days = Math.round((to - temp) / (1000*60*60*24));
  return { months, days };
}

function updateCountdowns() {
  const today = new Date();
  today.setHours(0,0,0,0);

  const engagementDate = new Date("2026-08-23");
  const engagementEnd = new Date("2026-08-30");
  const weddingDate = new Date("2026-11-11");

  const engagementEl = document.getElementById("engagementCountdown");
  const weddingEl = document.getElementById("weddingCountdown");

  if (today < engagementDate) {
    const diff = calculateMonthDayDiff(today, engagementDate);
    engagementEl.innerText = `${diff.months} months ${diff.days} days to Engagement 💍`;
  } else if (today >= engagementDate && today <= engagementEnd) {
    engagementEl.innerText = "Phase 1 complete. You're engaged. Congratulations 💍✨";
  } else {
    engagementEl.innerText = "Engagement Completed";
  }

  if (today < weddingDate) {
    const diff = calculateMonthDayDiff(today, weddingDate);
    weddingEl.innerText = `${diff.months} months ${diff.days} days to Wedding 🎉`;
  } else {
    weddingEl.innerText = "Wedding day has arrived 🎊";
  }
}

document.getElementById("expenseForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const expense = {
    id: Date.now(),
    date: date.value,
    title: title.value,
    category: category.value,
    paidBy: paidBy.value,
    paymentMode: paymentMode.value,
    amount: parseFloat(amount.value),
    invoiceLink: invoiceLink.value,
    notes: notes.value
  };

  expenses.push(expense);
  saveAll();
  render();
  this.reset();
});

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveAll();
  render();
}

function render() {
  populateCategories();
  updateCountdowns();
  document.getElementById("totalBudgetInput").value = totalBudget;

  let totalSpent = 0, groomPaid = 0, bridePaid = 0;
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  expenses.forEach(exp => {
    totalSpent += exp.amount;
    if (exp.paidBy === "Groom") groomPaid += exp.amount;
    if (exp.paidBy === "Bride") bridePaid += exp.amount;

    const div = document.createElement("div");
    div.className = "expense-card";
    div.innerHTML = `
      <strong>${exp.title}</strong> - ₹${exp.amount.toLocaleString()}<br>
      ${exp.date} | ${exp.category} | ${exp.paidBy}<br>
      <a href="${exp.invoiceLink}" target="_blank">Invoice</a>
      <div class="expense-actions" onclick="deleteExpense(${exp.id})">Delete</div>
    `;
    list.appendChild(div);
  });

  const expected = totalSpent / 2;
  const settlement = groomPaid - expected;

  document.getElementById("totalSpent").innerText = "₹" + totalSpent.toLocaleString();
  document.getElementById("remaining").innerText = "₹" + (totalBudget - totalSpent).toLocaleString();
  document.getElementById("settlement").innerText =
    settlement >= 0
      ? "Bride owes ₹" + settlement.toLocaleString()
      : "Groom owes ₹" + Math.abs(settlement).toLocaleString();

  const categoryBudgetList = document.getElementById("categoryBudgetList");
  categoryBudgetList.innerHTML = "";

  Object.keys(categories).forEach(cat => {
    const spent = expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);

    const percent = categories[cat] > 0
      ? (spent / categories[cat]) * 100
      : 0;

    const row = document.createElement("div");
    row.className = "category-row";
    if (percent > 100) row.classList.add("over-budget");

    row.innerHTML = `
      <strong>${cat}</strong><br>
      ₹${spent.toLocaleString()} / ₹${categories[cat].toLocaleString()} (${percent.toFixed(1)}%)
      <div class="progress-bar">
        <div class="progress-fill" style="width:${Math.min(percent,100)}%"></div>
      </div>
    `;

    categoryBudgetList.appendChild(row);
  });
}

render();
