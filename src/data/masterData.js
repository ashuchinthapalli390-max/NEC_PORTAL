// Master Data for Narasaraopeta Engineering College (Autonomous)
// All 418 verified faculty records + official leadership, committees, departments, publications, patents & Madam notebook seed data.

export const COLLEGE_INFO = {
  name: "Narasaraopeta Engineering College",
  shortName: "NEC",
  autonomous: "Autonomous Institution (Approved by AICTE, Affiliated to JNTUK Kakinada)",
  accreditations: ["NAAC 'A+' Grade (Cycle-2)", "NBA Accredited (CSE, ECE, EEE, ME)", "NIRF Ranked", "ISO 9001:2015 Certified", "AICTE Approved"],
  established: 1998,
  society: "Gayatri Educational Development Society (GEDS)",
  campusArea: "40+ Acres Wi-Fi Enabled Campus",
  address: "Kotappakonda Road, Yellamanda (P.O), Narasaraopet, Palnadu Dist., Andhra Pradesh - 522601, India.",
  phone: "+91 8647 239903 / 239904",
  admissionsHelpline: "+91 9440757039 / +91 9441864537",
  email: "principal@nrtec.in",
  website: "https://www.nrtec.in",
  code: "NRTEC (EAMCET/ECET Code: NARA)"
};

export const LEADERSHIP_PROFILES = [
  {
    id: "NEC-MGMT-001",
    name: "Sri Mittapalli Venkata Koteswara Rao",
    designation: "Chairman; President, Gayatri Educational Development Society (GEDS)",
    qualification: "Philanthropist & Visionary Industrialist",
    photo: "/assets/nrtec/people/chairman-mittapalli-venkata-koteswara-rao.webp",
    role: "Chairman",
    message: "At Narasaraopeta Engineering College, our mission is to empower students with technical rigor, human values, and an unwavering spirit of innovation to meet global challenges.",
    summary: "Founder President of GEDS and Sri Mittapalli Trust. A distinguished philanthropist committed to quality engineering and management education in rural and semi-urban Andhra Pradesh."
  },
  {
    id: "NEC-MGMT-002",
    name: "Sri Mittapalli Chakravarthi",
    designation: "Vice Chairman",
    qualification: "B.E. CSE (SRM, 1996), M.S. Computers (Oklahoma, USA, 1998), Exec MBA (ISB)",
    photo: "/assets/nrtec/people/vice-chairman-chakravarthi-portrait.webp",
    role: "Vice Chairman",
    message: "We bridge academia and global industry through modern research hubs, AICTE IDEA labs, and active student incubations.",
    summary: "Visionary entrepreneur; founded S&C Staffing Inc. in the United States before spearheading modern digital transformations, global MoUs, and advanced placement ecosystems at NEC."
  },
  {
    id: "NEC-MGMT-003",
    name: "Sri Mittapalli Ramesh Babu",
    designation: "Secretary, NEC Group",
    qualification: "Management & Institutional Development",
    photo: "/assets/nrtec/people/secretary-mittapalli-ramesh-babu.webp",
    role: "Secretary",
    message: "Discipline, student-centric infrastructure, and experiential learning form the bedrock of student success at NEC.",
    summary: "Oversees institutional planning, campus infrastructure modernization, student welfare initiatives, and green campus sustainability projects."
  },
  {
    id: "NEC-MGMT-004",
    name: "Smt. Mittapalli Suhasini",
    designation: "Executive Director, NEC Group",
    qualification: "MCA (Osmania University)",
    photo: "/assets/nrtec/people/director-suhasini-mittapalli.webp",
    role: "Director",
    message: "Fostering diversity, entrepreneurship, and global coding cultures helps our students thrive in top multinational environments.",
    summary: "Possesses 11+ years of enterprise IT work experience in the United States and co-founded technology firms before dedicating her leadership to NEC institutional innovation."
  },
  {
    id: "NEC-PER-0001",
    name: "Dr. S. Venkateswarlu",
    designation: "Principal",
    qualification: "M.E., Ph.D. (KLEF)",
    department: "ECE",
    photo: "/assets/nrtec/people/principal-s-venkateswarlu.webp",
    role: "Principal",
    message: "NEC provides an intellectually stimulating environment with state-of-the-art laboratories, experienced research mentors, and outcome-based engineering education.",
    summary: "Distinguished academician with 38+ years experience. Specializes in Wireless Channel Simulation and Computer Networks. Authored 125+ research articles, guided 8+ doctoral/M.Phil scholars."
  },
  {
    id: "NEC-PER-0110",
    name: "Dr. D. Suneel",
    designation: "Vice Principal & Dean (First Year)",
    qualification: "M.Tech., Ph.D., FIE(I), MISTE, MRSI",
    department: "MEC",
    photo: "/assets/nrtec/people/vice-principal-d-suneel.webp",
    role: "Vice Principal",
    message: "Our first-year engineering foundation blends rigorous core fundamentals with modern multidisciplinary problem-solving and AICTE IDEA Lab prototyping.",
    summary: "Mechanical Engineering academician with 23+ years experience, 30+ papers, 20 design patents, 2 innovation patents, and 50+ NPTEL/Coursera certifications."
  },
  {
    id: "NEC-PER-0137",
    name: "Dr. S. V. N. Sreenivasu",
    designation: "Dean R&D & Professor of CSE",
    qualification: "M.Tech., Ph.D.",
    department: "CSE",
    photo: "/assets/NEC Faculty/Dean R&D.jpg",
    role: "Dean R&D",
    message: "Research and innovation drive academic excellence. Our faculty and students continuously publish in SCI/Scopus indexed journals and file impactful patents.",
    summary: "Dean R&D and AICTE IDEA Lab Coordinator. Authored 60+ publications, 6 granted patents, recipient of high-impact research citations in IoT and neural network architectures."
  }
];

// -------------------------------------------------------------
// Canonical Emerging Technologies Departments (ET Scope Only)
// -------------------------------------------------------------
export const ET_DEPARTMENTS = [
  {
    id: "cys",
    code: "CYS",
    name: "CSE (Cyber Security)",
    shortName: "Cyber Security",
    established: 2021,
    intake: 60,
    hodName: "Dr. V. V. A. S. Lakshmi",
    programs: ["B.Tech Computer Science & Engineering (Cyber Security)"],
    bosRegulations: ["R20", "R23", "R26"]
  },
  {
    id: "ds",
    code: "DS",
    name: "CSE (Data Science)",
    shortName: "Data Science",
    established: 2020,
    intake: 120,
    hodName: "Dr. V. V. A. S. Lakshmi",
    programs: ["B.Tech Computer Science & Engineering (Data Science)"],
    bosRegulations: ["R20", "R23", "R26"]
  },
  {
    id: "ai",
    code: "AI",
    name: "Artificial Intelligence",
    shortName: "AI",
    established: 2020,
    intake: 120,
    hodName: "Dr. B. Jhansi Vazram",
    programs: ["B.Tech Computer Science & Engineering (Artificial Intelligence)"],
    bosRegulations: ["R20", "R23", "R26"]
  },
  {
    id: "aiml",
    code: "AIML",
    name: "Artificial Intelligence & Machine Learning",
    shortName: "AI & ML",
    established: 2020,
    intake: 180,
    hodName: "Dr. V. V. A. S. Lakshmi",
    programs: ["B.Tech Computer Science & Engineering (AI & ML)"],
    bosRegulations: ["R20", "R23", "R26"]
  }
];

export const ET_DEPARTMENT_CODES = ['CYS', 'DS', 'AI', 'AIML'];

/**
 * Robust Department Alias Normalizer & ET Boundary Guard
 * Maps diverse input variants to canonical ET codes: CYS, DS, AI, AIML
 * Flags plain CSE as 'NEEDS_MAPPING' (never assumes CYS)
 * Flags non-ET departments as 'OUT_OF_SCOPE_DEPARTMENT'
 */
export function normalizeDepartment(raw) {
  if (!raw || typeof raw !== 'string') return { code: 'NEEDS_MAPPING', raw: raw || '', isET: false };
  const s = raw.trim().toLowerCase().replace(/[\s\-_]+/g, ' ');
  
  // 1. CYS Aliases
  if (
    s === 'cys' || 
    s === 'cse (cyber security)' || 
    s === 'cse(cyber security)' || 
    s === 'cse cyber security' || 
    s === 'cyber security' || 
    s === 'cyber' || 
    s === 'cse(cs)' || 
    s === 'cse (cs)' || 
    s === 'cse cs' ||
    s === 'cse-cys' ||
    s === 'cse_cys' ||
    s === 'b.tech cse (cyber security)' ||
    s === 'b.tech (cyber security)'
  ) {
    return { code: 'CYS', name: 'CSE (Cyber Security)', isET: true };
  }

  // 2. DS Aliases
  if (
    s === 'ds' || 
    s === 'cse (data science)' || 
    s === 'cse(data science)' || 
    s === 'cse data science' || 
    s === 'data science' || 
    s === 'data science engineering' || 
    s === 'cse(ds)' || 
    s === 'cse (ds)' || 
    s === 'cse ds' ||
    s === 'cse-ds' ||
    s === 'cse_ds' ||
    s === 'b.tech cse (data science)' ||
    s === 'b.tech (data science)'
  ) {
    return { code: 'DS', name: 'CSE (Data Science)', isET: true };
  }

  // 3. AI Aliases
  if (
    s === 'ai' || 
    s === 'cse (ai)' || 
    s === 'cse(ai)' || 
    s === 'cse ai' || 
    s === 'artificial intelligence' ||
    s === 'cse-ai' ||
    s === 'b.tech cse (ai)' ||
    s === 'b.tech artificial intelligence'
  ) {
    return { code: 'AI', name: 'Artificial Intelligence', isET: true };
  }

  // 4. AIML Aliases
  if (
    s === 'aiml' || 
    s === 'ai&ml' || 
    s === 'ai & ml' || 
    s === 'ai and ml' || 
    s === 'cse (ai & ml)' || 
    s === 'cse(ai & ml)' || 
    s === 'cse(aiml)' || 
    s === 'cse (aiml)' || 
    s === 'cse aiml' ||
    s === 'cse-aiml' ||
    s === 'artificial intelligence & machine learning' ||
    s === 'artificial intelligence and machine learning' ||
    s === 'b.tech cse (ai & ml)'
  ) {
    return { code: 'AIML', name: 'Artificial Intelligence & Machine Learning', isET: true };
  }

  // 5. Plain CSE is Ambiguous -> NEEDS_MAPPING (Never assume CYS)
  if (s === 'cse' || s === 'computer science' || s === 'computer science & engineering' || s === 'computer science and engineering') {
    return { code: 'NEEDS_MAPPING', raw, isET: false, reason: 'Plain CSE requires manual mapping to specific ET specialization (AI, AIML, CYS, or DS).' };
  }

  // 6. Non-ET departments
  const nonET = ['ece', 'eee', 'mec', 'mech', 'mechanical', 'ce', 'civil', 'it', 'information technology', 'mba', 'mca', 'bsh', 'bs&h'];
  if (nonET.some(net => s.includes(net))) {
    return { code: 'OUT_OF_SCOPE_DEPARTMENT', raw, isET: false, reason: 'Department is outside the Emerging Technologies portal scope.' };
  }

  return { code: 'NEEDS_MAPPING', raw, isET: false, reason: 'Unrecognized department format.' };
}

