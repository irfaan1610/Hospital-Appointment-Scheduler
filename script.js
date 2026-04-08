//    STATE
let appointments = JSON.parse(localStorage.getItem('capminds_appts') || '[]');
let editId = null;
let currentDate = new Date();
const DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

function saveToStorage() {
  localStorage.setItem('capminds_appts', JSON.stringify(appointments));
}

function genId() {
  return 'appt_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
}

// SIDEBAR
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const sidebarToggle = document.getElementById('sidebarToggle');
const toggleIcon = document.getElementById('toggleIcon');

let sidebarOpen = window.innerWidth > 900;

function updateSidebarState() {
  if (sidebarOpen) {
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('expanded');
    toggleIcon.setAttribute('points', '15 18 9 12 15 6');
  } else {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    toggleIcon.setAttribute('points', '9 18 15 12 9 6');
  }
}

sidebarToggle.addEventListener('click', () => {
  sidebarOpen = !sidebarOpen;
  updateSidebarState();
});
updateSidebarState();

//    NAVIGATION
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    const pageId = 'page' + item.dataset.page.charAt(0).toUpperCase() + item.dataset.page.slice(1);
    document.getElementById(pageId).classList.add('active');
    if (item.dataset.page === 'dashboard') renderTable(getFilteredAppts());
  });
});

//    CALENDAR
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  // Month label
  const label = new Date(year, month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('calMonthLabel').textContent = label;

  // Day headers
  const headersEl = document.getElementById('calDayHeaders');
  headersEl.innerHTML = '';
  DAYS.forEach((d, i) => {
    const h = document.createElement('div');
    h.className = 'cal-day-header' + (i === 5 ? ' today-col' : '');
    h.textContent = d;
    headersEl.appendChild(h);
  });

  // Cells
  const bodyEl = document.getElementById('calBody');
  bodyEl.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  // Prev month cells
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = makeCell(year, month - 1, daysInPrev - i, true);
    bodyEl.appendChild(cell);
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const cell = makeCell(year, month, d, false, isToday);
    bodyEl.appendChild(cell);
  }

  // Next month fill
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    const cell = makeCell(year, month + 1, d, true);
    bodyEl.appendChild(cell);
  }
}

function makeCell(year, month, day, isOther, isToday) {
  const cell = document.createElement('div');
  cell.className = 'cal-cell' +
    (isOther ? ' other-month' : '') +
    (isToday  ? ' today-cell' : '');

  const dateNum = document.createElement('div');
  dateNum.className = 'cal-date-num';
  const cellDate = new Date(year, month, day);
  const iso = toISODate(cellDate);
  dateNum.textContent = isOther
    ? (month < 0 ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][((month%12)+12)%12]} ${day}` : `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month%12]} ${day}`)
    : day;
  cell.appendChild(dateNum);

  // Appointments on this date
  const dayAppts = appointments.filter(a => a.date === iso);
  dayAppts.forEach(appt => {
    const chip = document.createElement('div');
    chip.className = 'appt-chip';
    chip.innerHTML = `
      <span class="appt-chip-name">&#128100; ${appt.patient} (Arrived) ${formatTime(appt.time)}</span>
      <div class="appt-chip-actions">
        <button title="Edit" onclick="openEdit('${appt.id}', event)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button title="Delete" onclick="deleteAppt('${appt.id}', event)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
        <button title="Info">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </button>
      </div>`;
    cell.appendChild(chip);
  });

  // Click empty cell → open book with date pre-filled
  cell.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    if (!isOther) {
      openBook(iso);
    }
  });

  return cell;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh = h % 12 || 12;
  return `${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar();
});
document.getElementById('todayBtn').addEventListener('click', () => {
  currentDate = new Date();
  renderCalendar();
});


//MODAL
const modalOverlay = document.getElementById('modalOverlay');
const apptForm = document.getElementById('apptForm');

function openBook(preDate) {
  editId = null;
  apptForm.reset();
  clearErrors();
  document.getElementById('modalTitle').textContent = 'Schedule Appointment';
  if (preDate) document.getElementById('apptDate').value = preDate;
  modalOverlay.classList.add('open');
}

