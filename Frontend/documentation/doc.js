// Toggle Dark/Light Theme
function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const icon = document.getElementById("themeIcon");
  if (document.body.classList.contains("dark-theme")) {
    icon.className = "ri-sun-line";
  } else {
    icon.className = "ri-moon-line";
  }
}

// Generate PDF
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'a4');
  const content = document.getElementById("docContent");

  html2canvas(content, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let position = 0;
    let heightLeft = pdfHeight;

    doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= doc.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= doc.internal.pageSize.getHeight();
    }

    doc.save("Sahaay_Documentation.pdf");
  });
}