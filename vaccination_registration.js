window.onload = function () {
  const form = document.getElementById('registrationForm');
  const output = document.getElementById('output');
  const searchBar = document.getElementById('searchBar');
  const filterVaccine = document.getElementById('filterVaccine');

  let registrations = JSON.parse(localStorage.getItem('registrations')) || [];
  displayRecords();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = {
      id: 'VAC' + Date.now(),
      name: form.name.value.trim(),
      age: form.age.value,
      gender: form.gender.value,
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      vaccine: form.vaccine.value,
      slot: form.slot.value,
      date: form.date.value,
      dose: form.dose.value
    };

    // Validation
    if (!data.name || !data.phone || !data.email || !data.date || !data.vaccine || !data.slot) {
      Swal.fire({ icon: 'error', title: 'Please fill all required fields' });
      return;
    }

    registrations.push(data);
    localStorage.setItem('registrations', JSON.stringify(registrations));

    // SweetAlert confirmation
    Swal.fire({
      icon: 'success',
      html: `
        <div style="text-align:left;">
          <b>${escapeHtml(data.name)}</b><br>
          Vaccine: ${escapeHtml(data.vaccine)}<br>
          Dose: ${escapeHtml(data.dose)}<br>
          Date: ${escapeHtml(data.date)}<br>
          Slot: ${escapeHtml(data.slot)}<br><br>
          <button id="swalDownload" style="background:#bb86fc; color:var(--button-text); padding:8px 12px; border-radius:6px; border:2px solid black; cursor:pointer;">
            Download PDF
          </button>
        </div>
      `,
      confirmButtonColor: '#bb86fc'
    });

    setTimeout(() => {
      const btn = document.getElementById('swalDownload');
      if (btn) btn.addEventListener('click', () => downloadCertificate(data.id));
    }, 200);

    form.reset();
    displayRecords();
  });

  function displayRecords() {
    const keyword = (searchBar.value || '').toLowerCase();
    const filter = filterVaccine.value || 'all';
    output.innerHTML = '';

    registrations
      .filter((r) => {
        return (
          (r.name.toLowerCase().includes(keyword) || r.email.toLowerCase().includes(keyword)) &&
          (filter === 'all' || r.vaccine === filter)
        );
      })
      .forEach((r) => {
        const card = document.createElement('div');
        card.className = 'record-card';

        const left = document.createElement('div');
        left.className = 'record-left';
        left.innerHTML = `
          <strong><i class="fa-solid fa-user"></i> ${escapeHtml(r.name)}</strong> (${escapeHtml(r.age)}, ${escapeHtml(r.gender)})<br>
          <i class="fa-solid fa-phone"></i> ${escapeHtml(r.phone)} | <i class="fa-solid fa-envelope"></i> ${escapeHtml(r.email)}<br>
          <i class="fa-solid fa-syringe"></i> ${escapeHtml(r.vaccine)} (${escapeHtml(r.dose)})<br>
          <i class="fa-regular fa-calendar"></i> ${escapeHtml(r.date)} | <i class="fa-solid fa-clock"></i> ${escapeHtml(r.slot)}<br>
          <i class="fa-solid fa-id-card"></i> ID: ${escapeHtml(r.id)}
        `;

        const right = document.createElement('div');
        right.className = 'record-right';
        right.innerHTML = `
          <button class="small-btn" onclick="downloadCertificate('${r.id}')"><i class="fa-solid fa-file-arrow-down"></i> PDF</button>
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
              JSON.stringify(r)
            )}&size=100x100" alt="QR Code">
          </div>
        `;

        card.appendChild(left);
        card.appendChild(right);
        output.appendChild(card);
      });
  }

  searchBar.addEventListener('input', displayRecords);
  filterVaccine.addEventListener('change', displayRecords);

  function toggleTheme() {
    document.body.classList.toggle('dark');
  }

  // PDF Generator
  window.downloadCertificate = function (id) {
    const reg = registrations.find((r) => r.id === id);
    if (!reg) {
      Swal.fire({ icon: 'error', title: 'Record not found' });
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 40;
    let y = 60;

    doc.setFontSize(18);
    doc.text('Government of India', 220, y);
    y += 26;
    doc.setFontSize(16);
    doc.text('Vaccination Registration Form', 200, y);
    y += 28;

    doc.setLineWidth(0.8);
    doc.line(left, y, 560, y);
    y += 20;

    doc.setFontSize(12);
    doc.text(`Name: ${reg.name}`, left, y);
    y += 18;
    doc.text(`Age: ${reg.age}`, left, y);
    y += 18;
    doc.text(`Gender: ${reg.gender}`, left, y);
    y += 18;
    doc.text(`Phone: ${reg.phone}`, left, y);
    y += 18;
    doc.text(`Email: ${reg.email}`, left, y);
    y += 18;
    doc.text(`Vaccine: ${reg.vaccine}`, left, y);
    y += 18;
    doc.text(`Dose: ${reg.dose}`, left, y);
    y += 18;
    doc.text(`Date: ${reg.date}`, left, y);
    y += 18;
    doc.text(`Slot: ${reg.slot}`, left, y);
    y += 18;
    doc.text(`Registration ID: ${reg.id}`, left, y);
    y += 24;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      JSON.stringify(reg)
    )}&size=150x150`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      doc.addImage(img, 'PNG', 420, 120, 120, 120);
      doc.setFontSize(10);
      doc.text('Verified by: National Vaccination System', left, y + 30);
      doc.save(`${sanitizeFilename(reg.name)}_Vaccination_Form.pdf`);
    };
    img.onerror = function () {
      doc.setFontSize(10);
      doc.text('Verified by: National Vaccination System', left, y + 30);
      doc.save(`${sanitizeFilename(reg.name)}_Vaccination_Form.pdf`);
    };
    img.src = qrUrl;
  };

  function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function sanitizeFilename(name) {
    return (name || 'certificate').replace(/[^a-z0-9_\-\.]/gi, '_');
  }
};
