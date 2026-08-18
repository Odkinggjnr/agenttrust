import { STROOPS_PER_XLM, MAX_SCORE } from "./constants";

export function truncateAddress(
  address: string,
  start: number = 4,
  end: number = 4
): string {
  if (!address) return "";
  if (address.length <= start + end + 3) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatXLM(stroops: string | number): string {
  const stroopsBigInt = typeof stroops === "string" ? BigInt(stroops) : BigInt(Math.round(stroops));
  const xlm = Number(stroopsBigInt) / STROOPS_PER_XLM;
  const parts = xlm.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${parts.join(".")} XLM`;
}

export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 0) return "just now";

  if (diff < 60) {
    return diff === 1 ? "1 second ago" : `${diff} seconds ago`;
  }

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  const hours = Math.floor(diff / 3600);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(diff / 86400);
  if (days < 30) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function getScoreColor(score: number): string {
  if (score <= 2000) return "#6B7280"; // gray
  if (score <= 5000) return "#F59E0B"; // amber
  if (score <= 7500) return "#3B82F6"; // blue
  if (score <= 9000) return "#10B981"; // emerald
  return "#6366F1"; // indigo
}

export function getScorePercent(score: number): number {
  return Math.min(100, Math.max(0, (score / MAX_SCORE) * 100));
}

export function generateIdenticon(address: string): number[][] {
  // Simple hash: sum all character codes then use as seed
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }

  const grid: number[][] = [];
  for (let row = 0; row < 5; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < 3; col++) {
      // Use different bits of the hash for each cell
      const bitIndex = row * 3 + col;
      // Advance the hash for each cell
      hash = (hash * 1103515245 + 12345) >>> 0;
      rowData.push((hash >> (bitIndex % 16)) & 1);
    }
    // Mirror columns 0 and 1 to columns 4 and 3 for symmetry
    rowData.push(rowData[1]);
    rowData.push(rowData[0]);
    grid.push(rowData);
  }

  return grid;
}

export function classNames(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(" ");
}
