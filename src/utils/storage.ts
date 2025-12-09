export interface Lesson {
  id: string;
  date: string;
  stars: number; // 0-5
  attended: boolean;
}

export interface Student {
  id: string;
  name: string;
  lessons: Lesson[];
  classId: string;
  subgroupId: string;
  spentStars?: number; // Потраченные звездочки в магазине
  purchaseHistory?: PurchaseHistory[]; // История покупок
}

export interface PurchaseHistory {
  id: string;
  prizeId: string;
  prizeName: string;
  cost: number;
  date: string; // ISO date string
  refunded?: boolean; // Был ли возврат
}

export interface Subgroup {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
  color: string;
  subgroups: Subgroup[];
  archived?: boolean;
}

export interface Prize {
  id: string;
  name: string;
  cost: number;
  description: string;
  emoji: string;
  quantity?: number; // Количество доступных призов
  archived?: boolean; // Призы с quantity = 0 архивируются
}

export interface LessonFile {
  id: string;
  name: string;
  type: string;
  data: string; // base64
  size: number;
}

export interface LessonPlan {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  title: string;
  description: string;
  files: LessonFile[];
  classId?: string;
  subgroupId?: string;
}

const STUDENTS_KEY = "starcoin_students";
const PRIZES_KEY = "starcoin_prizes";
const CLASSES_KEY = "starcoin_classes";
const LESSON_PLANS_KEY = "starcoin_lesson_plans";

const defaultPrizes: Prize[] = [
  { id: "1", name: "Наклейка", cost: 10, description: "Красивая наклейка с героем", emoji: "🎨" },
  { id: "2", name: "Конфета", cost: 15, description: "Вкусная конфета", emoji: "🍬" },
  { id: "3", name: "Закладка", cost: 25, description: "Закладка для книг", emoji: "🔖" },
  { id: "4", name: "Карандаш", cost: 30, description: "Цветной карандаш", emoji: "✏️" },
  { id: "5", name: "Блокнот", cost: 50, description: "Маленький блокнот", emoji: "📓" },
  { id: "6", name: "Игрушка", cost: 100, description: "Маленькая игрушка", emoji: "🎁" },
];

export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STUDENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveStudents = (students: Student[]) => {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
};

export const getPrizes = (): Prize[] => {
  const data = localStorage.getItem(PRIZES_KEY);
  return data ? JSON.parse(data) : defaultPrizes;
};

export const savePrizes = (prizes: Prize[]) => {
  localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
};

export const getClasses = (): Class[] => {
  const data = localStorage.getItem(CLASSES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveClasses = (classes: Class[]) => {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
};

export const getLessonPlans = (): LessonPlan[] => {
  const data = localStorage.getItem(LESSON_PLANS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLessonPlans = (plans: LessonPlan[]) => {
  localStorage.setItem(LESSON_PLANS_KEY, JSON.stringify(plans));
};