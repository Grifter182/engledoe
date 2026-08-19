/**
 * Builds /downloads/ws-engledoe-when-a-loved-one-passes.pdf
 *
 * The PDF is a print counterpart of /guides/when-a-loved-one-passes.html and
 * deliberately reuses the site design system: the same tokens from
 * assets/site.css (deep blue, muted gold, paper, soft cream) and the same two
 * typefaces the site loads from Google Fonts (Playfair Display + Lato).
 *
 * Regenerate after editing the guide copy:
 *   npm i pdfkit && node tools/generate-guide-pdf.mjs
 *
 * Fonts are downloaded from fonts.gstatic.com on first run and cached in
 * tools/.fonts/ (git-ignored).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(ROOT, 'tools', '.fonts');
const OUT = path.join(ROOT, 'downloads', 'ws-engledoe-when-a-loved-one-passes.pdf');

/* --- Design tokens (mirrors :root in assets/site.css) --------------------- */
const SOFT_CREAM = '#FDFBF7';
const PAPER = '#F4EFE5';
const CHARCOAL = '#343F4B';
const DEEP_BLUE = '#233746';
const GOLD = '#C0B283';
const HAIRLINE = '#DAD5CB';

const FONTS = {
  'Playfair-Bold': 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf',
  'Playfair-Regular': 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf',
  'Lato-Regular': 'https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxk.ttf',
  'Lato-Bold': 'https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVew8.ttf',
};

