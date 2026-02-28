import type { Condition } from "./types";
import {
  EyeOff,
  Heart,
  VolumeX,
  Skull,
  Link,
  Zap,
  Eye,
  Snowflake,
  Anchor,
  Droplet,
  ArrowDown,
  Brain,
  Moon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CONDITION_ICONS: Record<Condition, LucideIcon> = {
  Blinded: EyeOff,
  Charmed: Heart,
  Deafened: VolumeX,
  Frightened: Skull,
  Grappled: Link,
  Incapacitated: Zap,
  Invisible: Eye,
  Paralyzed: Snowflake,
  Petrified: Anchor,
  Poisoned: Droplet,
  Prone: ArrowDown,
  Restrained: Link,
  Stunned: Brain,
  Unconscious: Moon,
};

export const CONDITION_COLORS: Record<Condition, string> = {
  Blinded: "text-gray-500",
  Charmed: "text-pink-400",
  Deafened: "text-gray-400",
  Frightened: "text-purple-500",
  Grappled: "text-orange-500",
  Incapacitated: "text-yellow-500",
  Invisible: "text-blue-300",
  Paralyzed: "text-cyan-400",
  Petrified: "text-stone-500",
  Poisoned: "text-green-500",
  Prone: "text-amber-600",
  Restrained: "text-red-500",
  Stunned: "text-indigo-400",
  Unconscious: "text-slate-600",
};
