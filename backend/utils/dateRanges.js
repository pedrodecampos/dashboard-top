const startOfDay = (inputDate) => {
  const date = new Date(inputDate);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getRangeFromPreset = (preset) => {
  const now = new Date();
  const todayStart = startOfDay(now);

  switch (preset) {
    case "today":
      return { start: todayStart, end: addDays(todayStart, 1) };
    case "yesterday": {
      const start = addDays(todayStart, -1);
      return { start, end: todayStart };
    }
    case "last7d":
      return { start: addDays(todayStart, -6), end: addDays(todayStart, 1) };
    case "currentMonth": {
      const start = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        1
      );
      const end = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth() + 1,
        1
      );
      return { start, end };
    }
    case "lastMonth": {
      const start = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth() - 1,
        1
      );
      const end = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      return { start, end };
    }
    case "all":
    default:
      return { start: null, end: null };
  }
};

module.exports = {
  startOfDay,
  addDays,
  getRangeFromPreset,
};
