document.addEventListener("DOMContentLoaded", function () {
  
  const defaultCategories = {
    "Venue & Catering": 400000, "Decor": 100000, "Photography": 120000,
    "Apparel": 100000, "Jewellery": 150000, "Travel": 80000,
    "Gifts": 70000, "Ritual": 50000, "Misc": 50000, "Contingency": 80000
  };

  // Logic Change: Check if a budget exists in storage first, don't force 12L
  let storedBudget = localStorage.getItem("totalBudget");
  let totalBudget = storedBudget !== null ? parseFloat(storedBudget) : 1200000;
  
  let categories = JSON.parse(localStorage.getItem("categoryBudgets")) || defaultCategories;
  let expenses = JSON.parse(localStorage.getItem("weddingExpenses")) || [];

  function saveAll() {
    localStorage.setItem("weddingExpenses", JSON.stringify(expenses));
    localStorage.setItem("totalBudget", totalBudget);
    localStorage.setItem("categoryBudgets", JSON.stringify(categories));
    
    // Firebase Sync Placeholder
    if (typeof db !== 'undefined') {
      db.ref('weddingData').set({ totalBudget, categories, expenses });
    }
  }

  function formatLakhs(num) {
    let abs = Math.abs(num);
    if (abs >= 100000) return (num / 100000).toFixed(2).replace(/\.00$/, '') + 'L';
    return num.toLocaleString('en-IN');
  }

  function render() {
    const today = new Date(); today.setHours(0,0,0,0);
    const engDate = new Date("2026-08-23");
    const wedDate = new Date("2026-11-11");

    const getDiff = (target) => {
        let m = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
        if (target.getDate() < today.getDate()) m--;
        const temp = new Date(today); temp.setMonth(temp.getMonth() + m);
        const d = Math.round((target - temp) / (1000 * 60 * 60 * 24));
        return `${m}M, ${d}D left`;
    };

    document.getElementById("engagementCountdown").innerText = today < engDate ? getDiff(engDate) : "Completed! 💍";
    document.getElementById("weddingCountdown").innerText = today < wedDate ? getDiff(wedDate) : "Wedding Day! 🎉";

    let spent = expenses.reduce((s, e) => s + e.amount, 0);
    let groomPaid = expenses.filter(e => e.paidBy === "Groom").reduce((s, e) => s + e.amount, 0);
    
    document.getElementById("totalSpent").innerText = "₹" + formatLakhs(spent);
    document.getElementById("remaining").innerText = "₹" + formatLakhs(totalBudget - spent);
    
    const settlement = groomPaid - (spent / 2);
    const setEl = document.getElementById("settlement");
    setEl.innerText = Math.abs(settlement) < 1 ? "Settled ✅" : (settlement > 0 ? `Bride owes ₹${formatLakhs(settlement)}` : `Groom owes ₹${formatLakhs(Math.abs(settlement))}`);
    setEl.style.color = Math.abs(settlement) < 1 ? "green" : "#d32f2f";

    // --- CATEGORY LIMITS EDITOR (Updated to format summary in Lakhs) ---
    const setDiv = document.getElementById("categorySettings");
    const currentAllocated = Object.values(categories).reduce((a,b)=>a+b,0);
    setDiv.innerHTML = `<p style="font-size:12px; color:#666; margin-bottom:12px;">
      Allocated: ₹${formatLakhs(currentAllocated)} / Total: ₹${formatLakhs(totalBudget)}
    </p>`;

    Object.keys(categories).forEach(cat => {
      const d = document.createElement("div");
      d.style = "display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;";
      d.innerHTML = `<span style="font-size:14px;">${cat}</span>
        <input type="number" class="cat-limit-input" data-cat="${cat}" value="${categories[cat]}" 
        style="width:100px; padding:5px; border:1px solid #ddd; border-radius:6px;">`;
      setDiv.appendChild(d);
    });

    const catList = document.getElementById("categoryBudgetList");
    catList.innerHTML = "";
    Object.keys(categories).forEach(cat => {
      const cSpent = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
      const perc = (cSpent / categories[cat]) * 100;
      catList.innerHTML += `<div class="category-row ${perc > 100 ? 'over-budget' : ''}">
        <div class="cat-header"><span>${cat}</span><span>₹${formatLakhs(cSpent)} / ${formatLakhs(categories[cat])}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(perc, 100)}%"></div></div>
      </div>`;
    });

    const select = document.getElementById("category");
    if(select.options.length <= 1) {
      Object.keys(categories).forEach(cat => {
        const opt = document.createElement("option"); opt.value = cat; opt.innerText = cat; select.appendChild(opt);
      });
    }

    const expList = document.getElementById("expenseList");
    expList.innerHTML = "";
    [...expenses].reverse().forEach(e => {
      expList.innerHTML += `<div class="expense-card">
        <strong>${e.title}</strong> - ₹${formatLakhs(e.amount)}
        <div class="expense-info">${e.date} | ${e.category} | Paid by ${e.paidBy}</div>
        <div class="expense-actions" onclick="deleteExpense(${e.id})">Delete</div>
      </div>`;
    });
  }

  window.updateTotalBudget = () => {
    const newBudget = parseFloat(document.getElementById("totalBudgetInput").value);
    if (!isNaN(newBudget)) {
      totalBudget = newBudget;
      saveAll(); 
      render();
      alert(`Budget set to ₹${formatLakhs(totalBudget)}`);
    }
  };

  window.saveCategoryLimits = () => {
    const inputs = document.querySelectorAll(".cat-limit-input");
    let sum = 0; const newCats = {};
    inputs.forEach(i => { const v = parseFloat(i.value) || 0; newCats[i.dataset.cat] = v; sum += v; });
    
    // We use Math.abs difference check to avoid tiny rounding errors
    if (Math.abs(sum - totalBudget) > 1) {
      return alert(`Total mismatch! \nCategories sum to: ₹${formatLakhs(sum)} \nTotal Budget is: ₹${formatLakhs(totalBudget)}`);
    }
    categories = newCats; 
    saveAll(); 
    render(); 
    alert("Limits Updated! ✅");
  };

  document.getElementById("expenseForm").onsubmit = (e) => {
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

  window.deleteExpense = (id) => { if(confirm("Delete?")) { expenses = expenses.filter(e => e.id !== id); saveAll(); render(); }};

  window.exportCSV = () => {
    if (!expenses.length) return alert("No expenses to export!");
    let csv = "Date,Title,Category,Amount,Paid By,Payment Mode,Notes\n";
    expenses.forEach(e => csv += `${e.date},${e.title},${e.category},${e.amount},${e.paidBy},${e.paymentMode},"${e.notes || ''}"\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Wedding_Expenses.csv'; a.click();
  };

  window.backupData = () => {
    const blob = new Blob([JSON.stringify({totalBudget, categories, expenses})], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Wedding_Backup.json'; a.click();
  };

  window.restoreData = (ev) => {
    const reader = new FileReader();
    reader.onload = (e) => { 
        const d = JSON.parse(e.target.result); 
        expenses = d.expenses || []; 
        categories = d.categories || defaultCategories; 
        totalBudget = d.totalBudget || 1200000;
        saveAll(); render(); alert("Restored Successfully!");
    };
    reader.readAsText(ev.target.files[0]);
  };

  render();
});
