// --- 1. GLOBAL VARIABLES & HELPERS ---
const defaultCategories = {
  "Venue & Catering": 400000, "Decor": 100000, "Photography": 120000,
  "Apparel": 100000, "Jewellery": 150000, "Travel": 80000,
  "Gifts": 70000, "Ritual": 50000, "Misc": 50000, "Contingency": 80000
};

// Load data
let storedBudget = localStorage.getItem("totalBudget");
let totalBudget = storedBudget ? parseFloat(storedBudget) : 1200000;
let categories = JSON.parse(localStorage.getItem("categoryBudgets")) || defaultCategories;
let expenses = JSON.parse(localStorage.getItem("weddingExpenses")) || [];

// Helper: 120000 -> "1.2L"
function formatLakhs(num) {
  let abs = Math.abs(num);
  if (abs >= 100000) {
    return (num / 100000).toFixed(2).replace(/\.00$/, '') + 'L';
  }
  return num.toLocaleString('en-IN');
}

// Helper: 120000 -> "1,20,000" (For Input Fields)
function formatCommas(num) {
  return num ? num.toLocaleString('en-IN') : '';
}

// Helper: "1,20,000" -> 120000 (For Calculation)
function parseCommas(str) {
  if(!str) return 0;
  return parseFloat(str.toString().replace(/,/g, ''));
}

// --- 2. SAVE & RENDER LOGIC ---
function saveAll() {
  localStorage.setItem("weddingExpenses", JSON.stringify(expenses));
  localStorage.setItem("totalBudget", totalBudget);
  localStorage.setItem("categoryBudgets", JSON.stringify(categories));
  // Firebase sync later
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

  const engEl = document.getElementById("engagementCountdown");
  const wedEl = document.getElementById("weddingCountdown");
  if(engEl) engEl.innerText = today < engDate ? getDiff(engDate) : "Completed! 💍";
  if(wedEl) wedEl.innerText = today < wedDate ? getDiff(wedDate) : "Wedding Day! 🎉";

  let spent = expenses.reduce((s, e) => s + e.amount, 0);
  let groomPaid = expenses.filter(e => e.paidBy === "Groom").reduce((s, e) => s + e.amount, 0);

  document.getElementById("totalSpent").innerText = "₹" + formatLakhs(spent);
  document.getElementById("remaining").innerText = "₹" + formatLakhs(totalBudget - spent);

  const settlement = groomPaid - (spent / 2);
  const setEl = document.getElementById("settlement");
  setEl.innerText = Math.abs(settlement) < 1 ? "Settled ✅" : (settlement > 0 ? `Bride owes ₹${formatLakhs(settlement)}` : `Groom owes ₹${formatLakhs(Math.abs(settlement))}`);
  setEl.style.color = Math.abs(settlement) < 1 ? "green" : "#d32f2f";

  // --- Category Limits Editor (With Commas) ---
  const currentAllocated = Object.values(categories).reduce((a,b)=>a+b,0);
  const headerDiv = document.getElementById("categorySettingsHeader");
  const inputsDiv = document.getElementById("categorySettingsInputs");
  
  if(headerDiv) {
      headerDiv.innerHTML = `Allocated: ₹${formatLakhs(currentAllocated)} / Total Budget: ₹${formatLakhs(totalBudget)}`;
      headerDiv.style.color = Math.abs(currentAllocated - totalBudget) > 100 ? "#d32f2f" : "#2e7d32";
  }

  // Only render inputs if empty to prevent focus loss while typing
  if(inputsDiv && inputsDiv.innerHTML === "") {
      Object.keys(categories).forEach(cat => {
        const d = document.createElement("div");
        d.style = "display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;";
        
        // Note: type="text" to allow commas
        d.innerHTML = `<span style="font-size:14px;">${cat}</span>
          <input type="text" inputmode="numeric" class="cat-limit-input" data-cat="${cat}" value="${formatCommas(categories[cat])}" 
          oninput="formatSelf(this)"
          style="width:120px; padding:8px; border:1px solid #ddd; border-radius:6px;">`;
        inputsDiv.appendChild(d);
      });
  }

  const catList = document.getElementById("categoryBudgetList");
  if(catList) {
      catList.innerHTML = "";
      Object.keys(categories).forEach(cat => {
        const cSpent = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
        const limit = categories[cat];
        const perc = limit > 0 ? (cSpent / limit) * 100 : 0;
        catList.innerHTML += `<div class="category-row ${perc > 100 ? 'over-budget' : ''}">
          <div class="cat-header"><span>${cat}</span><span>₹${formatLakhs(cSpent)} / ${formatLakhs(limit)}</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(perc, 100)}%"></div></div>
        </div>`;
      });
  }

  const select = document.getElementById("category");
  if(select && select.options.length <= 1) {
    Object.keys(categories).forEach(cat => {
      const opt = document.createElement("option"); opt.value = cat; opt.innerText = cat; select.appendChild(opt);
    });
  }

  const expList = document.getElementById("expenseList");
  if(expList) {
      expList.innerHTML = "";
      [...expenses].reverse().forEach(e => {
        expList.innerHTML += `<div class="expense-card">
          <strong>${e.title}</strong> - ₹${formatLakhs(e.amount)}
          <div class="expense-info">${e.date} | ${e.category} | Paid by ${e.paidBy}</div>
          <div class="expense-actions" onclick="deleteExpense(${e.id})">Delete</div>
        </div>`;
      });
  }
}

