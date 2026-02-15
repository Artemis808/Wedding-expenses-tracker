document.addEventListener("DOMContentLoaded", function () {

  // --- 1. INITIALIZATION & DATA LOADING ---
  
  let totalBudget = parseFloat(localStorage.getItem("totalBudget")) || 1200000;

  // Default Categories
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
  const expenseForm = document.getElementById("expenseForm");

  // --- 2. CORE FUNCTIONS ---

  function saveAll() {
    localStorage.setItem("weddingExpenses", JSON.stringify(expenses));
    localStorage.setItem("totalBudget", totalBudget);
    localStorage.setItem("categoryBudgets", JSON.stringify(categories));
  }

  // Populate Dropdown (Runs immediately)
  function populateCategories() {
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    Object.keys(categories).forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }

  // Countdown Logic
  function calculateMonthDayDiff(from, to) {
    let months = (to.getFullYear() - from.getFullYear()) * 12;
    months += to.getMonth() - from.getMonth();
    if (to.getDate() < from.getDate()) months--;

    const temp = new Date(from);
    temp.setMonth(temp.getMonth() + months);
    const days = Math.round((to - temp) / (1000 * 60 * 60 * 24));
    return { months, days };
  }

  function updateCountdowns() {
    const today = new Date();
    today.setHours(0,0,0,0);

    const engagementDate = new Date("2026-08-23");
    const weddingDate = new Date("2026-11-11");

    const engEl = document.getElementById("engagementCountdown");
    const wedEl = document.getElementById("weddingCountdown");

    if (engEl) {
      if (today < engagementDate) {
        const diff = calculateMonthDayDiff(today, engagementDate);
        engEl.innerText = `${diff.months} Mo, ${diff.days} Days left`;
      } else {
        engEl.innerText = "Completed! 💍";
      }
    }

    if (wedEl) {
      if (today < weddingDate) {
        const diff = calculateMonthDayDiff(today, weddingDate);
        wedEl.innerText = `${diff.months} Mo, ${diff.days} Days left`;
      } else {
        wedEl.innerText = "It's Wedding Day! 🎉";
      }
    }
  }

  // --- 3. RENDERING UI ---

  function render() {
    // Update Budget Input
    document.getElementById("totalBudgetInput").value = totalBudget;

    let totalSpent = 0;
    let groomPaid = 0;
    let bridePaid = 0;

    // Render Expense List
    const list = document.getElementById("expenseList");
    list.innerHTML = "";

    // Sort by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(exp => {
      totalSpent += exp.amount;
      if (exp.paidBy === "Groom") groomPaid += exp.amount;
      if (exp.paidBy === "Bride") bridePaid += exp.amount;

      const div = document.createElement("div");
      div.className = "expense-card";
      
      // Invoice link logic
      const linkHtml = exp.invoiceLink 
        ? ` | <a href="${exp.invoiceLink}" target="_blank">View Invoice</a>` 
        : "";

      div.innerHTML = `
        <strong>${exp.title}</strong> - ₹${exp.amount.toLocaleString()}
        <div class="expense-info">
          ${exp.date} | ${exp.category} | Paid by ${exp.paidBy} (${exp.paymentMode})
          ${linkHtml}
        </div>
        ${exp.notes ? `<div style="font-size:12px; color:#888; margin-top:4px;">Note: ${exp.notes}</div>` : ""}
        <div class="expense-actions" onclick="deleteExpense(${exp.id})">Delete</div>
      `;
      list.appendChild(div);
    });

    // Update Dashboard Numbers
    document.getElementById("totalSpent").innerText = "₹" + totalSpent.toLocaleString();
    document.getElementById("remaining").innerText = "₹" + (totalBudget - totalSpent).toLocaleString();

    // Settlement Logic (Split 50/50)
    const fairShare = totalSpent / 2;
    const settlement = groomPaid - fairShare; 
    // If positive: Groom paid more (Bride owes Groom). 
    // If negative: Groom paid less (Groom owes Bride).

    const settlementEl = document.getElementById("settlement");
    if (Math.abs(settlement) < 1) {
      settlementEl.innerText = "All settled ✅";
      settlementEl.style.color = "green";
    } else if (settlement > 0) {
      settlementEl.innerText = "Bride owes ₹" + settlement.toLocaleString();
      settlementEl.style.color = "#d32f2f";
    } else {
      settlementEl.innerText = "Groom owes ₹" + Math.abs(settlement).toLocaleString();
      settlementEl.style.color = "#d32f2f";
    }

    // Render Category Budgets
    const categoryBudgetList = document.getElementById("categoryBudgetList");
    categoryBudgetList.innerHTML = "";

    Object.keys(categories).forEach(cat => {
      const spent = expenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);

      const budget = categories[cat];
      const percent = budget > 0 ? (spent / budget) * 100 : 0;
      const isOver = percent > 100;

      const row = document.createElement("div");
      row.className = `category-row ${isOver ? "over-budget" : ""}`;

      row.innerHTML = `
        <div class="cat-header">
          <span>${cat}</span>
          <span>₹${spent.toLocaleString()} / ₹${budget.toLocaleString()}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${Math.min(percent, 100)}%"></div>
        </div>
      `;
      categoryBudgetList.appendChild(row);
    });
  }

  // --- 4. EVENT HANDLERS ---

  window.updateTotalBudget = function() {
    const input = document.getElementById("totalBudgetInput");
    totalBudget = parseFloat(input.value) || 0;
    saveAll();
    render();
    alert("Budget Updated!");
  };

  expenseForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const newExpense = {
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

    expenses.push(newExpense);
    saveAll();
    render();
    expenseForm.reset();
  });

  window.deleteExpense = function(id) {
    if(confirm("Are you sure you want to delete this expense?")) {
      expenses = expenses.filter(e => e.id !== id);
      saveAll();
      render();
    }
  };

  // --- 5. EXPORT & BACKUP FUNCTIONS ---

  window.exportCSV = function() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Title,Category,Paid By,Payment Mode,Amount,Notes\n";

    expenses.forEach(e => {
      const row = `${e.date},${e.title},${e.category},${e.paidBy},${e.paymentMode},${e.amount},${e.notes}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "wedding_expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.backupData = function() {
    const data = {
      budget: totalBudget,
      categories: categories,
      expenses: expenses
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "wedding_backup.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  window.restoreData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if(data.budget && data.categories && data.expenses) {
          totalBudget = data.budget;
          categories = data.categories;
          expenses = data.expenses;
          saveAll();
          render();
          alert("Data restored successfully!");
        } else {
          alert("Invalid backup file.");
        }
      } catch (err) {
        alert("Error reading file.");
      }
    };
    reader.readAsText(file);
  };

  // --- INITIAL EXECUTION ---
  populateCategories();
  updateCountdowns();
  render();
});
