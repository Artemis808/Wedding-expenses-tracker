document.addEventListener("DOMContentLoaded", function () {
  console.log("Wedding Expense Tracker Loaded");

  // --- 1. SAFE DATA LOADING (Prevents Crashes) ---
  
  const defaultCategories = {
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

  // Helper function to safely read storage without crashing
  function loadFromStorage(key, defaultValue) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      
      const parsed = JSON.parse(stored);
      
      // If categories object is empty, force defaults
      if (key === "categoryBudgets" && Object.keys(parsed).length === 0) {
        return defaultValue;
      }
      return parsed;
    } catch (error) {
      console.warn(`Corrupted data found for ${key}. Resetting to default.`);
      return defaultValue;
    }
  }

  let totalBudget = parseFloat(localStorage.getItem("totalBudget")) || 1200000;
  let categories = loadFromStorage("categoryBudgets", defaultCategories);
  let expenses = loadFromStorage("weddingExpenses", []);

  const categorySelect = document.getElementById("category");
  const expenseForm = document.getElementById("expenseForm");

  // --- 2. CORE FUNCTIONS ---

  function saveAll() {
    localStorage.setItem("weddingExpenses", JSON.stringify(expenses));
    localStorage.setItem("totalBudget", totalBudget);
    localStorage.setItem("categoryBudgets", JSON.stringify(categories));
  }

  // Populate Dropdown
  function populateCategories() {
    if (!categorySelect) return;
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
        engEl.innerText = `${diff.months} Months, ${diff.days} Days left`;
      } else {
        engEl.innerText = "Completed! 💍";
      }
    }

    if (wedEl) {
      if (today < weddingDate) {
        const diff = calculateMonthDayDiff(today, weddingDate);
        wedEl.innerText = `${diff.months} Months, ${diff.days} Days left`;
      } else {
        wedEl.innerText = "It's Wedding Day! 🎉";
      }
    }
  }

  // --- 3. RENDERING UI ---

  function render() {
    // 1. Setup Categories if empty
    if (categorySelect && categorySelect.options.length <= 1) {
      populateCategories();
    }

    // 2. Setup Budget Input
    const budgetInput = document.getElementById("totalBudgetInput");
    if (budgetInput) budgetInput.value = totalBudget;

    let totalSpent = 0;
    let groomPaid = 0;
    let bridePaid = 0;

    // 3. Render Expense List
    const list = document.getElementById("expenseList");
    if (list) {
      list.innerHTML = "";
      
      // Sort newest first
      const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

      sortedExpenses.forEach(exp => {
        totalSpent += exp.amount;
        if (exp.paidBy === "Groom") groomPaid += exp.amount;
        if (exp.paidBy === "Bride") bridePaid += exp.amount;

        const div = document.createElement("div");
        div.className = "expense-card";
        
        const linkHtml = exp.invoiceLink 
          ? ` | <a href="${exp.invoiceLink}" target="_blank">View Invoice</a>` 
          : "";

        div.innerHTML = `
          <strong>${exp.title}</strong> - ₹${exp.amount.toLocaleString()}
          <div class="expense-info">
            ${exp.date} | ${exp.category} | Paid by ${exp.paidBy}
            ${linkHtml}
          </div>
          <div class="expense-actions" onclick="deleteExpense(${exp.id})">Delete</div>
        `;
        list.appendChild(div);
      });
    }

    // 4. Update Stats
    const totalSpentEl = document.getElementById("totalSpent");
    const remainingEl = document.getElementById("remaining");
    const settlementEl = document.getElementById("settlement");

    if (totalSpentEl) totalSpentEl.innerText = "₹" + totalSpent.toLocaleString();
    if (remainingEl) remainingEl.innerText = "₹" + (totalBudget - totalSpent).toLocaleString();

    // Settlement
    const fairShare = totalSpent / 2;
    const settlement = groomPaid - fairShare; 

    if (settlementEl) {
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
    }

    // 5. Render Progress Bars
    const categoryBudgetList = document.getElementById("categoryBudgetList");
    if (categoryBudgetList) {
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
  }

  // --- 4. EVENT HANDLERS ---

  window.updateTotalBudget = function() {
    const input = document.getElementById("totalBudgetInput");
    totalBudget = parseFloat(input.value) || 0;
    saveAll();
    render();
    alert("Budget Updated!");
  };

  if (expenseForm) {
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
  }

  window.deleteExpense = function(id) {
    if(confirm("Delete this expense?")) {
      expenses = expenses.filter(e => e.id !== id);
      saveAll();
      render();
    }
  };

  // Export/Import functions omitted for brevity but can be added back if needed

  // --- INITIAL EXECUTION ---
  populateCategories();
  updateCountdowns();
  render();
});
