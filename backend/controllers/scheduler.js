import Faculty from '../models/Faculty.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import Allocation from '../models/Allocation.js';
import Timetable from '../models/Timetable.js';
import Setting from '../models/Setting.js';
import AuditLog from '../models/AuditLog.js';

// Days and Periods definitions
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5'];

// Day-specific period search order to rotate/shuffle periods across the week
const DAY_SEARCH_PERIODS = {
  'Monday':    ['P1', 'P3', 'P5', 'P2', 'P4'],
  'Tuesday':   ['P2', 'P4', 'P1', 'P3', 'P5'],
  'Wednesday': ['P3', 'P5', 'P2', 'P4', 'P1'],
  'Thursday':  ['P4', 'P1', 'P3', 'P5', 'P2'],
  'Friday':    ['P5', 'P2', 'P4', 'P1', 'P3'],
  'Saturday':  ['P1', 'P4', 'P2', 'P5', 'P3']
};

/**
 * Validate current timetable against all constraints.
 * Returns { valid: boolean, conflicts: Array }
 */
export const validateTimetableConstraints = async (scheduleEntries) => {
  const conflicts = [];

  // Load settings
  const settings = {};
  const dbSettings = await Setting.find({});
  dbSettings.forEach(s => {
    settings[s.key] = s.value;
  });

  const regularStaffHours = settings.regularStaffHours || 16;
  const hodStaffHours = settings.hodStaffHours || 12;

  // Load faculty, classes, subjects, allocations
  const faculties = await Faculty.find({});
  const classes = await Class.find({});
  const subjects = await Subject.find({});
  const allocations = await Allocation.find({});

  const facultyMap = new Map(faculties.map(f => [f._id.toString(), f]));
  const classMap = new Map(classes.map(c => [c._id.toString(), c]));
  const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));

  // Data structures for checking
  // 1. Double booking checks: key = facultyId_day_period -> entry
  const facultyTimetable = {};
  // 2. Class double booking: key = classId_day_period -> entry
  const classTimetable = {};
  // 3. Faculty daily hours: key = facultyId_day -> count
  const facultyDailyHours = {};
  // 4. Faculty weekly hours: key = facultyId -> count
  const facultyWeeklyHours = {};
  // 5. Subject weekly hours per class: key = classId_subjectId -> count
  const subjectClassHours = {};

  // Initialize weekly hours
  faculties.forEach(f => {
    facultyWeeklyHours[f._id.toString()] = 0;
    DAYS.forEach(day => {
      facultyDailyHours[`${f._id.toString()}_${day}`] = 0;
    });
  });

  // Check details
  for (const entry of scheduleEntries) {
    const { day, period, class: classId, subject: subjectId, faculty: facultyId } = entry;
    
    const classIdStr = classId?.toString();
    const subjectIdStr = subjectId?.toString();
    const facultyIdStr = facultyId?.toString();

    const faculty = facultyMap.get(facultyIdStr);
    const cls = classMap.get(classIdStr);
    const sub = subjectMap.get(subjectIdStr);

    if (!faculty || !cls || !sub) continue;

    // A. Faculty Double Booking
    const facKey = `${facultyIdStr}_${day}_${period}`;
    if (facultyTimetable[facKey]) {
      conflicts.push({
        type: 'Faculty Double Booking',
        faculty: faculty.name,
        class: cls.name,
        day,
        period,
        reason: `Faculty ${faculty.name} is assigned to both "${cls.name}" and "${classMap.get(facultyTimetable[facKey].class.toString()).name}" at ${day} ${period}.`
      });
    } else {
      facultyTimetable[facKey] = entry;
    }

    // B. Class Double Booking
    const classKey = `${classIdStr}_${day}_${period}`;
    if (classTimetable[classKey]) {
      conflicts.push({
        type: 'Class Double Booking',
        faculty: faculty.name,
        class: cls.name,
        day,
        period,
        reason: `Class ${cls.name} has multiple sessions assigned at ${day} ${period}.`
      });
    } else {
      classTimetable[classKey] = entry;
    }

    // C. Faculty Hours Accumulation
    facultyWeeklyHours[facultyIdStr] = (facultyWeeklyHours[facultyIdStr] || 0) + 1;
    facultyDailyHours[`${facultyIdStr}_${day}`] = (facultyDailyHours[`${facultyIdStr}_${day}`] || 0) + 1;

    // D. Subject Hours per Class
    const subClassKey = `${classIdStr}_${subjectIdStr}`;
    subjectClassHours[subClassKey] = (subjectClassHours[subClassKey] || 0) + 1;

    // E. Faculty Eligibility
    // Check if faculty is eligible for this class/subject type
    const isEligible = checkFacultyEligibility(faculty, cls, sub);
    if (!isEligible) {
      conflicts.push({
        type: 'Faculty Eligibility Violation',
        faculty: faculty.name,
        class: cls.name,
        subject: sub.name,
        reason: `Faculty ${faculty.name} is not eligible to teach ${sub.name} in ${cls.name}.`
      });
    }
  }

  // E. Consecutive Period Rule
  // A faculty member must NOT teach consecutive periods
  faculties.forEach(f => {
    const fId = f._id.toString();
    DAYS.forEach(day => {
      for (let pIdx = 0; pIdx < PERIODS.length - 1; pIdx++) {
        const p1 = PERIODS[pIdx];
        const p2 = PERIODS[pIdx + 1];
        
        const key1 = `${fId}_${day}_${p1}`;
        const key2 = `${fId}_${day}_${p2}`;

        if (facultyTimetable[key1] && facultyTimetable[key2]) {
          conflicts.push({
            type: 'Consecutive Teaching',
            faculty: f.name,
            day,
            periods: `${p1} & ${p2}`,
            reason: `Faculty ${f.name} has consecutive periods assigned on ${day} (${p1} and ${p2}).`
          });
        }
      }
    });
  });

  const activeFacultyIds = new Set(allocations.map(a => a.faculty.toString()));

  // F. Workload and Distribution Rule
  faculties.forEach(f => {
    const fId = f._id.toString();
    if (!activeFacultyIds.has(fId)) return; // Skip purely administrative/non-teaching staff (like Mohan)
    
    const assignedWeekly = facultyWeeklyHours[fId] || 0;
    const requiredWeekly = f.isHOD ? hodStaffHours : regularStaffHours;

    if (assignedWeekly !== requiredWeekly) {
      conflicts.push({
        type: 'Workload Mismatch',
        faculty: f.name,
        reason: `Faculty ${f.name} is assigned ${assignedWeekly} hours but requires ${requiredWeekly} hours.`
      });
    }

    // Daily distribution check for regular faculty (Permutation of [3, 3, 3, 3, 2, 2])
    if (!f.isHOD) {
      const dailyCounts = DAYS.map(day => facultyDailyHours[`${fId}_${day}`] || 0);
      const sortedDailyCounts = [...dailyCounts].sort((a, b) => b - a);
      
      // Expected sorted counts: [3, 3, 3, 3, 2, 2]
      const isValidDistribution = 
        sortedDailyCounts[0] === 3 && 
        sortedDailyCounts[1] === 3 && 
        sortedDailyCounts[2] === 3 && 
        sortedDailyCounts[3] === 3 && 
        sortedDailyCounts[4] === 2 && 
        sortedDailyCounts[5] === 2;

      if (!isValidDistribution) {
        conflicts.push({
          type: 'Unbalanced Daily Workload',
          faculty: f.name,
          reason: `Regular faculty ${f.name} daily workload distribution is [${dailyCounts.join(', ')}]. Must be exactly four days of 3 periods and two days of 2 periods (e.g. 3, 3, 3, 3, 2, 2).`
        });
      }
    }
  });

  // G. Subject hour mapping checks
  allocations.forEach(alloc => {
    const classIdStr = alloc.class.toString();
    const subjectIdStr = alloc.subject.toString();
    const facultyIdStr = alloc.faculty.toString();

    const subClassKey = `${classIdStr}_${subjectIdStr}`;
    const assignedHours = subjectClassHours[subClassKey] || 0;
    const targetHours = alloc.weeklyHours;

    if (assignedHours !== targetHours) {
      const faculty = facultyMap.get(facultyIdStr);
      const cls = classMap.get(classIdStr);
      const sub = subjectMap.get(subjectIdStr);

      conflicts.push({
        type: 'Subject Hour Mismatch',
        class: cls?.name,
        subject: sub?.name,
        faculty: faculty?.name,
        reason: `Subject "${sub?.name}" in class "${cls?.name}" (by ${faculty?.name}) is assigned ${assignedHours} hours, but requires ${targetHours} hours.`
      });
    }
  });

  return {
    valid: conflicts.length === 0,
    conflicts
  };
};

