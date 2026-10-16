import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { SubjectId } from '../types/planner';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
} catch (e) {
  console.warn('PDF.js worker setup warning in processor:', e);
}

/**
 * Clean a PDF filename according to user requirement:
 * - Remove "Sobit Nirman" / "Shobhit Nirwan" (case-insensitive)
 * - Remove redundant dashes, underscores, and extra whitespace
 * - Ensure .pdf extension is preserved
 * - NO CHANGES INSIDE THE PDF (only name changes)
 */
export function cleanPdfFileName(fileName: string): string {
  let name = fileName.trim();

  // Strip .pdf extension temporarily
  const hasPdfExt = /\.pdf$/i.test(name);
  if (hasPdfExt) {
    name = name.replace(/\.pdf$/i, '');
  }

  // Regex to remove "Sobit Nirman", "Shobhit Nirwan", "Shobhit Nirman", "Sobhit Nirwan"
  // including leading/trailing hyphens, bars, commas, parentheses
  const nirwanRegex = /(?:[-_|\s(\[]*)\b(?:sh?obh?it\s+nirm?w?an)\b(?:[-_|\s)\]]*)/gi;
  name = name.replace(nirwanRegex, ' ');

  // Clean redundant separators and punctuation
  name = name
    .replace(/[|\-_]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-_\s|:]+/, '')
    .replace(/[-_\s|:]+$/, '')
    .trim();

  if (!name || name.length < 2) {
    name = 'Study Resource';
  }

  return `${name}.pdf`;
}

/**
 * Process a PDF for local storage WITHOUT ANY INTERNAL MODIFICATION.
 * The original file bytes / Blob are strictly preserved 100% as uploaded by the user.
 * Handwritten annotations, figures, layers, and all pages remain intact.
 */
export async function processPdfFirstPage(
  arrayBuffer: ArrayBuffer,
  originalFilename: string,
  originalFileBlob?: Blob
): Promise<{
  processedBlob: Blob;
  originalPageCount: number;
  processedPageCount: number;
  firstPageRemoved: boolean;
  extractedText: string;
}> {
  let pageCount = 1;
  let extractedText = originalFilename.toLowerCase();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    pageCount = pdfDoc.numPages;

    // Safely extract text from up to 3 pages for subject identification
    const textPieces: string[] = [originalFilename];
    const pagesToScan = Math.min(pageCount, 3);

    for (let p = 1; p <= pagesToScan; p++) {
      try {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const pageString = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        textPieces.push(pageString);
      } catch {
        // Continue to next page if text extraction fails for image-only/handwritten page
      }
    }

    extractedText = textPieces.join(' ').toLowerCase();
  } catch (err) {
    console.warn('PDF.js inspection note:', err);
  }

  // STRICT USER REQUIREMENT:
  // "हैंड रिटन पीडीएफ रहने चाहिए। पीडीएफ के अंदर कुछ चेंजेस नहीं होना चाहिए। उनके नाम में चेंजेस होना चाहिए, अंदर कुछ चेंजेस नहीं होने चाहिए।"
  // We keep the exact original blob without touching any internal byte!
  const processedBlob = originalFileBlob || new Blob([arrayBuffer], { type: 'application/pdf' });

  return {
    processedBlob,
    originalPageCount: pageCount,
    processedPageCount: pageCount,
    firstPageRemoved: false, // Never remove or alter user's pages!
    extractedText,
  };
}

/**
 * Classify a PDF into one of the 6 existing subjects based on filename and extracted text
 */