// --- 3. LIVE FORMATTING HELPER ---
window.formatSelf = function(el) {
    const raw = el.value.replace(/,/g, '').replace(/[^0-9]/g, ''); // Keep digits only
    if(raw) {
        el.value = parseInt(raw).toLocaleString('en-IN');
    } else {
        el.value = "";
    }
};

// --- 4. EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", function() {
    render();

    // Budget Input Live Formatting
    const budgetInput = document.getElementById("totalBudgetInput");
    if(budgetInput) {
        budgetInput.value = formatCommas(totalBudget); // Initial Load
        budgetInput.addEventListener('input', function() { formatSelf(this); });
    }

    document.getElementById("setBudgetBtn").addEventListener("click", function() {
        const rawVal = document.getElementById("totalBudgetInput").value;
        const newBudget = parseCommas(rawVal);
        
        if (newBudget <= 0 || isNaN(newBudget)) {
            alert("Please enter a valid number.");
            return;
        }

        totalBudget = newBudget;
        saveAll();
        // Force refresh of "Allocated vs Total" text
        document.getElementById("categorySettingsHeader").innerHTML = "Updating...";
        setTimeout(render, 50);
        alert(`Total Budget updated to ₹${formatLakhs(totalBudget)}`);
    });

    document.getElementById("saveLimitsBtn").addEventListener("click", function() {
        const inputs = document.querySelectorAll(".cat-limit-input");
        let sum = 0; 
        const newCats = {};
        
        inputs.forEach(i => { 
            const v = parseCommas(i.value);
            newCats[i.dataset.cat] = v; 
            sum += v; 
        });

        const diff = Math.abs(sum - totalBudget);
        if (diff > 100) { 
            alert(`⚠️ Mismatch Warning!\n\nCategories Sum: ₹${formatLakhs(sum)}\nTotal Budget: ₹${formatLakhs(totalBudget)}\nDifference: ₹${formatLakhs(diff)}`);
            return; 
        }

        categories = newCats;
        saveAll();
        render(); // This updates the progress bars
        alert("Category Limits Verified & Saved! ✅");
    });

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
});

// --- 5. EXPORT / IMPORT ---
window.deleteExpense = (id) => { 
    if(confirm("Delete this expense?")) { 
        expenses = expenses.filter(e => e.id !== id); 
        saveAll(); render(); 
    }
};

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
  const file = ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => { 
      try {
          const d = JSON.parse(e.target.result); 
          if(d.expenses) expenses = d.expenses; 
          if(d.categories) categories = d.categories; 
          if(d.totalBudget) totalBudget = d.totalBudget;
          saveAll(); render(); 
          alert("Data Restored Successfully!");
      } catch(err) {
          alert("Invalid Backup File");
      }
  };
  reader.readAsText(file);
};
