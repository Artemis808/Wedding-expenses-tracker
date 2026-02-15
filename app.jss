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

const form = document.getElementById("expenseForm");
const categorySelect = document.getElementById("category");
const categoryBudgetList = document.getElementById("categoryBudgetList");

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

function calculateMonthDayDiff(fromDate, toDate) {
  let months = (toDate.getFullYear() - fromDate.getFullYear()) * 12;
  months += toDate.getMonth() - fromDate.getMonth();

  if (toDate.getDate() < fromDate.getDate()) {
    months--;
  }

  const tempDate = new Date(fromDate);
  tempDate.setMonth(tempDate.getMonth() + months);

  let days = Math.round((toDate - tempDate) / (1000 * 60 * 60 * 24));

  return { months, days };
}

function updateCountdowns() {
  const today = new Date();
  today.setHours(0,0,0,0);

  const engagementDate = new Date("2026-08-23");
  const engagementEnd = new Date("2026-08-30");
  const weddingDate = new Date("2026-11-11");

  const engagementCard = document.getElementById("engagementCard");
  const engagementEl = document.getElementById("engagementCountdown");
  const weddingEl = document.getElementById("weddingCountdown");

  if (today < engagementDate) {
    const diff = calculateMonthDayDiff(today, engagementDate);
    engagementEl.innerText = `${diff.months} months ${diff.days} days to Engagement 💍`;
    engagementCard.style.display = "block";
  } 
  else if (today >= engagementDate && today <= engagementEnd) {
    engagementEl.innerText = "Phase 1 complete. You’re engaged. Congratulations 💍✨";
    engagementCard.style.display = "block";
  } 
  else {
    engagementCard.style.display = "none";
  }

  if (today < weddingDate) {
    const diff = calculateMonthDayDiff(today, weddingDate);
    weddingEl.innerText = `${diff.months} months ${diff.days} days to Wedding 🎉`;
  } else {
    weddingEl.innerText = "Wedding day has arrived 🎊";
  }
}

function renderCategories() {
  categorySelect.innerHTML = "";
  categoryBudgetList.innerHTML = "";

  Object.keys(categories).forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);

    const spent = expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);

    const percent = categories[cat] > 0
      ? ((spent / categories[cat]) * 100).toFixed(1)
      : 0;

    const row = document.createElement("div");
    row.className = "category-row fade-in";
    if (percent > 100) row.classList.add("over-budget");

    row.innerHTML = `
      <strong>${cat}</strong><br>
      Budget: ₹${categories[cat].toLocaleString()} |
      Spent: ₹${spent.toLocaleString()} |
      ${percent}% used
    `;

    categoryBudgetList.appendChild(row);
  });
}

form.addEventListener("submit", function(e) {
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
  form.reset();
});

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveAll();
  render();
}

function render() {
  document.getElementById("totalBudgetInput").value = totalBudget;

  let totalSpent = 0;
  let groomPaid = 0;
  let bridePaid = 0;

  const expenseList = document.getElementById("expenseList");
  expenseList.innerHTML = "";

  expenses.forEach(exp => {
    totalSpent += exp.amount;
    if (exp.paidBy === "Groom") groomPaid += exp.amount;
    if (exp.paidBy === "Bride") bridePaid += exp.amount;

    const div = document.createElement("div");
    div.className = "expense-card fade-in";
    div.innerHTML = `
      <strong>${exp.title}</strong> - ₹${exp.amount.toLocaleString()}<br>
      ${exp.date} | ${exp.category} | ${exp.paidBy}<br>
      <a href="${exp.invoiceLink}" target="_blank">Invoice</a>
      <div class="expense-actions" onclick="deleteExpense(${exp.id})">Delete</div>
    `;
    expenseList.appendChild(div);
  });

  const expected = totalSpent / 2;
  const settlement = groomPaid - expected;

  document.getElementById("totalSpent").innerText = "₹" + totalSpent.toLocaleString();
  document.getElementById("remaining").innerText = "₹" + (totalBudget - totalSpent).toLocaleString();
  document.getElementById("settlement").innerText =
    settlement >= 0
      ? "Bride owes ₹" + settlement.toLocaleString()
      : "Groom owes ₹" + Math.abs(settlement).toLocaleString();

  renderCategories();
  updateCountdowns();
}

function exportCSV() {
  let csv = "Date,Title,Category,Paid By,Amount,Payment Mode,Invoice Link,Notes\n";
  expenses.forEach(e => {
    csv += `${e.date},${e.title},${e.category},${e.paidBy},${e.amount},${e.paymentMode},${e.invoiceLink},${e.notes}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "wedding-expenses.csv";
  link.click();
}

function backupData() {
  const blob = new Blob([JSON.stringify({ expenses, categories, totalBudget })], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "backup.json";
  link.click();
}

function restoreData(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    expenses = data.expenses;
    categories = data.categories;
    totalBudget = data.totalBudget;
    saveAll();
    render();
  };
  reader.readAsText(file);
}

render();
