const TOTAL_BUDGET = 1200000;
let expenses = JSON.parse(localStorage.getItem("weddingExpenses")) || [];

const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const expense = {
    id: Date.now(),
    date: document.getElementById("date").value,
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    paidBy: document.getElementById("paidBy").value,
    paymentMode: document.getElementById("paymentMode").value,
    amount: parseFloat(document.getElementById("amount").value),
    invoiceLink: document.getElementById("invoiceLink").value,
    notes: document.getElementById("notes").value
  };

  expenses.push(expense);
  saveData();
  render();
  form.reset();
});

function saveData() {
  localStorage.setItem("weddingExpenses", JSON.stringify(expenses));
}

function render() {
  expenseList.innerHTML = "";

  let totalSpent = 0;
  let groomPaid = 0;
  let bridePaid = 0;

  expenses.forEach(exp => {
    totalSpent += exp.amount;
    if (exp.paidBy === "Groom") groomPaid += exp.amount;
    if (exp.paidBy === "Bride") bridePaid += exp.amount;

    const div = document.createElement("div");
    div.className = "expense-card";
    div.innerHTML = `
      <strong>${exp.title}</strong> - ₹${exp.amount}<br>
      ${exp.date} | ${exp.category} | ${exp.paidBy}<br>
      <a href="${exp.invoiceLink}" target="_blank">Invoice</a>
    `;
    expenseList.appendChild(div);
  });

  const expected = totalSpent / 2;
  const settlement = groomPaid - expected;

  document.getElementById("totalSpent").innerText = "₹" + totalSpent.toLocaleString();
  document.getElementById("remaining").innerText = "₹" + (TOTAL_BUDGET - totalSpent).toLocaleString();
  document.getElementById("settlement").innerText = settlement >= 0 
    ? "Bride owes ₹" + settlement.toLocaleString()
    : "Groom owes ₹" + Math.abs(settlement).toLocaleString();
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
  const blob = new Blob([JSON.stringify(expenses)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "backup.json";
  link.click();
}

function restoreData(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    expenses = JSON.parse(e.target.result);
    saveData();
    render();
  };
  reader.readAsText(file);
}

render();

