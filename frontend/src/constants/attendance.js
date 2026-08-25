// Attendance statuses and the rules for reading them back.
//
// A student can end up with several marks on the same day (the API appends a
// record per submission rather than updating one), so every screen that reads
// attendance must collapse a day's records the same way. Keep that logic here
// so the list, the dashboard and the report can't drift apart.

export const PRESENT = 'Present';
export const LATE = 'Late';
export const ABSENT = 'Absent';

export const STATUSES = [
  { value: PRESENT, short: 'P', label: 'Present' },
  { value: LATE, short: 'L', label: 'Late' },
  { value: ABSENT, short: 'A', label: 'Absent' },
];

// When a day holds conflicting marks, the most favourable one wins.
const RANK = { [PRESENT]: 3, [LATE]: 2, [ABSENT]: 1 };

// A late student still turned up, so they count towards the attendance rate.
export const isAttended = (status) => status === PRESENT || status === LATE;

// records -> { [studentId]: status } for a single day's records.
export const resolveDay = (records) =>
  records.reduce((acc, record) => {
    const id = record.studentId?._id || record.studentId;
    if (!id) return acc;
    const current = acc[id];
    if (!current || (RANK[record.status] || 0) > (RANK[current] || 0)) {
      acc[id] = record.status;
    }
    return acc;
  }, {});
