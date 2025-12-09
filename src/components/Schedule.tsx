import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Clock, ChevronLeft, ChevronRight, CalendarClock, Settings, X, Paperclip, Download, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getStudents, saveStudents, getClasses, saveClasses, getLessonPlans, saveLessonPlans, type Student, type Class, type LessonPlan, type LessonFile } from "../utils/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";

type ViewMode = "day" | "week" | "month";
type RecurrenceType = "once" | "weekly" | "custom";

export function Schedule() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  // Фильтр архивных классов
  const [showArchivedClasses, setShowArchivedClasses] = useState(false);
  
  // Диалоги
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "future">("single");
  
  // Текущий урок
  const [currentPlan, setCurrentPlan] = useState<LessonPlan | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [files, setFiles] = useState<LessonFile[]>([]);
  
  // Создание урока
  const [createTime, setCreateTime] = useState("09:00");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("once");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [weeksCount, setWeeksCount] = useState(4);
  const [createLessonClassId, setCreateLessonClassId] = useState("");
  const [createLessonSubgroupId, setCreateLessonSubgroupId] = useState("all");
  const [customDatesMonth, setCustomDatesMonth] = useState<Date>(new Date());
  
  // Редактирование класса
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [className, setClassName] = useState("");
  const [classColor, setClassColor] = useState("#8b5cf6");
  const [classSubgroups, setClassSubgroups] = useState<Array<{ id: string; name: string }>>([]);

  const classColors = [
    "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#14b8a6", "#6366f1",
  ];

  useEffect(() => {
    setStudents(getStudents());
    setClasses(getClasses());
    setLessonPlans(getLessonPlans());
  }, []);

  // Мемоизированные вычисляемые значения
  const selectedClass = useMemo(() => 
    classes.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  );
  
  const displayedClasses = useMemo(() => 
    classes.filter(c => showArchivedClasses ? c.archived : !c.archived),
    [classes, showArchivedClasses]
  );

  // Мемоизируем функцию получения уроков для даты
  const getLessonsForDate = useMemo(() => {
    return (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      return lessonPlans.filter(lp => {
        if (lp.date !== dateString) return false;
        
        // Фильтр по активным/завершенным классам
        const lessonClass = classes.find(c => c.id === lp.classId);
        if (lessonClass) {
          if (showArchivedClasses && !lessonClass.archived) return false;
          if (!showArchivedClasses && lessonClass.archived) return false;
        }
        
        if (selectedClassId && lp.classId !== selectedClassId) return false;
        if (selectedClassId && selectedSubgroupId !== "all") {
          return lp.subgroupId === selectedSubgroupId || lp.subgroupId === "all";
        }
        return true;
      }).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    };
  }, [lessonPlans, classes, showArchivedClasses, selectedClassId, selectedSubgroupId]);

  // Навигация
  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  };

  const getDateTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (viewMode === "week") {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getClassBadge = (lesson: LessonPlan) => {
    const cls = classes.find(c => c.id === lesson.classId);
    if (!cls) return null;
    
    let displayName = cls.name;
    if (lesson.subgroupId && lesson.subgroupId !== "all") {
      const subgroup = cls.subgroups?.find(sg => sg.id === lesson.subgroupId);
      if (subgroup) {
        displayName = `${cls.name} - ${subgroup.name}`;
      }
    }
    
    return { name: displayName, color: cls.color };
  };

  // Создание урока
  const openCreateDialog = (date?: Date) => {
    const d = date || currentDate;
    setSelectedDates([d]);
    setCreateTime("09:00");
    setRecurrenceType("once");
    setWeeksCount(4);
    setCustomDatesMonth(d);
    setCreateLessonClassId(selectedClassId || "");
    setCreateLessonSubgroupId(selectedSubgroupId === "all" ? "all" : selectedSubgroupId);
    setIsCreateDialogOpen(true);
  };

  const createLessons = () => {
    if (!createLessonClassId) {
      toast.error("Выберите класс");
      return;
    }

    const selectedClassForLesson = classes.find(c => c.id === createLessonClassId);
    if (!selectedClassForLesson) return;

    let datesToCreate: Date[] = [];

    if (recurrenceType === "once") {
      datesToCreate = selectedDates;
    } else if (recurrenceType === "weekly") {
      const startDate = selectedDates[0] || currentDate;
      for (let i = 0; i < weeksCount; i++) {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + (i * 7));
        datesToCreate.push(newDate);
      }
    } else if (recurrenceType === "custom") {
      datesToCreate = selectedDates;
    }

    if (datesToCreate.length === 0) {
      toast.error("Выберите хотя бы одну дату");
      return;
    }

    const newPlans: LessonPlan[] = datesToCreate.map(date => ({
      id: `${Date.now()}-${Math.random()}`,
      title: `Урок ${selectedClassForLesson.name}`,
      date: date.toISOString().split('T')[0],
      time: createTime,
      description: "",
      classId: createLessonClassId,
      subgroupId: createLessonSubgroupId,
      files: []
    }));

    const updated = [...lessonPlans, ...newPlans];
    setLessonPlans(updated);
    saveLessonPlans(updated);
    setIsCreateDialogOpen(false);
    toast.success(`Создано уроков: ${newPlans.length}`);
  };

  // Просмотр/редактирование урока
  const openLessonDialog = (plan: LessonPlan) => {
    setCurrentPlan(plan);
    setTitle(plan.title);
    setDescription(plan.description);
    setTime(plan.time || "");
    setFiles(plan.files || []);
    setIsLessonDialogOpen(true);
  };

  const saveLessonChanges = () => {
    if (!currentPlan) return;

    const updated = lessonPlans.map(lp => 
      lp.id === currentPlan.id 
        ? { ...lp, title, description, time, files }
        : lp
    );
    setLessonPlans(updated);
    saveLessonPlans(updated);
    setIsLessonDialogOpen(false);
    toast.success("Урок обновлен");
  };

  const deleteLesson = (planId: string) => {
    setDeletingLessonId(planId);
    setDeleteMode("single");
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteLesson = () => {
    if (!deletingLessonId) return;
    
    if (deleteMode === "single") {
      // Удаляем только один урок
      const updated = lessonPlans.filter(lp => lp.id !== deletingLessonId);
      setLessonPlans(updated);
      saveLessonPlans(updated);
      setIsDeleteConfirmOpen(false);
      setIsLessonDialogOpen(false);
      setDeletingLessonId(null);
      toast.success("Урок удален");
    } else {
      // Удаляем этот урок и все будущие уроки того же класса и подгруппы
      const deletingLesson = lessonPlans.find(lp => lp.id === deletingLessonId);
      if (!deletingLesson) return;

      const updated = lessonPlans.filter(lp => {
        // Если это текущий урок - удаляем
        if (lp.id === deletingLessonId) return false;
        
        // Если это урок того же класса и подгруппы
        if (lp.classId === deletingLesson.classId && lp.subgroupId === deletingLesson.subgroupId) {
          // Если дата урока больше дате удаляемого урока - удаляем
          if (lp.date > deletingLesson.date) return false;
        }
        
        return true;
      });
      
      const deletedCount = lessonPlans.length - updated.length;
      setLessonPlans(updated);
      saveLessonPlans(updated);
      setIsDeleteConfirmOpen(false);
      setIsLessonDialogOpen(false);
      setDeletingLessonId(null);
      toast.success(`Удалено уроков: ${deletedCount}`);
    }
  };

  // Управление классами
  const openClassDialog = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls);
      setClassName(cls.name);
      setClassColor(cls.color);
      setClassSubgroups(cls.subgroups || []);
    } else {
      setEditingClass(null);
      setClassName("");
      setClassColor("#8b5cf6");
      setClassSubgroups([]);
    }
    setIsClassDialogOpen(true);
  };

  const saveClass = () => {
    if (!className.trim()) {
      toast.error("Введите название класса");
      return;
    }

    let updated: Class[];
    if (editingClass) {
      updated = classes.map(c => 
        c.id === editingClass.id 
          ? { ...c, name: className, color: classColor, subgroups: classSubgroups }
          : c
      );
    } else {
      const newClass: Class = {
        id: Date.now().toString(),
        name: className,
        color: classColor,
        subgroups: classSubgroups
      };
      updated = [...classes, newClass];
    }

    setClasses(updated);
    saveClasses(updated);
    setIsClassDialogOpen(false);
    toast.success(editingClass ? "Класс обновлен" : "Класс создан");
  };

  const archiveClass = () => {
    if (!editingClass) return;
    
    if (!confirm(`Завершить класс "${editingClass.name}"?\n\nЭто действие:\n- Переместит класс в архив\n- Удалит все будущие уроки\n- Ученики останутся привязанными к классу\n- Прошлые уроки сохранятся`)) {
      return;
    }

    const updated = classes.map(c => 
      c.id === editingClass.id ? { ...c, archived: true } : c
    );
    setClasses(updated);
    saveClasses(updated);

    const todayString = new Date().toISOString().split('T')[0];
    const updatedPlans = lessonPlans.filter(lp => 
      lp.classId !== editingClass.id || lp.date < todayString
    );
    setLessonPlans(updatedPlans);
    saveLessonPlans(updatedPlans);

    if (selectedClassId === editingClass.id) {
      setSelectedClassId("");
      setSelectedSubgroupId("all");
    }

    setIsClassDialogOpen(false);
    toast.success("Класс завершен");
  };

  const restoreClass = () => {
    if (!editingClass) return;
    
    const updated = classes.map(c => 
      c.id === editingClass.id ? { ...c, archived: false } : c
    );
    setClasses(updated);
    saveClasses(updated);
    
    // Если это был последний завершенный класс, переключаемся на активные
    if (updated.filter(c => c.archived).length === 0) {
      setShowArchivedClasses(false);
    }
    
    setIsClassDialogOpen(false);
    toast.success("Класс восстановлен");
  };

  const deleteClassPermanently = () => {
    if (!editingClass) return;

    if (!confirm(`Вы уверены, что хотите ПОЛНОСТЬЮ удалить класс "${editingClass.name}"?\n\nЭто действие:\n- Удалит класс безвозвратно\n- Удалит ВСЕ уроки этого класса (прошлые и будущие)\n- Отвяжет учеников от класса\n\nЭто действие нельзя отменить!`)) {
      return;
    }

    // Удаляем класс
    const updatedClasses = classes.filter(c => c.id !== editingClass.id);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    // Отвязываем учеников
    const updatedStudents = students.map(s =>
      s.classId === editingClass.id ? { ...s, classId: "", subgroupId: "" } : s
    );
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    // Удаляем все уроки
    const updatedPlans = lessonPlans.filter(lp => lp.classId !== editingClass.id);
    setLessonPlans(updatedPlans);
    saveLessonPlans(updatedPlans);

    if (selectedClassId === editingClass.id) {
      setSelectedClassId("");
      setSelectedSubgroupId("all");
    }

    // Если это был последний завершенный класс, переключаемся на активные
    if (updatedClasses.filter(c => c.archived).length === 0) {
      setShowArchivedClasses(false);
    }

    setIsClassDialogOpen(false);
    toast.success("Класс полностью удален");
  };

  const addSubgroup = () => {
    const newSubgroup = {
      id: Date.now().toString(),
      name: `Подгруппа ${classSubgroups.length + 1}`
    };
    setClassSubgroups([...classSubgroups, newSubgroup]);
  };

  const removeSubgroup = (id: string) => {
    setClassSubgroups(classSubgroups.filter(s => s.id !== id));
  };

  const updateSubgroupName = (id: string, name: string) => {
    setClassSubgroups(classSubgroups.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: LessonFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.type,
          data: reader.result as string,
          size: file.size
        };
        setFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  const downloadFile = (file: LessonFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  // Рендер календаря для просмотра
  const renderCalendar = () => {
    if (viewMode === "day") {
      const lessons = getLessonsForDate(currentDate);
      return (
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-purple-700">
                {currentDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardTitle>
              <Button onClick={() => openCreateDialog(currentDate)} size="sm" className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-1" />
                Создать урок
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Нет уроков</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => {
                  const badge = getClassBadge(lesson);
                  return (
                    <div
                      key={lesson.id}
                      className="group relative p-4 pr-10 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div onClick={() => openLessonDialog(lesson)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {lesson.time && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                                  {lesson.time}
                                </span>
                              )}
                              {badge && (
                                <span 
                                  className="px-2 py-1 rounded text-sm border"
                                  style={{
                                    borderColor: badge.color,
                                    backgroundColor: badge.color + "22",
                                    color: badge.color
                                  }}
                                >
                                  {badge.name}
                                </span>
                              )}
                            </div>
                            <p className="font-medium">{lesson.title}</p>
                            {lesson.description && (
                              <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLesson(lesson.id);
                        }}
                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Удалить урок"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (viewMode === "week") {
      const weekStart = getWeekStart(currentDate);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      });

      return (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const lessons = getLessonsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <Card 
                key={idx} 
                className={`border-2 ${isToday ? 'border-purple-400 bg-purple-50' : 'border-purple-200'}`}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg ${isToday ? 'font-bold text-purple-700' : ''}`}>
                      {day.getDate()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {lessons.map(lesson => {
                    const badge = getClassBadge(lesson);
                    return (
                      <div
                        key={lesson.id}
                        className="group relative p-2 pr-6 rounded border border-purple-200 hover:border-purple-400 cursor-pointer text-xs"
                        style={{
                          borderColor: badge?.color,
                          backgroundColor: badge?.color + "15"
                        }}
                      >
                        <div onClick={() => openLessonDialog(lesson)}>
                          {lesson.time && <div className="font-medium">{lesson.time}</div>}
                          <div className="truncate">{lesson.title}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLesson(lesson.id);
                          }}
                          className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="Удалить урок"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  <Button
                    onClick={() => openCreateDialog(day)}
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-dashed"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Урок
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }

    // Month view
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
    const daysInMonth = monthEnd.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            
            const lessons = getLessonsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <Card 
                key={idx}
                className={`border ${isToday ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}
              >
                <CardContent className="p-2">
                  <div className={`text-sm mb-1 ${isToday ? 'font-bold text-purple-700' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {lessons.map(lesson => {
                      const badge = getClassBadge(lesson);
                      return (
                        <div
                          key={lesson.id}
                          className="group text-xs p-1.5 pr-5 rounded cursor-pointer truncate relative"
                          style={{ backgroundColor: badge?.color + "30" }}
                        >
                          <div onClick={() => openLessonDialog(lesson)}>
                            {lesson.time}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLesson(lesson.id);
                            }}
                            className="absolute top-0.5 right-0.5 p-0.5 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="Удалить урок"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => openCreateDialog(day)}
                      className="w-full text-xs p-1 border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded flex items-center justify-center text-gray-500 hover:text-green-600 transition-all"
                      title="Добавить урок"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-purple-700">Расписание</h1>
      </div>

      {/* Фильтры по классам */}
      <Card className="border-2 border-purple-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Label className="text-sm whitespace-nowrap">Класс:</Label>
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <button
                onClick={() => {
                  setSelectedClassId("");
                  setSelectedSubgroupId("all");
                }}
                className={`px-3 py-1 text-sm rounded-lg border-2 transition-all ${
                  selectedClassId === "" ? "border-purple-500 bg-purple-100 font-medium" : "border-gray-300 hover:border-purple-300"
                }`}
              >
                Все классы
              </button>
              {displayedClasses.map((cls) => (
                <div key={cls.id} className="relative group">
                  <button
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setSelectedSubgroupId("all");
                    }}
                    className={`px-3 py-1 pr-8 text-sm rounded-lg border-2 transition-all ${
                      selectedClassId === cls.id ? "bg-opacity-20" : "border-gray-300"
                    }`}
                    style={{
                      borderColor: selectedClassId === cls.id ? cls.color : undefined,
                      backgroundColor: selectedClassId === cls.id ? cls.color + "33" : undefined,
                    }}
                  >
                    {cls.name}
                  </button>
                  <button
                    onClick={() => openClassDialog(cls)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-purple-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Редактировать класс"
                  >
                    <Settings className="w-3 h-3 text-purple-600" />
                  </button>
                </div>
              ))}
              <Button
                onClick={() => openClassDialog()}
                size="sm"
                variant="outline"
                className="h-7 px-2 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-purple-600"
              >
                <Plus className="w-3 h-3 mr-1" />
                Новый класс
              </Button>
            </div>
            {classes.filter(c => c.archived).length > 0 && (
              <Button
                onClick={() => {
                  setShowArchivedClasses(!showArchivedClasses);
                  setSelectedClassId("");
                  setSelectedSubgroupId("all");
                }}
                size="sm"
                variant={showArchivedClasses ? "default" : "outline"}
                className={showArchivedClasses 
                  ? "h-7 px-3 bg-gray-600 hover:bg-gray-700 text-white" 
                  : "h-7 px-3 border-2 border-gray-400 text-gray-600 hover:bg-gray-100"
                }
              >
                {showArchivedClasses ? "Завершенные" : "Активные"}
              </Button>
            )}
            {selectedClass && selectedClass.subgroups && selectedClass.subgroups.length > 0 && (
              <>
                <Label className="text-sm whitespace-nowrap">Подгруппа:</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedSubgroupId("all")}
                    className={`px-3 py-1 text-sm rounded-lg border-2 transition-all ${
                      selectedSubgroupId === "all" ? "border-purple-500 bg-purple-100" : "border-gray-300"
                    }`}
                  >
                    Все
                  </button>
                  {selectedClass.subgroups.map((subgroup) => (
                    <button
                      key={subgroup.id}
                      onClick={() => setSelectedSubgroupId(subgroup.id)}
                      className={`px-3 py-1 text-sm rounded-lg border-2 transition-all ${
                        selectedSubgroupId === subgroup.id ? "bg-opacity-20" : "border-gray-300"
                      }`}
                      style={{
                        borderColor: selectedSubgroupId === subgroup.id ? selectedClass.color : undefined,
                        backgroundColor: selectedSubgroupId === subgroup.id ? selectedClass.color + "33" : undefined,
                      }}
                    >
                      {subgroup.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Навигация */}
      <Card className="border-2 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                onClick={() => setViewMode("day")}
                size="sm"
                className={viewMode === "day" ? "bg-purple-600" : ""}
              >
                День
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                size="sm"
                className={viewMode === "week" ? "bg-purple-600" : ""}
              >
                Неделя
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
                size="sm"
                className={viewMode === "month" ? "bg-purple-600" : ""}
              >
                Месяц
              </Button>
              <div className="h-6 w-px bg-gray-300 mx-1" />
              <Button
                onClick={() => openCreateDialog(currentDate)}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить урок
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("prev")} 
                className="h-10 w-10 p-0 border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-purple-600 rounded-full shadow-sm transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="text-center px-6 py-2 bg-white rounded-lg border-2 border-purple-200 shadow-sm min-w-[280px]">
                <h3 className="text-purple-700 font-semibold">{getDateTitle()}</h3>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToToday} 
                className="px-4 py-2 h-10 border-2 border-blue-300 hover:border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 font-medium shadow-sm transition-all"
              >
                <CalendarClock className="w-4 h-4 mr-2" />
                Сегодня
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("next")} 
                className="h-10 w-10 p-0 border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-purple-600 rounded-full shadow-sm transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Календарь */}
      {renderCalendar()}

      {/* Диалог создания урока */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать урок</DialogTitle>
            <DialogDescription>
              Выберите класс, время и настройте повторение урока
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Класс</Label>
              <select
                value={createLessonClassId}
                onChange={(e) => {
                  setCreateLessonClassId(e.target.value);
                  setCreateLessonSubgroupId("all");
                }}
                className="w-full px-3 py-2.5 border rounded"
              >
                <option value="">Выберите класс</option>
                {displayedClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            {createLessonClassId && (() => {
              const cls = classes.find(c => c.id === createLessonClassId);
              return cls?.subgroups && cls.subgroups.length > 0 ? (
                <div>
                  <Label>Подгруппа</Label>
                  <select
                    value={createLessonSubgroupId}
                    onChange={(e) => setCreateLessonSubgroupId(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded"
                  >
                    <option value="all">Весь класс</option>
                    {cls.subgroups.map(sg => (
                      <option key={sg.id} value={sg.id}>{sg.name}</option>
                    ))}
                  </select>
                </div>
              ) : null;
            })()}

            <div>
              <Label>Время</Label>
              <Input
                type="time"
                value={createTime}
                onChange={(e) => setCreateTime(e.target.value)}
              />
            </div>

            <div>
              <Label>Повторение</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <input
                    type="radio"
                    checked={recurrenceType === "once"}
                    onChange={() => setRecurrenceType("once")}
                    className="cursor-pointer"
                  />
                  <span>Один раз</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <input
                    type="radio"
                    checked={recurrenceType === "weekly"}
                    onChange={() => setRecurrenceType("weekly")}
                    className="cursor-pointer"
                  />
                  <span>Еженедельно</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <input
                    type="radio"
                    checked={recurrenceType === "custom"}
                    onChange={() => setRecurrenceType("custom")}
                    className="cursor-pointer"
                  />
                  <span>По дням</span>
                </label>
              </div>
            </div>

            {recurrenceType === "weekly" && (
              <div>
                <Label>Количество недель</Label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={weeksCount}
                  onChange={(e) => setWeeksCount(parseInt(e.target.value) || 1)}
                />
              </div>
            )}

            {recurrenceType === "custom" && (
              <div className="space-y-3">
                <Label>Выберите дни в календаре</Label>
                <div className="flex items-center justify-between mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(customDatesMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCustomDatesMonth(newDate);
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="font-medium">
                    {customDatesMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(customDatesMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCustomDatesMonth(newDate);
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = new Date(customDatesMonth.getFullYear(), customDatesMonth.getMonth(), 1);
                      const monthEnd = new Date(customDatesMonth.getFullYear(), customDatesMonth.getMonth() + 1, 0);
                      const startDay = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
                      const daysInMonth = monthEnd.getDate();
                      const days: (Date | null)[] = [];
                      
                      for (let i = 0; i < startDay; i++) {
                        days.push(null);
                      }
                      for (let i = 1; i <= daysInMonth; i++) {
                        days.push(new Date(customDatesMonth.getFullYear(), customDatesMonth.getMonth(), i));
                      }
                      
                      return days.map((day, idx) => {
                        if (!day) return <div key={idx} />;
                        
                        const isSelected = selectedDates.some(
                          d => d.toDateString() === day.toDateString()
                        );
                        const isToday = day.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDates(selectedDates.filter(
                                  d => d.toDateString() !== day.toDateString()
                                ));
                              } else {
                                setSelectedDates([...selectedDates, day]);
                              }
                            }}
                            className={`
                              aspect-square rounded text-sm transition-all
                              ${
                                isSelected
                                  ? 'bg-purple-600 text-white font-medium shadow-md hover:bg-purple-700'
                                  : isToday
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                                  : 'hover:bg-gray-200 text-gray-700'
                              }
                            `}
                          >
                            {day.getDate()}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
                {selectedDates.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-sm text-gray-700">Выбрано дней:</span>
                    <span className="font-medium text-purple-700">{selectedDates.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={createLessons} className="bg-purple-600 hover:bg-purple-700">
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог просмотра/редактирования урока */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Урок</DialogTitle>
            <DialogDescription>
              Редактируйте информацию об уроке и прикрепляйте файлы
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Информация о классе и группе */}
            {currentPlan && (() => {
              const badge = getClassBadge(currentPlan);
              return badge ? (
                <div className="p-3 rounded-lg border-2" style={{
                  borderColor: badge.color,
                  backgroundColor: badge.color + "15"
                }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Класс и группа:</span>
                    <span 
                      className="px-3 py-1 rounded font-medium"
                      style={{
                        backgroundColor: badge.color + "33",
                        color: badge.color
                      }}
                    >
                      {badge.name}
                    </span>
                  </div>
                </div>
              ) : null;
            })()}

            <div>
              <Label>Название</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название урока"
              />
            </div>

            <div>
              <Label>Время</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div>
              <Label>Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание урока"
                rows={4}
              />
            </div>

            <div>
              <Label>Файлы</Label>
              <div className="space-y-2">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadFile(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-purple-400">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">Добавить файлы</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => currentPlan && deleteLesson(currentPlan.id)}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={saveLessonChanges} className="bg-purple-600 hover:bg-purple-700">
                Сохранить
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог управления классом */}
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Редактировать класс" : "Новый класс"}</DialogTitle>
            <DialogDescription>
              {editingClass ? "Измените настройки класса, подгруппы и цвет" : "Создайте новый класс с подгруппами"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название класса</Label>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Например: 1А"
              />
            </div>

            <div>
              <Label>Цвет</Label>
              <div className="flex gap-2 flex-wrap">
                {classColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setClassColor(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      classColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {(!editingClass || !editingClass.archived) && (
              <div>
                <Label>Подгруппы</Label>
                <div className="space-y-2">
                  {classSubgroups.map(sg => (
                    <div key={sg.id} className="flex items-center gap-2">
                      <Input
                        value={sg.name}
                        onChange={(e) => updateSubgroupName(sg.id, e.target.value)}
                        placeholder="Название подгруппы"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSubgroup(sg.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={addSubgroup}
                    variant="outline"
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить подгруппу
                  </Button>
                </div>
              </div>
            )}

            {editingClass && editingClass.archived && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm text-amber-700">
                  ⚠️ Завершенный класс. Подгруппы нельзя изменить. Можно изменить только название и цвет.
                </p>
              </div>
            )}

            {editingClass && (
              <div className="border rounded p-4" style={{ backgroundColor: classColor + "22" }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: classColor }} />
                  <div className="font-medium" style={{ color: classColor }}>
                    {className || "Название класса"}
                  </div>
                  {editingClass.archived && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      Завершен
                    </span>
                  )}
                  {classSubgroups.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({classSubgroups.length} {classSubgroups.length === 1 ? 'подгруппа' : classSubgroups.length < 5 ? 'подгруппы' : 'подгрупп'})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              {editingClass && !editingClass.archived && (
                <Button 
                  variant="outline" 
                  onClick={archiveClass}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Завершить класс
                </Button>
              )}
              {editingClass && editingClass.archived && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={restoreClass}
                    className="border-green-300 text-green-600 hover:bg-green-50 hover:border-green-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Восстановить класс
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={deleteClassPermanently}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить навсегда
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={saveClass} className="bg-purple-600 hover:bg-purple-700">
                {editingClass ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления урока */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удаление урока</DialogTitle>
            <DialogDescription>
              Выберите, какие уроки вы хотите удалить
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="deleteMode"
                checked={deleteMode === "single"}
                onChange={() => setDeleteMode("single")}
                className="mt-1 cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-medium">Только этот урок</div>
                <div className="text-sm text-gray-500">Будет удален только выбранный урок</div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="deleteMode"
                checked={deleteMode === "future"}
                onChange={() => setDeleteMode("future")}
                className="mt-1 cursor-pointer"
              />
              <div className="flex-1">
                <div className="font-medium">Этот и все будущие уроки</div>
                <div className="text-sm text-gray-500">
                  Будут удалены все будущие уроки этого класса и подгруппы
                </div>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Отмена
            </Button>
            <Button onClick={confirmDeleteLesson} className="bg-red-600 hover:bg-red-700">
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}