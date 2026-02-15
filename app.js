document.addEventListener("DOMContentLoaded", function () {
  
  // --- 1. DATA LOADING ---
  const defaultCategories = {
    "Venue & Catering": 400000, "Decor": 100000, "Photography": 120000,
    "Apparel": 100000, "Jewellery": 150000, "Travel": 80000,
    "Gifts": 70000, "Ritual": 50000, "Misc": 50000, "Contingency": 80000
  };

  let totalBudget = parseFloat(localStorage.getItem("totalBudget")) || 1200000;
  let categories = JSON.parse(localStorage.getItem("categoryBudgets")) || defaultCategories;
  let expenses = JSON.parse(localStorage.getItem("weddingExpenses")) || [];

  // --- 2. HELPERS ---

  function saveAll() {
    localStorage.setItem("weddingExpenses", JSON.stringify(expenses));
    localStorage.setItem("totalBudget", totalBudget);
    localStorage.setItem("categoryBudgets", JSON.stringify(categories));
  }

  // Formats numbers to Lakhs (e.g., 153000 -> 1.53L)
  function formatLakhs(num) {
    if (Math.abs(num) >= 100000) {
      return (num / 100000).toFixed(2).replace(/\.00$/, '') + 'L';
    }
    return num.toLocaleString('en-IN');
  }

  function calculateMonthDayDiff(from, to) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() < from.getDate()) months--;
    const temp = new Date(from);
    temp.setMonth(temp.getMonth() + months);
    const days = Math.round((to - temp) / (1000 * 60 * 60 * 24));
    return { months, days };
  }

  // --- 3. UI RENDERING ---

  function render() {
    // Update Countdowns
    const today = new Date(); today.setHours(0,0,0,0);
    const engDate = new Date("2026-08-23");
    const wedDate = new Date("2026-11-11");

    document.getElementById("engagementCountdown").innerText = today < engDate ? 
      `${calculateMonthDayDiff(today, engDate).months}M, ${calculateMonthDayDiff(today, engDate).days}D left` : "Completed! 💍";
    document.getElementById("weddingCountdown").innerText = today < wedDate ? 
      `${calculateMonthDayDiff(today, wedDate).months}M, ${calculateMonthDayDiff(today, wedDate).days}D left` : "Wedding Day! 🎉";

    // Dashboard
    let totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    let groomPaid = expenses.filter(e => e.paidBy === "Groom").reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById("totalSpent").innerText = "₹" + formatLakhs(totalSpent);
    document.getElementById("remaining").innerText = "₹" + formatLakhs(totalBudget - totalSpent);
    
    const settlement = groomPaid - (totalSpent / 2);
    const setEl = document.getElementById("settlement");
    setEl.innerText = settlement === 0 ? "Settled ✅" : 
      (settlement > 0 ? `Bride owes ₹${formatLakhs(settlement)}` : `Groom owes ₹${formatLakhs(Math.abs(settlement))}`);

    // Category Settings (Editor)
    const settingsDiv = document.getElementById("categorySettings");
    settingsDiv.innerHTML = `<p style="font-size:12px; color:#666; margin-bottom:10px;">Allocated: ₹${Object.values(categories).reduce((a,b)=>a+b,0).toLocaleString()} / ₹${totalBudget.toLocaleString()}</p>`;
    
    Object.keys(categories).forEach(cat => {
      const div = document.createElement("div");
      div.style = "display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;";
      div.innerHTML = `<span style="font-size:14px">${cat}</span>
        <input type="number" class="cat-limit-input" data-cat="${cat}" value="${categories[cat]}" style="width:100px; padding:4px; border:1px solid #ddd; border-radius:4px;">`;
      settingsDiv.appendChild(div);
    });

    // Category Progress Bars
    const catList = document.getElementById("categoryBudgetList");
    catList.innerHTML = "";
    Object.keys(categories).forEach(cat => {
      const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
      const percent = (spent / categories[cat]) * 100;
      const row = document.createElement("div");
      row.className = `category-row ${percent > 100 ? 'over-budget' : ''}`;
      row.innerHTML = `<div class="cat-header"><span>${cat}</span><span>₹${formatLakhs(spent)} / ${formatLakhs(categories[cat])}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(percent, 100)}%"></div></div>`;
      catList.appendChild(row);
    });

    // Populate Category Dropdown
    const select = document.getElementById("category");
    if(select.options.length <= 1) {
      Object.keys(categories).forEach(cat => {
        const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat;
        select.appendChild(opt);
      });
    }

    // Expense List
    const expList = document.getElementById("expenseList");
    expList.innerHTML = "";
    [...expenses].reverse().forEach(exp => {
      const div = document.createElement("div");
      div.className = "expense-card";
      div.innerHTML = `<strong>${exp.title}</strong> - ₹${formatLakhs(exp.amount)}
        <div class="expense-info">${exp.date} | ${exp.category} | ${exp.paidBy}</div>
        <div class="expense-actions" onclick="deleteExpense(${exp.id})">Delete</div>`;
      expList.appendChild(div);
    });
  }

  // --- 4. ACTIONS ---

  window.updateTotalBudget = function() {
    totalBudget = parseFloat(document.getElementById("totalBudgetInput").value) || 0;
    saveAll(); render();
  };

  window.saveCategoryLimits = function() {
    const inputs = document.querySelectorAll(".cat-limit-input");
    let newTotal = 0;
    const newCats = {};
    inputs.forEach(i => {
      const val = parseFloat(i.value) || 0;
      newCats[i.getAttribute("data-cat")] = val;
      newTotal += val;
    });

    if (newTotal !== totalBudget) {
      alert(`Allocation Error: Categories total ₹${newTotal.toLocaleString()}, but Total Budget is ₹${totalBudget.toLocaleString()}. Please adjust by ₹${Math.abs(totalBudget - newTotal).toLocaleString()}.`);
      return;
    }
    categories = newCats; saveAll(); render(); alert("Limits updated! ✅");
  };

  document.getElementById("expenseForm").onsubmit = function(e) {
    e.preventDefault();
    expenses.push({
      id: Date.now(),
      date: document.getElementById("date").value,
      title: document.getElementById("title").value,
      category: document.getElementById("category").value,
      paidBy: document.getElementById("paidBy").value,
      paymentMode: document.getElementById("paymentMode").value,
      amount: parseFloat(document.getElementById("amount").value),
      invoiceLink: document.getElementById("invoiceLink").value,
      notes: document.getElementById("notes").value
    });
    saveAll(); render(); e.target.reset();
  };

  window.deleteExpense = function(id) {
    if(confirm("Delete?")) { expenses = expenses.filter(e => e.id !== id); saveAll(); render(); }
  };

  // Run initial render
  render();
});
