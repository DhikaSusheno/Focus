export interface AdhdTarget {
  id: string;
  title: string;
  category: 'ShortTerm' | 'LongTerm';
  isCompleted: boolean;
  whyText?: string; // Emotional motivation: "Kenapa"
}

export interface JournalSummaryResult {
  achievements: string[];
  burnoutLevel: string;
  adhdSaran: string;
  bulletSummary: string;
}

export interface Task {
  id: string;
  title: string;
  urgency: 'Low' | 'Medium' | 'High';
  xpReward: number;
  coinReward: number;
  isCompleted: boolean;
  notes?: string;
}

export interface MindmapNode {
  id: string;
  label: string;
  description: string;
  parentId: string | null;
  xpReward: number;
  suggestedResources: string[];
  x?: number; // Spatial positioning coordinate X
  y?: number; // Spatial positioning coordinate Y
}

export interface Mindmap {
  title: string;
  nodes: MindmapNode[];
  completedNodes: string[];
}

export interface TechNewsItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  whyItMatters: string;
  adhdFriendlyStep: string;
}

export interface RewardItem {
  id: string;
  title: string;
  cost: number;
  icon: 'game' | 'social' | 'coffee' | 'food' | 'rest' | 'theme' | 'addon';
  type?: 'theme' | 'soundpack' | 'avatar' | 'template';
  unlocked?: boolean;
}

export type ADHDSubtype = 'Combined' | 'Inattentive' | 'Hyperactive' | 'Belum Dinilai';
export type Chronotype = 'Night Owl (Burung Hantu)' | 'Morning Lark (Burung Pagi)' | 'Belum Dinilai';

export interface OnboardingAnswers {
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  q5?: number;
  q6?: number;
  q7?: number;
  q8?: number;
  q9?: number;
  q10?: number;
}
