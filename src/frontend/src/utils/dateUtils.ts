export const formatRelativeTime = (nanoseconds: number | bigint): string => {
   // Konversi nanoseconds ke milliseconds
   const timestampMs = Number(nanoseconds) / 1_000_000;
   const now = Date.now();
   const diffMs = now - timestampMs;

   // Konversi ke detik, menit, jam, hari
   const seconds = Math.floor(diffMs / 1000);
   const minutes = Math.floor(seconds / 60);
   const hours = Math.floor(minutes / 60);
   const days = Math.floor(hours / 24);

   // Just now (kurang dari 1 menit)
   if (seconds < 60) {
      return "Just now";
   }

   // X minutes ago (kurang dari 1 jam)
   if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
   }

   // X hours ago (kurang dari 24 jam)
   if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
   }

   // Today, Yesterday, atau X days ago
   const targetDate = new Date(timestampMs);
   const today = new Date();
   const yesterday = new Date(today);
   yesterday.setDate(today.getDate() - 1);

   // Cek apakah hari ini
   if (targetDate.toDateString() === today.toDateString()) {
      return "Today";
   }

   // Cek apakah kemarin
   if (targetDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
   }

   // X days ago (kurang dari 7 hari)
   if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
   }

   // X weeks ago (kurang dari 4 minggu)
   const weeks = Math.floor(days / 7);
   if (weeks < 4) {
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
   }

   // X months ago (kurang dari 12 bulan)
   const months = Math.floor(days / 30);
   if (months < 12) {
      return `${months} month${months > 1 ? "s" : ""} ago`;
   }

   // X years ago
   const years = Math.floor(days / 365);
   return `${years} year${years > 1 ? "s" : ""} ago`;
};
