document.addEventListener('DOMContentLoaded', function () {
    // --- DOM Elements ---
    // Views
    const calculatorView = document.getElementById('calculator-view');
    const dashboardView = document.getElementById('dashboard-view');
    const requestFormView = document.getElementById('request-form-view');

    // Nav
    const navCalculator = document.getElementById('nav-calculator');
    const navDashboard = document.getElementById('nav-dashboard');

    // Dashboard Actions
    const btnAddRequest = document.getElementById('btnAddRequest');
    const csvInput = document.getElementById('csvInput');
    const requestsTableBody = document.querySelector('#requestsTable tbody');
    const noDataMsg = document.getElementById('no-data-msg');

    // Request Form Actions
    const btnBackToDashboard = document.getElementById('btnBackToDashboard');
    const btnSaveRequest = document.getElementById('btnSaveRequest');

    // Calculator Actions
    const btnSaveQuote = document.getElementById('btnSave');

    // Calculator Inputs & Outputs
    const costRows = document.querySelectorAll('.cost-row');
    const grandTotalCostEl = document.getElementById('grandTotalCost');
    const targetMarginInput = document.getElementById('targetMargin');
    const grossSellingPriceEl = document.getElementById('grossSellingPrice');

    // Tax Inputs
    const tax1LabelInput = document.getElementById('tax1Label');
    const tax1PercentInput = document.getElementById('tax1Percent');
    const tax1ValueEl = document.getElementById('tax1Value');
    const tax2LabelInput = document.getElementById('tax2Label');
    const tax2PercentInput = document.getElementById('tax2Percent');
    const tax2ValueEl = document.getElementById('tax2Value');
    const finalInvoiceAmountEl = document.getElementById('finalInvoiceAmount');

    // Data Inputs (Calculator)
    const calcInputs = {
        clientName: document.getElementById('clientName'),
        companyName: document.getElementById('companyName'),
        programName: document.getElementById('programName'),
        deliveryMode: document.getElementById('deliveryMode'),
        durationType: document.getElementById('durationType'),
        trainerName: document.getElementById('trainerName'),
        trainingDate: document.getElementById('trainingDate'),
        participants: document.getElementById('participants'),
        sessions: document.getElementById('sessions')
    };

    // Data Inputs (Request Form)
    const reqInputs = {
        clientName: document.getElementById('reqClientName'),
        orderType: document.getElementById('reqOrderType'),
        source: document.getElementById('reqSource'),
        date: document.getElementById('reqDate'),
        name: document.getElementById('reqName'),
        email: document.getElementById('reqEmail'),
        wa: document.getElementById('reqWA'),
        participants: document.getElementById('reqParticipants'),
        sessions: document.getElementById('reqSessions'),
        deliveryMode: document.getElementById('reqDeliveryMode'),
        location: document.getElementById('reqLocation'),
        startDate: document.getElementById('reqStartDate'),
        region: document.getElementById('reqRegion'),
        team: document.getElementById('reqTeam'),
        materials: document.getElementById('reqMaterials'),
        notes: document.getElementById('reqNotes')
    };

    // --- State & Config ---
    const formatIDR = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    let state = {
        currentRequestId: null, // If processing a request
        totalCost: 0,
        marginPercent: 55,
        sellingPrice: 0,
        tax1: { label: 'PPN', percent: 11, amount: 0 },
        tax2: { label: 'PPh', percent: 0, amount: 0 },
        finalAmount: 0
    };

    const LOCAL_STORAGE_KEY = 'corporateData';

    // --- Calculation Logic (Calculator) ---
    function calculateCostRow(row) {
        const qty = parseFloat(row.querySelector('.qty').value) || 0;
        const unitCost = parseFloat(row.querySelector('.unit-cost').value) || 0;
        const total = qty * unitCost;
        row.querySelector('.row-total').textContent = formatIDR(total);
        return total;
    }

    function calculateAll() {
        let totalCost = 0;
        costRows.forEach(row => {
            totalCost += calculateCostRow(row);
        });
        state.totalCost = totalCost;
        grandTotalCostEl.textContent = formatIDR(state.totalCost);

        state.marginPercent = parseFloat(targetMarginInput.value) || 0;
        const marginDecimal = state.marginPercent / 100;

        if (marginDecimal >= 1) {
            state.sellingPrice = 0;
        } else {
            state.sellingPrice = state.totalCost / (1 - marginDecimal);
        }
        grossSellingPriceEl.textContent = formatIDR(state.sellingPrice);

        state.tax1.label = tax1LabelInput.value;
        state.tax1.percent = parseFloat(tax1PercentInput.value) || 0;
        state.tax1.amount = state.sellingPrice * (state.tax1.percent / 100);
        tax1ValueEl.textContent = formatIDR(state.tax1.amount);

        state.tax2.label = tax2LabelInput.value;
        state.tax2.percent = parseFloat(tax2PercentInput.value) || 0;
        state.tax2.amount = state.sellingPrice * (state.tax2.percent / 100);
        tax2ValueEl.textContent = formatIDR(state.tax2.amount);

        state.finalAmount = state.sellingPrice + state.tax1.amount + state.tax2.amount;
        finalInvoiceAmountEl.textContent = formatIDR(state.finalAmount);
    }

    // --- Navigation ---
    function switchView(viewName) {
        // Reset ID when leaving calculator unless saving
        if (viewName !== 'calculator') {
            // state.currentRequestId = null; // Don't reset here, handled by actions
        }

        [calculatorView, dashboardView, requestFormView].forEach(el => el.classList.add('hidden'));
        navCalculator.classList.remove('active');
        navDashboard.classList.remove('active');

        if (viewName === 'calculator') {
            calculatorView.classList.remove('hidden');
            navCalculator.classList.add('active');
        } else if (viewName === 'dashboard') {
            dashboardView.classList.remove('hidden');
            navDashboard.classList.add('active');
            renderDashboard();
            state.currentRequestId = null; // Clear active request context
        } else if (viewName === 'request-form') {
            requestFormView.classList.remove('hidden');
        }
    }

    // --- Data Management ---
    function getData() {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    }

    function saveData(data) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }

    // --- Request Form Logic ---
    function saveNewRequest() {
        if (!reqInputs.clientName.value.trim()) {
            alert('Client Name is required.');
            return;
        }

        const newRequest = {
            id: Date.now().toString(),
            type: 'request',
            status: 'New',
            timestamp: new Date().toISOString(),
            requestData: {
                clientName: reqInputs.clientName.value,
                orderType: reqInputs.orderType.value,
                source: reqInputs.source.value,
                requestDate: reqInputs.date.value || new Date().toISOString().split('T')[0],
                requester: {
                    name: reqInputs.name.value,
                    email: reqInputs.email.value,
                    wa: reqInputs.wa.value
                },
                training: {
                    participants: reqInputs.participants.value,
                    sessions: reqInputs.sessions.value,
                    mode: reqInputs.deliveryMode.value,
                    location: reqInputs.location.value,
                    startDate: reqInputs.startDate.value
                },
                details: {
                    region: reqInputs.region.value,
                    team: reqInputs.team.value,
                    materials: reqInputs.materials.value,
                    notes: reqInputs.notes.value
                }
            }
        };

        const data = getData();
        data.push(newRequest);
        saveData(data);

        alert('Request saved successfully!');
        // Reset form
        document.getElementById('requestForm').reset();
        switchView('dashboard');
    }

    // --- CSV Import ---
    csvInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const text = event.target.result;
            processCSV(text);
        };
        reader.readAsText(file);
    });

    function processCSV(csvText) {
        const lines = csvText.split('\n');
        const data = getData();
        let addedCount = 0;

        // Simple CSV parser - assuming headers correlate loosely or fixed order
        // For this demo, let's assume a fixed simple format:
        // ClientName, RequesterName, Program, Date, Participants

        lines.forEach((line, index) => {
            if (index === 0) return; // Skip header
            const cols = line.split(',');
            if (cols.length < 2) return;

            const newReq = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                type: 'request',
                status: 'New',
                timestamp: new Date().toISOString(),
                requestData: {
                    clientName: cols[0]?.trim() || 'Unknown Client',
                    orderType: 'B2B', // Default
                    requestDate: new Date().toISOString().split('T')[0],
                    requester: { name: cols[1]?.trim() || '', email: '', wa: '' },
                    training: {
                        participants: cols[4]?.trim() || 20,
                        sessions: 1,
                        mode: 'Offline',
                        startDate: cols[3]?.trim() || ''
                    },
                    details: {
                        materials: cols[2]?.trim() || '',
                        notes: 'Imported via CSV'
                    }
                }
            };
            data.push(newReq);
            addedCount++;
        });

        saveData(data);
        alert(`Imported ${addedCount} requests from CSV.`);
        renderDashboard();
    }

    // --- Calculator Save (Quote) Logic ---
    function saveQuote() {
        if (!calcInputs.clientName.value.trim()) {
            alert('Please enter a Client Name.');
            return;
        }

        const costData = Array.from(costRows).map(row => ({
            component: row.dataset.component,
            qty: row.querySelector('.qty').value,
            unitCost: row.querySelector('.unit-cost').value
        }));

        const data = getData();
        let entry;

        // If we are editing an existing Request/Quote
        if (state.currentRequestId) {
            const index = data.findIndex(item => item.id === state.currentRequestId);
            if (index !== -1) {
                entry = data[index];
                entry.status = 'Quoted';
                entry.type = 'quote'; // Upgrade to quote
            } else {
                // ID not found, create new
                entry = { id: state.currentRequestId, type: 'quote', status: 'Quoted', timestamp: new Date().toISOString() };
                data.push(entry);
            }
        } else {
            // New Quote from scratch
            entry = {
                id: Date.now().toString(),
                type: 'quote',
                status: 'Quoted',
                timestamp: new Date().toISOString()
            };
            data.push(entry);
        }

        // Update Entry Data
        entry.clientName = calcInputs.clientName.value; // Explicit Top Level
        entry.programName = calcInputs.programName.value;

        entry.quoteData = {
            companyName: calcInputs.companyName.value,
            clientName: calcInputs.clientName.value,
            programName: calcInputs.programName.value,
            deliveryMode: calcInputs.deliveryMode.value,
            durationType: calcInputs.durationType.value,
            trainerName: calcInputs.trainerName.value,
            trainingDate: calcInputs.trainingDate.value,
            participants: calcInputs.participants.value,
            sessions: calcInputs.sessions.value
        };
        entry.costData = costData;
        entry.financials = { ...state };

        saveData(data);
        alert('Pricing saved successfully!');
        switchView('dashboard');
    }

    // --- Dashboard Rendering ---
    function renderDashboard() {
        const data = getData();
        requestsTableBody.innerHTML = '';

        if (data.length === 0) {
            noDataMsg.classList.remove('hidden');
            return;
        }
        noDataMsg.classList.add('hidden');

        // Sort by timestamp desc
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(item => {
            const isQuote = item.type === 'quote' || item.status === 'Quoted';
            const date = new Date(item.timestamp).toLocaleDateString();

            // Extract display info based on type
            let clientName = item.clientName || item.requestData?.clientName || '-';
            let requester = item.requestData?.requester?.name ? `(${item.requestData.requester.name})` : '';
            let program = item.programName || item.requestData?.details?.materials || '-';
            let totalAmt = isQuote ? formatIDR(item.financials?.finalAmount || 0) : '-';

            // Status Badge
            let statusClass = item.status === 'New' ? 'badge-new' : 'badge-quoted';
            let statusBadge = `<span class="badge ${statusClass}">${item.status}</span>`;

            // Action Buttons
            let actionBtn = '';
            if (item.status === 'New') {
                actionBtn = `<button class="btn btn-sm btn-success" onclick="processRequest('${item.id}')">Pricing</button>`;
            } else {
                actionBtn = `<button class="btn btn-sm btn-primary" onclick="editQuote('${item.id}')">Edit Pricing</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td><strong>${clientName}</strong> <br> <small>${requester}</small></td>
                <td>${program}</td>
                <td>${statusBadge} <br> ${totalAmt}</td>
                <td>
                    ${actionBtn}
                    <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.id}')">Delete</button>
                </td>
            `;
            requestsTableBody.appendChild(tr);
        });
    }

    // --- Global Actions (Window) ---
    window.processRequest = function (id) {
        const data = getData();
        const item = data.find(i => i.id === id);
        if (!item) return;

        state.currentRequestId = id; // Set context

        // Pre-fill Calculator with Request Data
        const r = item.requestData;
        calcInputs.clientName.value = r.clientName || '';
        calcInputs.companyName.value = ''; // Manual
        calcInputs.programName.value = r.details.materials || '';
        calcInputs.deliveryMode.value = r.training.mode || 'Offline';
        calcInputs.trainingDate.value = r.training.startDate || '';
        calcInputs.participants.value = r.training.participants || 20;
        calcInputs.sessions.value = r.training.sessions || 1;

        // Reset Costs
        costRows.forEach(row => {
            row.querySelector('.qty').value = 1;
            row.querySelector('.unit-cost').value = 0;
            row.querySelector('.row-total').textContent = formatIDR(0);
        });

        calculateAll();
        switchView('calculator');
        alert(`Loaded request for ${r.clientName}. Please configure costs and save as quote.`);
    };

    window.editQuote = function (id) {
        const data = getData();
        const item = data.find(i => i.id === id);
        if (!item || !item.quoteData) return;

        state.currentRequestId = id;

        // Restore Quote Data
        const q = item.quoteData;
        calcInputs.clientName.value = q.clientName;
        calcInputs.companyName.value = q.companyName;
        calcInputs.programName.value = q.programName;
        calcInputs.deliveryMode.value = q.deliveryMode;
        calcInputs.durationType.value = q.durationType;
        calcInputs.trainerName.value = q.trainerName;
        calcInputs.trainingDate.value = q.trainingDate;
        calcInputs.participants.value = q.participants;
        calcInputs.sessions.value = q.sessions;

        // Restore Costs
        if (item.costData) {
            item.costData.forEach((cost, index) => {
                if (costRows[index]) {
                    costRows[index].querySelector('.qty').value = cost.qty;
                    costRows[index].querySelector('.unit-cost').value = cost.unitCost;
                }
            });
        }

        // Restore Financials
        if (item.financials) {
            targetMarginInput.value = item.financials.marginPercent;
            tax1PercentInput.value = item.financials.tax1.percent;
            tax2PercentInput.value = item.financials.tax2.percent;
        }

        calculateAll();
        switchView('calculator');
    };

    window.deleteItem = function (id) {
        if (confirm('Are you sure you want to delete this item?')) {
            const data = getData();
            const newData = data.filter(i => i.id !== id);
            saveData(newData);
            renderDashboard();
        }
    };

    // --- Init Listeners ---
    // Actions
    navCalculator.addEventListener('click', () => switchView('calculator'));
    navDashboard.addEventListener('click', () => switchView('dashboard'));

    btnAddRequest.addEventListener('click', () => {
        document.getElementById('requestForm').reset();
        switchView('request-form');
    });
    btnBackToDashboard.addEventListener('click', () => switchView('dashboard'));
    btnSaveRequest.addEventListener('click', saveNewRequest);
    btnSaveQuote.addEventListener('click', saveQuote);

    // Calc Re-calc
    costRows.forEach(row => {
        row.querySelectorAll('input').forEach(i => i.addEventListener('input', calculateAll));
    });
    [targetMarginInput, tax1PercentInput, tax2PercentInput].forEach(i => i.addEventListener('input', calculateAll));

    // Initial
    calculateAll();
});
