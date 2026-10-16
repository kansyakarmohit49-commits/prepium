import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { StoredResource } from '../types/resources';
import { SubjectId } from '../types/planner';
import { saveResource, getAllResources, deleteResource } from './resourceStorage';

interface PrebundledResourceDef {
  subjectId: SubjectId;
  cleanedName: string;
  originalName: string;
  pageCount: number;
  sections: {
    title: string;
    subHeading: string;
    lines: string[];
    handwrittenNotes: string[];
  }[];
}

const PREBUNDLED_RESOURCES: PrebundledResourceDef[] = [
  // 1. Physics
  {
    subjectId: 'physics',
    cleanedName: 'Physics Class 12 Core Derivations & Formulas.pdf',
    originalName: 'Physics Class 12 Core Derivations - Prepium.pdf',
    pageCount: 3,
    sections: [
      {
        title: 'Core Board Derivations: Electrostatics & Capacitance',
        subHeading: 'CBSE Class 12 Physics (Code 042) • High Yield Handwritten Notes',
        lines: [
          '1. Electric Dipole Field on Axial Line:',
          '   E_axial = (1 / 4*pi*epsilon_0) * (2*p*r) / (r^2 - a^2)^2',
          '   For short dipole (r >> a): E_axial = 2*k*p / r^3 (along dipole axis).',
          '',
          '2. Electric Dipole Field on Equatorial Line:',
          '   E_equatorial = (1 / 4*pi*epsilon_0) * p / (r^2 + a^2)^(3/2)',
          '   For short dipole (r >> a): E_eq = k*p / r^3 (opposite to dipole moment vector p).',
          '   Relation: E_axial = 2 * E_equatorial.',
          '',
          '3. Torque on Dipole in Uniform Electric Field:',
          '   tau = p x E = p * E * sin(theta)  [Stable equilibrium at theta = 0°, Unstable at 180°].',
          '',
          '4. Gauss Law Applications:',
          '   - Infinitely long straight thin wire: E = lambda / (2*pi*epsilon_0*r)',
          '   - Uniformly charged infinite plane sheet: E = sigma / (2*epsilon_0) [Independent of distance r!]',
          '',
          '5. Capacitance of Parallel Plate Capacitor:',
          '   C_0 = (epsilon_0 * A) / d',
          '   With dielectric slab of constant K completely filling space: C = K * C_0 = (K*epsilon_0*A) / d',
          '   Energy stored: U = 1/2 C V^2 = 1/2 Q V = Q^2 / (2C). Energy density: u = 1/2 epsilon_0 E^2.'
        ],
        handwrittenNotes: [
          'EXAM TIP: Always state direction of dipole moment (negative to positive charge).',
          'REMEMBER: Gauss law flux depends ONLY on enclosed charge (q_in / eps_0).'
        ]
      },
      {
        title: 'Current Electricity, Magnetism & Alternating Current',
        subHeading: 'Drift Velocity, Biot-Savart Law, Solenoid & Series LCR Resonance',
        lines: [
          '6. Drift Velocity & Microscopic Ohm\'s Law:',
          '   v_d = - (e * E * tau) / m',
          '   Current: I = n * e * A * v_d  =>  Current density j = I/A = n * e * v_d',
          '   Resistivity: rho = m / (n * e^2 * tau)  [rho increases with temperature for metals].',
          '',
          '7. Biot-Savart Law & Circular Coil:',
          '   Field at center of circular loop: B = (mu_0 * N * I) / (2 * R)',
          '   Field on axis: B = (mu_0 * N * I * R^2) / [2 * (R^2 + x^2)^(3/2)]',
          '',
          '8. Ampere\'s Circuital Law & Solenoid:',
          '   oint B . dl = mu_0 * I_enclosed  =>  Inside ideal long solenoid: B = mu_0 * n * I',
          '',
          '9. Series LCR Resonant Circuit:',
          '   Impedance: Z = sqrt( R^2 + (X_L - X_C)^2 )',
          '   At resonance: X_L = X_C  =>  omega_0 = 1 / sqrt(L*C), f_0 = 1 / (2*pi*sqrt(L*C))',
          '   Power factor cos(phi) = 1 (purely resistive, maximum current).'
        ],
        handwrittenNotes: [
          'IMPORTANT: Quality factor Q = omega_0 L / R = (1/R) * sqrt(L/C). Higher Q = sharper resonance.',
          'Wattless current condition: Pure inductor or pure capacitor circuit where cos(phi) = 0.'
        ]
      },
      {
        title: 'Optics, Dual Nature & Semiconductor Electronics',
        subHeading: 'Lensmaker Formula, Prism, Photoelectric Equation & Rectifiers',
        lines: [
          '10. Lens Maker\'s Formula:',
          '    1 / f = (mu - 1) * (1 / R_1 - 1 / R_2)',
          '    Combination in contact: 1 / F = 1 / f_1 + 1 / f_2  =>  P = P_1 + P_2',
          '',
          '11. Refraction Through Prism:',
          '    mu = sin((A + D_m)/2) / sin(A/2)  [At minimum deviation: r_1 = r_2 = A/2, i = e].',
          '',
          '12. Wave Optics (Young\'s Double Slit):',
          '    Fringe width: beta = (lambda * D) / d  [Central diffraction width = 2 lambda D / a].',
          '',
          '13. Einstein\'s Photoelectric Equation:',
          '    K_max = h * nu - phi_0 = e * V_0  =>  V_0 = (h/e)*nu - (phi_0/e)',
          '    Slope of stopping potential vs frequency graph equals h / e (universal constant!).',
          '',
          '14. Full-Wave Rectifier:',
          '    Centre-tapped transformer with 2 diodes. Output ripple frequency = 2 * f_in (100 Hz for 50 Hz input).'
        ],
        handwrittenNotes: [
          'CAUTION: Sign convention in Lens Maker: for biconvex lens R1 > 0, R2 < 0.',
          'SEMICONDUCTOR: In forward bias depletion width decreases; in reverse bias it increases.'
        ]
      }
    ]
  },

  // 2. Chemistry
  {
    subjectId: 'chemistry',
    cleanedName: 'Organic Chemistry Conversions & Reaction Pathways.pdf',
    originalName: 'Organic Chemistry Master Notes - Prepium.pdf',
    pageCount: 3,
    sections: [
      {
        title: 'Haloalkanes, Haloarenes & Name Reactions',
        subHeading: 'CBSE Class 12 Chemistry (Code 043) • Organic Reaction Pathways',
        lines: [
          '1. Finkelstein Reaction: R-X + NaI (in dry acetone) -> R-I + NaX (NaCl/NaBr precipitates).',
          '2. Swarts Reaction: R-Cl + AgF (or CoF2, SbF3) -> R-F + AgCl [Synthesis of fluorides].',
          '3. Wurtz Reaction: 2 R-X + 2 Na (dry ether) -> R-R + 2 NaX (Symmetric alkanes).',
          '4. Fittig & Wurtz-Fittig: 2 Ar-X + 2 Na -> Ar-Ar (Biphenyl) / Ar-X + R-X -> Ar-R.',
          '5. Sandmeyer Reaction: Ar-N2+Cl- + Cu2Cl2 / HCl -> Ar-Cl + N2 (or Cu2Br2 / CuCN).',
          '',
          'NUCLEOPHILIC SUBSTITUTION MECHANISM COMPARISON:',
          '- SN1 (Unimolecular): Two steps via Carbocation intermediate. Reactivity: 3° > 2° > 1° > CH3X.',
          '  Stereochemistry: Racemisation (inversion + retention). Favored by polar protic solvents.',
          '- SN2 (Bimolecular): Single step concerted via backside attack transition state. Reactivity: CH3X > 1° > 2° > 3°.',
          '  Stereochemistry: Complete Walden Inversion of configuration. Favored by polar aprotic solvents (DMF/DMSO).'
        ],
        handwrittenNotes: [
          'EXAM TRICK: Tertiary alkyl halides undergo ELIMINATION (Alkene) with strong base instead of SN2.',
          'Haloarenes are extremely unreactive to Nu substitution due to resonance partial double bond character.'
        ]
      },
      {
        title: 'Alcohols, Phenols, Ethers & Chemical Distinction Tests',
        subHeading: 'Acidity Trends, Williamson Synthesis & Board Test Identification',
        lines: [
          '6. Kolbe\'s Reaction: Phenol + NaOH -> Sodium Phenoxide --(CO2, 400K, 4-7 atm; H3O+)--> Salicylic acid.',
          '7. Reimer-Tiemann: Phenol + CHCl3 + 3 NaOH (340K) -> Salicylaldehyde (via :CCl2 intermediate).',
          '8. Williamson Ether Synthesis: R-ONa + R\'-X -> R-O-R\' + NaX. (R\'-X MUST be 1°!).',
          '9. Cleavage of Ethers by HI:',
          '   - Primary/Secondary ether: Halide ion attacks LESS sterically hindered alkyl group (SN2).',
          '   - Tertiary alkyl ether: Halide ion attacks TERTIARY carbon forming stable 3° carbocation (SN1)!',
          '',
          'DISTINCTION TESTS SUMMARY:',
          '- Lucas Test: Conc HCl + anhyd. ZnCl2 -> 3° alcohol turbidity immediate; 2° in 5 min; 1° no reaction at room temp.',
          '- Tollens Test: Aldehydes give bright silver mirror [Ag(NH3)2]+. Ketones do not.',
          '- Fehlings Test: Aliphatic aldehydes give red-brown Cu2O ppt. Aromatic aldehydes & ketones do not.',
          '- Iodoform Test: Yellow CHI3 ppt with I2 + NaOH for compounds with CH3-C=O or CH3-CH(OH)-.'
        ],
        handwrittenNotes: [
          'ACIDITY: p-nitrophenol > o-nitrophenol > phenol > cresol > ethanol.',
          'Anisole (C6H5-O-CH3) + HI -> Phenol (C6H5-OH) + CH3-I (C(aryl)-O bond cannot break!).'
        ]
      },
      {
        title: 'Carbonyl Compounds, Amines & Biomolecules',
        subHeading: 'Aldol, Cannizzaro, Hinsberg Test & Carbohydrates Structure',
        lines: [
          '10. Aldol Condensation: Aldehydes/Ketones with alpha-H + dilute NaOH -> beta-hydroxyaldehyde -> heat -> alpha,beta-unsaturated aldehyde.',
          '11. Cannizzaro Reaction: Aldehydes with NO alpha-H (HCHO, C6H5CHO) + 50% conc. KOH -> 1 molecule alcohol + 1 molecule carboxylate salt.',
          '12. Clemmensen Reduction: Carbonyl (>C=O) + Zn-Hg / conc. HCl -> Methylene (>CH2).',
          '13. Wolff-Kishner: Carbonyl (>C=O) + NH2-NH2 / KOH, ethylene glycol -> Methylene (>CH2).',
          '14. Carbylamine Test: 1° Amine (aliphatic/aromatic) + CHCl3 + alc. KOH -> foul smelling isocyanide (R-NC).',
          '15. Hinsberg Test: Benzenesulphonyl chloride (C6H5SO2Cl) -> 1° amine gives alkali-soluble sulfonamide; 2° insoluble; 3° no reaction.',
          '16. Biomolecules: D-Glucose open chain verified by HI (n-hexane), Br2 water (gluconic acid), HNO3 (saccharic acid).'
        ],
        handwrittenNotes: [
          'BASIC STRENGTH of Amines in aqueous solution: (C2H5)2NH > (C2H5)3N > C2H5NH2 > NH3 (Ethyl series: 2° > 3° > 1°).',
          'For Methyl series in aqueous medium: (CH3)2NH > CH3NH2 > (CH3)3N > NH3 (2° > 1° > 3°).'
        ]
      }
    ]
  },

  // 3. Mathematics
  {
    subjectId: 'mathematics',
    cleanedName: 'Class 12 Mathematics Key Formulas & Vectors 3D.pdf',
    originalName: 'Class 12 Mathematics Master Sheet - Prepium.pdf',
    pageCount: 3,
    sections: [
      {
        title: 'Matrices, Determinants, Relations & Functions',
        subHeading: 'CBSE Class 12 Mathematics (Code 041) • High Yield Formulation',
        lines: [
          '1. Relations: Reflexive (a,a in R), Symmetric (a,b in R => b,a in R), Transitive (a,b & b,c in R => a,c in R).',
          '   Equivalence Relation: Satisfies all three properties.',
          '2. Functions: Injective (f(x1)=f(x2) => x1=x2), Surjective (Range = Codomain), Bijective (both one-one and onto).',
          '3. Matrix Properties: (AB)\' = B\' A\',  (AB)^-1 = B^-1 A^-1,  A^-1 = (1/|A|) * adj(A).',
          '   Symmetric: A = A\'.  Skew-Symmetric: A = -A\' (diagonal elements are always zero!).',
          '   Decomposition: Every square matrix A = 1/2(A + A\') [Symmetric] + 1/2(A - A\') [Skew-Symmetric].',
          '4. Determinant Adjoint Theorems: |adj A| = |A|^(n-1),  |A * adj A| = |A|^n,  adj(adj A) = |A|^(n-2) * A.',
          '5. Matrix Method for Linear Systems: A X = B  =>  X = A^-1 B.  Unique solution if |A| != 0.'
        ],
        handwrittenNotes: [
          'SURE 5-MARKER: Matrix method solving 3 linear simultaneous equations with unique solution.',
          'Check |A| first: if |A| = 0 and (adj A)B != 0, system is INCONSISTENT (no solution).'
        ]
      },
      {
        title: 'Calculus: Derivatives, Integrals & Differential Equations',
        subHeading: 'Standard Derivatives, King Property, Area Under Curves & Integrating Factor',
        lines: [
          '6. Logarithmic Differentiation: For y = [u(x)]^[v(x)], take ln y = v ln u and differentiate.',
          '7. Integration by Parts: int (u * v) dx = u * int v dx - int (u\' * int v dx) dx  [Follow ILATE rule].',
          '8. Special Standard Integrals:',
          '   - int dx / (x^2 + a^2) = (1/a) * tan^-1(x/a) + C',
          '   - int dx / (x^2 - a^2) = (1/2a) * ln|(x-a)/(x+a)| + C',
          '   - int dx / sqrt(a^2 - x^2) = sin^-1(x/a) + C',
          '   - int dx / sqrt(x^2 + a^2) = ln|x + sqrt(x^2 + a^2)| + C',
          '   - int e^x [f(x) + f\'(x)] dx = e^x * f(x) + C',
          '9. Definite Integral King Property: int_0^a f(x) dx = int_0^a f(a - x) dx.',
          '10. Linear Differential Equations: dy/dx + P(x)*y = Q(x). Integrating factor IF = e^(int P dx).',
          '    Solution: y * (IF) = int [ Q(x) * (IF) ] dx + C.'
        ],
        handwrittenNotes: [
          'MAXIMA/MINIMA: 1st find f\'(x)=0 for critical points. If f\'\'(c) < 0 => Local Maximum; if f\'\'(c) > 0 => Local Minimum.',
          'AREA: When finding area bounded by two curves, integrate |y_upper - y_lower| dx between intersection limits.'
        ]
      },
      {
        title: 'Vectors, Three-Dimensional Geometry & Probability',
        subHeading: 'Dot/Cross Product, Shortest Distance between Skew Lines & Bayes\' Theorem',
        lines: [
          '11. Dot & Cross Product:',
          '    a . b = |a||b| cos(theta).  Projection of a on b = (a . b) / |b|.',
          '    a x b = |a||b| sin(theta) n_hat.  Unit vector perpendicular to both = (a x b) / |a x b|.',
          '    Area of triangle with adjacent vectors a, b = 1/2 |a x b|.',
          '12. Equation of Line in 3D Space:',
          '    Vector form: r = a + lambda * b.  Cartesian: (x - x1)/a = (y - y1)/b = (z - z1)/c.',
          '13. Shortest Distance Between Two Skew Lines:',
          '    Lines: r = a1 + lambda * b1  and  r = a2 + mu * b2.',
          '    d = | (b1 x b2) . (a2 - a1) | / | b1 x b2 |.',
          '14. Bayes\' Theorem:',
          '    P(E_i | A) = [ P(E_i) * P(A | E_i) ] / [ sum_j P(E_j) * P(A | E_j) ].',
          '15. Independent Events: P(A cap B) = P(A) * P(B).'
        ],
        handwrittenNotes: [
          'HIGH WEIGHTAGE: Shortest distance between skew lines appears almost every year in CBSE 5-mark section.',
          'PROBABILITY: Always define partition events E1, E2, E3 clearly before writing Bayes formula.'
        ]
      }
    ]
  },

  // 4. Biology
  {
    subjectId: 'biology',
    cleanedName: 'Biology High-Yield Genetics & Biotechnology Notes.pdf',
    originalName: 'Biology Class 12 Master Notes - Prepium.pdf',
    pageCount: 3,
    sections: [
      {
        title: 'Reproduction in Flowering Plants & Humans',
        subHeading: 'CBSE Class 12 Biology (Code 044) • Embryo Sac, Menstrual Cycle & Hormones',
        lines: [
          '1. Angiosperm Embryo Sac: 7-celled, 8-nucleate structure at maturity.',
          '   - Micropylar end: Egg cell (1) + Synergids (2) with filiform apparatus (guides pollen tube).',
          '   - Central cell: 2 Polar nuclei (fuses with 2nd male gamete -> 3n Primary Endosperm Nucleus PEN).',
          '   - Chalazal end: 3 Antipodal cells (degenerate post-fertilization).',
          '   Double Fertilization = Syngamy (Egg + Sperm -> 2n Zygote) + Triple Fusion (Polar nuclei + Sperm -> 3n PEN).',
          '',
          '2. Human Male Gametogenesis (Spermatogenesis):',
          '   Spermatogonia (2n) -> Primary spermatocyte (2n) --[Meiosis I]--> Secondary spermatocytes (n) --[Meiosis II]--> Spermatids (n) -> Spermatozoa (n).',
          '   Hormones: GnRH stimulates LH (acts on Leydig cells -> Testosterone) & FSH (acts on Sertoli cells -> Spermiogenesis).',
          '',
          '3. Menstrual Cycle (28 Days):',
          '   - Follicular Phase (Days 6-13): Estrogen rises, endometrium regenerates.',
          '   - Ovulatory Surge (Day 14): Rapid secretion of LH induces rupture of Graafian follicle (LH surge).',
          '   - Luteal Phase (Days 15-28): Corpus luteum secretes large amounts of Progesterone to maintain endometrium.'
        ],
        handwrittenNotes: [
          'IMPORTANT: Non-albuminous (exalbuminous) seeds consume endosperm completely (pea, gram, bean).',
          'Albuminous seeds retain endosperm (wheat, maize, barley, castor, sunflower).'
        ]
      },
      {
        title: 'Genetics, Molecular Inheritance & Human Disorders',
        subHeading: 'Morgan\'s Linkage, DNA Replication, Transcription, lac Operon & Pedigree',
        lines: [
          '4. DNA Packaging: Nucleosome contains 200 bp of DNA wrapped around histone octamer (H2A, H2B, H3, H4 x 2).',
          '   H1 histone seals the linker DNA. Lysine and arginine rich basic histones possess positive charge.',
          '',
          '5. Hershey & Chase Bacteriophage Proof (1952):',
          '   Radioactive 35S labeled protein coat (remained in supernatant).',
          '   Radioactive 32P labeled DNA core (passed into bacterial pellet), confirming DNA is genetic material.',
          '',
          '6. The lac Operon (Jacob & Monod):',
          '   - Regulator gene i synthesizes repressor protein.',
          '   - In absence of Lactose (Inducer): Repressor binds to Operator (O) preventing RNA Polymerase transcription (OFF).',
          '   - In presence of Lactose: Allolactose binds repressor, inactivating it. RNA Pol transcribes z, y, a genes (ON).',
          '   - z: beta-galactosidase (lactose -> glucose + galactose), y: permease (increases permeability), a: transacetylase.',
          '',
          '7. Genetic Disorders:',
          '   - Sickle-cell anaemia: Autosomal recessive (point mutation GAG to GUG, Glu replaced by Val at position 6 of beta-globin).',
          '   - Down\'s Syndrome: Trisomy of chromosome 21 (47, XX/XY).',
          '   - Klinefelter\'s Syndrome: 47, XXY (sterile male with gynaecomastia).  Turner\'s: 45, X0 (sterile female, webbed neck).'
        ],
        handwrittenNotes: [
          'PEDIGREE TIP: Autosomal recessive skips generations; unaffected parents can have affected child.',
          'Sex-linked recessive (Haemophilia/Colorblindness): Father never passes trait to son (criss-cross inheritance).'
        ]
      },
      {
        title: 'Biotechnology Tools, Applications & Ecology',
        subHeading: 'pBR322 Vector, PCR Amplification, Bt Cotton, RNAi & Verhulst-Pearl Growth',
        lines: [
          '8. Recombinant DNA Vector pBR322:',
          '   Contains ori (origin of replication), selectable markers (ampR and tetR).',
          '   BamHI site in tetR gene allows insertional inactivation (recombinants lose tetracycline resistance!).',
          '',
          '9. PCR (Polymerase Chain Reaction - Kary Mullis):',
          '   - Denaturation: dsDNA separated at 94°C.',
          '   - Annealing: Primers bind to single-stranded templates at 54°C.',
          '   - Extension: Thermostable Taq Polymerase (from Thermus aquaticus) adds dNTPs at 72°C. 2^n copies in n cycles.',
          '',
          '10. Biotechnology in Agriculture & Medicine:',
          '    - Bt Cotton: CryIAc & CryIIAb control cotton bollworms; CryIAb controls corn borer (activated by alkaline insect gut pH).',
          '    - RNA Interference (RNAi): Cellular defense silencing mRNA by complementary dsRNA using Dicer enzyme.',
          '    - Genetically Engineered Insulin (Humulin - Eli Lilly 1983): A and B peptide chains produced separately in E. coli, linked by disulphide bonds.',
          '',
          '11. Population Ecology: Verhulst-Pearl Logistic Growth dN/dt = r*N * ((K - N)/K)  [Carrying capacity K].'
        ],
        handwrittenNotes: [
          'EVIL QUARTET (Biodiversity Loss): 1. Habitat loss & fragmentation (most serious!), 2. Over-exploitation, 3. Alien species invasion (Nile perch, Eichhornia, Parthenium), 4. Co-extinctions.',
          'Species-Area Relationship: log S = log C + Z log A (Alexander von Humboldt).'
        ]
      }
    ]
  },

  // 5. English Core
  {
    subjectId: 'english',
    cleanedName: 'English Core Flamingo, Vistas & Writing Formats.pdf',
    originalName: 'English Core Master Formats - Prepium.pdf',
    pageCount: 3,
    sections: [
      {
        title: 'Advanced Writing Skills: Official CBSE Formats',
        subHeading: 'CBSE Class 12 English Core (Code 301) • Notice, Invitations & Formal Letters',
        lines: [
          '1. NOTICE WRITING FORMAT (50 Words, 4 Marks):',
          '   - Must be enclosed in a neat BOX.',
          '   - Line 1: NAME OF THE ISSUING ORGANIZATION / SCHOOL (ALL CAPS, Centered)',
          '   - Line 2: NOTICE (Bold, Centered, All Caps)',
          '   - Line 3: Date of Issue (e.g. 16 October 2026, Left aligned)',
          '   - Line 4: HEADING / TITLE (Catchy, Centered, Underlined)',
          '   - Body: 5 Ws - What is happening, When (Date & Time), Where (Venue), Who is eligible, Whom to contact.',
          '   - Footer: Signatory Name (Left) and Designation (e.g. Head Boy / Cultural Secretary).',
          '',
          '2. FORMAL INVITATION (Card Format):',
          '   - Written in 3rd Person (No I, We, You). Enclosed in a box. No signature.',
          '   - Standard Phrasing: \"The Principal, Staff and Students of [School] cordially invite you to the [Event]...\"',
          '   - Left Bottom: RSVP (Respondez s\'il vous plait - name & contact number). Right Bottom: Programme itinerary.',
          '',
          '3. FORMAL LETTER TO THE EDITOR (120-150 Words, 5 Marks):',
          '   - Sender\'s Address, Date, Receiver\'s Designation & Address (\"The Editor, The Times of India, New Delhi\").',
          '   - Subject: Concise statement of the grievance / cause.',
          '   - Opening: \"Through the esteemed columns of your widely read newspaper, I wish to draw the attention of the authorities and general public towards...\"',
          '   - Body: Para 1: Statement of problem. Para 2: Consequences & impact. Para 3: Constructive suggestions.'
        ],
        handwrittenNotes: [
          'MARKING SCHEME: Format 1 Mark, Content 2 Marks, Accuracy & Expression 1-2 Marks.',
          'Always proofread for grammatical concord and avoid colloquial contractions in formal letters.'
        ]
      },
      {
        title: 'Flamingo Prose & Poetry: Core Themes & Character Insights',
        subHeading: 'The Last Lesson, Lost Spring, Deep Water, Rattrap & Key Poems',
        lines: [
          '4. The Last Lesson (Alphonse Daudet):',
          '   - Theme: Linguistic chauvinism, value of native language, sudden realization of procrastination.',
          '   - M. Hamel dressed in ceremonial Sunday attire (green coat, frilled shirt, embroidered silk cap).',
          '   - Final words on blackboard: \"Vive La France!\" (Long live France). Language as the key to freedom.',
          '',
          '5. Lost Spring (Anees Jung):',
          '   - Saheb-e-Alam (\"Lord of the Universe\" - ironical name) in Seemapuri; barefoot ragpicker seeking gold in garbage.',
          '   - Mukesh in Firozabad glass bangle industry; dares to dream of becoming a motor mechanic against vicious circle of sahukars and police.',
          '',
          '6. Deep Water (William Douglas):',
          '   - Hydrophobia overcome through determined will and rigorous training. \"All we have to fear is fear itself\" (Roosevelt).',
          '',
          '7. The Rattrap (Selma Lagerlof):',
          '   - Metaphor of world as a rattrap baited with riches and comforts. Edla Willmansson\'s compassion redeems the peddler.',
          '',
          '8. Key Poems Core Essences:',
          '   - My Mother at Sixty-Six (Kamala Das): Fear of separation and maternal aging; masked by reassuring smile.',
          '   - Keeping Quiet (Pablo Neruda): Call for introspective silence and universal brotherhood without inactivity.',
          '   - A Thing of Beauty (John Keats): Joy forever, immortal nectar transcending human gloom.'
        ],
        handwrittenNotes: [
          'KEY LITERARY DEVICES: Simile (\"pale as a late winter\'s moon\"), Metaphor (\"rattrap\", \"garbage as gold\"), Oxymoron (\"clean clothes\").',
          'In analytical questions, quote pivotal phrases to score full marks.'
        ]
      },
      {
        title: 'Vistas Supplementary Reader: Character Arcs & Ethical Dilemmas',
        subHeading: 'The Third Level, The Tiger King, The Enemy & On the Face of It',
        lines: [
          '9. The Third Level (Jack Finney):',
          '   - Psychological escape medium for Charley from modern insecurity, war and worry into peaceful 1894 Galesburg.',
          '   - Sam Weiner\'s letter in the first-day cover proves that escape fantasy is universally shared.',
          '',
          '10. The Tiger King (Kalki):',
          '    - Satire on pride and conceit of absolute power. Maharaja of Pratibandapuram slaughters 99 tigers to defy prophecy.',
          '    - Irony of destiny: Slain by a tiny wooden toy tiger\'s sliver causing fatal infection.',
          '',
          '11. The Enemy (Pearl S. Buck):',
          '    - Conflict between patriotic duty to country and humanitarian doctor\'s oath. Dr. Sadao Hoki shelters wounded American POW Tom.',
          '    - Universal compassion and human dignity triumph over wartime nationalism.',
          '',
          '12. On the Face of It (Susan Hill):',
          '    - Friendship between scarred Derry (acid burnt face) and disabled Mr. Lamb (tin leg).',
          '    - Lesson: Physical impairment is lesser pain than isolation and societal alienation. Optimism inspires acceptance.'
        ],
        handwrittenNotes: [
          'CRITICAL PERSPECTIVE: The Enemy is frequently set for 5-mark character comparison questions.',
          'Contrast Derry\'s defensive withdrawal with Mr. Lamb\'s open-door garden philosophy.'
        ]
      }
    ]
  },

  // 6. Painting (Fine Arts)
  {
    subjectId: 'painting',
    cleanedName: 'Painting Miniature Schools & Modern Art Chronology.pdf',
    originalName: 'Painting Fine Arts Master Notes - Prepium.pdf',
    pageCount: 3,
    sections: [
      {
        title: 'The Rajasthani & Pahari Schools of Miniature Art',
        subHeading: 'CBSE Class 12 Painting (Code 049) • Prescribed Miniatures & Aesthetics',
        lines: [
          '1. Rajasthani School (16th-19th Century A.D.):',
          '   - Primary themes: Bhakti movement, Radha-Krishna, Baramasa (twelve seasons), Ragamala series.',
          '   - Prominent Sub-schools: Mewar, Bundi, Jodhpur, Bikaner, Kishangarh, Jaipur.',
          '   - Masterpiece 1: \"Maru Ragini\" (Mewar sub-school by artist Sahibdin). King and Queen riding camel with attendants.',
          '   - Masterpiece 2: \"Radha (Bani-Thani)\" (Kishangarh sub-school by artist Nihal Chand, patron Raja Sawant Singh).',
          '     Epitome of Indian beauty: Lotus eyes (Khamjanaksha), sharp arched eyebrows, pointed chin, transparent odhani.',
          '   - Masterpiece 3: \"Chaugan Players\" (Jodhpur by Dana) - Princesses playing polo on spirited horses.',
          '',
          '2. Pahari School (17th-19th Century A.D. Himalayan foothills):',
          '   - Basohli School: Intense emotional vigor, warm glowing colors, beetle-wing fragments for jewelry.',
          '   - Masterpiece: \"Krishna with Gopis\" (Basohli School by artist Manaku). Bold horizontal layout on yellow background.',
          '   - Kangra School: Delicate, lyrical lines, tranquil female faces, rhythmic drapery, poetic landscape.',
          '   - Masterpiece: \"Nand, Yashoda and Krishna with Kinsmen going to Vrindavana\" (Kangra School by artist Nainsukh).'
        ],
        handwrittenNotes: [
          'AESTHETICS: Shadanga (Six Limbs of Indian Painting) - Rupa-bheda, Pramana, Bhava, Lavanya-yojanam, Sadrishyam, Varnika-bhanga.',
          'Bani-Thani was commemorated on an official Indian postage stamp.'
        ]
      },
      {
        title: 'The Mughal & Deccan Schools of Miniature Painting',
        subHeading: 'Imperial Ateliers, Realistic Portraiture & Sultanate Elegance',
        lines: [
          '3. Mughal Miniature School (16th-18th Century A.D.):',
          '   - Synthesis of indigenous Indian, Persian delicacy and European realistic perspective.',
          '   - Akbar Atelier: Dynamic action, manuscript illustrations. Painting: \"Krishna Lifting Mount Govardhan\" (artist Miskin).',
          '   - Jahangir Atelier: Golden age of naturalism and portraiture (shabih). Painting: \"Falcon on a Bird-Rest\" (artist Ustad Mansur).',
          '     Superb ornithological precision, intense yellow eye, delicate feather textures, ornate floral border (hashiya).',
          '   - Shah Jahan Atelier: Formal court splendor. Painting: \"Kabir and Raidas\" (artist Ustad Faquirullah Khan) - rustic simplicity and spiritual contemplation.',
          '   - Painting: \"Marriage Procession of Dara Shikoh\" (artist Haji Madani) - grand nocturnal wedding procession on horseback.',
          '',
          '4. Deccan School (Ahmednagar, Bijapur, Golconda, Hyderabad):',
          '   - Tall graceful human figures, rich sensual color palette, generous use of gold, Persianized landscape.',
          '   - Painting: \"Hazrat Nizamuddin Auliya and Amir Khusro\" (Hyderabad School) - Sufi saint conferring blessing on disciple poet.',
          '   - Painting: \"Chand Bibi Playing Polo\" (Golconda/Bijapur) - royal women riding gallantly against white fortress.'
        ],
        handwrittenNotes: [
          'TECHNIQUE: Fine squirrel-hair brushes used for hair-breadth miniature lines.',
          'Mughal borders (Hashiya) were decorated with arabesque gold patterns and wild animals.'
        ]
      },
      {
        title: 'Bengal Renaissance & Modern Trends in Indian Art',
        subHeading: 'Swadeshi Revival, Progressive Artists Group, Sculptures & Graphic Prints',
        lines: [
          '5. Bengal Renaissance (Early 20th Century):',
          '   - Nationalist Swadeshi revival led by E.B. Havell, Abanindranath Tagore, Sister Nivedita.',
          '   - Rejection of Western academic oil painting; return to Ajanta murals, Mughal wash, Japanese watercolor wash.',
          '   - Masterpiece: \"Journey\'s End\" (Abanindranath Tagore). Exhausted, dying camel collapsing on desert sand under heavy load; touching metaphor for life\'s weariness.',
          '   - \"Shiva and Sati\" (Nandalal Bose), \"Radhika\" (M.A.R. Chughtai), \"Meghdoot\" (Ram Gopal Vijaivargiya).',
          '',
          '6. Modern Trends in Indian Paintings & Sculptures:',
          '   - \"Rama Vanquishing the Pride of the Ocean\" (Raja Ravi Varma - Indian myth in oil technique).',
          '   - \"Mother and Child\" (Jamini Roy - Kalighat folk style with flat bold tempera strokes).',
          '   - \"Haldi Grinders\" (Amrita Sher-Gil - European form meeting Indian rural pathos).',
          '   - Modern Sculptures: \"Triumph of Labour\" (D.P. Roy Chowdhury - monumental bronze celebrating working class unity).',
          '     \"Santhal Family\" (Ramkinkar Baij - pioneer open-air modern sculpture in cement and river pebbles).'
        ],
        handwrittenNotes: [
          'GRAPHIC PRINTS: Whirlpool (Krishna Reddy - viscosity printmaking), Children (Somnath Hore - paper pulp relief print on wound).',
          'EXAM QUESTION: Be prepared to describe visual composition, medium, artist and emotional theme.'
        ]
      }
    ]
  }
];