export function classifySubjectFromContent(
  filename: string,
  extractedContent: string = ''
): { subjectId: SubjectId; confidence: number; reason: string } {
  const text = `${filename} ${extractedContent}`.toLowerCase();

  const scores: Record<SubjectId, number> = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    biology: 0,
    english: 0,
    painting: 0,
  };

  // 1. Physics signals
  const physicsKeywords = [
    'physics', 'physic', 'derivation', 'derivations', 'electrostatic', 'electric charges',
    'electric field', 'capacitance', 'capacitor', 'current electricity', 'drift velocity',
    'kirchhoff', 'wheatstone', 'potentiometer', 'galvanometer', 'moving charges', 'biot savart',
    'ampere', 'circuital', 'solenoid', 'toroid', 'magnetism', 'magnetic dipole', 'electromagnetic induction',
    'motional emf', 'alternating current', 'lcr circuit', 'electromagnetic waves', 'ray optics',
    'lens maker', 'prism', 'wave optics', 'interference', 'diffraction', 'dual nature',
    'photoelectric', 'de broglie', 'atoms', 'bohr', 'hydrogen', 'nuclei', 'mass defect',
    'semiconductor', 'diode', 'coulomb', 'faraday', 'lenz', 'tesla', 'gauss law'
  ];

  // 2. Chemistry signals
  const chemistryKeywords = [
    'chemistry', 'chemical', 'haloalkane', 'haloalkanes', 'haloarene', 'haloarenes',
    'alcohol', 'alcohols', 'phenol', 'phenols', 'ether', 'ethers', 'aldehyde', 'aldehydes',
    'ketone', 'ketones', 'carboxylic', 'amine', 'amines', 'diazonium', 'biomolecule',
    'biomolecules', 'glucose', 'fructose', 'amino acid', 'protein', 'solutions', 'solution',
    'molarity', 'molality', 'raoult', 'henry law', 'electrochemistry', 'nernst', 'kohlrausch',
    'chemical kinetics', 'order of reaction', 'activation energy', 'd-block', 'f-block',
    'lanthanoid', 'coordination', 'isomerism', 'crystal field', 'wurtz', 'finkelstein',
    'swartz', 'sandmeyer', 'friedel crafts', 'aldol', 'cannizzaro', 'clemmensen',
    'wolff kishner', 'tollen', 'fehling', 'kolbe', 'reimer tiemann', 'hinsberg',
    'iupac', 'nucleophilic', 'carbocation', 'sn1', 'sn2', 'distinction test', 'pyqs'
  ];

  // 3. Mathematics signals
  const mathKeywords = [
    'mathematics', 'maths', 'math', 'algebra', 'calculus', 'relations and functions',
    'inverse trigonometric', 'matrices', 'matrix', 'determinants', 'determinant',
    'continuity', 'differentiability', 'derivatives', 'integrals', 'integration',
    'differential equations', 'vectors', 'vector', 'three dimensional', '3d geometry',
    'skew lines', 'direction cosines', 'linear programming', 'probability', 'bayes theorem',
    'permutation', 'combination', 'tangent', 'normal', 'maxima', 'minima'
  ];

  // 4. Biology signals
  const biologyKeywords = [
    'biology', 'botany', 'zoology', 'flowering plants', 'human reproduction', 'gametogenesis',
    'spermatogenesis', 'oogenesis', 'menstrual cycle', 'reproductive health', 'contraceptive',
    'inheritance', 'mendel', 'genetics', 'chromosomal', 'molecular basis', 'dna replication',
    'transcription', 'translation', 'lac operon', 'evolution', 'darwin', 'hardy weinberg',
    'human health', 'pathogen', 'immunity', 'aids', 'hiv', 'cancer', 'microbes', 'sewage',
    'biotechnology', 'pcr', 'recombinant', 'plasmid', 'insulin', 'organisms', 'ecosystem',
    'biodiversity', 'evil quartet'
  ];

  // 5. English signals
  const englishKeywords = [
    'english', 'core', 'flamingo', 'vistas', 'prose', 'poetry', 'comprehension',
    'discursive', 'factual', 'notice writing', 'invitation', 'letter to editor',
    'job application', 'bio data', 'article writing', 'report writing', 'last lesson',
    'lost spring', 'deep water', 'rattrap', 'indigo', 'poets and pancakes', 'the interview',
    'going places', 'mother at sixty-six', 'keeping quiet', 'thing of beauty', 'roadside stand',
    'aunt jennifer', 'third level', 'tiger king', 'journey to the end of the earth',
    'the enemy', 'on the face of it', 'memories of childhood'
  ];

  // 6. Painting signals
  const paintingKeywords = [
    'painting', 'fine arts', 'indian art', 'shadanga', 'six limbs', 'rajasthani school',
    'pahari school', 'mughal school', 'deccan school', 'bengal school', 'maru ragini',
    'bundi', 'kishangarh', 'bani thani', 'krishna with gopis', 'basohli', 'kangra',
    'falcon on a bird rest', 'kabir and raidas', 'hazrat nizamuddin', 'chand bibi',
    'journey end', 'shiva and sati', 'radhika', 'amrita sher-gil', 'jamini roy',
    'sculptures', 'graphic prints', 'miniature'
  ];

  // Count matches
  for (const kw of physicsKeywords) {
    if (text.includes(kw)) scores.physics += kw.length > 7 ? 2 : 1;
  }
  for (const kw of chemistryKeywords) {
    if (text.includes(kw)) scores.chemistry += kw.length > 7 ? 2 : 1;
  }
  for (const kw of mathKeywords) {
    if (text.includes(kw)) scores.mathematics += kw.length > 7 ? 2 : 1;
  }
  for (const kw of biologyKeywords) {
    if (text.includes(kw)) scores.biology += kw.length > 7 ? 2 : 1;
  }
  for (const kw of englishKeywords) {
    if (text.includes(kw)) scores.english += kw.length > 7 ? 2 : 1;
  }
  for (const kw of paintingKeywords) {
    if (text.includes(kw)) scores.painting += kw.length > 7 ? 2 : 1;
  }

  // Find max score
  let bestSub: SubjectId = 'chemistry';
  let maxScore = -1;

  for (const [sId, score] of Object.entries(scores) as [SubjectId, number][]) {
    if (score > maxScore) {
      maxScore = score;
      bestSub = sId;
    }
  }

  const confidence = maxScore > 3 ? Math.min(0.95, 0.4 + maxScore * 0.08) : maxScore > 0 ? 0.6 : 0.3;

  return {
    subjectId: bestSub,
    confidence,
    reason: `Identified keywords for ${bestSub} (match score: ${maxScore})`,
  };
}
