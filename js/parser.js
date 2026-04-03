/**
 * Resume Parser — extracts plain text from PDF and DOCX files
 * Uses PDF.js 2.x (stable API) for PDFs, Mammoth.js for DOCX
 */

const PARSER = (() => {

  // ── PDF.js: use stable 2.x build ────────────────
  function setupPDFWorker() {
    if (typeof pdfjsLib !== 'undefined') {
      // Use the matching worker for the CDN version loaded in HTML
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
  }

  setupPDFWorker();

  // ── PDF Extraction ───────────────────────────────
  async function extractFromPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF reader library not loaded. Please check your internet connection and refresh.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const typedArr = new Uint8Array(e.target.result);

          const loadingTask = pdfjsLib.getDocument({
            data: typedArr,
            // Disable range requests to avoid CORS issues when opening locally
            disableRange: true,
            disableStream: true,
          });

          const pdf = await loadingTask.promise;
          let fullText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page    = await pdf.getPage(pageNum);
            const content = await page.getTextContent();

            // Join items with spaces, add newline between items that are far apart
            let lastY = null;
            let pageText = '';
            content.items.forEach(item => {
              if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += '\n';
              }
              pageText += item.str + ' ';
              lastY = item.transform[5];
            });

            fullText += pageText + '\n\n';
          }

          if (!fullText.trim()) {
            reject('The PDF appears to be image-based (scanned). ATS Pro can only read text-based PDFs. Please use a DOCX file instead.');
            return;
          }

          resolve(fullText);
        } catch (err) {
          reject('PDF parse failed: ' + (err.message || err));
        }
      };

      reader.onerror = () => reject('Could not read the file. Please try again.');
      reader.readAsArrayBuffer(file);
    });
  }

  // ── DOCX Extraction ──────────────────────────────
  async function extractFromDOCX(file) {
    if (typeof mammoth === 'undefined') {
      throw new Error('DOCX reader library not loaded. Please check your internet connection and refresh.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
          if (!result.value || !result.value.trim()) {
            reject('The DOCX file appears to be empty or unreadable.');
            return;
          }
          resolve(result.value);
        } catch (err) {
          reject('DOCX parse failed: ' + (err.message || err));
        }
      };

      reader.onerror = () => reject('Could not read the file. Please try again.');
      reader.readAsArrayBuffer(file);
    });
  }

  // ── TXT Extraction ───────────────────────────────
  async function extractFromTXT(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target.result);
      reader.onerror = () => reject('Could not read the text file.');
      reader.readAsText(file, 'UTF-8');
    });
  }

  // ── Main Entry Point ─────────────────────────────
  async function extract(file) {
    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf'))  return extractFromPDF(file);
    if (name.endsWith('.docx')) return extractFromDOCX(file);
    if (name.endsWith('.doc'))  return extractFromDOCX(file);
    if (name.endsWith('.txt'))  return extractFromTXT(file);

    throw new Error('Unsupported file. Please upload a PDF, DOCX, or TXT file.');
  }

  return { extract };
})();
