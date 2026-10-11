const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

(async () => {
  const source = path.resolve(process.argv[2] || 'docs/APPLICATION_PROCESS_FLOW.md');
  const markdown = fs.readFileSync(source, 'utf8');
  const expectedHeadings = (markdown.match(/^## /gm) || []).length;
  const expectedDiagrams = (markdown.match(/^```mermaid/gm) || []).length;
  const title = (markdown.match(/^# (.+)$/m) || [null, 'FINOVA documentation'])[1];
  const footerTitle = title.replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`);
  const output = source.replace(/\.md$/, '.pdf');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: A4; margin: 16mm 13mm 18mm; }
      body { font: 10px/1.5 Arial, sans-serif; color: #172033; }
      h1 { font-size: 25px; color: #143b65; margin-bottom: 10px; }
      h2 { font-size: 16px; color: #143b65; margin-top: 24px; break-after: avoid; }
      h3 { break-after: avoid; }
      p, li { orphans: 3; widows: 3; }
      a { color: #225c9b; text-decoration: none; overflow-wrap: anywhere; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9px; table-layout: fixed; }
      th, td { padding: 6px; border: 1px solid #ccd5df; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { background: #e9f0f7; }
      tr { break-inside: avoid; }
      thead { display: table-header-group; }
      code { font: 9px Consolas, monospace; overflow-wrap: anywhere; }
      pre { white-space: pre-wrap; padding: 10px; background: #f1f5f9; break-inside: avoid; }
      .diagram { break-inside: avoid; text-align: center; margin: 14px 0; }
      .diagram svg { max-width: 100%; max-height: 235mm; height: auto; }
    </style></head><body><main></main></body></html>`);
    await page.addScriptTag({ path: path.join(os.tmpdir(), 'finova-marked.min.js') });
    await page.addScriptTag({ path: path.join(os.tmpdir(), 'finova-mermaid.min.js') });
    const result = await page.evaluate(async (markdown) => {
      document.querySelector('main').innerHTML = marked.parse(markdown);
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict',
        flowchart: { htmlLabels: false }, er: { useMaxWidth: true },
        themeVariables: { fontSize: '14px', fontFamily: 'Arial' } });
      const blocks = [...document.querySelectorAll('pre code.language-mermaid')];
      for (const [index, block] of blocks.entries()) {
        const { svg } = await mermaid.render('diagram-' + index, block.textContent);
        const figure = document.createElement('div');
        figure.className = 'diagram';
        figure.innerHTML = svg;
        block.parentElement.replaceWith(figure);
      }
      await document.fonts.ready;
      return { diagrams: blocks.length, headings: document.querySelectorAll('h2').length,
        errors: document.querySelectorAll('.error-icon').length };
    }, markdown);
    if (result.errors || result.headings !== expectedHeadings || result.diagrams !== expectedDiagrams)
      throw new Error('Unexpected document structure: ' + JSON.stringify(result));
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: output, format: 'A4', printBackground: true,
      displayHeaderFooter: true, headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#64748b">${footerTitle} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>` });
    console.log(JSON.stringify({ output, ...result, bytes: fs.statSync(output).size }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