/**
 * Generate a pristine binary PDF Blob for a pre-bundled study resource
 */
async function generateResourcePdfBlob(def: PrebundledResourceDef): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  for (let pIdx = 0; pIdx < def.sections.length; pIdx++) {
    const sec = def.sections[pIdx];
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
    const { width, height } = page.getSize();

    // Top Header Banner
    const isDark = pIdx % 2 === 0;
    page.drawRectangle({
      x: 0,
      y: height - 68,
      width: width,
      height: 68,
      color: def.subjectId === 'physics'
        ? rgb(0.01, 0.45, 0.75)
        : def.subjectId === 'chemistry'
        ? rgb(0.02, 0.55, 0.4)
        : def.subjectId === 'mathematics'
        ? rgb(0.85, 0.45, 0.05)
        : def.subjectId === 'biology'
        ? rgb(0.85, 0.12, 0.28)
        : def.subjectId === 'english'
        ? rgb(0.45, 0.22, 0.85)
        : rgb(0.88, 0.35, 0.05),
    });

    page.drawText('PREPIUM — CBSE CLASS 12 (2026-27)', {
      x: 32,
      y: height - 26,
      size: 9.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(sec.title, {
      x: 32,
      y: height - 44,
      size: 13,
      font: fontBold,
      color: rgb(1, 0.96, 0.82),
    });

    page.drawText(sec.subHeading, {
      x: 32,
      y: height - 58,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.9, 0.95, 1),
    });

    // Body Lines
    let y = height - 92;
    const lineHeight = 15;

    for (const line of sec.lines) {
      if (y < 125) break;

      const isHeading = /^\d+\./.test(line) || line.startsWith('NUCLEOPHILIC') || line.startsWith('DISTINCTION');
      const isSub = line.trim().startsWith('-') || line.startsWith('   -');

      if (isHeading) {
        y -= 4;
        page.drawText(line.slice(0, 95), {
          x: 32,
          y,
          size: 9.5,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.25),
        });
      } else if (isSub) {
        page.drawText(line.slice(0, 105), {
          x: 38,
          y,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.35),
        });
      } else {
        page.drawText(line.slice(0, 110), {
          x: 34,
          y,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.25, 0.3, 0.38),
        });
      }

      y -= lineHeight;
    }

    // Yellow Highlighted Handwritten Sticky Note Box
    if (sec.handwrittenNotes && sec.handwrittenNotes.length > 0) {
      page.drawRectangle({
        x: 32,
        y: 45,
        width: width - 64,
        height: 65,
        color: rgb(1, 0.98, 0.88),
        borderColor: rgb(0.95, 0.85, 0.5),
        borderWidth: 1,
      });

      page.drawText('HANDWRITTEN EXAM MEMO / QUICK REVISION:', {
        x: 42,
        y: 95,
        size: 8.5,
        font: fontBold,
        color: rgb(0.65, 0.4, 0.05),
      });

      let noteY = 80;
      for (const note of sec.handwrittenNotes) {
        page.drawText(`• ${note}`.slice(0, 105), {
          x: 44,
          y: noteY,
          size: 8,
          font: fontOblique,
          color: rgb(0.3, 0.25, 0.15),
        });
        noteY -= 13;
      }
    }

    // Bottom Footer
    page.drawLine({
      start: { x: 32, y: 34 },
      end: { x: width - 32, y: 34 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText(`Prepium 100% Offline Study Library • Page ${pIdx + 1} of ${def.sections.length}`, {
      x: 32,
      y: 20,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

/**
 * Install all 6 curated handwritten PDF resources directly into the application's local IndexedDB!
 * Each PDF is placed into its respective subject section.
 * Does NOT download files to user's device external disk.
 */
export async function installAllPrebundledResources(replaceExisting: boolean = true): Promise<{
  installedCount: number;
  totalCount: number;
}> {
  const existing = await getAllResources();

  if (replaceExisting) {
    // Cleanly remove any old prebundles or synthetic seeds to replace with fresh ones
    for (const r of existing) {
      if (
        r.id.startsWith('res_prebundle_') ||
        r.id.startsWith('res_seed_') ||
        r.originalName.includes('Prepium Arkh')
      ) {
        await deleteResource(r.id);
      }
    }
  }

  const updatedExisting = await getAllResources();
  const existingNames = new Set(updatedExisting.map((r) => r.cleanedName.toLowerCase()));

  let installedCount = 0;

  for (const def of PREBUNDLED_RESOURCES) {
    // If not already in app's local storage, create and install
    if (!existingNames.has(def.cleanedName.toLowerCase())) {
      try {
        const blob = await generateResourcePdfBlob(def);
        const stored: StoredResource = {
          id: `res_prebundle_${def.subjectId}_${Date.now()}`,
          subjectId: def.subjectId,
          originalName: def.originalName,
          cleanedName: def.cleanedName,
          fileSize: blob.size,
          pageCount: def.pageCount,
          originalPageCount: def.pageCount,
          firstPageRemoved: false,
          importedAt: new Date().toISOString(),
          fileBlob: blob,
        };

        await saveResource(stored);
        installedCount++;
      } catch (err) {
        console.error(`Failed to install prebundled resource for ${def.subjectId}:`, err);
      }
    }
  }

  return {
    installedCount,
    totalCount: PREBUNDLED_RESOURCES.length,
  };
}
