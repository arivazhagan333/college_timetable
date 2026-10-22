import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Faculty from '../models/Faculty.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import Allocation from '../models/Allocation.js';
import Setting from '../models/Setting.js';
import Timetable from '../models/Timetable.js';
import AuditLog from '../models/AuditLog.js';
import TimetableHistory from '../models/TimetableHistory.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    await Class.deleteMany({});
    await Allocation.deleteMany({});
    await Setting.deleteMany({});
    await Timetable.deleteMany({});
    await AuditLog.deleteMany({});
    await TimetableHistory.deleteMany({});

    console.log('Database cleared.');

    // 1. Seed Settings
    const settings = [
      { key: 'workingDays', value: 6, description: 'Number of working days per week' },
      { key: 'periodsPerDay', value: 5, description: 'Number of periods per day' },
      { key: 'periodDuration', value: 1, description: 'Period duration in hours' },
      { key: 'regularStaffHours', value: 16, description: 'Required weekly hours for regular faculty' },
      { key: 'hodStaffHours', value: 12, description: 'Required weekly hours for HOD' },
      { key: 'noConsecutivePeriods', value: true, description: 'Enforce no consecutive teaching periods rule' },
      { key: 'academicYear', value: '2026-2027', description: 'Current Academic Year' },
      { key: 'semester', value: 'Odd', description: 'Current Semester' },
      { key: 'departments', value: ['Mathematics'], description: 'List of departments' },
      { key: 'mediums', value: ['E/M', 'T/M', 'Other'], description: 'List of mediums' }
    ];
    await Setting.insertMany(settings);
    console.log('Settings seeded.');

    // 2. Seed Classes
    const classData = [
      { name: 'I M.Sc', department: 'Mathematics', program: 'M.Sc Mathematics', year: 'I', medium: 'English', type: 'Primary', roomNumber: '3' },
      { name: 'II M.Sc', department: 'Mathematics', program: 'M.Sc Mathematics', year: 'II', medium: 'English', type: 'Primary', roomNumber: '17' },
      { name: 'I B.Sc E/M', department: 'Mathematics', program: 'B.Sc Mathematics', year: 'I', medium: 'English', type: 'Primary', roomNumber: '20' },
      { name: 'I B.Sc T/M', department: 'Mathematics', program: 'B.Sc Mathematics', year: 'I', medium: 'Tamil', type: 'Primary', roomNumber: '19' },
      { name: 'II B.Sc E/M', department: 'Mathematics', program: 'B.Sc Mathematics', year: 'II', medium: 'English', type: 'Primary', roomNumber: '4' },
      { name: 'II B.Sc T/M', department: 'Mathematics', program: 'B.Sc Mathematics', year: 'II', medium: 'Tamil', type: 'Primary', roomNumber: '5' },
      { name: 'III B.Sc E/M', department: 'Mathematics', program: 'B.Sc Mathematics', year: 'III', medium: 'English', type: 'Primary', roomNumber: '18' },
      { name: 'III B.Sc T/M', department: 'Mathematics', program: 'B.Sc Mathematics', year: 'III', medium: 'Tamil', type: 'Primary', roomNumber: '15' },
      
      // Allied Classes
      { name: 'STATISTICS', department: 'Statistics', program: 'Allied', year: 'Allied', medium: 'Other', type: 'Allied' },
      { name: 'PHYSICS (T/M)', department: 'Physics', program: 'Allied', year: 'Allied', medium: 'Tamil', type: 'Allied' },
      { name: 'CHEMISTRY (E/M ,T/M)', department: 'Chemistry', program: 'Allied', year: 'Allied', medium: 'Other', type: 'Allied' },
      { name: 'M.Sc (CS)', department: 'Computer Science', program: 'Allied', year: 'Allied', medium: 'Other', type: 'Allied' },
      { name: 'PHYSICS (E/M)', department: 'Physics', program: 'Allied', year: 'Allied', medium: 'English', type: 'Allied' },
      { name: 'GEOLOGY', department: 'Geology', program: 'Allied', year: 'Allied', medium: 'Other', type: 'Allied' },
      { name: 'MCA', department: 'Computer Science', program: 'Allied', year: 'Allied', medium: 'Other', type: 'Allied' },
      { name: 'ALLIED PHYSICS E/M', department: 'Physics', program: 'Allied', year: 'Allied', medium: 'English', type: 'Allied' },
      { name: 'BCA', department: 'Computer Science', program: 'Allied', year: 'Allied', medium: 'Other', type: 'Allied' },
      { name: 'COMPUTER SCIENCE', department: 'Computer Science', program: 'Allied', year: 'Allied', medium: 'Other', type: 'Allied' }
    ];
    const classes = await Class.insertMany(classData);
    console.log('Classes seeded.');

    // Map class names to Class IDs
    const classMap = {};
    classes.forEach(c => {
      classMap[c.name] = c._id;
    });

    // 3. Seed Faculty
    const facultyData = [
      { staffId: 'ADMIN_MOHAN', name: 'Mohan', shortName: 'Mohan', phone: '8072223992', email: 'mohan@gacsalem.edu.in', designation: 'Super Administrator', role: 'Super Admin', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC001', name: 'Dr. A. Murugesan', shortName: 'AM', phone: '9443212341', email: 'murugesan@gacsalem.edu.in', designation: 'Associate Professor & HOD', role: 'Admin', isHOD: true, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC002', name: 'Mrs. C. Baby', shortName: 'CB', phone: '9443212342', email: 'baby@gacsalem.edu.in', designation: 'Associate Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC003', name: 'Dr. P. Banumathi', shortName: 'PB', phone: '9443212343', email: 'banumathi@gacsalem.edu.in', designation: 'Associate Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC004', name: 'Mrs. V. Pappy Antony', shortName: 'VPA', phone: '9443212344', email: 'pappy@gacsalem.edu.in', designation: 'Associate Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC005', name: 'Dr. P. Senthil Vadivu', shortName: 'PSV', phone: '9443212345', email: 'senthil@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC006', name: 'Dr. S. Meher Banu', shortName: 'SMB', phone: '9443212346', email: 'meharbanu@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC007', name: 'Dr. S. Karthikeyan', shortName: 'SK', phone: '9443212347', email: 'karthikeyan@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC008', name: 'Dr. R. Vikramaprasad', shortName: 'RVP', phone: '9443212348', email: 'vikramaprasad@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG', 'Allied'] },
      { staffId: 'FAC009', name: 'Dr. D. Ramya', shortName: 'DR', phone: '9443212349', email: 'ramya@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG'] },
      { staffId: 'FAC010', name: 'Dr. P. Ramasamy', shortName: 'RS', phone: '9443212350', email: 'ramasamy@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG', 'Allied'] },
      { staffId: 'FAC011', name: 'Mr. V. Umamaheswaran', shortName: 'VU', phone: '9443212351', email: 'umamaheswaran@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'PG', 'Allied'] },
      { staffId: 'FAC012', name: 'Ms. R. Saraswathi', shortName: 'RS', phone: '9443212352', email: 'saraswathi@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'Allied'] },
      { staffId: 'FAC013', name: 'Mrs. M. Sumathi', shortName: 'MS', phone: '9443212353', email: 'sumathi@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'Allied'] },
      { staffId: 'FAC014', name: 'Dr. P. Sowmiya', shortName: 'PS', phone: '9443212354', email: 'sowmiya@gacsalem.edu.in', designation: 'Assistant Professor', role: 'Staff', isHOD: false, teachingEligibility: ['UG', 'Allied'] }
    ];
    const faculties = await Faculty.insertMany(facultyData);
    console.log('Faculty seeded.');

    const nameMap = {
      'DR. A. MURUGESAN': 'Dr. A. Murugesan',
      'Mrs. C. BABY': 'Mrs. C. Baby',
      'DR. P. BANUMATHI': 'Dr. P. Banumathi',
      'Mrs. V. PAPPY ANTONY SAGAYA MARY': 'Mrs. V. Pappy Antony',
      'DR. P. SENTHIL VADIVU': 'Dr. P. Senthil Vadivu',
      'DR. S. MEHAR BANU': 'Dr. S. Meher Banu',
      'DR. S. KARTHIKEYAN': 'Dr. S. Karthikeyan',
      'DR. R. VIKRAMAPRASAD': 'Dr. R. Vikramaprasad',
      'DR. D. RAMYA': 'Dr. D. Ramya',
      'DR. P. RAMASAMY': 'Dr. P. Ramasamy',
      'Mr. V. UMAMAHESWARAN': 'Mr. V. Umamaheswaran',
      'Ms. R. SARASWATHI': 'Ms. R. Saraswathi',
      'Mrs. M. SUMATHI': 'Mrs. M. Sumathi',
      'DR. P. SOWMIYA': 'Dr. P. Sowmiya'
    };

    const facultyMap = {};
    faculties.forEach(f => {
      facultyMap[f.name] = f._id;
      const oldName = Object.keys(nameMap).find(k => nameMap[k] === f.name);
      if (oldName) {
        facultyMap[oldName] = f._id;
      }
    });

    // 4. Seed Subjects & Allocations
    // We will define them together and map them accurately
    const rawAllocations = [
      // DR. A. MURUGESAN (HOD, Total = 12)
      { faculty: 'DR. A. MURUGESAN', code: '26PMT02', subject: 'REAL ANALYSIS - I', class: 'I M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. A. MURUGESAN', code: '23UMTS6', subject: 'MATHEMATICS FOR COMPETITIVE EXAMINATIONS - II', class: 'III B.Sc E/M', hrs: 1, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. A. MURUGESAN', code: '23UMT10', subject: 'REAL ANALYSIS -I', class: 'III B.Sc E/M', hrs: 5, cat: 'UG', med: 'E/M' },

      // Mrs. C. BABY (Total = 16)
      { faculty: 'Mrs. C. BABY', code: '23PMT08', subject: 'TOPOLOGY', class: 'II M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'Mrs. C. BABY', code: '23UMT09', subject: 'ABSTRACT ALGEBRA', class: 'III B.Sc E/M', hrs: 5, cat: 'UG', med: 'E/M' },
      { faculty: 'Mrs. C. BABY', code: '26AEC01', subject: 'AEC I : Ethical Values for Life', class: 'I B.Sc T/M', hrs: 1, cat: 'UG', med: 'T/M' },
      { faculty: 'Mrs. C. BABY', code: '26UMT01', subject: 'ALGEBRA AND TRIGNOMETRY', class: 'I B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },

      // DR. P. BANUMATHI (Total = 16)
      { faculty: 'DR. P. BANUMATHI', code: '23PMT03', subject: 'ORDINARY DIFFERENTIAL EQUATION', class: 'I M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. P. BANUMATHI', code: '26AEC01', subject: 'AEC I : Ethical Values for Life', class: 'I B.Sc E/M', hrs: 1, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. P. BANUMATHI', code: '23UMT11', subject: 'COMPLEX ANALYSIS - I', class: 'III B.Sc E/M', hrs: 4, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. P. BANUMATHI', code: '26UMT01', subject: 'ALGEBRA AND TRIGNOMETRY', class: 'I B.Sc E/M', hrs: 5, cat: 'UG', med: 'E/M' },

      // Mrs. V. PAPPY ANTONY SAGAYA MARY (Total = 16)
      { faculty: 'Mrs. V. PAPPY ANTONY SAGAYA MARY', code: '23PMT10', subject: 'OPERATIONS RESEARCH', class: 'II M.Sc', hrs: 5, cat: 'PG', med: 'E/M' },
      { faculty: 'Mrs. V. PAPPY ANTONY SAGAYA MARY', code: '23UMTE2', subject: 'DISCRETE MATHEMATICS', class: 'III B.Sc E/M', hrs: 4, cat: 'UG', med: 'E/M' },
      { faculty: 'Mrs. V. PAPPY ANTONY SAGAYA MARY', code: '23UMT05', subject: 'DIFFERENTIAL EQUATIONS AND APPLICATIONS', class: 'II B.Sc E/M', hrs: 4, cat: 'UG', med: 'E/M' },
      { faculty: 'Mrs. V. PAPPY ANTONY SAGAYA MARY', code: '23UMTS2', subject: 'ENTREPRENEURIAL SKILL : FUNDAMENTAL OF FINANCIAL SERVICES', class: 'II B.Sc E/M', hrs: 2, cat: 'UG', med: 'E/M' },
      { faculty: 'Mrs. V. PAPPY ANTONY SAGAYA MARY', code: '26UMT01', subject: 'ALGEBRA AND TRIGNOMETRY', class: 'I B.Sc T/M', hrs: 1, cat: 'UG', med: 'T/M' },

      // DR. P. SENTHIL VADIVU (Total = 16)
      { faculty: 'DR. P. SENTHIL VADIVU', code: '23PMT09', subject: 'MECHANICS', class: 'II M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. P. SENTHIL VADIVU', code: '23UMT06', subject: 'VECTOR CALCULUS AND APPLICATIONS', class: 'II B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },
      { faculty: 'DR. P. SENTHIL VADIVU', code: '23UMT12', subject: 'OPTIMIZATION TECHNIQUES', class: 'III B.Sc E/M', hrs: 4, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. P. SENTHIL VADIVU', code: '23UMTS2', subject: 'ENTREPRENEURIAL SKILL : FUNDAMENTAL OF FINANCIAL SERVICES', class: 'II B.Sc T/M', hrs: 2, cat: 'UG', med: 'T/M' },

      // DR. S. MEHAR BANU (Total = 16)
      { faculty: 'DR. S. MEHAR BANU', code: '23PMT07', subject: 'COMPLEX ANALYSIS', class: 'II M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. S. MEHAR BANU', code: '23UMT11', subject: 'COMPLEX ANALYSIS - I', class: 'III B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },
      { faculty: 'DR. S. MEHAR BANU', code: '23UMTS6', subject: 'MATHEMATICS FOR COMPETITIVE EXAMINATIONS - II', class: 'III B.Sc T/M', hrs: 2, cat: 'UG', med: 'T/M' },
      { faculty: 'DR. S. MEHAR BANU', code: '26UMT02', subject: 'DIFFERENTIAL CALCULUS', class: 'I B.Sc E/M', hrs: 4, cat: 'UG', med: 'E/M' },

      // DR. S. KARTHIKEYAN (Total = 16)
      { faculty: 'DR. S. KARTHIKEYAN', code: '23PMTE5', subject: 'DATA ANALYSIS USING R - PROGRAMMING', class: 'II M.Sc', hrs: 5, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. S. KARTHIKEYAN', code: '23PMTS3', subject: 'PHYTHON Practical', class: 'II M.Sc', hrs: 2, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. S. KARTHIKEYAN', code: '23UMTE1', subject: 'NUMERICAL METHODS AND APPLICATIONS - I', class: 'III B.Sc E/M', hrs: 4, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. S. KARTHIKEYAN', code: '23UMTS7', subject: 'NAN MUDALVAN', class: 'III B.Sc E/M', hrs: 1, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. S. KARTHIKEYAN', code: '26UMT02', subject: 'DIFFERENTIAL CALCULUS', class: 'I B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },

      // DR. R. VIKRAMAPRASAD (Total = 16)
      { faculty: 'DR. R. VIKRAMAPRASAD', code: '26PMT01', subject: 'ALGEBRAIC STRUCTURES', class: 'I M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. R. VIKRAMAPRASAD', code: 'ALLIED-STAT', subject: 'ALLIED MATHEMATICS - I STATISTICS', class: 'STATISTICS', hrs: 5, cat: 'Allied', med: 'Other' },
      { faculty: 'DR. R. VIKRAMAPRASAD', code: 'ALLIED-PHYS', subject: 'ALLIED MATHEMATICS - I PHYSICS (T/M)', class: 'PHYSICS (T/M)', hrs: 5, cat: 'Allied', med: 'T/M' },

      // DR. D. RAMYA (Total = 16)
      { faculty: 'DR. D. RAMYA', code: '26PMT04', subject: 'GRAPH THEORY AND ITS APPLICATIONS', class: 'I M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. D. RAMYA', code: '23UMT09', subject: 'ABSTRACT ALGEBRA', class: 'III B.Sc T/M', hrs: 5, cat: 'UG', med: 'T/M' },
      { faculty: 'DR. D. RAMYA', code: '23UMT05', subject: 'DIFFERENTIAL EQUATIONS AND APPLICATIONS', class: 'II B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },
      { faculty: 'DR. D. RAMYA', code: '23UMTS7', subject: 'NAN MUDALVAN', class: 'III B.Sc T/M', hrs: 1, cat: 'UG', med: 'T/M' },

      // DR. P. RAMASAMY (Total = 16)
      { faculty: 'DR. P. RAMASAMY', code: '26PMTD1', subject: 'CALCULUS OF VARIATION AND INTEGRAL EQUATIONS', class: 'I M.Sc', hrs: 6, cat: 'PG', med: 'E/M' },
      { faculty: 'DR. P. RAMASAMY', code: '23UMT06', subject: 'VECTOR CALCULUS AND APPLICATIONS', class: 'II B.Sc E/M', hrs: 4, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. P. RAMASAMY', code: '23UMTS3', subject: 'NAN MUDALVAN', class: 'II B.Sc E/M', hrs: 1, cat: 'UG', med: 'E/M' },
      { faculty: 'DR. P. RAMASAMY', code: 'ALLIED-CHEM', subject: 'ALLIED MATHEMATICS - I CHEMISTRY (E/M ,T/M)', class: 'CHEMISTRY (E/M ,T/M)', hrs: 5, cat: 'Allied', med: 'Other' },

      // Mr. V. UMAMAHESWARAN (Total = 16)
      { faculty: 'Mr. V. UMAMAHESWARAN', code: 'MFCS', subject: 'Mathematical Foundatation for Computer Science', class: 'M.Sc (CS)', hrs: 5, cat: 'Allied', med: 'Other' },
      { faculty: 'Mr. V. UMAMAHESWARAN', code: '23UMTE1', subject: 'NUMERICAL METHODS AND APPLICATION - I', class: 'III B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },
      { faculty: 'Mr. V. UMAMAHESWARAN', code: 'ALLIED-PHYS-EM', subject: 'ALLIED MATHEMATICS - I PHYSICS (E/M)', class: 'PHYSICS (E/M)', hrs: 1, cat: 'Allied', med: 'E/M' },
      { faculty: 'Mr. V. UMAMAHESWARAN', code: 'ALLIED-GEOL', subject: 'ALLIED MATHEMATICS - I GEOLOGY', class: 'GEOLOGY', hrs: 5, cat: 'Allied', med: 'Other' },
      { faculty: 'Mr. V. UMAMAHESWARAN', code: '23UMTS3', subject: 'NAN MUDALVAN', class: 'II B.Sc T/M', hrs: 1, cat: 'UG', med: 'T/M' },

      // Ms. R. SARASWATHI (Total = 16)
      { faculty: 'Ms. R. SARASWATHI', code: '23UMTE2', subject: 'DISCRETE MATHEMATICS', class: 'III B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },
      { faculty: 'Ms. R. SARASWATHI', code: 'DM-MCA', subject: 'DISCRETE MATHEMATICS - MCA', class: 'MCA', hrs: 4, cat: 'Allied', med: 'Other' },
      { faculty: 'Ms. R. SARASWATHI', code: 'ALLIED-PHYS-EM-I', subject: 'ALLIED MATHEMATICS I ALLIED PHYSICS E/M', class: 'ALLIED PHYSICS E/M', hrs: 4, cat: 'Allied', med: 'E/M' },
      { faculty: 'Ms. R. SARASWATHI', code: 'ALLIED-PHYS-EM-III', subject: 'ALLIED MATHEMATICS III ALLIED PHYSICS E/M', class: 'ALLIED PHYSICS E/M', hrs: 2, cat: 'Allied', med: 'E/M' },
      { faculty: 'Ms. R. SARASWATHI', code: 'ALLIED-GEOL-III', subject: 'ALLIED MATHEMATICS - III GEOLOGY', class: 'GEOLOGY', hrs: 2, cat: 'Allied', med: 'Other' },

      // Mrs. M. SUMATHI (Total = 16)
      { faculty: 'Mrs. M. SUMATHI', code: 'AT-BCA', subject: 'ALGEBRA AND TRIGNOMETRY - BCA', class: 'BCA', hrs: 5, cat: 'Allied', med: 'Other' },
      { faculty: 'Mrs. M. SUMATHI', code: 'DM-BCA', subject: 'Discrete Mathematics - BCA', class: 'BCA', hrs: 2, cat: 'Allied', med: 'Other' },
      { faculty: 'Mrs. M. SUMATHI', code: 'ALLIED-PHYS-TM-III', subject: 'ALLIED MATHEMATICS - III PHYSICS (T/M)', class: 'PHYSICS (T/M)', hrs: 2, cat: 'Allied', med: 'T/M' },
      { faculty: 'Mrs. M. SUMATHI', code: '23UMTS6', subject: 'MATHEMATICS FOR COMPETITIVE EXAMINATIONS - II', class: 'III B.Sc E/M', hrs: 1, cat: 'UG', med: 'E/M' },
      { faculty: 'Mrs. M. SUMATHI', code: 'ALLIED-CHEM-TM-III', subject: 'ALLIED MATHEMATICS - III CHEMISTRY (E/M ,T/M)', class: 'CHEMISTRY (E/M ,T/M)', hrs: 2, cat: 'Allied', med: 'Other' },
      { faculty: 'Mrs. M. SUMATHI', code: 'ALLIED-STAT-III', subject: 'ALLIED MATHEMATICS - III STATISTICS', class: 'STATISTICS', hrs: 2, cat: 'Allied', med: 'Other' },
      { faculty: 'Mrs. M. SUMATHI', code: '26UMT02', subject: 'DIFFERENTIAL CALCULUS', class: 'I B.Sc E/M', hrs: 1, cat: 'UG', med: 'E/M' },
      { faculty: 'Mrs. M. SUMATHI', code: '26UMT02', subject: 'DIFFERENTIAL CALCULUS', class: 'I B.Sc T/M', hrs: 1, cat: 'UG', med: 'T/M' },

      // DR. P. SOWMIYA (Total = 16)
      { faculty: 'DR. P. SOWMIYA', code: '23UMT10', subject: 'REAL ANALYSIS -I', class: 'III B.Sc T/M', hrs: 5, cat: 'UG', med: 'T/M' },
      { faculty: 'DR. P. SOWMIYA', code: '23UMT12', subject: 'OPTIMIZATION TECHNIQUES', class: 'III B.Sc T/M', hrs: 4, cat: 'UG', med: 'T/M' },
      { faculty: 'DR. P. SOWMIYA', code: 'ALLIED-CS-I', subject: 'ALLIED MATHEMATICS - I COMPUTER SCIENCE', class: 'COMPUTER SCIENCE', hrs: 5, cat: 'Allied', med: 'Other' },
      { faculty: 'DR. P. SOWMIYA', code: 'ALLIED-CS-III', subject: 'ALLIED MATHEMATICS III COMPUTER SCIENCE', class: 'COMPUTER SCIENCE', hrs: 2, cat: 'Allied', med: 'Other' }
    ];

    // Seed Subjects first (making sure each unique code + name + medium is stored)
    const subjectsToInsert = [];
    const subjectsMap = {}; // key: code_name_medium

    rawAllocations.forEach(item => {
      const key = `${item.code}_${item.subject}_${item.med}`;
      if (!subjectsMap[key]) {
        subjectsMap[key] = {
          courseCode: item.code,
          name: item.subject,
          weeklyHours: item.hrs, // default to seeded hours, can be edited
          medium: item.med,
          category: item.cat
        };
        subjectsToInsert.push(subjectsMap[key]);
      }
    });

    const insertedSubjects = await Subject.insertMany(subjectsToInsert);
    console.log('Subjects seeded.');

    // Map unique key back to database subject object ID
    const subjectDbMap = {};
    insertedSubjects.forEach(s => {
      const key = `${s.courseCode}_${s.name}_${s.medium}`;
      subjectDbMap[key] = s._id;
    });

    // Seed Allocations
    const allocationsToInsert = [];
    for (const item of rawAllocations) {
      const facultyId = facultyMap[item.faculty];
      const subjectKey = `${item.code}_${item.subject}_${item.med}`;
      const subjectId = subjectDbMap[subjectKey];
      const classId = classMap[item.class];

      if (!facultyId || !subjectId || !classId) {
        console.error(`Missing mappings: Faculty(${item.faculty}): ${facultyId}, Subject(${item.subject}): ${subjectId}, Class(${item.class}): ${classId}`);
        continue;
      }

      allocationsToInsert.push({
        faculty: facultyId,
        subject: subjectId,
        class: classId,
        weeklyHours: item.hrs
      });
    }

    await Allocation.insertMany(allocationsToInsert);
    console.log('Allocations seeded.');

    // Add Audit Log
    await AuditLog.create({
      action: 'DATABASE_SEED',
      details: 'Successfully seeded faculty, classes, subjects, allocations, and settings from PDF data.',
      user: 'System'
    });

    console.log('Database seeding complete successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

export default seedData;

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('seeder.js')) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
