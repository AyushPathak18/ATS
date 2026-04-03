/**
 * Resume Parser — extracts plain text from PDF and DOCX files
 * Uses PDF.js for PDFs, Mammoth.js for DOCX, plain text for TXT
 */

const PARSER = (() => {

  // Configure PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  async function extractFromPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const typedArr = new Uint8Array(e.target.result);
          const pdf      = await pdfjsLib.getDocument({ data: typedArr }).promise;
          let   fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page    = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          resolve(fullText);
        } catch (err) {
          reject(`PDF parse error: ${err.message}`);
        }
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsArrayBuffer(file);
    });
  }

  async function extractFromDOCX(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
          resolve(result.value);
        } catch (err) {
          reject(`DOCX parse error: ${err.message}`);
        }
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsArrayBuffer(file);
    });
  }

  async function extractFromTXT(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = () => reject('Failed to read file');
      reader.readAsText(file);
    });
  }

  async function extract(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf'))  return extractFromPDF(file);
    if (name.endsWith('.docx')) return extractFromDOCX(file);
    if (name.endsWith('.doc'))  return extractFromDOCX(file);
    if (name.endsWith('.txt'))  return extractFromTXT(file);
    throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
  }

  return { extract };
})();
