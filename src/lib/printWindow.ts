/**
 * Chekni chop etish uchun alohida, mustaqil oyna ochadi. Bu usul asosiy
 * ilovaning CSS/layout murakkabliklaridan (flex, position, Tailwind
 * qoidalari) butunlay mustaqil ishlaydi — shu sababli har xil brauzer va
 * printer sozlamalarida ancha barqaror.
 *
 * @param widthMm Chek qog'ozi kengligi (mm). Ko'pchilik chek-printerlar
 *                80mm, ba'zilari 58mm bo'ladi — agar sizning printeringiz
 *                58mm bo'lsa, chaqirganda `widthMm: 58` deb bering.
 */
export function openPrintWindow(bodyHtml: string, title = "Chek", widthMm = 80) {
  const printWindow = window.open("", "_blank", "width=820,height=640");
  if (!printWindow) {
    alert(
      "Chop etish oynasi ochilmadi. Brauzeringizda ushbu sayt uchun pop-up oynalar bloklangan bo'lishi mumkin — brauzer manzil satrida chiqqan bildirishnomadan ruxsat bering."
    );
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: ${widthMm}mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html {
    width: ${widthMm}mm;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
  }
  body {
    width: ${widthMm}mm;
    max-width: ${widthMm}mm;
    overflow-x: hidden;
    padding: 2mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.35;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .title { font-size: 14px; }
  .big { font-size: 13px; }
  .row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`);
  printWindow.document.close();

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      /* noop */
    }
  };

  // Ba'zi brauzerlarda onload ishonchli chaqirilmasligi mumkin — shuning
  // uchun ham onload, ham zaxira timeout orqali chop etishni ishga tushiramiz.
  printWindow.onload = triggerPrint;
  setTimeout(triggerPrint, 300);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { escapeHtml };