async function ensureFonts() {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  for (const [name, url] of Object.entries(FONTS)) {
    const file = path.join(FONT_DIR, `${name}.ttf`);
    if (fs.existsSync(file)) continue;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not download ${name}: ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
}

/* --- Guide content -------------------------------------------------------- */
const INTRO =
  'In the first hours after a death, it is normal to feel overwhelmed. You do not have to manage ' +
  'everything at once. We are here to guide you through the next steps.';

const STEPS = [
  {
    title: 'Take a moment',
    body: 'There is no need to make every decision immediately. Ask someone you trust to stay with you if you are alone.',
  },
  {
    title: 'Follow the appropriate process',
    body: 'The next steps depend on where and how the death occurred. Hospital, hospice and care-home staff can guide you. Sudden, unexpected or unnatural deaths require the relevant authorities.',
  },
  {
    title: 'Contact W.S. Engledoe & Sons',
    body: 'Once the required medical or police procedures have been followed, contact us. We are available 24 hours a day to assist with collection and the arrangements that follow.',
  },
  {
    title: 'Gather key information',
    body: 'Where possible, have the deceased’s ID/passport, medical or hospital information and any funeral-plan documents available.',
  },
  {
    title: 'Choose one family contact',
    body: 'Having one person coordinate the funeral arrangements can reduce confusion and help information reach the right family members.',
  },
  {
    title: 'We will guide you',
    body: 'We can assist with funeral planning, burial or cremation arrangements, documentation and the practical details of the farewell.',
  },
];

/* --- Layout --------------------------------------------------------------- */
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 52; // page gutter
const HEADER_H = 122;
const FOOTER_H = 104;
const NUM_W = 32; // width of the gold numeral column on each step card
const PAD = 11;

function eyebrow(doc, text, x, y, color, size = 7.2) {
  doc.font('Lato-Bold').fontSize(size).fillColor(color)
    .text(text.toUpperCase(), x, y, { characterSpacing: 1.9, lineBreak: false });
}

async function build() {
  await ensureFonts();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0, info: {
    Title: 'When a loved one passes away — W. S. Engledoe & Sons',
    Author: 'W. S. Engledoe & Sons Funerals',
    Subject: 'What to do in the first hours after a death',
    Keywords: 'funeral, Cape Town, guide, bereavement, W.S. Engledoe & Sons',
  }});
  doc.pipe(fs.createWriteStream(OUT));

  for (const name of Object.keys(FONTS)) {
    doc.registerFont(name, path.join(FONT_DIR, `${name}.ttf`));
  }

  /* Page field */
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(SOFT_CREAM);

  /* --- Header band ------------------------------------------------------- */
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(DEEP_BLUE);

  // The faint gold ring that appears in the site's hero sections.
  doc.save();
  doc.rect(0, 0, PAGE_W, HEADER_H).clip();
  doc.circle(PAGE_W - 46, HEADER_H + 6, 96).lineWidth(1).strokeOpacity(0.34).strokeColor(GOLD).stroke();
  doc.circle(PAGE_W - 46, HEADER_H + 6, 132).lineWidth(1).strokeOpacity(0.16).strokeColor(GOLD).stroke();
  doc.restore();
  doc.strokeOpacity(1);

  doc.font('Playfair-Bold').fontSize(17).fillColor(SOFT_CREAM)
    .text('W. S. ENGLEDOE & SONS', M, 34, { characterSpacing: 0.6, lineBreak: false });
  doc.rect(M, 63, 46, 2).fill(GOLD);
  eyebrow(doc, 'Family-run in Cape Town since 1955', M, 76, GOLD);

  eyebrow(doc, '24-hour assistance', PAGE_W - M - 150, 40, GOLD, 6.8);
  doc.font('Playfair-Bold').fontSize(16).fillColor(SOFT_CREAM)
    .text('082 49 49 852', PAGE_W - M - 150, 55, { width: 150, align: 'right', lineBreak: false });
  doc.font('Lato-Regular').fontSize(7.4).fillColor('#B9C0C7')
    .text('Salt River, Cape Town', PAGE_W - M - 150, 78, { width: 150, align: 'right', lineBreak: false });

  doc.rect(0, HEADER_H, PAGE_W, 2.5).fill(GOLD);

  /* --- Title block ------------------------------------------------------- */
  let y = HEADER_H + 40;
  eyebrow(doc, 'A guide for the first hours', M, y, GOLD, 7.4);
  y += 16;
  doc.rect(M, y, 46, 2).fill(GOLD);
  y += 18;
  doc.font('Playfair-Bold').fontSize(26).fillColor(CHARCOAL)
    .text('When a loved one passes away', M, y, { lineBreak: false });
  y += 44;

  const contentW = PAGE_W - M * 2;
  doc.font('Lato-Regular').fontSize(9.6).fillColor(CHARCOAL);
  const introH = doc.heightOfString(INTRO, { width: contentW - 40, lineGap: 3.4 });
  doc.text(INTRO, M, y, { width: contentW - 40, lineGap: 3.4 });
  y += introH + 20;

  /* --- Step cards -------------------------------------------------------- */
  const bodyW = contentW - NUM_W - PAD * 2;
  const gap = 7;
  const heights = STEPS.map((s) => {
    doc.font('Lato-Bold').fontSize(9.8);
    const th = doc.heightOfString(s.title, { width: bodyW });
    doc.font('Lato-Regular').fontSize(8.9);
    const bh = doc.heightOfString(s.body, { width: bodyW, lineGap: 2.6 });
    return Math.max(th + bh + PAD * 2 + 4, 44);
  });

  // Distribute any slack evenly so the six cards fill the page down to the footer.
  const available = PAGE_H - FOOTER_H - 30 - y - gap * (STEPS.length - 1);
  const needed = heights.reduce((a, b) => a + b, 0);
  if (needed > available) {
    console.warn(`Warning: step cards need ${Math.round(needed - available)}pt more than the page allows.`);
  }
  const slack = Math.max(0, (available - needed) / STEPS.length);

  STEPS.forEach((step, i) => {
    const h = heights[i] + slack;

    doc.rect(M, y, contentW, h).fill(PAPER);
    doc.rect(M, y, contentW, h).lineWidth(0.6).strokeColor(HAIRLINE).stroke();
    doc.rect(M, y, NUM_W, h).fill(GOLD);

    doc.font('Playfair-Bold').fontSize(14).fillColor('#FFFFFF')
      .text(String(i + 1), M, y + h / 2 - 10, { width: NUM_W, align: 'center', lineBreak: false });

    const tx = M + NUM_W + PAD;
    let ty = y + PAD;
    doc.font('Lato-Bold').fontSize(9.8).fillColor(CHARCOAL)
      .text(step.title, tx, ty, { width: bodyW });
    ty += doc.heightOfString(step.title, { width: bodyW }) + 4;
    doc.font('Lato-Regular').fontSize(8.9).fillColor('#4C586A')
      .text(step.body, tx, ty, { width: bodyW, lineGap: 2.6 });

    y += h + gap;
  });

  /* --- Footer band ------------------------------------------------------- */
  const fy = PAGE_H - FOOTER_H;
  doc.rect(0, fy, PAGE_W, FOOTER_H).fill(DEEP_BLUE);
  doc.rect(0, fy, PAGE_W, 2.5).fill(GOLD);

  doc.font('Lato-Bold').fontSize(7.6).fillColor(GOLD)
    .text('WE ARE HERE, AT ANY HOUR', 0, fy + 24, { width: PAGE_W, align: 'center', characterSpacing: 2.4 });
  doc.font('Playfair-Bold').fontSize(21).fillColor(SOFT_CREAM)
    .text('082 49 49 852', 0, fy + 40, { width: PAGE_W, align: 'center' });
  doc.font('Lato-Regular').fontSize(7.6).fillColor('#A8B2BB')
    .text('www.wsefunerals.co.za  ·  12 Spencer Road, Salt River, Cape Town, 7925', 0, fy + 72, {
      width: PAGE_W, align: 'center',
    });

  doc.end();
}

build().then(() => console.log(`Wrote ${path.relative(ROOT, OUT)}`));
