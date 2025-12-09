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

// Ключи для localStorage
const STUDENTS_KEY = "starcoin_students";
const PRIZES_KEY = "starcoin_prizes";
const CLASSES_KEY = "starcoin_classes";
const LESSON_PLANS_KEY = "starcoin_lesson_plans";
const BACKUP_KEY = "starcoin_backup";
const LAST_BACKUP_KEY = "starcoin_last_backup";

// Интерфейс для экспорта всех данных
export interface ExportData {
  version: string;
  exportDate: string;
  students: Student[];
  prizes: Prize[];
  classes: Class[];
  lessonPlans: LessonPlan[];
}

const defaultPrizes: Prize[] = [
  { id: "1", name: "Наклейка", cost: 10, description: "Красивая наклейка с героем", emoji: "🎨" },
  { id: "2", name: "Конфета", cost: 15, description: "Вкусная конфета", emoji: "🍬" },
  { id: "3", name: "Закладка", cost: 25, description: "Закладка для книг", emoji: "🔖" },
  { id: "4", name: "Карандаш", cost: 30, description: "Цветной карандаш", emoji: "✏️" },
  { id: "5", name: "Блокнот", cost: 50, description: "Маленький блокнот", emoji: "📓" },
  { id: "6", name: "Игрушка", cost: 100, description: "Маленькая игрушка", emoji: "🎁" },
];

// Проверка доступности localStorage
const isStorageAvailable = (): boolean => {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Безопасное чтение из localStorage
const safeGetItem = <T>(key: string, defaultValue: T): T => {
  if (!isStorageAvailable()) {
    console.warn("localStorage недоступен");
    return defaultValue;
  }

  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Ошибка при чтении ${key}:`, error);
    return defaultValue;
  }
};

// Безопасная запись в localStorage
const safeSetItem = <T>(key: string, value: T): boolean => {
  if (!isStorageAvailable()) {
    console.warn("localStorage недоступен");
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Ошибка при записи ${key}:`, error);
    // Попытка освободить место, удалив старые бэкапы
    if (error instanceof DOMException && error.code === 22) {
      try {
        localStorage.removeItem(BACKUP_KEY);
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
};

// Основные функции для работы с данными
export const getStudents = (): Student[] => {
  return safeGetItem<Student[]>(STUDENTS_KEY, []);
};

export const saveStudents = (students: Student[]): boolean => {
  const success = safeSetItem(STUDENTS_KEY, students);
  if (success) {
    createAutoBackup();
  }
  return success;
};

export const getPrizes = (): Prize[] => {
  const prizes = safeGetItem<Prize[]>(PRIZES_KEY, []);
  return prizes.length > 0 ? prizes : defaultPrizes;
};

export const savePrizes = (prizes: Prize[]): boolean => {
  const success = safeSetItem(PRIZES_KEY, prizes);
  if (success) {
    createAutoBackup();
  }
  return success;
};

export const getClasses = (): Class[] => {
  return safeGetItem<Class[]>(CLASSES_KEY, []);
};

export const saveClasses = (classes: Class[]): boolean => {
  const success = safeSetItem(CLASSES_KEY, classes);
  if (success) {
    createAutoBackup();
  }
  return success;
};

export const getLessonPlans = (): LessonPlan[] => {
  return safeGetItem<LessonPlan[]>(LESSON_PLANS_KEY, []);
};

export const saveLessonPlans = (plans: LessonPlan[]): boolean => {
  const success = safeSetItem(LESSON_PLANS_KEY, plans);
  if (success) {
    createAutoBackup();
  }
  return success;
};

// Автоматический бэкап (создается при каждом сохранении, но не чаще раза в час)
const createAutoBackup = (): void => {
  try {
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    const now = Date.now();
    
    // Создаем бэкап не чаще раза в час
    if (lastBackup) {
      const timeSinceLastBackup = now - parseInt(lastBackup, 10);
      if (timeSinceLastBackup < 3600000) { // 1 час
        return;
      }
    }

    const backup: ExportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      students: getStudents(),
      prizes: getPrizes(),
      classes: getClasses(),
      lessonPlans: getLessonPlans(),
    };

    safeSetItem(BACKUP_KEY, backup);
    localStorage.setItem(LAST_BACKUP_KEY, now.toString());
  } catch (error) {
    console.error("Ошибка при создании бэкапа:", error);
  }
};

// Экспорт всех данных
export const exportAllData = (): ExportData => {
  return {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    students: getStudents(),
    prizes: getPrizes(),
    classes: getClasses(),
    lessonPlans: getLessonPlans(),
  };
};

// Экспорт данных в JSON файл
export const exportToFile = (): void => {
  try {
    const data = exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `starcoin-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Ошибка при экспорте:", error);
    throw new Error("Не удалось экспортировать данные");
  }
};

// Импорт данных из JSON
export const importFromData = (data: ExportData): boolean => {
  try {
    // Валидация данных
    if (!data.version || !data.exportDate) {
      throw new Error("Неверный формат данных");
    }

    // Сохраняем данные
    if (data.students) safeSetItem(STUDENTS_KEY, data.students);
    if (data.prizes) safeSetItem(PRIZES_KEY, data.prizes);
    if (data.classes) safeSetItem(CLASSES_KEY, data.classes);
    if (data.lessonPlans) safeSetItem(LESSON_PLANS_KEY, data.lessonPlans);

    // Создаем бэкап после импорта
    createAutoBackup();
    return true;
  } catch (error) {
    console.error("Ошибка при импорте:", error);
    return false;
  }
};

// Импорт из файла
export const importFromFile = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ExportData;
        const success = importFromData(data);
        resolve(success);
      } catch (error) {
        console.error("Ошибка при чтении файла:", error);
        reject(new Error("Неверный формат файла"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Ошибка при чтении файла"));
    };

    reader.readAsText(file);
  });
};

// Восстановление из автоматического бэкапа
export const restoreFromBackup = (): boolean => {
  try {
    const backup = safeGetItem<ExportData>(BACKUP_KEY, null);
    if (!backup) {
      return false;
    }
    return importFromData(backup);
  } catch (error) {
    console.error("Ошибка при восстановлении из бэкапа:", error);
    return false;
  }
};

// Получение информации о бэкапе
export const getBackupInfo = (): { exists: boolean; date: string | null } => {
  try {
    const backup = safeGetItem<ExportData>(BACKUP_KEY, null);
    return {
      exists: backup !== null,
      date: backup?.exportDate || null,
    };
  } catch {
    return { exists: false, date: null };
  }
};

// Очистка всех данных
export const clearAllData = (): boolean => {
  try {
    if (!isStorageAvailable()) return false;
    
    localStorage.removeItem(STUDENTS_KEY);
    localStorage.removeItem(PRIZES_KEY);
    localStorage.removeItem(CLASSES_KEY);
    localStorage.removeItem(LESSON_PLANS_KEY);
    // Бэкап не удаляем намеренно
    return true;
  } catch (error) {
    console.error("Ошибка при очистке данных:", error);
    return false;
  }
};

// Получение статистики использования хранилища
export const getStorageStats = (): {
  totalSize: number;
  itemsCount: number;
  available: boolean;
} => {
  if (!isStorageAvailable()) {
    return { totalSize: 0, itemsCount: 0, available: false };
  }

  let totalSize = 0;
  let itemsCount = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("starcoin_")) {
      const value = localStorage.getItem(key) || "";
      totalSize += key.length + value.length;
      itemsCount++;
    }
  }

  return {
    totalSize,
    itemsCount,
    available: true,
  };
};