export const DEPARTMENTS = [
  {
    id: "cse",
    code: "CSE",
    name: "Computer Science & Engineering",
    hodName: "Dr. S. N. Tirumala Rao",
    hodQualification: "M.Tech., Ph.D.",
    established: 1998,
    intake: 300,
    facultyCount: 99,
    programs: ["B.Tech Computer Science & Engineering", "M.Tech Computer Science & Engineering"],
    description: "The Department of Computer Science and Engineering is recognized for excellence in artificial intelligence, cloud computing, cyber systems, and full-stack software development.",
    vision: "To produce globally competent computer engineers capable of leading research, innovation, and industry solutions.",
    mission: "Provide state-of-the-art laboratory infrastructure, nurture industry collaboration, foster ethical computing, and inspire lifelong learning.",
    labs: ["Advanced AI & Deep Learning Lab", "Cloud Computing & Distributed Systems Lab", "Cyber Security & Forensics Lab", "Full Stack Development Studio", "IoT & Embedded Systems Lab", "Database Engineering Lab"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["Accredited by NBA", "95%+ Placement Conversion", "Active IEEE, CSI & ACM Student Chapters", "Centres of Excellence in AI & Cloud"]
  },
  {
    id: "ece",
    code: "ECE",
    name: "Electronics & Communication Engineering",
    hodName: "Dr. V. Venkata Rao",
    hodQualification: "M.E., Ph.D., Senior Member IEEE",
    established: 1998,
    intake: 240,
    facultyCount: 67,
    programs: ["B.Tech Electronics & Communication Engineering", "M.Tech Digital Systems & Signal Processing"],
    description: "A premier department offering deep expertise in VLSI design, embedded systems, wireless communications, IoT, and microwave engineering.",
    vision: "To excel as a centre of high-tech learning and cutting-edge research in electronics and telecommunications.",
    mission: "Impart rigorous technical knowledge, state-of-the-art EDA tool practice, and industry-oriented communication engineering education.",
    labs: ["VLSI Design & Cadence EDA Lab", "Embedded Systems & ARM Studio", "Microwave & Optical Communications Lab", "DSP & Image Processing Lab", "Electronic Circuits & Simulation Lab", "AICTE IDEA Prototyping Centre"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["NBA Accredited", "35+ Granted & Published Patents", "Active IETE & IEEE Photonics Chapters"]
  },
  {
    id: "eee",
    code: "EEE",
    name: "Electrical & Electronics Engineering",
    hodName: "Dr. Sk. Md. Shareef",
    hodQualification: "M.Tech., Ph.D.",
    established: 1998,
    intake: 120,
    facultyCount: 30,
    programs: ["B.Tech Electrical & Electronics Engineering", "M.Tech Power Electronics & Drives"],
    description: "Specializes in smart grid technologies, renewable energy integration, electric vehicle powertrains, and adaptive power systems.",
    vision: "To develop skilled electrical engineers committed to sustainable power generation, industrial automation, and innovation.",
    mission: "Equip students with theoretical and hands-on skills in electrical machines, power electronics, and green energy systems.",
    labs: ["Smart Grid & Power Systems Lab", "Electric Vehicle Powertrain Simulation Lab", "Power Electronics & Industrial Drives Lab", "Electrical Machines Testing Lab", "Control Systems & SCADA Studio"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["NBA Accredited", "High volume of smart energy patents", "Active solar microgrid campus installation"]
  },
  {
    id: "mec",
    code: "MEC",
    name: "Mechanical Engineering",
    hodName: "Dr. B. Venkata Siva",
    hodQualification: "M.Tech, Ph.D, FIE(I), ASME",
    established: 1998,
    intake: 120,
    facultyCount: 21,
    programs: ["B.Tech Mechanical Engineering", "M.Tech Machine Design", "M.Tech Thermal Engineering"],
    description: "Fosters advanced manufacturing, robotics, CAD/CAM/CAE simulation, additive manufacturing, and sustainable thermal systems.",
    vision: "To groom innovative mechanical engineers adept at digital manufacturing, automotive dynamics, and sustainable product design.",
    mission: "Provide experiential learning through advanced machining, 3D printing facilities, robotics, and industrial internships.",
    labs: ["AICTE IDEA Lab Rapid Prototyping Centre", "CNC Machining & Robotics Lab", "CAD/CAM Simulation Studio", "Thermal Engineering & IC Engines Lab", "Materials Characterization & NDT Lab", "Heat Transfer & Fluid Mechanics Lab"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["NBA Accredited", "40+ Design & Utility Patents", "Host of AICTE IDEA Lab facility"]
  },
  {
    id: "ce",
    code: "CE",
    name: "Civil Engineering",
    hodName: "Dr. P. Naga Sowjanya",
    hodQualification: "M.Tech (NITW), Ph.D (NITW)",
    established: 2002,
    intake: 60,
    facultyCount: 16,
    programs: ["B.Tech Civil Engineering", "M.Tech Structural Engineering"],
    description: "Dedicated to sustainable infrastructure, earthquake-resistant structural design, environmental engineering, and GIS remote sensing.",
    vision: "To emerge as a premier civil engineering department producing socially responsible infrastructure innovators.",
    mission: "Deliver rigorous education in structural analysis, geotechnical engineering, water resources, and green building technologies.",
    labs: ["Advanced Structural Engineering Lab", "Geotechnical & Soil Mechanics Lab", "GIS & Remote Sensing Studio", "Environmental Engineering Testing Lab", "Concrete Technology Lab", "Total Station & Advanced Surveying Lab"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["High-impact climate research", "Live consultancy for government & municipal projects", "Active ICI Student Chapter"]
  },
  {
    id: "it",
    code: "IT",
    name: "Information Technology",
    hodName: "Dr. B. Jhansi Vazram",
    hodQualification: "M.Tech., Ph.D.",
    established: 2000,
    intake: 120,
    facultyCount: 18,
    programs: ["B.Tech Information Technology"],
    description: "Empowers students in cloud computing, data analytics, web architectures, cybersecurity, and enterprise systems integration.",
    vision: "To develop skilled IT professionals capable of leading global software engineering and data innovation.",
    mission: "Provide state-of-the-art software development platforms, industry certifications, and research opportunities in cloud technologies.",
    labs: ["Enterprise Application Development Lab", "Cloud Native Computing Studio", "Big Data Analytics Lab", "Mobile Computing & App Studio"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["100% Industry-aligned electives", "High Scopus publication density", "MoUs with Top Cloud Providers"]
  },
  {
    id: "cse-ai",
    code: "CSE (AI)",
    name: "CSE (Artificial Intelligence)",
    hodName: "Dr. B. Jhansi Vazram",
    hodQualification: "M.Tech., Ph.D.",
    established: 2020,
    intake: 120,
    facultyCount: 12,
    programs: ["B.Tech Computer Science & Engineering (Artificial Intelligence)"],
    description: "Dedicated specialization covering knowledge engineering, natural language processing, intelligent agent systems, and automated reasoning.",
    vision: "To pioneer education and research in foundational and applied artificial intelligence.",
    mission: "Train students with deep algorithmic capabilities in symbolic AI, machine intelligence, and cognitive computing.",
    labs: ["AI Algorithmic Studio", "Cognitive Systems Lab", "GPU Accelerated Deep Learning Cluster"],
    bosRegulations: ["R20", "R23", "R26"],
    highlights: ["State-of-the-art GPU clusters", "AI research publications", "Kaggle & Hackathon podium finishes"]
  },
  {
    id: "cse-aiml",
    code: "CSE (AI & ML)",
    name: "CSE (AI & Machine Learning)",
    hodName: "Dr. V. V. A. S. Lakshmi",
    hodQualification: "M.Tech., Ph.D.",
    established: 2020,
    intake: 180,
    facultyCount: 37,
    programs: ["B.Tech Computer Science & Engineering (AI & ML)"],
    description: "Focuses on predictive modeling, computer vision, deep reinforcement learning, and production machine learning pipelines.",
    vision: "To be recognized as a premier destination for machine learning and computational intelligence education.",
    mission: "Deliver comprehensive training in mathematical foundations, neural architectures, and industrial ML deployments.",
    labs: ["Machine Learning Studio", "Computer Vision & Medical Imaging Lab", "Predictive Analytics Sandbox"],
    bosRegulations: ["R20", "R23", "R26"],
    highlights: ["100% placement rate", "Hands-on projects with PyTorch & TensorFlow", "Industry-guided capstones"]
  },
  {
    id: "cse-cys",
    code: "CSE (Cyber Security)",
    name: "CSE (Cyber Security)",
    hodName: "Dr. V. V. A. S. Lakshmi",
    hodQualification: "M.Tech., Ph.D.",
    established: 2021,
    intake: 60,
    facultyCount: 15,
    programs: ["B.Tech Computer Science & Engineering (Cyber Security)"],
    description: "Equips students with defensive and offensive security skills, digital forensics, ethical hacking, malware analysis, and blockchain defense.",
    vision: "To prepare elite cyber defense specialists capable of protecting critical national and enterprise digital assets.",
    mission: "Provide hands-on cyber range experience, vulnerability testing environments, and security architecture training.",
    labs: ["Cyber Range & Security Operations Centre", "Digital Forensics Lab", "Ethical Hacking & Penetration Testing Sandbox"],
    bosRegulations: ["R20", "R23", "R26"],
    highlights: ["Dedicated SOC simulator", "Certified Ethical Hacker (CEH) curriculum alignment", "CTF competition squads"]
  },
  {
    id: "cse-ds",
    code: "CSE (Data Science)",
    name: "CSE (Data Science)",
    hodName: "Dr. V. V. A. S. Lakshmi",
    hodQualification: "M.Tech., Ph.D.",
    established: 2020,
    intake: 120,
    facultyCount: 20,
    programs: ["B.Tech Computer Science & Engineering (Data Science)"],
    description: "Specializes in big data engineering, statistical inference, data warehousing, BI pipelines, and generative data modeling.",
    vision: "To create top data science professionals driving data-driven intelligence across global enterprises.",
    mission: "Provide intensive training in statistical algorithms, big data frameworks, business analytics, and visualization tools.",
    labs: ["Big Data Engineering Lab (Hadoop/Spark)", "Data Visualization & BI Studio", "Statistical Analytics Lab"],
    bosRegulations: ["R20", "R23", "R26"],
    highlights: ["High demand enterprise placements", "Live industry dataset research", "Kaggle Grandmaster mentorship"]
  },
  {
    id: "mba",
    code: "MBA",
    name: "Department of Management Studies",
    hodName: "Dr. Y. Anki Reddy",
    hodQualification: "M.B.A., Ph.D.",
    established: 2006,
    intake: 120,
    facultyCount: 24,
    programs: ["Master of Business Administration (MBA)"],
    description: "Offers dual specializations in Finance, Marketing, HR, Business Analytics, and Supply Chain Management with strong corporate connect.",
    vision: "To nurture visionary business leaders, ethical managers, and dynamic entrepreneurs for the global economy.",
    mission: "Deliver rigorous case-study methodology, industry live projects, executive guest lectures, and entrepreneurship incubation.",
    labs: ["Business Analytics & Financial Modeling Lab", "Management Simulation & GD Lab", "Entrepreneurship Incubation Cell"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["100% Internship placement", "Active Management Development Programs (MDPs)", "Over 40 corporate MoUs"]
  },
  {
    id: "mca",
    code: "MCA",
    name: "Department of Computer Applications",
    hodName: "Prof. Y. Suhasini",
    hodQualification: "M.C.A.",
    established: 2007,
    intake: 120,
    facultyCount: 12,
    programs: ["Master of Computer Applications (MCA) - 2 Years"],
    description: "Provides in-depth postgraduate training in software engineering, mobile computing, cloud platforms, and full-stack web architectures.",
    vision: "To develop master computer application professionals capable of crafting resilient software solutions.",
    mission: "Foster advanced coding skills, database administration, web development expertise, and software project leadership.",
    labs: ["Postgraduate Software Development Studio", "Database & Big Data Lab", "Mobile App Development Centre"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["Strong campus recruitment in Tier-1 IT companies", "Alumni in top leadership positions worldwide"]
  },
  {
    id: "bsh",
    code: "BS&H",
    name: "Basic Sciences & Humanities",
    hodName: "Dr. K. P. Lakshmi",
    hodQualification: "M.A., M.Phil., Ph.D., Dean Student Affairs",
    established: 1998,
    intake: 1200,
    facultyCount: 77,
    programs: ["First Year Engineering Foundation (English, Mathematics, Physics, Chemistry, ES, TPC, Physical Education)"],
    description: "Builds the foundational mathematical, scientific, communicative, and ethical bedrock for all undergraduate engineering disciplines.",
    vision: "To inspire first-year engineers with scientific inquiry, mathematical rigor, and flawless communication skills.",
    mission: "Provide state-of-the-art scientific laboratories, digital language learning studios, and personality development programs.",
    labs: ["Advanced English Digital Language Communication Skills Lab", "Engineering Physics & Optics Lab", "Engineering Chemistry & Nanomaterials Lab", "Environmental Science & Sustainability Centre", "Sports Complex & Intramural Arena"],
    bosRegulations: ["R16", "R19", "R20", "R23", "R26"],
    highlights: ["50+ Ph.D. qualified faculty", "Extensive publications in international SCI/Scopus journals", "State-level sports champions"]
  }
];

export const GOVERNING_BODY = [
  { id: "NEC-GB-001", name: "Sri M. S. Chakravarthi", role: "Chairman", category: "Management", organization: "Gayatri Educational Development Society" },
  { id: "NEC-GB-002", name: "Sri M. V. Koteswara Rao", role: "Member", category: "Management", organization: "Gayatri Educational Development Society" },
  { id: "NEC-GB-003", name: "Sri M. Ramesh Babu", role: "Member", category: "Management", organization: "Gayatri Educational Development Society" },
  { id: "NEC-GB-004", name: "Sri M. B. V. Satyanarayana", role: "Member", category: "Management", organization: "Gayatri Educational Development Society" },
  { id: "NEC-GB-005", name: "Sri M. Kishore Kumar", role: "Member", category: "Management", organization: "Gayatri Educational Development Society" },
  { id: "NEC-GB-006", name: "Sri Ch. Srinivasa Rao", role: "Member", category: "Management", organization: "Gayatri Educational Development Society" },
  { id: "NEC-GB-007", name: "Dr. B. Jhansi Vazram", role: "Member", category: "Teachers of the College", organization: "NEC (Professor & HOD, IT)" },
  { id: "NEC-GB-008", name: "Dr. B. Venkata Siva", role: "Member", category: "Teachers of the College", organization: "NEC (Professor & HOD, Mechanical)" },
  { id: "NEC-GB-009", name: "Sri Ashok Reddy", role: "Member", category: "Industrialist", organization: "Industry Leader & Technologist" },
  { id: "NEC-GB-010", name: "Ch. Sailaja", role: "Member", category: "State Govt. Nominee", organization: "Principal, GITT, Guntur" },
  { id: "NEC-GB-011", name: "Prof. A. Gopalakrishna", role: "Member", category: "University Nominee", organization: "Professor of Mechanical Engineering, UCEK JNTUK, Kakinada" },
  { id: "NEC-GB-012", name: "Dr. Shakeel Ahmed", role: "Member", category: "Nominee of Society / UGC", organization: "Joint Secretary, UGC" },
  { id: "NEC-GB-013", name: "Dr. S. Venkateswarlu", role: "Member Secretary", category: "Principal of College", organization: "Narasaraopeta Engineering College" }
];

export const ACADEMIC_COUNCIL = [
  { id: "NEC-AC-001", name: "Dr. S. Venkateswarlu", designation: "Principal, NEC", role: "Chairman", department: "Institutional", organization: "NEC" },
  { id: "NEC-AC-002", name: "Prof. M.H.M. Krishna Prasad", designation: "Professor of CSE & DAP, JNTUK", role: "University Nominee", department: "University", organization: "JNTUK Kakinada" },
  { id: "NEC-AC-003", name: "Prof. G. Padmaja Rani", designation: "Professor of Physics & DE, JNTUK", role: "University Nominee", department: "University", organization: "JNTUK Kakinada" },
  { id: "NEC-AC-004", name: "Prof. V.V. Subba Rao", designation: "Professor of Mechanical Engineering, JNTUK", role: "University Nominee", department: "University", organization: "JNTUK Kakinada" },
  { id: "NEC-AC-005", name: "Sri Kalyan Sathyavada", designation: "Director, Fusion HCM Development", role: "Industrialist", department: "Industry", organization: "Oracle / Tech Sector" },
  { id: "NEC-AC-006", name: "Dr. Y. Yashwanthi", designation: "Medical Practitioner", role: "Expert Member", department: "Community / Healthcare", organization: "Palnadu Health Care" },
  { id: "NEC-AC-007", name: "Sri G.L.V. Ramana Murthy", designation: "Senior Advocate", role: "Expert Member (Law)", department: "Legal", organization: "High Court Bar Association" },
  { id: "NEC-AC-008", name: "Dr. K. Srinivasa Reddy", designation: "Professor, Mechanical Engineering", role: "External Academician", department: "Mechanical", organization: "IIT Madras" },
  { id: "NEC-AC-009", name: "Prof. N. Siva Prasad", designation: "Retired Professor, Mechanical Engineering", role: "External Academician", department: "Mechanical", organization: "IIT Madras" },
  { id: "NEC-AC-010", name: "Sri Richard King Chatragadda", designation: "Regional Head, Academic Interface Program", role: "Industry Expert", department: "Corporate Relations", organization: "Tata Consultancy Services (TCS), Hyderabad" },
  { id: "NEC-AC-011", name: "Dr. P. Naga Sowjanya", designation: "HOD, Civil Engineering", role: "Member", department: "Civil", organization: "NEC" },
  { id: "NEC-AC-012", name: "Dr. Sk. Md. Shareef", designation: "Associate Professor & HOD, EEE", role: "Member", department: "EEE", organization: "NEC" },
  { id: "NEC-AC-013", name: "Dr. V. Venkata Rao", designation: "HOD, ECE", role: "Member", department: "ECE", organization: "NEC" },
  { id: "NEC-AC-014", name: "Dr. B. Venkata Siva", designation: "HOD, Mechanical Engineering", role: "Member", department: "Mechanical", organization: "NEC" },
  { id: "NEC-AC-015", name: "Dr. S. N. Thirumala Rao", designation: "HOD, CSE", role: "Member", department: "CSE", organization: "NEC" },
  { id: "NEC-AC-016", name: "Dr. B. Jhansi Vazram", designation: "HOD, IT & CSE (AI)", role: "Member", department: "IT / CSE (AI)", organization: "NEC" },
  { id: "NEC-AC-017", name: "Dr. V. V. A. S. Lakshmi", designation: "HOD, CSE (AI&ML / CS / DS)", role: "Member", department: "CSE Emerging", organization: "NEC" },
  { id: "NEC-AC-018", name: "Dr. K. P. Lakshmi", designation: "Dean Student Affairs & HOD, BS&H", role: "Member", department: "BS&H", organization: "NEC" },
  { id: "NEC-AC-019", name: "Dr. Y. Anki Reddy", designation: "HOD, MBA", role: "Member", department: "MBA", organization: "NEC" },
  { id: "NEC-AC-020", name: "Dr. K. Lakshminath", designation: "HOD, MCA", role: "Member", department: "MCA", organization: "NEC" },
  { id: "NEC-AC-021", name: "Dr. D. Suneel", designation: "Vice Principal; Professor, ME; Dean Academics", role: "Member", department: "Mechanical / Admin", organization: "NEC" },
  { id: "NEC-AC-022", name: "Dr. S. V. N. Sreenivasu", designation: "Dean R&D; Professor, CSE", role: "Member (Principal Nominee)", department: "CSE / R&D", organization: "NEC" },
  { id: "NEC-AC-023", name: "Mr. V. Mahesh Babu", designation: "Professor, MCA & Controller of Examinations", role: "Member Secretary", department: "Exam Cell", organization: "NEC" }
];

export const AICTE_IDEA_LAB_TEAM = [
  { id: "IDEA-01", name: "Dr. S. Venkateswarlu", role: "Chief Mentor", designation: "Principal", department: "ECE" },
  { id: "IDEA-02", name: "Dr. S. V. N. Sreenivasu", role: "Coordinator", designation: "Dean R&D; Professor", department: "CSE" },
  { id: "IDEA-03", name: "Dr. D. Suneel", role: "Co-Coordinator", designation: "Vice Principal; Dean First Year", department: "Mechanical" },
  { id: "IDEA-04", name: "Dr. K. Raju", role: "Tech Guru", designation: "Professor", department: "ECE" },
  { id: "IDEA-05", name: "Dr. Mohammad Javeed Ahammed", role: "Tech Guru", designation: "Assoc. Professor", department: "ECE" },
  { id: "IDEA-06", name: "M. Venkaiah", role: "Tech Guru", designation: "Assoc. Professor", department: "Mechanical" },
  { id: "IDEA-07", name: "K. John Babu", role: "Tech Guru", designation: "Asst. Professor", department: "Mechanical" }
];

export const CAMPUS_VIDEOS = [
  { id: "vid-1", title: "NEC Aerial Campus Tour", category: "Campus Overview", file: "/assets/NEC Videos/Aerial View Of campus_.mp4", duration: "1:45", description: "Spectacular drone footage showing the lush 40-acre campus, academic blocks, and greenery." },
  { id: "vid-2", title: "Admin Block & Main Campus", category: "Campus Overview", file: "/assets/NEC Videos/NEC Aerial View & Admin blck.mp4", duration: "1:30", description: "Aerial exploration of the monumental Admin Block and entrance promenade." },
  { id: "vid-3", title: "Main Block Aerial View", category: "Infrastructure", file: "/assets/NEC Videos/Main block aerial view_.mp4", duration: "1:20", description: "Overhead cinematic flight across the central academic building complex." },
  { id: "vid-4", title: "Main Building Inside View", category: "Infrastructure", file: "/assets/NEC Videos/Main block inside view.mp4", duration: "2:10", description: "Walkthrough of high-tech digital classrooms, auditoriums, and interactive learning halls." },
  { id: "vid-5", title: "Academic Blocks & Walkway", category: "Campus Life", file: "/assets/NEC Videos/Blocks view.mp4", duration: "1:15", description: "Panoramic look at interconnected engineering blocks and student walkways." },
  { id: "vid-6", title: "Green Walkway & Gardens", category: "Campus Life", file: "/assets/NEC Videos/Walkway_.mp4", duration: "1:05", description: "Serene tree-lined campus paths connecting academic wings." },
  { id: "vid-7", title: "Sports Complex & Athletics", category: "Sports", file: "/assets/NEC Videos/Sports.mp4", duration: "1:50", description: "Vibrant footage of student athletics, cricket grounds, and physical fitness activities." },
  { id: "vid-8", title: "Basketball Arena & Tournaments", category: "Sports", file: "/assets/NEC Videos/Basketball_.mp4", duration: "1:10", description: "Intense basketball match action under state-of-the-art campus floodlights." },
  { id: "vid-9", title: "NCC Drills & Cultural Dance", category: "Student Life", file: "/assets/NEC Videos/NCC & Dance.mp4", duration: "2:25", description: "Disciplined NCC cadet parades combined with colorful annual cultural festival dances." },
  { id: "vid-10", title: "Transport Fleet & Buses", category: "Facilities", file: "/assets/NEC Videos/Buses Aerial view_.mp4", duration: "1:40", description: "Aerial view of NEC's comprehensive 60+ bus fleet serving the entire region." },
  { id: "vid-11", title: "Campus Gardens & Greenery", category: "Facilities", file: "/assets/NEC Videos/Garden&Buses 2.mp4", duration: "1:15", description: "Eco-friendly landscaping, solar installations, and student transit terminals." },
  { id: "vid-12", title: "Campus Aerial Perspective II", category: "Campus Overview", file: "/assets/NEC Videos/Aerial view 2.mp4", duration: "1:35", description: "High-altitude campus vantage highlighting modern architectural design." },
  { id: "vid-13", title: "Transit Infrastructure", category: "Facilities", file: "/assets/NEC Videos/Buses.mp4", duration: "0:55", description: "Safe and structured daily transit management at the central transport bay." },
  { id: "vid-14", title: "NEC Institutional Identity", category: "Branding", file: "/assets/NEC Videos/NEC Logo video.mp4", duration: "0:45", description: "Animated institutional emblem symbolizing engineering knowledge and innovation." }
];

export const CAMPUS_PHOTOS = [
  { id: "img-1", title: "College Main Building", category: "Campus", file: "/assets/NEC Buildings/College main building.jpg", description: "The iconic multi-storey academic headquarters of NEC." },
  { id: "img-2", title: "College Admin Block", category: "Infrastructure", file: "/assets/NEC Buildings/College Admin Block.jpg", description: "Administrative offices, Principal's secretariat, and central exam cell." },
  { id: "img-3", title: "College Grand Entrance", category: "Campus", file: "/assets/NEC Buildings/College Entrance.jpg", description: "The majestic main campus entrance on Kotappakonda Highway." },
  { id: "img-4", title: "Main Building Atrium", category: "Infrastructure", file: "/assets/NEC Buildings/Main buliding inside.jpg", description: "Spacious multi-level central atrium and digital display hub." },
  { id: "img-5", title: "Campus Walkway", category: "Student Life", file: "/assets/NEC Buildings/College Walkway.jpg", description: "Landscaped pedestrian corridors shaded by lush trees." },
  { id: "img-6", title: "College Campus Area View", category: "Campus", file: "/assets/NEC Buildings/College Area View.jpg", description: "Wide-angle campus perspective showcasing sprawling departmental blocks." },
  { id: "img-7", title: "Campus Illumination at Night", category: "Night Views", file: "/assets/NEC Logos/College Night view.png", description: "Breathtaking architectural lighting across the central academic quad." },
  { id: "img-8", title: "Walkway Night Panorama", category: "Night Views", file: "/assets/NEC Logos/College Walkway Night View.png", description: "Illuminated pedestrian pathway fostering 24/7 security and modern beauty." }
];

export const BRANDING_LOGOS = {
  collegeLogo: "/assets/NEC Logos/College-logo.jpeg",
  collegeLogo2: "/assets/NEC Logos/College Logo 2.jpeg",
  collegeLogoBg: "/assets/NEC Logos/College Logo BG.jpeg",
  collegeFullName: "/assets/NEC Logos/College Full name.png",
  mainLogoLockup: "/assets/nrtec/branding/nec-main-logo.webp",
  accreditationBadges: "/assets/nrtec/branding/accreditations-badges.png",
  organizationChart: "/assets/nrtec/branding/organization-chart.webp",
  aicte: "/assets/NEC Logos/AICTE Logo.jpeg",
  naac: "/assets/NEC Logos/NAAC Logo.jpeg",
  nba: "/assets/NEC Logos/NBA Logo.jpeg",
  nba2: "/assets/NEC Logos/NBA Logo 2.png",
  nirf: "/assets/NEC Logos/NIRF Logo.jpeg",
  aishe: "/assets/NEC Logos/AISHE Logo.png",
  iic: "/assets/NEC Logos/IIC Logo.jpeg",
  iicBg: "/assets/NEC Logos/IIC Logo BG.png",
  rdLogo: "/assets/NEC Logos/R&D Logo.png",
};

export const FACULTY_DATA = [];
export const INITIAL_PUBLICATIONS = [];
export const INITIAL_PATENTS = [
  {
    "id": "pat_202541127567",
    "patentRecordNumber": "PAT-AIML-2025-0001",
    "applicationNumber": "202541127567",
    "title": "Reinforcement Learning-Driven Traffic Control System for Smart Cities",
    "department": "AIML",
    "departmentCode": "AIML",
    "academicYear": "2025-26",
    "filingDate": "2025-12-16",
    "publicationDate": "2026-02-01",
    "sourceDateSerial": 46054,
    "legalStatus": "PUBLISHED",
    "workflowStatus": "APPROVED",
    "patentType": "Indian Patent",
    "countryCode": "IN",
    "country": "India",
    "patentOffice": "Indian Patent Office (Chennai)",
    "applicant": "Narasaraopeta Engineering College (Autonomous)",
    "applicantName": "Narasaraopeta Engineering College (Autonomous)",
    "sourceSheet": "25-26",
    "sourceRowRange": "Row 5 to 14",
    "leadInventor": {
      "name": "P. V Sateesh Kumar",
      "designation": "Assistant Professor",
      "department": "AIML",
      "order": 1
    },
    "inventors": [
      {
        "name": "P. V Sateesh Kumar",
        "order": 1,
        "department": "AIML"
      },
      {
        "name": "G. Jeevana Manikanta",
        "order": 2,
        "department": "AIML"
      },
      {
        "name": "J. Syam Babu",
        "order": 3,
        "department": "AIML"
      },
      {
        "name": "P. Solmon",
        "order": 4,
        "department": "AIML"
      },
      {
        "name": "A. Veema Rao",
        "order": 5,
        "department": "AIML"
      },
      {
        "name": "D. Sreekanth",
        "order": 6,
        "department": "AIML"
      },
      {
        "name": "P. Srinivasa Rao",
        "order": 7,
        "department": "AIML"
      },
      {
        "name": "M. Revathi",
        "order": 8,
        "department": "AIML"
      },
      {
        "name": "N. Siva Rama Krishna",
        "order": 9,
        "department": "AIML"
      },
      {
        "name": "G. V Neelimadhavi",
        "order": 10,
        "department": "AIML"
      }
    ],
    "inventorCount": 10,
    "hasPatentLink": false,
    "isDeleted": false
  },
  {
    "id": "pat_202541127569",
    "patentRecordNumber": "PAT-AIML-2025-0002",
    "applicationNumber": "202541127569",
    "title": "Federated Learning-Based Secure Healthcare Diagnostic System",
    "department": "AIML",
    "departmentCode": "AIML",
    "academicYear": "2025-26",
    "filingDate": "2025-12-16",
    "publicationDate": "2026-02-01",
    "sourceDateSerial": 46054,
    "legalStatus": "PUBLISHED",
    "workflowStatus": "APPROVED",
    "patentType": "Indian Patent",
    "countryCode": "IN",
    "country": "India",
    "patentOffice": "Indian Patent Office (Chennai)",
    "applicant": "Narasaraopeta Engineering College (Autonomous)",
    "applicantName": "Narasaraopeta Engineering College (Autonomous)",
    "sourceSheet": "25-26",
    "sourceRowRange": "Row 15 to 24",
    "leadInventor": {
      "name": "Dr. V V A S Lakshmi",
      "designation": "Professor & HOD",
      "department": "AIML",
      "order": 1
    },
    "inventors": [
      {
        "name": "Dr. V V A S Lakshmi",
        "order": 1,
        "department": "AIML"
      },
      {
        "name": "G. Mahesh Babu",
        "order": 2,
        "department": "AIML"
      },
      {
        "name": "N. Siva Rama Krishna",
        "order": 3,
        "department": "AIML"
      },
      {
        "name": "P. V Sateesh Kumar",
        "order": 4,
        "department": "AIML"
      },
      {
        "name": "M. Sai Yaswanth",
        "order": 5,
        "department": "AIML"
      },
      {
        "name": "D. Uma Sankar",
        "order": 6,
        "department": "AIML"
      },
      {
        "name": "G. Jeevana Manikanta",
        "order": 7,
        "department": "AIML"
      },
      {
        "name": "G. Nageswara Rao",
        "order": 8,
        "department": "AIML"
      },
      {
        "name": "P. Solmon",
        "order": 9,
        "department": "AIML"
      },
      {
        "name": "Ch. Padma",
        "order": 10,
        "department": "AIML"
      }
    ],
    "inventorCount": 10,
    "hasPatentLink": false,
    "isDeleted": false
  },
  {
    "id": "pat_202541127568",
    "patentRecordNumber": "PAT-AIML-2025-0003",
    "applicationNumber": "202541127568",
    "title": "Automated Academic Performance Prediction System Using Deep Ensemble Models",
    "department": "AIML",
    "departmentCode": "AIML",
    "academicYear": "2025-26",
    "filingDate": "2025-12-16",
    "publicationDate": "2026-02-01",
    "sourceDateSerial": 46054,
    "legalStatus": "PUBLISHED",
    "workflowStatus": "APPROVED",
    "patentType": "Indian Patent",
    "countryCode": "IN",
    "country": "India",
    "patentOffice": "Indian Patent Office (Chennai)",
    "applicant": "Narasaraopeta Engineering College (Autonomous)",
    "applicantName": "Narasaraopeta Engineering College (Autonomous)",
    "sourceSheet": "25-26",
    "sourceRowRange": "Row 25 to 34",
    "leadInventor": {
      "name": "J. Syam Babu",
      "designation": "Assistant Professor",
      "department": "AIML",
      "order": 1
    },
    "inventors": [
      {
        "name": "J. Syam Babu",
        "order": 1,
        "department": "AIML"
      },
      {
        "name": "G. Mahesh Babu",
        "order": 2,
        "department": "AIML"
      },
      {
        "name": "D. Sreekanth",
        "order": 3,
        "department": "AIML"
      },
      {
        "name": "D. Uma Sankar",
        "order": 4,
        "department": "AIML"
      },
      {
        "name": "A. Veema Rao",
        "order": 5,
        "department": "AIML"
      },
      {
        "name": "G. Nageswara Rao",
        "order": 6,
        "department": "AIML"
      },
      {
        "name": "P. Sardar Khan",
        "order": 7,
        "department": "AIML"
      },
      {
        "name": "G. V Neelimadhavi",
        "order": 8,
        "department": "AIML"
      },
      {
        "name": "M. Revathi",
        "order": 9,
        "department": "AIML"
      },
      {
        "name": "K. Mounika",
        "order": 10,
        "department": "AIML"
      }
    ],
    "inventorCount": 10,
    "hasPatentLink": false,
    "isDeleted": false
  },
  {
    "id": "pat_202541127565",
    "patentRecordNumber": "PAT-DS-2025-0001",
    "applicationNumber": "202541127565",
    "title": "AI-Powered Data Visualization Assistant for Insight Generation",
    "department": "DS",
    "departmentCode": "DS",
    "academicYear": "2025-26",
    "filingDate": "2025-12-16",
    "publicationDate": "2026-02-01",
    "sourceDateSerial": 46054,
    "legalStatus": "PUBLISHED",
    "workflowStatus": "APPROVED",
    "patentType": "Indian Patent",
    "countryCode": "IN",
    "country": "India",
    "patentOffice": "Indian Patent Office (Chennai)",
    "applicant": "Narasaraopeta Engineering College (Autonomous)",
    "applicantName": "Narasaraopeta Engineering College (Autonomous)",
    "sourceSheet": "25-26",
    "sourceRowRange": "Row 35 to 44",
    "leadInventor": {
      "name": "Dr. V V A S Lakshmi",
      "designation": "Professor & HOD",
      "department": "DS",
      "order": 1
    },
    "inventors": [
      {
        "name": "Dr. V V A S Lakshmi",
        "order": 1,
        "department": "DS"
      },
      {
        "name": "G. Mahesh Babu",
        "order": 2,
        "department": "DS"
      },
      {
        "name": "P. V Sateesh Kumar",
        "order": 3,
        "department": "DS"
      },
      {
        "name": "G. Jeevana Manikanta",
        "order": 4,
        "department": "DS"
      },
      {
        "name": "P. Srinivasa Rao",
        "order": 5,
        "department": "DS"
      },
      {
        "name": "P. Sardar Khan",
        "order": 6,
        "department": "DS"
      },
      {
        "name": "M. Sai Yaswanth",
        "order": 7,
        "department": "DS"
      },
      {
        "name": "N. Siva Rama Krishna",
        "order": 8,
        "department": "DS"
      },
      {
        "name": "J. Syam Babu",
        "order": 9,
        "department": "DS"
      },
      {
        "name": "K. Mounika",
        "order": 10,
        "department": "DS"
      }
    ],
    "inventorCount": 10,
    "hasPatentLink": false,
    "isDeleted": false
  }
];
export const INITIAL_FACULTY_RESEARCH_PROFILES = [];
export const INITIAL_BOS = [
  {
    "id": "bos_cys_r20_01",
    "bosNumber": "BOS-CYS-R20-SRC-1",
    "meetingSourceKey": "BOS-CYS-R20-SRC-1",
    "department": "CSE (Cyber Security)",
    "departmentCode": "CYS",
    "departmentName": "CSE (Cyber Security)",
    "academicYear": "2022-23",
    "targetYear": "I & II",
    "title": "R20 Board of Studies Meeting - I & II",
    "bosDate": "2022-09-26",
    "meetingDate": "2022-09-26",
    "startTime": null,
    "endTime": null,
    "meetingMode": "Offline",
    "venue": null,
    "platform": null,
    "privateMeetingLink": null,
    "circularReference": null,
    "circularDate": null,
    "regulations": [
      "R20"
    ],
    "regulationCodes": "R20",
    "regulationMeetingNumber": 1,
    "meetingStatus": "HELD",
    "workflowStatus": "DRAFT",
    "sourceConfidence": "LIMITED_XLSX_ONLY",
    "reviewNotes": "Only summary-level R20 data is present in the provided XLSX. Chairperson, full internal member list, agenda, resolutions, and supporting minutes were not provided; do not invent them.",
    "chairman": null,
    "chairperson": null,
    "members": [
      {
        "name": "Dr.ASN Chakravarthy",
        "member_type": "UNIVERSITY_NOMINEE",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Dr.Bheemarjuna Reddy Tamma",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Dr.K.V.D.Kiran",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Mr.P.Sudhakar",
        "member_type": "INDUSTRY_EXPERT",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Mrs.Lakshmi Deepthi",
        "member_type": "ALUMNI",
        "designation": "",
        "institution": ""
      }
    ],
    "agenda": [],
    "resolutions": [],
    "documents": [],
    "hasDocument": false,
    "isDeleted": false
  },
  {
    "id": "bos_cys_r20_02",
    "bosNumber": "BOS-CYS-R20-SRC-2",
    "meetingSourceKey": "BOS-CYS-R20-SRC-2",
    "department": "CSE (Cyber Security)",
    "departmentCode": "CYS",
    "departmentName": "CSE (Cyber Security)",
    "academicYear": "2023-24",
    "targetYear": "III & IV",
    "title": "R20 Board of Studies Meeting - III & IV",
    "bosDate": "2023-12-16",
    "meetingDate": "2023-12-16",
    "startTime": null,
    "endTime": null,
    "meetingMode": "Offline",
    "venue": null,
    "platform": null,
    "privateMeetingLink": null,
    "circularReference": null,
    "circularDate": null,
    "regulations": [
      "R20"
    ],
    "regulationCodes": "R20",
    "regulationMeetingNumber": 2,
    "meetingStatus": "HELD",
    "workflowStatus": "DRAFT",
    "sourceConfidence": "LIMITED_XLSX_ONLY",
    "reviewNotes": "Only summary-level R20 data is present in the provided XLSX. Chairperson, meeting mode/time, agenda and resolutions not supplied.",
    "chairman": null,
    "chairperson": null,
    "members": [
      {
        "name": "Dr.ASN Chakravarthy",
        "member_type": "UNIVERSITY_NOMINEE",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Dr.Bheemarjuna Reddy Tamma",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Dr.K.V.D.Kiran",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Mr.P.Sudhakar",
        "member_type": "INDUSTRY_EXPERT",
        "designation": "",
        "institution": ""
      },
      {
        "name": "Mrs.Lakshmi Deepthi",
        "member_type": "ALUMNI",
        "designation": "",
        "institution": ""
      }
    ],
    "agenda": [],
    "resolutions": [],
    "documents": [],
    "hasDocument": false,
    "isDeleted": false
  },
  {
    "id": "bos_cys_r23_01",
    "bosNumber": "BOS-CYS-R23-01",
    "meetingSourceKey": "BOS-CYS-R23-01",
    "department": "CSE (Cyber Security)",
    "departmentCode": "CYS",
    "departmentName": "CSE (Cyber Security)",
    "academicYear": "2023-24",
    "targetYear": "I Year",
    "title": "R23 1st Board of Studies Meeting - I Year",
    "bosDate": "2023-09-26",
    "meetingDate": "2023-09-26",
    "startTime": "10:00 AM",
    "endTime": "01:00 PM",
    "meetingMode": "Online",
    "platform": "Microsoft Teams",
    "privateMeetingLink": "",
    "circularReference": "NEC/CSE (CS)/BoS-1",
    "circularDate": "2023-09-20",
    "regulations": [
      "R23"
    ],
    "regulationCodes": "R23",
    "regulationMeetingNumber": 1,
    "meetingStatus": "HELD",
    "workflowStatus": "APPROVED",
    "sourceConfidence": "FULL_DOCUMENTS_VERIFIED",
    "chairman": "Dr. V. V. A. S. Lakshmi (Professor & HOD, CSE (Cyber Security))",
    "chairperson": "Dr. V. V. A. S. Lakshmi",
    "members": [
      {
        "name": "Dr. V. V. A. S. Lakshmi",
        "member_type": "CHAIRMAN",
        "designation": "Professor & HOD",
        "institution": "NEC"
      },
      {
        "name": "Dr.ASN Chakravarthy",
        "member_type": "UNIVERSITY_NOMINEE",
        "designation": "Professor",
        "institution": "UCEK JNTUK Kakinada"
      },
      {
        "name": "Dr.Bheemarjuna Reddy Tamma",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Professor",
        "institution": "IIT Hyderabad"
      },
      {
        "name": "Dr.K.V.D.Kiran",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Professor",
        "institution": "KLEF"
      },
      {
        "name": "Mr.P.Sudhakar",
        "member_type": "INDUSTRY_EXPERT",
        "designation": "Senior Director",
        "institution": "Cognizant"
      },
      {
        "name": "Mrs.Lakshmi Deepthi",
        "member_type": "ALUMNI",
        "designation": "Software Engineer",
        "institution": "TCS"
      },
      {
        "name": "Dr.S.N.Tirumala Rao",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, CSE",
        "institution": "NEC"
      },
      {
        "name": "Dr.B.Jhansi Vazram",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, IT",
        "institution": "NEC"
      },
      {
        "name": "Dr.K.Lakshmi Nadh",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, MCA",
        "institution": "NEC"
      },
      {
        "name": "Dr.S.Siva Nageswara Rao",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Associate Professor",
        "institution": "NEC"
      },
      {
        "name": "Dr.M.Sireesha",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Associate Professor",
        "institution": "NEC"
      }
    ],
    "agenda": [
      {
        "itemNo": 1,
        "title": "Opening remarks by the Chairperson",
        "description": "Welcome and introductory address by Dr. V.V.A.S. Lakshmi"
      },
      {
        "itemNo": 2,
        "title": "Discussion on R23 First-Year Course Structure and Syllabus",
        "description": "Detailed review of R23 B.Tech CSE (Cyber Security) curriculum"
      },
      {
        "itemNo": 3,
        "title": "Approval of First-Year Course Structure & Syllabus",
        "description": "Formal adoption and recommendation to Academic Council"
      }
    ],
    "resolutions": [
      "String coverage strengthened in Introduction to Programming course.",
      "Unix command exercises explicitly included in Programming Laboratory syllabus.",
      "Data Structures units restructured for balanced conceptual flow across tree algorithms.",
      "AVL trees, binary search trees, and heap structures formalized in curriculum.",
      "Graph concepts and traversal algorithms ratified for core laboratory work.",
      "R23 first-year course structure and syllabus unanimously approved."
    ],
    "documents": [
      {
        "id": "doc_bos_01",
        "title": "01_R23_1st_BoS_CYS_2023-09-26.pdf",
        "fileName": "01_R23_1st_BoS_CYS_2023-09-26.pdf",
        "url": "/documents/bos/cse-cys/01_R23_1st_BoS_CYS_2023-09-26.pdf",
        "fileSize": "1.2 MB",
        "documentType": "Signed Minutes & Syllabus"
      }
    ],
    "minutesPdfUrl": "/documents/bos/cse-cys/01_R23_1st_BoS_CYS_2023-09-26.pdf",
    "hasDocument": true,
    "isDeleted": false
  },
  {
    "id": "bos_cys_r23_02",
    "bosNumber": "BOS-CYS-R23-02",
    "meetingSourceKey": "BOS-CYS-R23-02",
    "department": "CSE (Cyber Security)",
    "departmentCode": "CYS",
    "departmentName": "CSE (Cyber Security)",
    "academicYear": "2024-25",
    "targetYear": "II Year",
    "title": "R23 2nd Board of Studies Meeting - II Year",
    "bosDate": "2024-07-09",
    "meetingDate": "2024-07-09",
    "startTime": "11:00 AM",
    "endTime": "01:30 PM",
    "meetingMode": "Online",
    "platform": "Microsoft Teams",
    "privateMeetingLink": "",
    "circularReference": "NEC/CSE (CS)/BoS-2",
    "circularDate": "2024-07-04",
    "regulations": [
      "R23"
    ],
    "regulationCodes": "R23",
    "regulationMeetingNumber": 2,
    "meetingStatus": "HELD",
    "workflowStatus": "APPROVED",
    "sourceConfidence": "FULL_DOCUMENTS_VERIFIED",
    "chairman": "Dr. V. V. A. S. Lakshmi (Professor & HOD, CSE (Cyber Security))",
    "chairperson": "Dr. V. V. A. S. Lakshmi",
    "members": [
      {
        "name": "Dr. V. V. A. S. Lakshmi",
        "member_type": "CHAIRMAN",
        "designation": "Professor & HOD",
        "institution": "NEC"
      },
      {
        "name": "Dr.ASN Chakravarthy",
        "member_type": "UNIVERSITY_NOMINEE",
        "designation": "Professor",
        "institution": "UCEK JNTUK Kakinada"
      },
      {
        "name": "Dr.Bheemarjuna Reddy Tamma",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Professor",
        "institution": "IIT Hyderabad"
      },
      {
        "name": "Dr.K.V.D.Kiran",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Professor",
        "institution": "KLEF"
      },
      {
        "name": "Mr.P.Sudhakar",
        "member_type": "INDUSTRY_EXPERT",
        "designation": "Senior Director",
        "institution": "Cognizant"
      },
      {
        "name": "Mrs.Lakshmi Deepthi",
        "member_type": "ALUMNI",
        "designation": "Software Engineer",
        "institution": "TCS"
      },
      {
        "name": "Dr.S.N.Tirumala Rao",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, CSE",
        "institution": "NEC"
      },
      {
        "name": "Dr.B.Jhansi Vazram",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, IT",
        "institution": "NEC"
      },
      {
        "name": "Dr.K.Lakshmi Nadh",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, MCA",
        "institution": "NEC"
      },
      {
        "name": "Dr.S.Siva Nageswara Rao",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Associate Professor",
        "institution": "NEC"
      }
    ],
    "agenda": [
      {
        "itemNo": 1,
        "title": "Welcome and introductory remarks by Chairman",
        "description": "Introductory address"
      },
      {
        "itemNo": 2,
        "title": "Discussion on R23 II Year B.Tech (Cyber Security) Course Structure and Syllabus",
        "description": "Review II-I and II-II courses"
      },
      {
        "itemNo": 3,
        "title": "Finalization incorporating member suggestions",
        "description": "Curriculum optimization"
      },
      {
        "itemNo": 4,
        "title": "Minutes summary & approval",
        "description": "Ratification"
      },
      {
        "itemNo": 5,
        "title": "Vote of thanks",
        "description": "Concluding address"
      }
    ],
    "resolutions": [
      "Operating Systems Lab transitioned to Networks Lab in II Semester to reinforce protocol implementations.",
      "Virtual labs integrated for remote experimentation in network topologies.",
      "Computer Networks units reordered for logical progression from physical to application layers.",
      "Removed Convex Hull algorithm from Advanced Data Structures and Algorithm Analysis Unit-II in II-I.",
      "Shifted Environmental Studies from II-I to II-II semester for balanced student workload.",
      "R23 II Year B.Tech (Cyber Security) course structure and syllabus approved."
    ],
    "documents": [
      {
        "id": "doc_bos_02",
        "title": "02_R23_2nd_BoS_CYS_2024-07-09.pdf",
        "fileName": "02_R23_2nd_BoS_CYS_2024-07-09.pdf",
        "url": "/documents/bos/cse-cys/02_R23_2nd_BoS_CYS_2024-07-09.pdf",
        "fileSize": "1.8 MB",
        "documentType": "Signed Minutes & Syllabus"
      }
    ],
    "minutesPdfUrl": "/documents/bos/cse-cys/02_R23_2nd_BoS_CYS_2024-07-09.pdf",
    "hasDocument": true,
    "isDeleted": false
  },
  {
    "id": "bos_cys_r23_03",
    "bosNumber": "BOS-CYS-R23-03",
    "meetingSourceKey": "BOS-CYS-R23-03",
    "department": "CSE (Cyber Security)",
    "departmentCode": "CYS",
    "departmentName": "CSE (Cyber Security)",
    "academicYear": "2025-26",
    "targetYear": "III Year",
    "title": "R23 3rd Board of Studies Meeting - III Year",
    "bosDate": "2025-07-12",
    "meetingDate": "2025-07-12",
    "startTime": "10:00 AM",
    "endTime": "01:00 PM",
    "meetingMode": "Online",
    "platform": "Microsoft Teams",
    "privateMeetingLink": "",
    "circularReference": "NEC/CSE (CS)/BoS-5",
    "circularDate": "2025-07-10",
    "regulations": [
      "R23"
    ],
    "regulationCodes": "R23",
    "regulationMeetingNumber": 3,
    "meetingStatus": "HELD",
    "workflowStatus": "APPROVED",
    "sourceConfidence": "FULL_DOCUMENTS_VERIFIED",
    "hasSourceConflict": true,
    "sourceConflictNote": "Source cover and minutes support 12-07-2025 at 10:00 AM; internal agenda page references 11-07-2025 / 11:00 AM. Canonical 12-07-2025 retained with source conflict flag.",
    "chairman": "Dr. V. V. A. S. Lakshmi (Professor & HOD, CSE (Cyber Security))",
    "chairperson": "Dr. V. V. A. S. Lakshmi",
    "members": [
      {
        "name": "Dr. V. V. A. S. Lakshmi",
        "member_type": "CHAIRMAN",
        "designation": "Professor & HOD",
        "institution": "NEC"
      },
      {
        "name": "Dr.ASN Chakravarthy",
        "member_type": "UNIVERSITY_NOMINEE",
        "designation": "Professor",
        "institution": "UCEK JNTUK Kakinada"
      },
      {
        "name": "Dr.Bheemarjuna Reddy Tamma",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Professor",
        "institution": "IIT Hyderabad"
      },
      {
        "name": "Dr.K.V.D.Kiran",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Professor",
        "institution": "KLEF"
      },
      {
        "name": "Mr.P.Sudhakar",
        "member_type": "INDUSTRY_EXPERT",
        "designation": "Senior Director",
        "institution": "Cognizant"
      },
      {
        "name": "Mrs.Lakshmi Deepthi",
        "member_type": "ALUMNI",
        "designation": "Software Engineer",
        "institution": "TCS"
      },
      {
        "name": "Dr.S.N.Tirumala Rao",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, CSE",
        "institution": "NEC"
      },
      {
        "name": "Dr.B.Jhansi Vazram",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, IT",
        "institution": "NEC"
      },
      {
        "name": "Dr.S.V.N.Srinivasu",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor, CSE & Dean R&D",
        "institution": "NEC"
      },
      {
        "name": "Dr.K.Lakshminadh",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, MCA",
        "institution": "NEC"
      },
      {
        "name": "Mr.G.Mahesh Babu",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Assistant Professor",
        "institution": "NEC"
      },
      {
        "name": "Mr.G.J.Manikanta",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Assistant Professor",
        "institution": "NEC"
      },
      {
        "name": "Mr.D.Srikanth",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Assistant Professor",
        "institution": "NEC"
      }
    ],
    "agenda": [
      {
        "itemNo": 1,
        "title": "Welcome and opening remarks by Chairman",
        "description": "Address by Dr. V.V.A.S. Lakshmi"
      },
      {
        "itemNo": 2,
        "title": "Discussion on R23 III Year B.Tech (Cyber Security) Course Structure and Syllabus",
        "description": "Review III-I and III-II subjects"
      },
      {
        "itemNo": 3,
        "title": "Incorporation of AICTE IDEA Lab and Design Thinking Modules",
        "description": "Prototyping integration"
      },
      {
        "itemNo": 4,
        "title": "Electives refinement (PE-II and OE-II)",
        "description": "Unix & Shell programming inclusions"
      },
      {
        "itemNo": 5,
        "title": "Ratification and approval",
        "description": "Course structure sign-off"
      },
      {
        "itemNo": 6,
        "title": "Vote of thanks",
        "description": "Meeting conclusion"
      }
    ],
    "resolutions": [
      "AICTE Design Thinking and Idea Lab prototyping included in III-I curriculum.",
      "Unix & Shell Programming formally approved in Professional Elective (PE-II).",
      "Fundamentals of Unix Programming incorporated in Open Elective (OE-II).",
      "R23 III Year B.Tech Cyber Security course structure and syllabus approved."
    ],
    "documents": [
      {
        "id": "doc_bos_03",
        "title": "03_R23_3rd_BoS_CYS_2025-07-12.pdf",
        "fileName": "03_R23_3rd_BoS_CYS_2025-07-12.pdf",
        "url": "/documents/bos/cse-cys/03_R23_3rd_BoS_CYS_2025-07-12.pdf",
        "fileSize": "2.1 MB",
        "documentType": "Signed Minutes & Syllabus"
      }
    ],
    "minutesPdfUrl": "/documents/bos/cse-cys/03_R23_3rd_BoS_CYS_2025-07-12.pdf",
    "hasDocument": true,
    "isDeleted": false
  },
  {
    "id": "bos_cys_r23_04",
    "bosNumber": "BOS-CYS-R23-04",
    "meetingSourceKey": "BOS-CYS-R23-04",
    "department": "CSE (Cyber Security)",
    "departmentCode": "CYS",
    "departmentName": "CSE (Cyber Security)",
    "academicYear": "2025-26",
    "targetYear": "IV Year",
    "title": "R23 4th Board of Studies Meeting - IV Year",
    "bosDate": "2026-02-21",
    "meetingDate": "2026-02-21",
    "startTime": "10:00 AM",
    "endTime": "01:00 PM",
    "meetingMode": "Online",
    "platform": "Microsoft Teams",
    "privateMeetingLink": "",
    "circularReference": "NEC/CSE (CS)/BoS-6",
    "circularDate": "2026-02-17",
    "regulations": [
      "R23"
    ],
    "regulationCodes": "R23",
    "regulationMeetingNumber": 4,
    "meetingStatus": "HELD",
    "workflowStatus": "APPROVED",
    "sourceConfidence": "FULL_DOCUMENTS_VERIFIED",
    "chairman": "Dr. V. V. A. S. Lakshmi (Professor & HOD, CSE (Cyber Security))",
    "chairperson": "Dr. V. V. A. S. Lakshmi",
    "members": [
      {
        "name": "Dr. V. V. A. S. Lakshmi",
        "member_type": "CHAIRMAN",
        "designation": "Professor & HOD",
        "institution": "NEC"
      },
      {
        "name": "Dr.ASN Chakravarthy",
        "member_type": "UNIVERSITY_NOMINEE",
        "designation": "Professor",
        "institution": "UCEK JNTUK Kakinada"
      },
      {
        "name": "Dr.Sriramulu Bojjagani",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Associate Professor",
        "institution": "School of Computer Science & Artificial Intelligence, SR University, Warangal"
      },
      {
        "name": "Dr.B.Kotaiah",
        "member_type": "ACADEMIC_EXPERT",
        "designation": "Associate Professor",
        "institution": "School of Computer Science & Engineering, VIT-AP University"
      },
      {
        "name": "Mr.P.Sudhakar",
        "member_type": "INDUSTRY_EXPERT",
        "designation": "Senior Director",
        "institution": "Cognizant"
      },
      {
        "name": "Mrs.Lakshmi Deepthi",
        "member_type": "ALUMNI",
        "designation": "Software Engineer",
        "institution": "TCS"
      },
      {
        "name": "Dr.S.N.Tirumala Rao",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, CSE",
        "institution": "NEC"
      },
      {
        "name": "Dr.B.Jhansi Vazram",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, IT",
        "institution": "NEC"
      },
      {
        "name": "Dr.S.V.N.Srinivasu",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor, CSE & Dean R&D",
        "institution": "NEC"
      },
      {
        "name": "Dr.K.Lakshminadh",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Professor & HOD, MCA",
        "institution": "NEC"
      },
      {
        "name": "Mr.G.Mahesh Babu",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Assistant Professor",
        "institution": "NEC"
      },
      {
        "name": "Mr.G.J.Manikanta",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Assistant Professor",
        "institution": "NEC"
      },
      {
        "name": "Mr.D.Srikanth",
        "member_type": "INTERNAL_MEMBER",
        "designation": "Assistant Professor",
        "institution": "NEC"
      }
    ],
    "agenda": [
      {
        "itemNo": 1,
        "title": "Welcome and opening remarks by Chairman",
        "description": "Introductory address"
      },
      {
        "itemNo": 2,
        "title": "Discussion on R23 IV Year B.Tech (Cyber Security) Course Structure and Syllabus",
        "description": "Review of IV-I and IV-II curriculum"
      },
      {
        "itemNo": 3,
        "title": "Prescribed textbook recommendations for Ethical Hacking and Security",
        "description": "Reference materials"
      },
      {
        "itemNo": 4,
        "title": "Ratification and approval of Final Year Curriculum",
        "description": "Final adoption"
      }
    ],
    "resolutions": [
      "Adoption of university-prescribed R23 IV-Year course structure and syllabus for Cyber Security.",
      "Ethical Hacking textbook recommendations and modern reference editions ratified.",
      "Capstone project evaluation criteria and industry internship guidelines approved.",
      "R23 IV Year B.Tech Cyber Security course structure and syllabus approved."
    ],
    "documents": [
      {
        "id": "doc_bos_04",
        "title": "04_R23_4th_BoS_CYS_2026-02-21.pdf",
        "fileName": "04_R23_4th_BoS_CYS_2026-02-21.pdf",
        "url": "/documents/bos/cse-cys/04_R23_4th_BoS_CYS_2026-02-21.pdf",
        "fileSize": "2.4 MB",
        "documentType": "Signed Minutes & Syllabus"
      }
    ],
    "minutesPdfUrl": "/documents/bos/cse-cys/04_R23_4th_BoS_CYS_2026-02-21.pdf",
    "hasDocument": true,
    "isDeleted": false
  }
];
export const INITIAL_STUDENT_ACHIEVEMENTS = [
  {
    "id": "ach_001",
    "achievementNumber": "ACH-AIML-2026-0001",
    "rollNumber": "23471A4283",
    "studentName": "K. SUNANDA",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "TELEPORT SEASON3",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "TATA ELXSI",
    "organizingInstitute": "TATA ELXSI",
    "eventDate": "2026-06-15",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-15",
    "endDate": "2026-06-15"
  },
  {
    "id": "ach_002",
    "achievementNumber": "ACH-AIML-2026-0002",
    "rollNumber": "23471A4222",
    "studentName": "KAKARA LAVANYA",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "INTRODUCTION TO SOFT SKILLS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "TCS",
    "organizingInstitute": "TCS",
    "eventDate": "2026-06-18",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-11",
    "endDate": "2026-06-18"
  },
  {
    "id": "ach_003",
    "achievementNumber": "ACH-AIML-2026-0003",
    "rollNumber": "24471A4203",
    "studentName": "A. SAI TEJASWI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "DESIGN THINKING",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "INFOSYS",
    "organizingInstitute": "INFOSYS",
    "eventDate": "2026-01-05",
    "sourceDateSerial": 46027,
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-01-05",
    "endDate": "2026-01-05"
  },
  {
    "id": "ach_004",
    "achievementNumber": "ACH-AIML-2026-0004",
    "rollNumber": "23471A4224",
    "studentName": "K. DIVYA SRI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_005",
    "achievementNumber": "ACH-AIML-2026-0005",
    "rollNumber": "23471A4239",
    "studentName": "P. LAKSHMI SRINIDHI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_006",
    "achievementNumber": "ACH-AIML-2026-0006",
    "rollNumber": "23471A4240",
    "studentName": "P. LALITHANJALI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_007",
    "achievementNumber": "ACH-AIML-2026-0007",
    "rollNumber": "23471A4280",
    "studentName": "D. SUVARNA DEEPIKA",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_008",
    "achievementNumber": "ACH-AIML-2026-0008",
    "rollNumber": "23471A6140",
    "studentName": "SK. MEERAVALI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "INTRODUCTION TO PROMPTING",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "AMD AI ACADEMY",
    "organizingInstitute": "AMD AI ACADEMY",
    "eventDate": "2026-06-20",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-20",
    "endDate": "2026-06-20"
  },
  {
    "id": "ach_009",
    "achievementNumber": "ACH-AIML-2026-0009",
    "rollNumber": "23471A6140",
    "studentName": "SK. MEERAVALI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "INTRODUCTION TO QUANTIZATION",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "AMD AI ACADEMY",
    "organizingInstitute": "AMD AI ACADEMY",
    "eventDate": "2026-06-21",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-21",
    "endDate": "2026-06-21"
  },
  {
    "id": "ach_010",
    "achievementNumber": "ACH-AIML-2026-0010",
    "rollNumber": "23471A6140",
    "studentName": "SK. MEERAVALI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "INTRODUCTION TO AI AGENTS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "AMD AI ACADEMY",
    "organizingInstitute": "AMD AI ACADEMY",
    "eventDate": "2026-06-22",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-22",
    "endDate": "2026-06-22"
  },
  {
    "id": "ach_011",
    "achievementNumber": "ACH-AIML-2026-0011",
    "rollNumber": "23471A6140",
    "studentName": "SK. MEERAVALI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "INTRODUCTION TO AI ON AMD AI PC",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "AMD AI ACADEMY",
    "organizingInstitute": "AMD AI ACADEMY",
    "eventDate": "2026-06-23",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-23",
    "endDate": "2026-06-23"
  },
  {
    "id": "ach_012",
    "achievementNumber": "ACH-AIML-2026-0012",
    "rollNumber": "23471A6140",
    "studentName": "SK. MEERAVALI",
    "department": "AIML",
    "departmentCode": "AIML",
    "eventName": "INTRODUCTION TO LLM ARCHITECTURES AND AMD AI MODELS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "AMD AI ACADEMY",
    "organizingInstitute": "AMD AI ACADEMY",
    "eventDate": "2026-06-24",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-24",
    "endDate": "2026-06-24"
  },
  {
    "id": "ach_013",
    "achievementNumber": "ACH-CYS-2026-0001",
    "rollNumber": "23471A4610",
    "studentName": "G. BHAVYA SRI",
    "department": "CYS",
    "departmentCode": "CYS",
    "eventName": "TELIPORT SEASON 3",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "TATA ELXSI",
    "organizingInstitute": "TATA ELXSI",
    "eventDate": "2026-06-15",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-15",
    "endDate": "2026-06-15"
  },
  {
    "id": "ach_014",
    "achievementNumber": "ACH-DS-2026-0001",
    "rollNumber": "23471A4456",
    "studentName": "Y. SAI TANUSHA",
    "department": "DS",
    "departmentCode": "DS",
    "eventName": "TELIPORT SEASON 3",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "TATA ELAXSI",
    "organizingInstitute": "TATA ELAXSI",
    "eventDate": "2026-06-15",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-15",
    "endDate": "2026-06-15"
  },
  {
    "id": "ach_015",
    "achievementNumber": "ACH-DS-2026-0002",
    "rollNumber": "24471A4408",
    "studentName": "D. NARENDRA",
    "department": "DS",
    "departmentCode": "DS",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_016",
    "achievementNumber": "ACH-AI-2026-0001",
    "rollNumber": "23471A4313",
    "studentName": "D. DIVYA SRI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "HACKATHON-VIBE CODING",
    "achievementType": "Academic",
    "category": "Academic",
    "level": "State",
    "organizer": "TECHNOVA",
    "organizingInstitute": "TECHNOVA",
    "eventDate": "2026-03-06",
    "sourceDateSerial": 46087,
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-03-06",
    "endDate": "2026-03-06"
  },
  {
    "id": "ach_017",
    "achievementNumber": "ACH-AI-2026-0002",
    "rollNumber": "23471A4308",
    "studentName": "CH. MARUTHI SRINIVASA RAJU",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "TRADITIONAL",
    "achievementType": "Sports",
    "category": "Sports",
    "awardTitle": "2 nd Prize",
    "organizer": "YOGASANA SPORTS ASSOCIATION OF PALNADU DISTRICT",
    "organizingInstitute": "YOGASANA SPORTS ASSOCIATION OF PALNADU DISTRICT",
    "eventDate": "2026-05-07",
    "sourceDateSerial": 46149,
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "enrichmentNote": "Merged/enriched 2nd prize entry for roll 23471A4308",
    "startDate": "2026-05-07",
    "endDate": "2026-05-07"
  },
  {
    "id": "ach_018",
    "achievementNumber": "ACH-AI-2026-0003",
    "rollNumber": "24471A4365",
    "studentName": "T. SAI KRISHNA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "CERTIFIED LLM SECURITY EXPERT (CLLMSE)",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "RED TEAM LEADERS",
    "organizingInstitute": "RED TEAM LEADERS",
    "eventDate": "2026-07-21",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-07-21",
    "endDate": "2026-07-21"
  },
  {
    "id": "ach_019",
    "achievementNumber": "ACH-AI-2026-0004",
    "rollNumber": "23471A4325",
    "studentName": "K. RAJESWARI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_020",
    "achievementNumber": "ACH-AI-2026-0005",
    "rollNumber": "23471A4356",
    "studentName": "SK. NAGINA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_021",
    "achievementNumber": "ACH-AI-2026-0006",
    "rollNumber": "23471A4368",
    "studentName": "Y. VEERENDRA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_022",
    "achievementNumber": "ACH-AI-2026-0007",
    "rollNumber": "23471A4317",
    "studentName": "G. LAVANYA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_023",
    "achievementNumber": "ACH-AI-2026-0008",
    "rollNumber": "23471A4340",
    "studentName": "N. ASHOK VARDHAN",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_024",
    "achievementNumber": "ACH-AI-2026-0009",
    "rollNumber": "23471A4367",
    "studentName": "V. VENKATESWARLU",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_025",
    "achievementNumber": "ACH-AI-2026-0010",
    "rollNumber": "23471A4328",
    "studentName": "K. LAVNYA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "ADVANCED ROBOTICS WITH AI",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "HACK BOATS (NEC)",
    "organizingInstitute": "HACK BOATS (NEC)",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_026",
    "achievementNumber": "ACH-AI-2026-0011",
    "rollNumber": "24471A4302",
    "studentName": "A. UDAYA SRI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_027",
    "achievementNumber": "ACH-AI-2026-0012",
    "rollNumber": "24471A4303",
    "studentName": "A. RAJESH",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_028",
    "achievementNumber": "ACH-AI-2026-0013",
    "rollNumber": "24471A4312",
    "studentName": "D. MEGHANA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_029",
    "achievementNumber": "ACH-AI-2026-0014",
    "rollNumber": "24471A4316",
    "studentName": "G. LIKHITHA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_030",
    "achievementNumber": "ACH-AI-2026-0015",
    "rollNumber": "24471A4324",
    "studentName": "J. CHANDAN SAI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_031",
    "achievementNumber": "ACH-AI-2026-0016",
    "rollNumber": "24471A4326",
    "studentName": "K. SIREESHA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_032",
    "achievementNumber": "ACH-AI-2026-0017",
    "rollNumber": "24471A4342",
    "studentName": "P. NAGA PUSHPA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_033",
    "achievementNumber": "ACH-AI-2026-0018",
    "rollNumber": "24471A4358",
    "studentName": "SK. SUHANA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_034",
    "achievementNumber": "ACH-AI-2026-0019",
    "rollNumber": "24471A4359",
    "studentName": "S. HARIKA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_035",
    "achievementNumber": "ACH-AI-2026-0020",
    "rollNumber": "24471A4361",
    "studentName": "S. AKHILA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_036",
    "achievementNumber": "ACH-AI-2026-0021",
    "rollNumber": "24471A4363",
    "studentName": "S. SHOIAB AHMED",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_037",
    "achievementNumber": "ACH-AI-2026-0022",
    "rollNumber": "24471A4366",
    "studentName": "U. PAVANI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_038",
    "achievementNumber": "ACH-AI-2026-0023",
    "rollNumber": "24471A4370",
    "studentName": "Y. SAI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_039",
    "achievementNumber": "ACH-AI-2026-0024",
    "rollNumber": "24471A43B7",
    "studentName": "A. ANJALI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_040",
    "achievementNumber": "ACH-AI-2026-0025",
    "rollNumber": "24471A43BK",
    "studentName": "G. SRAVANI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_041",
    "achievementNumber": "ACH-AI-2026-0026",
    "rollNumber": "24471A43BU",
    "studentName": "K. SAI LAKSHMI SUVARNA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_042",
    "achievementNumber": "ACH-AI-2026-0027",
    "rollNumber": "24471A43BX",
    "studentName": "K. GEETHANJALI",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_043",
    "achievementNumber": "ACH-AI-2026-0028",
    "rollNumber": "24471A43CE",
    "studentName": "SK. G. AYESHA BEGAM",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_044",
    "achievementNumber": "ACH-AI-2026-0029",
    "rollNumber": "24471A43C7",
    "studentName": "P. VENKATA LAKSHMI NARASIMHA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_045",
    "achievementNumber": "ACH-AI-2026-0030",
    "rollNumber": "24471A43CP",
    "studentName": "T. BALA SUSHMA",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "END TO END DATA TOOLS AND AI APPLICATIONS",
    "achievementType": "Academic",
    "category": "Academic",
    "organizer": "FYNITY INNOVATIONS LLP",
    "organizingInstitute": "FYNITY INNOVATIONS LLP",
    "eventDate": "2026-07-04",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "startDate": "2026-06-29",
    "endDate": "2026-07-04"
  },
  {
    "id": "ach_046",
    "achievementNumber": "ACH-AI-2026-0031",
    "rollNumber": "23471A4308",
    "studentName": "CH. MARUTHI SRINIVASA RAJU",
    "department": "AI",
    "departmentCode": "AI",
    "eventName": "TRADITIONAL",
    "achievementType": "Sports",
    "category": "Sports",
    "organizer": "YOGASANA SPORTS ASSOCIATION OF PALNADU DISTRICT",
    "organizingInstitute": "YOGASANA SPORTS ASSOCIATION OF PALNADU DISTRICT",
    "eventDate": "2026-05-07",
    "sourceDateSerial": 46149,
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "isDeleted": false,
    "enrichmentNote": "Raw participation entry for roll 23471A4308",
    "startDate": "2026-05-07",
    "endDate": "2026-05-07"
  }
];
export const INITIAL_INTERNSHIPS = [];
export const INITIAL_PROJECTS = [];
export const INITIAL_FDPS = [];
export const INITIAL_FACULTY_ACHIEVEMENTS = [];
export const INITIAL_EVENTS = [
  {
    "id": "evt_001",
    "eventNumber": "EVT-ALL-2026-0001",
    "sourceNumber": 1,
    "title": "CODE-A-THON",
    "eventType": "Event",
    "targetYear": "III, IV",
    "audienceYears": "III, IV",
    "department": "AI, AIML, CYS, DS",
    "departmentCodes": "AI, AIML, CYS, DS",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "isMultiDept": true,
    "participantsTotal": 75,
    "venue": "3305 & 3427",
    "startDate": "2026-06-15",
    "endDate": null,
    "coordinatorName": "Mr.G.Mahesh Babu",
    "organizedBy": "TechnoElite, ISTE",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_002",
    "eventNumber": "EVT-DS-2026-0001",
    "sourceNumber": 2,
    "title": "Data Science Accelerator",
    "eventType": "Workshop",
    "targetYear": "III",
    "audienceYears": "III",
    "department": "DS",
    "departmentCodes": "DS",
    "targetDepartments": [
      "DS"
    ],
    "isMultiDept": false,
    "participantsTotal": 59,
    "venue": "3427",
    "startDate": "2026-06-22",
    "endDate": "2026-06-27",
    "coordinatorName": "P. Sardar Khan",
    "organizedBy": "TechnoElite, ISTE",
    "mouPartner": "Fynity",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_003",
    "eventNumber": "EVT-ALL-2026-0002",
    "sourceNumber": 3,
    "title": "Alumni Talk on Data Structures & Algorithms (DSA) and Placement Guidance",
    "eventType": "Seminar",
    "targetYear": "III, IV",
    "audienceYears": "III, IV",
    "department": "AI, AIML, CYS, DS",
    "departmentCodes": "AI, AIML, CYS, DS",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "isMultiDept": true,
    "participantsTotal": 64,
    "participantBreakdown": "Total 64, III=26, IV=38",
    "venue": "Tech Hub Seminar Hall",
    "startDate": "2026-06-22",
    "endDate": "2026-06-22",
    "coordinatorName": "P. Srinivasa Rao",
    "resourcePerson": "P. Srinivasa Rao",
    "organizedBy": "TechnoElite, ISTE",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_004",
    "eventNumber": "EVT-CYS-2026-0001",
    "sourceNumber": 4,
    "title": "Ethical Hacking",
    "eventType": "Workshop",
    "targetYear": "III",
    "audienceYears": "III",
    "department": "CYS",
    "departmentCodes": "CYS",
    "targetDepartments": [
      "CYS"
    ],
    "sourceDepartment": "CS",
    "needsMappingReview": true,
    "reviewNote": "Source specifies 'CS'; mapped to CYS (Cyber Security) per specialization scope",
    "isMultiDept": false,
    "participantsTotal": 51,
    "venue": "3427",
    "startDate": "2026-06-29",
    "endDate": "2026-07-04",
    "coordinatorName": "G.Nageswara Rao",
    "organizedBy": "TechnoElite, ISTE",
    "mouPartner": "Supraja Technologies",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_005",
    "eventNumber": "EVT-AIML-2026-0001",
    "sourceNumber": 5,
    "title": "AI Tools and Applications",
    "eventType": "Workshop",
    "targetYear": "III",
    "audienceYears": "III",
    "department": "AIML, AI",
    "departmentCodes": "AIML, AI",
    "targetDepartments": [
      "AIML",
      "AI"
    ],
    "isMultiDept": true,
    "participantsTotal": 59,
    "venue": "3305",
    "startDate": "2026-06-29",
    "endDate": "2026-07-04",
    "coordinatorName": "P.Solmon and N.Moulalil",
    "organizedBy": "TechnoElite, ISTE",
    "mouPartner": "Fynity",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_006",
    "eventNumber": "EVT-ALL-2026-0003",
    "sourceNumber": 47,
    "title": "Advanced Robotics With AI",
    "eventType": "Workshop",
    "targetYear": "III & IV",
    "audienceYears": "III & IV",
    "department": "ALL_ET",
    "departmentCodes": "NEEDS_MAPPING",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "needsMappingReview": true,
    "participantsTotal": 3,
    "participantBreakdown": "IV -3",
    "venue": null,
    "startDate": "2026-06-29",
    "endDate": "2026-01-07",
    "sourceEndDateSerial": 46029,
    "hasDateConflict": true,
    "dateConflictNote": "Raw Excel serial 46029 parses to 2026-01-07 which is before start date 2026-06-29; preserved with DATE_CONFLICT flag",
    "resourcePerson": "K. M Srinivas Rao, Founder and CVO / Robotics Research Engineer, Hackboats, Bangalore",
    "academicYear": "2026-27",
    "workflowStatus": "NEEDS_REVISION",
    "eventStatus": "PLANNED",
    "isDeleted": false
  },
  {
    "id": "evt_007",
    "eventNumber": "EVT-ALL-2026-0004",
    "sourceNumber": 6,
    "title": "Claude Architecture",
    "eventType": "Workshop",
    "targetYear": "IV",
    "audienceYears": "IV",
    "department": "AI, AIML, CYS, DS",
    "departmentCodes": "AI, AIML, CYS, DS",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "isMultiDept": true,
    "participantsTotal": 97,
    "venue": "3421",
    "startDate": "2026-02-07",
    "sourceStartDateSerial": 46060,
    "endDate": "2026-04-07",
    "sourceEndDateSerial": 46119,
    "resourcePerson": "S. PURNADITYA, Reliability Engineer, Cyient",
    "organizedBy": "TechnoElite, ISTE",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_008",
    "eventNumber": "EVT-ALL-2026-0005",
    "sourceNumber": 7,
    "title": "PowerBI",
    "eventType": "Workshop",
    "targetYear": "IV",
    "audienceYears": "IV",
    "department": "AI, AIML, CYS, DS",
    "departmentCodes": "AI, AIML, CYS, DS",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "isMultiDept": true,
    "participantsTotal": 98,
    "venue": "1206",
    "startDate": "2026-07-13",
    "endDate": "2026-07-18",
    "resourcePerson": "Bhavani Sankar, Power BI Developer, TCS HYD",
    "organizedBy": "TechnoElite, ISTE",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_009",
    "eventNumber": "EVT-ALL-2026-0006",
    "sourceNumber": 8,
    "title": "Microsoft Fabric",
    "eventType": "Workshop",
    "targetYear": "IV",
    "audienceYears": "IV",
    "department": "AI, AIML, CYS, DS",
    "departmentCodes": "AI, AIML, CYS, DS",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "isMultiDept": true,
    "participantsTotal": 110,
    "venue": "3421",
    "startDate": "2026-10-07",
    "sourceStartDateSerial": 46302,
    "endDate": "2026-07-25",
    "hasDateConflict": true,
    "dateConflictNote": "Start serial 46302 = 2026-10-07 while textual end is 25-07-2026; preserved with DATE_CONFLICT flag",
    "resourcePerson": "SK.Abdul Khadar, Technology Lead, Infosys",
    "mouPartner": "Fynity",
    "academicYear": "2026-27",
    "workflowStatus": "NEEDS_REVISION",
    "eventStatus": "PLANNED",
    "isDeleted": false
  },
  {
    "id": "evt_010",
    "eventNumber": "EVT-ALL-2026-0007",
    "sourceNumber": 9,
    "title": "Flutter Development",
    "eventType": "Seminar",
    "targetYear": "III",
    "audienceYears": "III",
    "department": "AI, AIML, CYS, DS",
    "departmentCodes": "AI, AIML, CYS, DS",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "isMultiDept": true,
    "participantsTotal": 127,
    "venue": "Block3 Seminar Hall",
    "startDate": "2026-01-08",
    "sourceStartDateSerial": 46030,
    "endDate": null,
    "resourcePerson": "SK.Rehaman, Mobile App Development Team Lead, innologic Technologies, HYD",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_011",
    "eventNumber": "EVT-ALL-2026-0008",
    "sourceNumber": 10,
    "title": "Vibe Coding",
    "eventType": "Bootcamp & Hackathon",
    "targetYear": "II",
    "audienceYears": "II",
    "department": "AI, AIML, CYS, DS",
    "departmentCodes": "AI, AIML, CYS, DS",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "isMultiDept": true,
    "participantsTotal": 196,
    "venue": "3305",
    "startDate": "2026-06-08",
    "sourceStartDateSerial": 46181,
    "endDate": "2026-07-08",
    "sourceEndDateSerial": 46211,
    "resourcePerson": "Mr.Noorbhasha Moulali",
    "organizedBy": "TechnoElite, ISTE",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_012",
    "eventNumber": "EVT-ALL-2026-0009",
    "sourceNumber": 11,
    "title": "Robotics",
    "eventType": "Workshop",
    "targetYear": "IV",
    "audienceYears": "IV",
    "department": "ALL_ET",
    "departmentCodes": "NEEDS_MAPPING",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "needsMappingReview": true,
    "participantsTotal": 93,
    "venue": null,
    "startDate": "2026-06-29",
    "endDate": "2026-01-07",
    "sourceEndDateSerial": 46029,
    "hasDateConflict": true,
    "dateConflictNote": "End date serial 46029 produces 2026-01-07 before start date 2026-06-29",
    "resourcePerson": "K.M Srinivasa Rao, Hackboats, Bangalore",
    "academicYear": "2026-27",
    "workflowStatus": "NEEDS_REVISION",
    "eventStatus": "PLANNED",
    "isDeleted": false
  },
  {
    "id": "evt_013",
    "eventNumber": "EVT-AI-2026-0001",
    "sourceNumber": 12,
    "title": "End To End Data Tools and AI Application Tools",
    "eventType": "Workshop",
    "targetYear": "III",
    "audienceYears": "III",
    "department": "AI",
    "departmentCodes": "AI",
    "targetDepartments": [
      "AI"
    ],
    "participantsTotal": 115,
    "participantBreakdown": "III- AI - 115",
    "venue": "3305",
    "startDate": "2026-06-29",
    "endDate": "2026-04-07",
    "sourceEndDateSerial": 46119,
    "hasDateConflict": true,
    "dateConflictNote": "End serial 46119 (2026-04-07) is before start date 2026-06-29; participant text explicitly notes AI",
    "resourcePerson": "SK.Abdul Khadar, Technology Lead, Infosys",
    "mouPartner": "Fynity",
    "academicYear": "2026-27",
    "workflowStatus": "NEEDS_REVISION",
    "eventStatus": "PLANNED",
    "isDeleted": false
  },
  {
    "id": "evt_014",
    "eventNumber": "EVT-AI-AIML-2026-0001",
    "sourceNumber": 13,
    "title": "Git &Git Hub Technologies",
    "eventType": "Seminar",
    "targetYear": "II & III",
    "audienceYears": "II & III",
    "department": "AI, AIML",
    "departmentCodes": "AI, AIML",
    "targetDepartments": [
      "AI",
      "AIML"
    ],
    "isMultiDept": true,
    "participantsTotal": 20,
    "participantBreakdown": "II & III- AI- 15, AIML- 5",
    "venue": null,
    "startDate": "2026-07-17",
    "endDate": "2026-07-17",
    "resourcePerson": "G.Mahesh Babu, Assistant Professor, NEC",
    "academicYear": "2026-27",
    "workflowStatus": "APPROVED",
    "eventStatus": "COMPLETED",
    "isDeleted": false
  },
  {
    "id": "evt_015",
    "eventNumber": "EVT-ALL-2026-0010",
    "sourceNumber": 14,
    "title": "Swetcah Orientation Program",
    "eventType": "Seminar",
    "targetYear": "II",
    "audienceYears": "II",
    "department": "ALL_ET",
    "departmentCodes": "NEEDS_MAPPING",
    "targetDepartments": [
      "AI",
      "AIML",
      "CYS",
      "DS"
    ],
    "needsMappingReview": true,
    "participantsTotal": null,
    "venue": null,
    "startDate": "2026-08-08",
    "sourceStartDateSerial": 46242,
    "endDate": null,
    "resourcePerson": "MS. CH.Naga Malleswari, Full Stack Developer, Swetcha",
    "titlePreservedNote": "Title 'Swetcah Orientation Program' retained exactly as spelled in source",
    "academicYear": "2026-27",
    "workflowStatus": "NEEDS_REVISION",
    "eventStatus": "PLANNED",
    "isDeleted": false
  }
];
export const INITIAL_MEMBERSHIPS = [];
export const INITIAL_MOUS = [];
export const INITIAL_NPTEL = [];
export const INITIAL_PLACEMENT_STATS = [];
export const INITIAL_PLACEMENT_RECORDS = [];
export const INITIAL_PLACEMENTS = [
  {
    "id": "plc_001",
    "studentRoll": "22471A4251",
    "studentName": "TATA KARTHESHA",
    "department": "AIML",
    "companyName": "APMOSYS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 1
  },
  {
    "id": "plc_002",
    "studentRoll": "22471A4633",
    "studentName": "NANDIPATI PUJITHA",
    "department": "CYS",
    "companyName": "APMOSYS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 2
  },
  {
    "id": "plc_003",
    "studentRoll": "22471A4436",
    "studentName": "MEDA NAVA DURGA",
    "department": "DS",
    "companyName": "TECHNOPARIN SOFT",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 3
  },
  {
    "id": "plc_004",
    "studentRoll": "22471A4633",
    "studentName": "NANDIPATI PUJITHA",
    "department": "CYS",
    "companyName": "TECHNOPARIN SOFT",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 4
  },
  {
    "id": "plc_005",
    "studentRoll": "22471A4212",
    "studentName": "JALADI RICHARD MARK",
    "department": "AIML",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 5
  },
  {
    "id": "plc_006",
    "studentRoll": "22471A4420",
    "studentName": "GADE HEMA SARANYA",
    "department": "AIML",
    "sourceDepartment": "AIML",
    "departmentConflict": true,
    "conflictNote": "Appears as AIML in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 6
  },
  {
    "id": "plc_007",
    "studentRoll": "22471A4427",
    "studentName": "KANDIMALLA VENKATA SAI BHARATH",
    "department": "CYS",
    "sourceDepartment": "CYS",
    "departmentConflict": true,
    "conflictNote": "Appears as CYS in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 7
  },
  {
    "id": "plc_008",
    "studentRoll": "22471A4614",
    "studentName": "GHANTASALA V.N.L.S.SATYA GANESH",
    "department": "CYS",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 8
  },
  {
    "id": "plc_009",
    "studentRoll": "22471A4642",
    "studentName": "SOMEPALLI PUJITHA",
    "department": "CYS",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 9
  },
  {
    "id": "plc_010",
    "studentRoll": "22471A4251",
    "studentName": "TATA KARTHESHA",
    "department": "AIML",
    "companyName": "SUTHERLAND GLOBAL",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 10
  },
  {
    "id": "plc_011",
    "studentRoll": "22471A4458",
    "studentName": "GUGGILAM SHANMUKHA SAMBASIVA RAO",
    "department": "DS",
    "companyName": "SUTHERLAND GLOBAL",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 11
  },
  {
    "id": "plc_012",
    "studentRoll": "22471A4201",
    "studentName": "AVANIGADDA BHAGYA SREELAKSHMI",
    "department": "AIML",
    "companyName": "INFOSYS",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 12
  },
  {
    "id": "plc_013",
    "studentRoll": "22471A4228",
    "studentName": "MARKAPURAM KAVYA",
    "department": "AIML",
    "companyName": "INFOSYS",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 13
  },
  {
    "id": "plc_014",
    "studentRoll": "22471A4401",
    "studentName": "AKKALA SRIVALLI",
    "department": "DS",
    "companyName": "INFOSYS",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 14
  },
  {
    "id": "plc_015",
    "studentRoll": "22471A4216",
    "studentName": "KAPUGANTI YASWANTH GUPTHA",
    "department": "AIML",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 15
  },
  {
    "id": "plc_016",
    "studentRoll": "22471A4407",
    "studentName": "BODANAPU VENKATA PRASANTH REDDY",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 16
  },
  {
    "id": "plc_017",
    "studentRoll": "22471A4425",
    "studentName": "KAJA HARSHITHA NAGA KUTUMBAM",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 17
  },
  {
    "id": "plc_018",
    "studentRoll": "22471A4432",
    "studentName": "MADDI CHIDANANDA DEDEEPYA",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 18
  },
  {
    "id": "plc_019",
    "studentRoll": "22471A4446",
    "studentName": "SHAIK ISHRATH BANU",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 19
  },
  {
    "id": "plc_020",
    "studentRoll": "22471A4642",
    "studentName": "SOMEPALLI PUJITHA",
    "department": "CYS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 20
  },
  {
    "id": "plc_021",
    "studentRoll": "22471A4612",
    "studentName": "DEVU BALA BRAHMAJI",
    "department": "CYS",
    "companyName": "CONGNISYS AI",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "Off Campus",
    "offerType": "Off Campus",
    "status": "PLACED",
    "sourceRow": 21
  },
  {
    "id": "plc_022",
    "studentRoll": "22471A4630",
    "studentName": "LINGAMALLU VASU DEVA SIVA SAI SUBBARAO",
    "department": "CYS",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 22
  },
  {
    "id": "plc_023",
    "studentRoll": "22471A4239",
    "studentName": "Patan Sadhik",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 23
  },
  {
    "id": "plc_024",
    "studentRoll": "22471A4247",
    "studentName": "S.Koteswara Rao",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 24
  },
  {
    "id": "plc_025",
    "studentRoll": "22471A4222",
    "studentName": "K.Karthik",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 25
  },
  {
    "id": "plc_026",
    "studentRoll": "22471A4416",
    "studentName": "K.Yaswanth Guptha",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": null,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 26,
    "note": "Package unstated in source"
  },
  {
    "id": "plc_027",
    "studentRoll": "22471A4436",
    "studentName": "Nava Durga Meda",
    "department": "DS",
    "companyName": "PIVOX",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 27
  },
  {
    "id": "plc_028",
    "studentRoll": "22471A4642",
    "studentName": "S.Poojitha",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 28
  },
  {
    "id": "plc_029",
    "studentRoll": "22471A4627",
    "studentName": "K.Yamini Niharika",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 29
  },
  {
    "id": "plc_030",
    "studentRoll": "22471A4618",
    "studentName": "J.Aamuktha",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 30
  },
  {
    "id": "plc_031",
    "studentRoll": "22471A4611",
    "studentName": "Ch.Prasadu",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 31
  },
  {
    "id": "plc_032",
    "studentRoll": "22471A4639",
    "studentName": "R.Manoj Kumar",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 32
  },
  {
    "id": "plc_033",
    "studentRoll": "22471A4645",
    "studentName": "U.Srinivas",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 33
  },
  {
    "id": "plc_034",
    "studentRoll": "22471A4626",
    "studentName": "K.Sai Kumar",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 34
  },
  {
    "id": "plc_035",
    "studentRoll": "22471A4205",
    "studentName": "Ram Sai Manikanta Guru Kalyan Devisetti",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 35
  },
  {
    "id": "plc_036",
    "studentRoll": "22471A4209",
    "studentName": "Vinay Kumar Guddati",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 36
  },
  {
    "id": "plc_037",
    "studentRoll": "22471A4212",
    "studentName": "Richard Mark Jaladi",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 37
  },
  {
    "id": "plc_038",
    "studentRoll": "22471A4213",
    "studentName": "Pujitha Jetti",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 38
  },
  {
    "id": "plc_039",
    "studentRoll": "22471A4216",
    "studentName": "Yaswanth Guptha Kapuganti",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 39
  },
  {
    "id": "plc_040",
    "studentRoll": "22471A4231",
    "studentName": "Sai Srija Mundru",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 40
  },
  {
    "id": "plc_041",
    "studentRoll": "22471A4234",
    "studentName": "Srinuvasa Rao Nakaraboina",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 41
  },
  {
    "id": "plc_042",
    "studentRoll": "22471A4236",
    "studentName": "Gopi Sankar Nelluri",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 42
  },
  {
    "id": "plc_043",
    "studentRoll": "22471A4241",
    "studentName": "Fayaz Shaik",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 43
  },
  {
    "id": "plc_044",
    "studentRoll": "22471A4402",
    "studentName": "Swathi Angadala",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 44
  },
  {
    "id": "plc_045",
    "studentRoll": "22471A4407",
    "studentName": "Venkata Prasanth Reddy Bodanapu",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 45
  },
  {
    "id": "plc_046",
    "studentRoll": "22471A4420",
    "studentName": "Hema Saranya Gade",
    "department": "DS",
    "sourceDepartment": "DS",
    "departmentConflict": true,
    "conflictNote": "Appears as AIML in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 46
  },
  {
    "id": "plc_047",
    "studentRoll": "22471A4426",
    "studentName": "Srinivasa Reddy Kandi",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 47
  },
  {
    "id": "plc_048",
    "studentRoll": "22471A4427",
    "studentName": "Venkata Sai Bharath Kandimalla",
    "department": "DS",
    "sourceDepartment": "DS",
    "departmentConflict": true,
    "conflictNote": "Appears as CYS in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 48
  },
  {
    "id": "plc_049",
    "studentRoll": "22471A4434",
    "studentName": "Venkata Yaswanth Maram",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 49
  },
  {
    "id": "plc_050",
    "studentRoll": "22471A4436",
    "studentName": "Nava Durga Meda",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 50
  },
  {
    "id": "plc_051",
    "studentRoll": "22471A4446",
    "studentName": "Ishrath Banu Shaik",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 51
  },
  {
    "id": "plc_052",
    "studentRoll": "22471A4611",
    "studentName": "Prasadu Chukka",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 52
  },
  {
    "id": "plc_053",
    "studentRoll": "22471A4613",
    "studentName": "Ganesh Bharathvaj Divvela",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 53
  },
  {
    "id": "plc_054",
    "studentRoll": "22471A4618",
    "studentName": "Aamuktha Jampana",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 54
  },
  {
    "id": "plc_055",
    "studentRoll": "22471A4627",
    "studentName": "Yamini Niharika Konatham",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 55
  },
  {
    "id": "plc_056",
    "studentRoll": "22471A4642",
    "studentName": "Pujitha Somepalli",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 56
  },
  {
    "id": "plc_057",
    "studentRoll": "22471A4208",
    "studentName": "Siva Dhanush Naidu Gandham",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 57
  },
  {
    "id": "plc_058",
    "studentRoll": "22471A4241",
    "studentName": "Fayaz Shaik",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "DUPLICATE_CANDIDATE",
    "sourceRow": 58,
    "isDuplicateCandidate": true,
    "duplicateNote": "Repeated identical row for 22471A4241 Fayaz Shaik in SAVANTIS SOLUTIONS"
  },
  {
    "id": "plc_059",
    "studentRoll": "22471A4425",
    "studentName": "Harshita Naga Kutumbam Kaja",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 59
  },
  {
    "id": "plc_060",
    "studentRoll": "22471A4432",
    "studentName": "Chidananda Deedepya Maddi",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 60
  },
  {
    "id": "plc_061",
    "studentRoll": "22471A4458",
    "studentName": "Shanmukha Sambasiva Rao Guggilam",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 61
  },
  {
    "id": "plc_062",
    "studentRoll": "22471A4616",
    "studentName": "Venkatswaralu Gudipati",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 62
  },
  {
    "id": "plc_063",
    "studentRoll": "22471A4643",
    "studentName": "Rama Krishna Reddy Syamala",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 63
  }
];
export const INITIAL_EXAM_NOTIFICATIONS = [];
export const INITIAL_NEWS = [];
export const INITIAL_STUDENTS = [];
export const INITIAL_STUDENT_GUARDIANS = [];
export const INITIAL_ATTENDANCE_SNAPSHOTS = [];
export const INITIAL_ATTENDANCE_ALERTS = [];
export const INITIAL_ATTENDANCE_PARENT_CONTACTS = [];

export const INITIAL_CAMPUS_PLACEMENTS = [
  {
    "id": "plc_001",
    "studentRoll": "22471A4251",
    "studentName": "TATA KARTHESHA",
    "department": "AIML",
    "companyName": "APMOSYS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 1
  },
  {
    "id": "plc_002",
    "studentRoll": "22471A4633",
    "studentName": "NANDIPATI PUJITHA",
    "department": "CYS",
    "companyName": "APMOSYS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 2
  },
  {
    "id": "plc_003",
    "studentRoll": "22471A4436",
    "studentName": "MEDA NAVA DURGA",
    "department": "DS",
    "companyName": "TECHNOPARIN SOFT",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 3
  },
  {
    "id": "plc_004",
    "studentRoll": "22471A4633",
    "studentName": "NANDIPATI PUJITHA",
    "department": "CYS",
    "companyName": "TECHNOPARIN SOFT",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 4
  },
  {
    "id": "plc_005",
    "studentRoll": "22471A4212",
    "studentName": "JALADI RICHARD MARK",
    "department": "AIML",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 5
  },
  {
    "id": "plc_006",
    "studentRoll": "22471A4420",
    "studentName": "GADE HEMA SARANYA",
    "department": "AIML",
    "sourceDepartment": "AIML",
    "departmentConflict": true,
    "conflictNote": "Appears as AIML in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 6
  },
  {
    "id": "plc_007",
    "studentRoll": "22471A4427",
    "studentName": "KANDIMALLA VENKATA SAI BHARATH",
    "department": "CYS",
    "sourceDepartment": "CYS",
    "departmentConflict": true,
    "conflictNote": "Appears as CYS in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 7
  },
  {
    "id": "plc_008",
    "studentRoll": "22471A4614",
    "studentName": "GHANTASALA V.N.L.S.SATYA GANESH",
    "department": "CYS",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 8
  },
  {
    "id": "plc_009",
    "studentRoll": "22471A4642",
    "studentName": "SOMEPALLI PUJITHA",
    "department": "CYS",
    "companyName": "W3 GLOBAL",
    "packageLpa": 4.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 9
  },
  {
    "id": "plc_010",
    "studentRoll": "22471A4251",
    "studentName": "TATA KARTHESHA",
    "department": "AIML",
    "companyName": "SUTHERLAND GLOBAL",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 10
  },
  {
    "id": "plc_011",
    "studentRoll": "22471A4458",
    "studentName": "GUGGILAM SHANMUKHA SAMBASIVA RAO",
    "department": "DS",
    "companyName": "SUTHERLAND GLOBAL",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 11
  },
  {
    "id": "plc_012",
    "studentRoll": "22471A4201",
    "studentName": "AVANIGADDA BHAGYA SREELAKSHMI",
    "department": "AIML",
    "companyName": "INFOSYS",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 12
  },
  {
    "id": "plc_013",
    "studentRoll": "22471A4228",
    "studentName": "MARKAPURAM KAVYA",
    "department": "AIML",
    "companyName": "INFOSYS",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 13
  },
  {
    "id": "plc_014",
    "studentRoll": "22471A4401",
    "studentName": "AKKALA SRIVALLI",
    "department": "DS",
    "companyName": "INFOSYS",
    "packageLpa": 3.6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 14
  },
  {
    "id": "plc_015",
    "studentRoll": "22471A4216",
    "studentName": "KAPUGANTI YASWANTH GUPTHA",
    "department": "AIML",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 15
  },
  {
    "id": "plc_016",
    "studentRoll": "22471A4407",
    "studentName": "BODANAPU VENKATA PRASANTH REDDY",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 16
  },
  {
    "id": "plc_017",
    "studentRoll": "22471A4425",
    "studentName": "KAJA HARSHITHA NAGA KUTUMBAM",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 17
  },
  {
    "id": "plc_018",
    "studentRoll": "22471A4432",
    "studentName": "MADDI CHIDANANDA DEDEEPYA",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 18
  },
  {
    "id": "plc_019",
    "studentRoll": "22471A4446",
    "studentName": "SHAIK ISHRATH BANU",
    "department": "DS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 19
  },
  {
    "id": "plc_020",
    "studentRoll": "22471A4642",
    "studentName": "SOMEPALLI PUJITHA",
    "department": "CYS",
    "companyName": "RINUX TECHNOLOGIES",
    "packageLpa": 5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 20
  },
  {
    "id": "plc_021",
    "studentRoll": "22471A4612",
    "studentName": "DEVU BALA BRAHMAJI",
    "department": "CYS",
    "companyName": "CONGNISYS AI",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "Off Campus",
    "offerType": "Off Campus",
    "status": "PLACED",
    "sourceRow": 21
  },
  {
    "id": "plc_022",
    "studentRoll": "22471A4630",
    "studentName": "LINGAMALLU VASU DEVA SIVA SAI SUBBARAO",
    "department": "CYS",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 22
  },
  {
    "id": "plc_023",
    "studentRoll": "22471A4239",
    "studentName": "Patan Sadhik",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 23
  },
  {
    "id": "plc_024",
    "studentRoll": "22471A4247",
    "studentName": "S.Koteswara Rao",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 24
  },
  {
    "id": "plc_025",
    "studentRoll": "22471A4222",
    "studentName": "K.Karthik",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": 3.5,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 25
  },
  {
    "id": "plc_026",
    "studentRoll": "22471A4416",
    "studentName": "K.Yaswanth Guptha",
    "department": "AIML",
    "companyName": "TCS",
    "packageLpa": null,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 26,
    "note": "Package unstated in source"
  },
  {
    "id": "plc_027",
    "studentRoll": "22471A4436",
    "studentName": "Nava Durga Meda",
    "department": "DS",
    "companyName": "PIVOX",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 27
  },
  {
    "id": "plc_028",
    "studentRoll": "22471A4642",
    "studentName": "S.Poojitha",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 28
  },
  {
    "id": "plc_029",
    "studentRoll": "22471A4627",
    "studentName": "K.Yamini Niharika",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 29
  },
  {
    "id": "plc_030",
    "studentRoll": "22471A4618",
    "studentName": "J.Aamuktha",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 30
  },
  {
    "id": "plc_031",
    "studentRoll": "22471A4611",
    "studentName": "Ch.Prasadu",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 31
  },
  {
    "id": "plc_032",
    "studentRoll": "22471A4639",
    "studentName": "R.Manoj Kumar",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 32
  },
  {
    "id": "plc_033",
    "studentRoll": "22471A4645",
    "studentName": "U.Srinivas",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 33
  },
  {
    "id": "plc_034",
    "studentRoll": "22471A4626",
    "studentName": "K.Sai Kumar",
    "department": "CYS",
    "companyName": "HCL",
    "packageLpa": 6,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 34
  },
  {
    "id": "plc_035",
    "studentRoll": "22471A4205",
    "studentName": "Ram Sai Manikanta Guru Kalyan Devisetti",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 35
  },
  {
    "id": "plc_036",
    "studentRoll": "22471A4209",
    "studentName": "Vinay Kumar Guddati",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 36
  },
  {
    "id": "plc_037",
    "studentRoll": "22471A4212",
    "studentName": "Richard Mark Jaladi",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 37
  },
  {
    "id": "plc_038",
    "studentRoll": "22471A4213",
    "studentName": "Pujitha Jetti",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 38
  },
  {
    "id": "plc_039",
    "studentRoll": "22471A4216",
    "studentName": "Yaswanth Guptha Kapuganti",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 39
  },
  {
    "id": "plc_040",
    "studentRoll": "22471A4231",
    "studentName": "Sai Srija Mundru",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 40
  },
  {
    "id": "plc_041",
    "studentRoll": "22471A4234",
    "studentName": "Srinuvasa Rao Nakaraboina",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 41
  },
  {
    "id": "plc_042",
    "studentRoll": "22471A4236",
    "studentName": "Gopi Sankar Nelluri",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 42
  },
  {
    "id": "plc_043",
    "studentRoll": "22471A4241",
    "studentName": "Fayaz Shaik",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 43
  },
  {
    "id": "plc_044",
    "studentRoll": "22471A4402",
    "studentName": "Swathi Angadala",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 44
  },
  {
    "id": "plc_045",
    "studentRoll": "22471A4407",
    "studentName": "Venkata Prasanth Reddy Bodanapu",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 45
  },
  {
    "id": "plc_046",
    "studentRoll": "22471A4420",
    "studentName": "Hema Saranya Gade",
    "department": "DS",
    "sourceDepartment": "DS",
    "departmentConflict": true,
    "conflictNote": "Appears as AIML in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 46
  },
  {
    "id": "plc_047",
    "studentRoll": "22471A4426",
    "studentName": "Srinivasa Reddy Kandi",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 47
  },
  {
    "id": "plc_048",
    "studentRoll": "22471A4427",
    "studentName": "Venkata Sai Bharath Kandimalla",
    "department": "DS",
    "sourceDepartment": "DS",
    "departmentConflict": true,
    "conflictNote": "Appears as CYS in W3 GLOBAL row and DS in SAVANTIS SOLUTIONS row",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "NEEDS_REVIEW",
    "sourceRow": 48
  },
  {
    "id": "plc_049",
    "studentRoll": "22471A4434",
    "studentName": "Venkata Yaswanth Maram",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 49
  },
  {
    "id": "plc_050",
    "studentRoll": "22471A4436",
    "studentName": "Nava Durga Meda",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 50
  },
  {
    "id": "plc_051",
    "studentRoll": "22471A4446",
    "studentName": "Ishrath Banu Shaik",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 51
  },
  {
    "id": "plc_052",
    "studentRoll": "22471A4611",
    "studentName": "Prasadu Chukka",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 52
  },
  {
    "id": "plc_053",
    "studentRoll": "22471A4613",
    "studentName": "Ganesh Bharathvaj Divvela",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 53
  },
  {
    "id": "plc_054",
    "studentRoll": "22471A4618",
    "studentName": "Aamuktha Jampana",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 54
  },
  {
    "id": "plc_055",
    "studentRoll": "22471A4627",
    "studentName": "Yamini Niharika Konatham",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 55
  },
  {
    "id": "plc_056",
    "studentRoll": "22471A4642",
    "studentName": "Pujitha Somepalli",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 56
  },
  {
    "id": "plc_057",
    "studentRoll": "22471A4208",
    "studentName": "Siva Dhanush Naidu Gandham",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 57
  },
  {
    "id": "plc_058",
    "studentRoll": "22471A4241",
    "studentName": "Fayaz Shaik",
    "department": "AIML",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "DUPLICATE_CANDIDATE",
    "sourceRow": 58,
    "isDuplicateCandidate": true,
    "duplicateNote": "Repeated identical row for 22471A4241 Fayaz Shaik in SAVANTIS SOLUTIONS"
  },
  {
    "id": "plc_059",
    "studentRoll": "22471A4425",
    "studentName": "Harshita Naga Kutumbam Kaja",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 59
  },
  {
    "id": "plc_060",
    "studentRoll": "22471A4432",
    "studentName": "Chidananda Deedepya Maddi",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 60
  },
  {
    "id": "plc_061",
    "studentRoll": "22471A4458",
    "studentName": "Shanmukha Sambasiva Rao Guggilam",
    "department": "DS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 61
  },
  {
    "id": "plc_062",
    "studentRoll": "22471A4616",
    "studentName": "Venkatswaralu Gudipati",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 62
  },
  {
    "id": "plc_063",
    "studentRoll": "22471A4643",
    "studentName": "Rama Krishna Reddy Syamala",
    "department": "CYS",
    "companyName": "SAVANTIS SOLUTIONS",
    "packageLpa": 3,
    "academicYear": "2025-2026",
    "campusType": "On Campus",
    "offerType": "On Campus",
    "status": "PLACED",
    "sourceRow": 63
  }
];