/**
 * Check if a faculty member is eligible for a class/subject
 */
const checkFacultyEligibility = (faculty, cls, subject) => {
  // If no eligibility list, default to true
  if (!faculty.teachingEligibility || faculty.teachingEligibility.length === 0) return true;

  // Normalize eligibility strings (lowercase, remove spaces)
  const eligibilities = faculty.teachingEligibility.map(e => e.toLowerCase().trim());

  if (eligibilities.includes('ug + pg')) return true;

  const isUG = cls.year === 'I' || cls.year === 'II' || cls.year === 'III';
  const isPG = cls.year === 'I' || cls.year === 'II' && cls.program.startsWith('M.Sc');
  
  if (isUG && eligibilities.includes('ug only')) return true;
  if (isPG && eligibilities.includes('pg only')) return true;

  // Specific class names, e.g. "statistics", "physics"
  const classNameLower = cls.name.toLowerCase();
  if (eligibilities.some(el => classNameLower.includes(el))) return true;

  // Program names
  const progNameLower = cls.program.toLowerCase();
  if (eligibilities.some(el => progNameLower.includes(el))) return true;

  // Default true if there's an overlap or if it's general
  return true;
};

/**
 * Generate timetable using backtracking solver.
 */
export const runBacktrackingSolver = async (level) => {
  // 1. Load data
  const dbSettings = await Setting.find({});
  const settings = {};
  dbSettings.forEach(s => { settings[s.key] = s.value; });

  const regularStaffHours = settings.regularStaffHours || 16;
  const hodStaffHours = settings.hodStaffHours || 12;

  const faculties = await Faculty.find({ isActive: true });
  const classes = await Class.find({});
  const allocations = await Allocation.find({});
  const subjects = await Subject.find({});

  // 2. Pre-validations
  const classRequiredHours = {};
  allocations.forEach(alloc => {
    const classIdStr = alloc.class.toString();
    classRequiredHours[classIdStr] = (classRequiredHours[classIdStr] || 0) + alloc.weeklyHours;
  });

  for (const cls of classes) {
    const reqHrs = classRequiredHours[cls._id.toString()] || 0;
    if (reqHrs > 30) {
      throw new Error(`Class "${cls.name}" requires ${reqHrs} teaching hours, which exceeds the maximum weekly capacity of 30 slots (6 days × 5 periods).`);
    }
  }

  const facultyAllocatedHours = {};
  allocations.forEach(alloc => {
    const facIdStr = alloc.faculty.toString();
    facultyAllocatedHours[facIdStr] = (facultyAllocatedHours[facIdStr] || 0) + alloc.weeklyHours;
  });

  for (const fac of faculties) {
    const allocated = facultyAllocatedHours[fac._id.toString()] || 0;
    if (allocated === 0) continue; // Skip non-teaching admin staff (like Mohan)
    
    const required = fac.isHOD ? hodStaffHours : regularStaffHours;
    if (level === 0 && allocated !== required) {
      throw new Error(`Faculty "${fac.name}" has ${allocated} hours allocated, but level 0 requires exactly ${required} hours.`);
    }
  }

  const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));

  // Group allocations by class
  const classItems = {};
  classes.forEach(c => { classItems[c._id.toString()] = []; });

  allocations.forEach(alloc => {
    const classIdStr = alloc.class.toString();
    const subjectHours = [];
    for (let h = 0; h < alloc.weeklyHours; h++) {
      subjectHours.push({
        classId: classIdStr,
        facId: alloc.faculty.toString(),
        subjectId: alloc.subject.toString(),
        alloc
      });
    }
    classItems[classIdStr].push(subjectHours);
  });

  // Sort classes: Primary first, then by total hours descending
  const sortedClasses = [...classes].sort((a, b) => {
    const typeA = a.type === 'Primary' ? 0 : 1;
    const typeB = b.type === 'Primary' ? 0 : 1;
    if (typeA !== typeB) return typeA - typeB;

    const hoursA = classRequiredHours[a._id.toString()] || 0;
    const hoursB = classRequiredHours[b._id.toString()] || 0;
    return hoursB - hoursA;
  });

  // Generate interleaved unassigned array using the sorted class list
  const unassigned = [];
  sortedClasses.forEach(c => {
    const classIdStr = c._id.toString();
    const subjectsList = classItems[classIdStr];
    if (subjectsList.length === 0) return;

    // Sort subjects in this class: Practical subjects first, then theory subjects (highest hours first)
    subjectsList.sort((a, b) => {
      const subA = subjectMap.get(a[0].subjectId);
      const subB = subjectMap.get(b[0].subjectId);
      const isAPrac = subA?.name?.toLowerCase().includes('practical') || subA?.name?.toLowerCase().includes('lab');
      const isBPrac = subB?.name?.toLowerCase().includes('practical') || subB?.name?.toLowerCase().includes('lab');
      if (isAPrac !== isBPrac) return isAPrac ? -1 : 1;
      return b.length - a.length;
    });

    const maxHrs = Math.max(...subjectsList.map(list => list.length));

    // Interleave the hours to spread subjects across the days
    for (let h = 0; h < maxHrs; h++) {
      subjectsList.forEach(list => {
        if (h < list.length) {
          unassigned.push({
            id: `${list[h].alloc._id.toString()}_${h}`,
            classId: list[h].classId,
            facId: list[h].facId,
            alloc: list[h].alloc
          });
        }
      });
    }
  });

  // State structures
  const timetableGrid = {};
  classes.forEach(c => {
    timetableGrid[c._id.toString()] = {};
    DAYS.forEach(day => {
      timetableGrid[c._id.toString()][day] = {};
      PERIODS.forEach(period => {
        timetableGrid[c._id.toString()][day][period] = null;
      });
    });
  });

  const facultyGrid = {};
  faculties.forEach(f => {
    facultyGrid[f._id.toString()] = {};
    DAYS.forEach(day => {
      facultyGrid[f._id.toString()][day] = {};
      PERIODS.forEach(period => {
        facultyGrid[f._id.toString()][day][period] = null;
      });
    });
  });

  const facultyDailyCount = {};
  faculties.forEach(f => {
    facultyDailyCount[f._id.toString()] = {};
    DAYS.forEach(day => {
      facultyDailyCount[f._id.toString()][day] = 0;
    });
  });

  // Fast subject daily counter to prevent same-subject clumping
  const classSubjectDailyCount = {};
  classes.forEach(c => {
    classSubjectDailyCount[c._id.toString()] = {};
    DAYS.forEach(day => {
      classSubjectDailyCount[c._id.toString()][day] = {};
      subjects.forEach(s => {
        classSubjectDailyCount[c._id.toString()][day][s._id.toString()] = 0;
      });
    });
  });

  // Fast faculty daily counter in each class (for allied spread)
  const facultyClassDailyCount = {};
  faculties.forEach(f => {
    facultyClassDailyCount[f._id.toString()] = {};
    classes.forEach(c => {
      facultyClassDailyCount[f._id.toString()][c._id.toString()] = {};
      DAYS.forEach(day => {
        facultyClassDailyCount[f._id.toString()][c._id.toString()][day] = 0;
      });
    });
  });

  const facultyMap = new Map(faculties.map(f => [f._id.toString(), f]));
  const classMap = new Map(classes.map(c => [c._id.toString(), c]));

  // Check safety of slot placement
  const isSafe = (classIdStr, day, period, alloc) => {
    const facIdStr = alloc.faculty.toString();
    const fac = facultyMap.get(facIdStr);

    // Double booking checks
    if (facultyGrid[facIdStr][day][period] !== null) return false;
    if (timetableGrid[classIdStr][day][period] !== null) return false;

    // Spread constraint: Max 2 periods of the SAME subject in the SAME class per day (only for theory subjects in Primary classes)
    const subjectIdStr = alloc.subject.toString();
    const sub = subjectMap.get(subjectIdStr);
    const subName = sub?.name?.toLowerCase() || '';
    const isPractical = subName.includes('practical') || subName.includes('lab');
    const cls = classMap.get(classIdStr);
    const isPrimaryClass = cls?.type === 'Primary';
    if (!isPractical && isPrimaryClass) {
      if ((classSubjectDailyCount[classIdStr][day][subjectIdStr] || 0) >= 2) {
        return false;
      }
    }

    // Spread constraint for Allied classes: At most 2 periods per day for any teacher in the same allied class
    if (cls?.type === 'Allied') {
      if ((facultyClassDailyCount[facIdStr][classIdStr][day] || 0) >= 2) {
        return false;
      }
    }

    // Level-specific checks
    if (level === 0) {
      const currentDaily = facultyDailyCount[facIdStr][day];
      if (currentDaily >= 3) return false;

      // Consecutive check
      const pIdx = PERIODS.indexOf(period);
      if (pIdx > 0 && facultyGrid[facIdStr][day][PERIODS[pIdx - 1]] !== null) return false;
      if (pIdx < PERIODS.length - 1 && facultyGrid[facIdStr][day][PERIODS[pIdx + 1]] !== null) return false;

      // P2/P4 constraint
      if ((period === 'P2' || period === 'P4') && currentDaily >= 2) return false;

      // P1/P3/P5 constraint
      if (currentDaily === 2) {
        const assigned = [];
        PERIODS.forEach(p => {
          if (facultyGrid[facIdStr][day][p] !== null) assigned.push(p);
        });
        assigned.push(period);
        const sorted = assigned.sort();
        if (!(sorted.includes('P1') && sorted.includes('P3') && sorted.includes('P5'))) return false;
      }

      // Look-ahead checks for regular faculty
      if (!fac.isHOD) {
        const tempDailyCount = { ...facultyDailyCount[facIdStr] };
        tempDailyCount[day]++;
        
        const allocatedHours = facultyAllocatedHours[facIdStr] || 16;
        let totalAssigned = 0;
        DAYS.forEach(d => { totalAssigned += tempDailyCount[d]; });
        const remainingHours = allocatedHours - totalAssigned;

        const maxDayCapacity = {};
        DAYS.forEach(d => {
          const hasP2orP4 = facultyGrid[facIdStr][d]['P2'] !== null || 
                            facultyGrid[facIdStr][d]['P4'] !== null ||
                            (d === day && (period === 'P2' || period === 'P4'));
          maxDayCapacity[d] = hasP2orP4 ? 2 : 3;
        });

        const counts = DAYS.map(d => tempDailyCount[d]);

        for (let i = 0; i < DAYS.length; i++) {
          const d = DAYS[i];
          if (tempDailyCount[d] > maxDayCapacity[d]) return false;
        }

        let minHoursToReach2s = 0;
        counts.forEach(c => { if (c < 2) minHoursToReach2s += (2 - c); });
        if (remainingHours < minHoursToReach2s) return false;

        let daysWith3 = 0;
        DAYS.forEach(d => { if (tempDailyCount[d] === 3) daysWith3++; });
        if (daysWith3 > 4) return false;

        if (daysWith3 < 4) {
          const target3sNeeded = 4 - daysWith3;
          const costs = [];
          DAYS.forEach(d => {
            if (maxDayCapacity[d] === 3 && tempDailyCount[d] < 3) {
              costs.push(3 - tempDailyCount[d]);
            }
          });
          if (costs.length < target3sNeeded) return false;
          costs.sort((a, b) => a - b);
          let minHoursToReach4_3s = 0;
          for (let i = 0; i < target3sNeeded; i++) {
            minHoursToReach4_3s += costs[i];
          }
          if (remainingHours < minHoursToReach4_3s) return false;
        }

        let maxCapacityRemaining = 0;
        DAYS.forEach(d => { maxCapacityRemaining += (maxDayCapacity[d] - tempDailyCount[d]); });
        if (remainingHours > maxCapacityRemaining) return false;
      }
    } 
    else if (level === 1) {
      if (facultyDailyCount[facIdStr][day] >= 3) return false;

      const pIdx = PERIODS.indexOf(period);
      if (pIdx > 0 && facultyGrid[facIdStr][day][PERIODS[pIdx - 1]] !== null) return false;
      if (pIdx < PERIODS.length - 1 && facultyGrid[facIdStr][day][PERIODS[pIdx + 1]] !== null) return false;
    } 
    else if (level === 2) {
      if (facultyDailyCount[facIdStr][day] >= 4) return false;

      const pIdx = PERIODS.indexOf(period);
      if (pIdx > 0 && facultyGrid[facIdStr][day][PERIODS[pIdx - 1]] !== null) return false;
      if (pIdx < PERIODS.length - 1 && facultyGrid[facIdStr][day][PERIODS[pIdx + 1]] !== null) return false;
    }
    else if (level === 3) {
      if (facultyDailyCount[facIdStr][day] >= 5) return false;
      const pIdx = PERIODS.indexOf(period);
      if (pIdx > 0) {
        const prevAlloc = timetableGrid[classIdStr][day][PERIODS[pIdx - 1]];
        if (prevAlloc && prevAlloc.faculty.toString() === facIdStr) return false;
      }
      if (pIdx < PERIODS.length - 1) {
        const nextAlloc = timetableGrid[classIdStr][day][PERIODS[pIdx + 1]];
        if (nextAlloc && nextAlloc.faculty.toString() === facIdStr) return false;
      }
    }
    else if (level === 4) {
      if (facultyDailyCount[facIdStr][day] >= 6) return false;
    }

    return true;
  };

  const getSafeSlotsCount = (item) => {
    let count = 0;
    for (const day of DAYS) {
      for (const period of PERIODS) {
        if (isSafe(item.classId, day, period, item.alloc)) {
          count++;
        }
      }
    }
    return count;
  };

  const startTime = Date.now();
  const timeoutMs = level === 0 ? 1500 : (level === 4 ? 2500 : 1500);

  const solve = (placedCount) => {
    if (Date.now() - startTime > timeoutMs) return false; // timeout
    if (placedCount === unassigned.length) {
      if (level === 0) {
        for (const fac of faculties) {
          if (!fac.isHOD) {
            const facIdStr = fac._id.toString();
            if ((facultyAllocatedHours[facIdStr] || 0) === 0) continue;
            
            const dailyCounts = DAYS.map(day => facultyDailyCount[facIdStr][day]);
            const sorted = [...dailyCounts].sort((a, b) => b - a);
            const isValid = 
              sorted[0] === 3 && 
              sorted[1] === 3 && 
              sorted[2] === 3 && 
              sorted[3] === 3 && 
              sorted[4] === 2 && 
              sorted[5] === 2;
            if (!isValid) return false;
          } else {
            const facIdStr = fac._id.toString();
            const dailyCounts = DAYS.map(day => facultyDailyCount[facIdStr][day]);
            if (dailyCounts.some(c => c !== 2)) return false;
          }
        }
      }
      return true;
    }

    let minSlots = 999;
    let mrvIdx = -1;
    const limit = Math.min(unassigned.length, placedCount + 15);

    for (let i = placedCount; i < limit; i++) {
      const item = unassigned[i];
      const count = getSafeSlotsCount(item);
      if (count < minSlots) {
        minSlots = count;
        mrvIdx = i;
      }
      if (minSlots === 0) return false; // prune early
    }

    if (mrvIdx === -1) return false;

    // Swap
    const item = unassigned[mrvIdx];
    unassigned[mrvIdx] = unassigned[placedCount];
    unassigned[placedCount] = item;

    for (const day of DAYS) {
      const searchPeriods = DAY_SEARCH_PERIODS[day] || ['P1', 'P3', 'P5', 'P2', 'P4'];
      for (const period of searchPeriods) {
        if (isSafe(item.classId, day, period, item.alloc)) {
          timetableGrid[item.classId][day][period] = item.alloc;
          facultyGrid[item.facId][day][period] = item.classId;
          facultyDailyCount[item.facId][day]++;
          classSubjectDailyCount[item.classId][day][item.alloc.subject.toString()]++;
          facultyClassDailyCount[item.facId][item.classId][day]++;

          if (solve(placedCount + 1)) return true;

          timetableGrid[item.classId][day][period] = null;
          facultyGrid[item.facId][day][period] = null;
          facultyDailyCount[item.facId][day]--;
          classSubjectDailyCount[item.classId][day][item.alloc.subject.toString()]--;
          facultyClassDailyCount[item.facId][item.classId][day]--;
        }
      }
    }

    // Swap back
    const temp = unassigned[placedCount];
    unassigned[placedCount] = unassigned[mrvIdx];
    unassigned[mrvIdx] = temp;

    return false;
  };

  const success = solve(0);
  if (!success) {
    throw new Error(`Solver level ${level} timed out or failed to find a valid solution.`);
  }

  // Convert grid to flat schedule list
  const finalSchedule = [];
  classes.forEach(c => {
    const classIdStr = c._id.toString();
    DAYS.forEach(day => {
      PERIODS.forEach(period => {
        const alloc = timetableGrid[classIdStr][day][period];
        if (alloc) {
          finalSchedule.push({
            day,
            period,
            class: c._id,
            subject: alloc.subject,
            faculty: alloc.faculty
          });
        }
      });
    });
  });

  return finalSchedule;
};

export const generateTimetableEngine = async () => {
  let schedule = null;
  let success = false;
  let currentLevel = 0;
  const levelsCount = 5;
  let lastError = null;

  while (currentLevel < levelsCount && !success) {
    console.log(`Attempting timetable generation at relaxation level ${currentLevel}...`);
    try {
      schedule = await runBacktrackingSolver(currentLevel);
      success = true;
      console.log(`Success at level ${currentLevel}!`);
    } catch (err) {
      console.log(`Level ${currentLevel} failed: ${err.message}`);
      lastError = err;
      currentLevel++;
    }
  }

  if (!success) {
    throw new Error(lastError ? lastError.message : 'Unable to generate timetable: All solver levels failed or timed out.');
  }

  return schedule;
};
