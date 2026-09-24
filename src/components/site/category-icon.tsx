import { createElement } from "react";
import {
  BatteryCharging, Cctv, CookingPot, HardDrive, House, Keyboard, Monitor, Package, Refrigerator, Router, type LucideIcon,
} from "lucide-react";
import { slugify } from "@/lib/format";

// Picked by keywords in the category name so admin-created categories get a sensible icon too.
const RULES: [RegExp, LucideIcon][] = [
  [/camera|dau-ghi|cctv/, Cctv],
  [/mang|wifi|switch|router/, Router],
  [/luu-dien|ups|nang-luong/, BatteryCharging],
  [/phu-kien|chuot|ban-phim|tai-nghe/, Keyboard],
  [/may-tinh|laptop|pc|man-hinh/, Monitor],
  [/luu-tru|hdd|the-nho|usb|o-cung/, HardDrive],
  [/nha-thong-minh|chuong|khoa/, House],
  [/gia-dung|noi|bep/, CookingPot],
  [/dien-may|tu-lanh|tivi|may-giat|dieu-hoa/, Refrigerator],
];

export function categoryIcon(name: string): LucideIcon {
  const key = slugify(name);
  return RULES.find(([re]) => re.test(key))?.[1] ?? Package;
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  return createElement(categoryIcon(name), { className, "aria-hidden": true });
}