function openEdit(id, e) {
  if (e) e.stopPropagation();
  const appt = appointments.find(a => a.id === id);
  if (!appt) return;
  editId = id;
  clearErrors();
  document.getElementById('modalTitle').textContent = 'Edit Appointment';
  document.getElementById('patientName').value = appt.patient;
  document.getElementById('doctorName').value = appt.doctor;
  document.getElementById('hospitalName').value = appt.hospital;
  document.getElementById('specialty').value = appt.specialty;
  document.getElementById('apptDate').value = appt.date;
  document.getElementById('apptTime').value = appt.time;
  document.getElementById('reason').value = appt.reason || '';
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
  editId = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.getElementById('btnBook').addEventListener('click', () => openBook());

//FORM VALIDATION & SAVE
function clearErrors() {
  document.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
}

function validate() {
  let valid = true;
  const checks = [
    { fieldId: 'fPatient',  inputId: 'patientName'  },
    { fieldId: 'fDoctor',   inputId: 'doctorName'   },
    { fieldId: 'fHospital', inputId: 'hospitalName' },
    { fieldId: 'fSpecialty',inputId: 'specialty'    },
    { fieldId: 'fDate',     inputId: 'apptDate'     },
    { fieldId: 'fTime',     inputId: 'apptTime'     },
  ];
  checks.forEach(({ fieldId, inputId }) => {
    const val = document.getElementById(inputId).value.trim();
    if (!val) {
      document.getElementById(fieldId).classList.add('has-error');
      valid = false;
    }
  });
  return valid;
}

document.getElementById('btnSave').addEventListener('click', () => {
  clearErrors();
  if (!validate()) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  const appt = {
    id:       editId || genId(),
    patient:  document.getElementById('patientName').value,
    doctor:   document.getElementById('doctorName').value,
    hospital: document.getElementById('hospitalName').value,
    specialty:document.getElementById('specialty').value,
    date:     document.getElementById('apptDate').value,
    time:     document.getElementById('apptTime').value,
    reason:   document.getElementById('reason').value,
  };

  if (editId) {
    appointments = appointments.map(a => a.id === editId ? appt : a);
    showToast('Appointment updated!', 'success');
  } else {
    appointments.push(appt);
    showToast('Appointment saved!', 'success');
  }

  saveToStorage();
  closeModal();
  renderCalendar();
  if (document.getElementById('pageDashboard').classList.contains('active')) {
    renderTable(getFilteredAppts());
  }
});


//DELETE
function deleteAppt(id, e) {
  if (e) e.stopPropagation();
  if (!confirm('Delete this appointment?')) return;
  appointments = appointments.filter(a => a.id !== id);
  saveToStorage();
  renderCalendar();
  renderTable(getFilteredAppts());
  showToast('Appointment deleted.', 'success');
}


//DASHBOARD TABLE
function getFilteredAppts() {
  const pat  = document.getElementById('searchPatient')?.value.toLowerCase() || '';
  const doc  = document.getElementById('searchDoctor')?.value.toLowerCase() || '';
  const from = document.getElementById('filterFrom')?.value || '';
  const to   = document.getElementById('filterTo')?.value   || '';

  return appointments.filter(a => {
    if (pat  && !a.patient.toLowerCase().includes(pat)) return false;
    if (doc  && !a.doctor.toLowerCase().includes(doc))  return false;
    if (from && a.date < from) return false;
    if (to   && a.date > to)   return false;
    return true;
  });
}

function renderTable(data) {
  const tbody = document.getElementById('apptTableBody');
  if (!data.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No appointments found.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(a => `
    <tr>
      <td><span class="link" onclick="openEdit('${a.id}')">${a.patient}</span></td>
      <td><span class="link" onclick="openEdit('${a.id}')">${a.doctor}</span></td>
      <td>${a.hospital}</td>
      <td>${a.specialty}</td>
      <td>${formatDisplayDate(a.date)}</td>
      <td class="time-blue">${formatTime(a.time)} - ${formatEndTime(a.time)}</td>
      <td>
        <button class="tbl-action-btn edit" title="Edit" onclick="openEdit('${a.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="tbl-action-btn del" title="Delete" onclick="deleteAppt('${a.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </td>
    </tr>`).join('');
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatEndTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const endM = (m + 15) % 60;
  const endH = m + 15 >= 60 ? h + 1 : h;
  const ampm = endH >= 12 ? 'AM' : 'AM';
  const hh = endH % 12 || 12;
  return `${String(hh).padStart(2,'0')}:${String(endM).padStart(2,'0')} AM`;
}

// Live filter on input
['searchPatient','searchDoctor'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => renderTable(getFilteredAppts()));
});
document.getElementById('btnUpdate')?.addEventListener('click', () => renderTable(getFilteredAppts()));

//TOAST
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(toastTimer);
  requestAnimationFrame(() => {
    t.classList.add('show');
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  });
}

//KEYBOARD
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

//INIT
renderCalendar();
renderTable(appointments);

// Expose globals for inline handlers
window.openEdit   = openEdit;
window.deleteAppt = deleteAppt;
window.openBook   = openBook;
