import { useState, useEffect, useMemo, useCallback } from "react";
import { Star, UserPlus, Trash2, Users, X, Pencil, Plus, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getStudents, saveStudents, getClasses, saveClasses, getLessonPlans, saveLessonPlans, type Student, type Class, type Subgroup, type LessonPlan } from "../utils/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";

export function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  
  // Диалоги
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);

  // Добавление студента
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("");
  const [newStudentSubgroup, setNewStudentSubgroup] = useState("");

  // Редактирование студента
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentClass, setEditStudentClass] = useState("");
  const [editStudentSubgroup, setEditStudentSubgroup] = useState("");

  // Управление классами
  const [newClassName, setNewClassName] = useState("");
  const [newClassColor, setNewClassColor] = useState("#8b5cf6");
  const [newSubgroupName, setNewSubgroupName] = useState("");
  
  // Редактирование класса
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [editClassColor, setEditClassColor] = useState("#8b5cf6");
  const [editClassSubgroups, setEditClassSubgroups] = useState<Array<{ id: string; name: string }>>([]);

  const classColors = [
    "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#14b8a6", "#6366f1",
  ];

  useEffect(() => {
    setStudents(getStudents());
    setClasses(getClasses());
    setLessonPlans(getLessonPlans());
  }, []);

  // Управление студентами
  const addStudent = () => {
    if (!newStudentName.trim()) {
      toast.error("Введите имя студента");
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      name: newStudentName.trim(),
      classId: newStudentClass === "none" ? "" : newStudentClass,
      subgroupId: newStudentSubgroup === "none" ? "" : newStudentSubgroup,
      lessons: [],
    };

    const updated = [...students, newStudent];
    setStudents(updated);
    saveStudents(updated);
    setNewStudentName("");
    setNewStudentClass("");
    setNewStudentSubgroup("");
    setIsAddStudentOpen(false);
    toast.success("Студент добавлен!");
  };

  const openEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditStudentName(student.name);
    setEditStudentClass(student.classId || "none");
    setEditStudentSubgroup(student.subgroupId || "none");
    setIsEditStudentOpen(true);
  };

  const saveEditStudent = () => {
    if (!editingStudent || !editStudentName.trim()) {
      toast.error("Введите имя студента");
      return;
    }

    const updated = students.map(s =>
      s.id === editingStudent.id
        ? {
            ...s,
            name: editStudentName.trim(),
            classId: editStudentClass === "none" ? "" : editStudentClass,
            subgroupId: editStudentSubgroup === "none" ? "" : editStudentSubgroup,
          }
        : s
    );

    setStudents(updated);
    saveStudents(updated);
    setIsEditStudentOpen(false);
    toast.success("Профиль обновлен!");
  };

  const deleteStudent = (studentId: string) => {
    if (!confirm("Удалить студента?")) return;

    const updated = students.filter(s => s.id !== studentId);
    setStudents(updated);
    saveStudents(updated);
    toast.success("Студент удален!");
  };

  // Управление классами
  const addClass = () => {
    if (!newClassName.trim()) {
      toast.error("Введите название класса");
      return;
    }

    const newClass: Class = {
      id: Date.now().toString(),
      name: newClassName.trim(),
      color: newClassColor,
      subgroups: [],
    };

    const updated = [...classes, newClass];
    setClasses(updated);
    saveClasses(updated);
    setNewClassName("");
    toast.success("Класс добавлен!");
  };

  const addSubgroup = (classId: string) => {
    if (!newSubgroupName.trim()) {
      toast.error("Введите название подгруппы");
      return;
    }

    const newSubgroup: Subgroup = {
      id: Date.now().toString(),
      name: newSubgroupName.trim(),
    };

    const updated = classes.map(cls =>
      cls.id === classId
        ? { ...cls, subgroups: [...(cls.subgroups || []), newSubgroup] }
        : cls
    );

    setClasses(updated);
    saveClasses(updated);
    setNewSubgroupName("");
    toast.success("Подгруппа добавлена!");
  };

  const deleteSubgroup = (classId: string, subgroupId: string) => {
    const updated = classes.map(cls =>
      cls.id === classId
        ? { ...cls, subgroups: cls.subgroups.filter(sg => sg.id !== subgroupId) }
        : cls
    );

    setClasses(updated);
    saveClasses(updated);

    const updatedStudents = students.map(s =>
      s.subgroupId === subgroupId ? { ...s, subgroupId: "" } : s
    );
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    toast.success("Подгруппа удалена!");
  };

  const openEditClass = (cls: Class) => {
    setEditingClass(cls);
    setEditClassName(cls.name);
    setEditClassColor(cls.color);
    setEditClassSubgroups(cls.subgroups || []);
    setIsEditClassOpen(true);
  };

  const saveEditClass = () => {
    if (!editingClass || !editClassName.trim()) {
      toast.error("Введите название класса");
      return;
    }

    const updated = classes.map(c =>
      c.id === editingClass.id
        ? { ...c, name: editClassName, color: editClassColor, subgroups: editClassSubgroups }
        : c
    );

    setClasses(updated);
    saveClasses(updated);
    setIsEditClassOpen(false);
    toast.success("Класс обновлен!");
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

    setIsEditClassOpen(false);
    toast.success("Класс завершен");
  };

  const restoreClass = () => {
    if (!editingClass) return;
    
    const updated = classes.map(c =>
      c.id === editingClass.id ? { ...c, archived: false } : c
    );
    setClasses(updated);
    saveClasses(updated);
    
    setIsEditClassOpen(false);
    toast.success("Класс восстановлен");
  };

  const addEditSubgroup = () => {
    const newSubgroup = {
      id: Date.now().toString(),
      name: `Подгруппа ${editClassSubgroups.length + 1}`
    };
    setEditClassSubgroups([...editClassSubgroups, newSubgroup]);
  };

  const removeEditSubgroup = (id: string) => {
    setEditClassSubgroups(editClassSubgroups.filter(s => s.id !== id));
  };

  const updateEditSubgroupName = (id: string, name: string) => {
    setEditClassSubgroups(editClassSubgroups.map(s => s.id === id ? { ...s, name } : s));
  };

  const deleteClass = (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);

    if (!confirm(`Вы уверены, что хотите ПОЛНОСТЬЮ удалить класс "${classToDelete?.name}"?\n\nЭто действие:\n- Удалит класс безвозвратно\n- Удалит ВСЕ уроки этого класса (прошлые и будущие)\n- Отвяжет учеников от класса\n\nЭто действие нельзя отменить!`)) {
      return;
    }

    const updatedClasses = classes.filter(c => c.id !== classId);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    const updatedStudents = students.map(s =>
      s.classId === classId ? { ...s, classId: "", subgroupId: "" } : s
    );
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    const updatedLessonPlans = lessonPlans.filter(lp => lp.classId !== classId);
    setLessonPlans(updatedLessonPlans);
    saveLessonPlans(updatedLessonPlans);

    toast.success("Класс полностью удален!");
  };

  // Оценки
  const updateLessonStars = (studentId: string, lessonDate: string, stars: number, attended: boolean = true) => {
    const updated = students.map(student => {
      if (student.id === studentId) {
        const lesson = student.lessons.find(l => l.date === lessonDate);

        if (!lesson) {
          const newLesson = {
            date: lessonDate,
            stars: attended ? stars : 0,
            attended: attended,
          };
          return { ...student, lessons: [...student.lessons, newLesson] };
        } else {
          return {
            ...student,
            lessons: student.lessons.map(l =>
              l.date === lessonDate
                ? { ...l, stars: attended ? stars : 0, attended: attended }
                : l
            ),
          };
        }
      }
      return student;
    });

    setStudents(updated);
    saveStudents(updated);
  };

  // Фильтрация
  const filteredStudents = useMemo(() => students.filter(s => {
    if (selectedClassId !== "all") {
      if (s.classId !== selectedClassId) return false;
    } else {
      // Если выбраны "Все классы", фильтруем по активным/завершенным
      const studentClass = classes.find(c => c.id === s.classId);
      if (studentClass) {
        if (showArchived && !studentClass.archived) return false;
        if (!showArchived && studentClass.archived) return false;
      }
    }
    if (selectedSubgroupId !== "all" && s.subgroupId !== selectedSubgroupId) return false;
    return true;
  }), [students, selectedClassId, selectedSubgroupId, classes, showArchived]);

  // Даты уроков из расписания
  const allLessonDates = useMemo(() => lessonPlans
    .filter(lp => {
      if (selectedClassId !== "all") {
        if (lp.classId !== selectedClassId) return false;
        if (selectedSubgroupId !== "all") {
          return lp.subgroupId === selectedSubgroupId || lp.subgroupId === "all";
        }
        return true;
      }
      // Фильтруем по активным/завершенным
      const lessonClass = classes.find(c => c.id === lp.classId);
      if (lessonClass) {
        if (showArchived && !lessonClass.archived) return false;
        if (!showArchived && lessonClass.archived) return false;
      }
      return true;
    })
    .map(lp => lp.date)
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()), 
  [lessonPlans, selectedClassId, selectedSubgroupId, classes, showArchived]);

  const getClassById = (classId: string) => classes.find(c => c.id === classId);
  const selectedClass = useMemo(() => getClassById(selectedClassId), [classes, selectedClassId]);

  // Статистика - все вычисления мемоизированы
  const overallAverage = useMemo(() => {
    if (filteredStudents.length === 0) return "0.0";
    
    const totalAvg = filteredStudents.reduce((acc, student) => {
      const validLessons = student.lessons.filter(l => l.attended && l.stars >= 0);
      if (validLessons.length === 0) return acc;
      const sum = validLessons.reduce((s, l) => s + l.stars, 0);
      const avg = sum / validLessons.length;
      return acc + avg;
    }, 0);
    
    return (totalAvg / filteredStudents.length).toFixed(1);
  }, [filteredStudents]);

  const totalClassStars = useMemo(() => 
    filteredStudents.reduce((acc, student) => {
      const validLessons = student.lessons.filter(l => l.attended && l.stars >= 0);
      return acc + validLessons.reduce((s, l) => s + l.stars, 0);
    }, 0),
    [filteredStudents]
  );

  const totalClassMaxStars = useMemo(() => 
    filteredStudents.reduce((acc, student) => {
      const validLessons = student.lessons.filter(l => l.attended && l.stars >= 0);
      return acc + (validLessons.length * 5);
    }, 0),
    [filteredStudents]
  );
  
  // Абсолютный максимум с учетом разных расписаний для разных групп
  const totalClassAbsoluteMaxStars = useMemo(() => 
    filteredStudents.reduce((acc, student) => {
      const studentLessonsCount = allLessonDates.filter(date => {
        const lessonPlansForDate = lessonPlans.filter(lp => lp.date === date);
        return lessonPlansForDate.some(lp => {
          if (lp.classId !== student.classId) return false;
          if (lp.subgroupId === "all") return true;
          if (student.subgroupId && lp.subgroupId === student.subgroupId) return true;
          if (!student.subgroupId && lp.subgroupId === "all") return true;
          return false;
        });
      }).length;
      return acc + (studentLessonsCount * 5);
    }, 0),
    [filteredStudents, allLessonDates, lessonPlans]
  );

  // Вспомогательные функции для вычислений
  const calculateAverage = useCallback((student: Student) => {
    const validLessons = student.lessons.filter(l => l.attended && l.stars >= 0);
    if (validLessons.length === 0) return 0;
    const sum = validLessons.reduce((acc, l) => acc + l.stars, 0);
    return (sum / validLessons.length).toFixed(1);
  }, []);

  const calculateTotalStars = useCallback((student: Student) => {
    const validLessons = student.lessons.filter(l => l.attended && l.stars >= 0);
    return validLessons.reduce((acc, l) => acc + l.stars, 0);
  }, []);

  const calculateMaxPossibleStars = useCallback((student: Student) => {
    const validLessons = student.lessons.filter(l => l.attended && l.stars >= 0);
    return validLessons.length * 5;
  }, []);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-purple-700">StarCoin</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isManageClassesOpen} onOpenChange={setIsManageClassesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-purple-300">
                <Users className="w-5 h-5 mr-2" />
                Классы
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Классы и подгруппы</DialogTitle>
                <DialogDescription>Управление классами и подгруппами</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Название класса</Label>
                  <Input
                    id="className"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Например: 1А"
                    className="px-3 py-2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Цвет</Label>
                  <div className="flex gap-2 flex-wrap">
                    {classColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewClassColor(color)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          newClassColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={addClass} className="w-full bg-purple-600 hover:bg-purple-700">
                  Добавить класс
                </Button>

                <div className="border-t pt-4 mt-4">
                  {classes.length === 0 ? (
                    <p className="text-gray-500 text-center py-2">Нет классов</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Активные классы */}
                      {classes.filter(cls => !cls.archived).length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-gray-700">Активные классы</h3>
                          {classes.filter(cls => !cls.archived).map(cls => (
                            <Card key={cls.id} className="border-2" style={{ borderColor: cls.color }}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded" style={{ backgroundColor: cls.color }} />
                                    <span>{cls.name}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteClass(cls.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Подгруппы</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Название подгруппы"
                                      value={newSubgroupName}
                                      onChange={(e) => setNewSubgroupName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          addSubgroup(cls.id);
                                        }
                                      }}
                                    />
                                    <Button
                                      onClick={() => addSubgroup(cls.id)}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                {cls.subgroups && cls.subgroups.length > 0 && (
                                  <div className="space-y-2">
                                    {cls.subgroups.map(subgroup => (
                                      <div
                                        key={subgroup.id}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                      >
                                        <span>{subgroup.name}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteSubgroup(cls.id, subgroup.id)}
                                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}

                      {/* Завершенные классы */}
                      {classes.filter(cls => cls.archived).length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-gray-700 pt-4">Завершенные классы</h3>
                          {classes.filter(cls => cls.archived).map(cls => (
                            <Card key={cls.id} className="border-2 bg-gray-50" style={{ borderColor: cls.color }}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded opacity-50" style={{ backgroundColor: cls.color }} />
                                    <span className="text-gray-600">{cls.name}</span>
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">Завершен</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditClass(cls)}
                                      className="text-purple-600 hover:text-purple-700"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteClass(cls.id)}
                                      className="text-red-500 hover:text-red-700"
                                      title="Удалить класс полностью"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-gray-500">
                                  Завершенный класс. История уроков сохранена в журнале.
                                  Восстановить класс можно через кнопку настроек.
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="w-5 h-5 mr-2" />
                Добавить ученика
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый ученик</DialogTitle>
                <DialogDescription>Добавьте нового ученика в систему</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Имя</Label>
                  <Input
                    id="studentName"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Введите имя"
                    onKeyDown={(e) => e.key === "Enter" && addStudent()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentClass">Класс</Label>
                  <Select
                    value={newStudentClass}
                    onValueChange={value => {
                      setNewStudentClass(value);
                      setNewStudentSubgroup("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите класс" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без класса</SelectItem>
                      {classes.filter(cls => !cls.archived).map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newStudentClass && newStudentClass !== "none" && (() => {
                  const selectedClassData = getClassById(newStudentClass);
                  return selectedClassData?.subgroups && selectedClassData.subgroups.length > 0 ? (
                    <div className="space-y-2">
                      <Label htmlFor="studentSubgroup">Подгруппа</Label>
                      <Select value={newStudentSubgroup} onValueChange={setNewStudentSubgroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите подгруппу" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без подгруппы</SelectItem>
                          {selectedClassData.subgroups.map(subgroup => (
                            <SelectItem key={subgroup.id} value={subgroup.id}>
                              {subgroup.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null;
                })()}
                <Button onClick={addStudent} className="w-full bg-purple-600 hover:bg-purple-700">
                  Добавить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Фильтры */}
      <div className="space-y-4">
        {classes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedClassId("all");
                    setSelectedSubgroupId("all");
                  }}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedClassId === "all"
                      ? "border-purple-500 bg-purple-100 text-purple-700"
                      : "border-gray-300 hover:border-purple-300"
                  }`}
                >
                  Все ({students.length})
                </button>
                {classes.filter(cls => showArchived ? cls.archived : !cls.archived).map(cls => {
                  const count = students.filter(s => s.classId === cls.id).length;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSelectedSubgroupId("all");
                      }}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedClassId === cls.id
                          ? "bg-opacity-20"
                          : "border-gray-300 hover:border-opacity-50"
                      }`}
                      style={{
                        borderColor: selectedClassId === cls.id ? cls.color : undefined,
                        backgroundColor: selectedClassId === cls.id ? cls.color + "33" : undefined,
                      }}
                    >
                      {cls.name} ({count})
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() => setShowArchived(!showArchived)}
                variant="outline"
                size="sm"
                className="border-2"
              >
                {showArchived ? "Активные классы" : "Завершенные классы"}
              </Button>
            </div>
          </div>
        )}

        {selectedClass && selectedClass.subgroups && selectedClass.subgroups.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedSubgroupId("all")}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedSubgroupId === "all"
                    ? "border-purple-500 bg-purple-100 text-purple-700"
                    : "border-gray-300 hover:border-purple-300"
                }`}
              >
                Все подгруппы
              </button>
              {selectedClass.subgroups.map(subgroup => {
                const count = students.filter(s => s.classId === selectedClassId && s.subgroupId === subgroup.id).length;
                return (
                  <button
                    key={subgroup.id}
                    onClick={() => setSelectedSubgroupId(subgroup.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedSubgroupId === subgroup.id
                        ? "bg-opacity-20"
                        : "border-gray-300 hover:border-opacity-50"
                    }`}
                    style={{
                      borderColor: selectedSubgroupId === subgroup.id ? selectedClass.color : undefined,
                      backgroundColor: selectedSubgroupId === subgroup.id ? selectedClass.color + "33" : undefined,
                    }}
                  >
                    {subgroup.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Статистика */}
      {filteredStudents.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Средний балл группы</p>
                <p className="text-2xl font-bold text-purple-700">{overallAverage} ★</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Звездочки группы</p>
                <p className="text-2xl font-bold text-purple-700">
                  {totalClassStars} / {totalClassMaxStars} ({totalClassAbsoluteMaxStars})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Учеников в группе</p>
                <p className="text-2xl font-bold text-purple-700">{filteredStudents.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего уроков</p>
                <p className="text-2xl font-bold text-purple-700">{allLessonDates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Журнал */}
      {filteredStudents.length === 0 ? (
        <Card className="border-2 border-purple-200">
          <CardContent className="p-12 text-center text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Нет учеников для отображения</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-purple-100">
                <th className="sticky left-0 z-20 bg-purple-100 border-2 border-purple-300 p-3 text-left min-w-[250px]">
                  <div className="flex items-center justify-between">
                    <span>Ученик</span>
                  </div>
                </th>
                {allLessonDates.map(date => (
                  <th key={date} className="border-2 border-purple-300 p-2 text-center min-w-[110px] bg-purple-100">
                    <div className="text-xs">
                      {new Date(date + "T00:00:00").toLocaleDateString('ru-RU', { 
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  </th>
                ))}
                <th className="sticky right-0 z-20 bg-purple-100 border-2 border-purple-300 p-3 text-center min-w-[100px]">
                  Средний балл
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const studentClass = getClassById(student.classId);
                return (
                  <tr key={student.id} className="hover:bg-purple-50">
                    <td className="sticky left-0 z-10 bg-white border-2 border-purple-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {studentClass && (
                              <div 
                                className="text-xs px-2 py-0.5 rounded inline-block"
                                style={{ 
                                  backgroundColor: studentClass.color + "22",
                                  color: studentClass.color
                                }}
                              >
                                {studentClass.name}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {calculateTotalStars(student)} / {calculateMaxPossibleStars(student)} ★
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditStudent(student)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteStudent(student.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    {allLessonDates.map(date => {
                      // Проверяем, относится ли урок к классу и подгруппе ученика
                      const lessonPlansForDate = lessonPlans.filter(lp => lp.date === date);
                      const isRelevantLesson = lessonPlansForDate.some(lp => {
                        if (lp.classId !== student.classId) return false;
                        if (lp.subgroupId === "all") return true;
                        if (student.subgroupId && lp.subgroupId === student.subgroupId) return true;
                        if (!student.subgroupId && lp.subgroupId === "all") return true;
                        return false;
                      });

                      // Если урок не относится к этому ученику, показываем пустую ячейку
                      if (!isRelevantLesson) {
                        return (
                          <td key={date} className="border-2 border-purple-200 p-1 text-center bg-gray-50">
                            <div className="text-gray-300">—</div>
                          </td>
                        );
                      }

                      const lesson = student.lessons.find(l => l.date === date);
                      const stars = lesson?.stars ?? -1;
                      const attended = lesson?.attended ?? true;
                      
                      return (
                        <td key={date} className="border-2 border-purple-200 p-1 text-center bg-white">
                          {!attended ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="text-red-500 text-xl font-bold">✕</div>
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => updateLessonStars(student.id, date, 0, true)}
                                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                                  title="Отметить присутствие"
                                >
                                  был
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => updateLessonStars(student.id, date, star, true)}
                                    className={`transition-all ${
                                      star <= stars
                                        ? "text-yellow-400 hover:text-yellow-500 scale-110"
                                        : "text-gray-300 hover:text-yellow-300"
                                    }`}
                                  >
                                    <Star
                                      className="w-4 h-4"
                                      fill={star <= stars ? "currentColor" : "none"}
                                    />
                                  </button>
                                ))}
                              </div>
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => updateLessonStars(student.id, date, 0, true)}
                                  className={`text-xs px-1 py-0.5 rounded border transition-all ${
                                    stars === 0
                                      ? "bg-gray-200 border-gray-400 font-bold"
                                      : "border-gray-300 hover:border-gray-400 text-gray-500"
                                  }`}
                                  title="0 звездочек"
                                >
                                  0
                                </button>
                                <button
                                  onClick={() => updateLessonStars(student.id, date, 0, false)}
                                  className="text-xs px-1 py-0.5 rounded border border-red-300 hover:border-red-500 text-red-500 hover:bg-red-50 transition-all"
                                  title="Отметить отсутствие"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 bg-white border-2 border-purple-200 p-3 text-center font-bold text-purple-700">
                      {calculateAverage(student)} ★
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Диалог редактирования студента */}
      <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>Измените имя ученика и его принадлежность к классу</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editStudentName">Имя</Label>
              <Input
                id="editStudentName"
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                placeholder="Введите имя"
                onKeyDown={(e) => e.key === "Enter" && saveEditStudent()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStudentClass">Класс</Label>
              <Select
                value={editStudentClass}
                onValueChange={value => {
                  setEditStudentClass(value);
                  setEditStudentSubgroup("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите класс" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без класса</SelectItem>
                  {classes.filter(cls => !cls.archived).map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editStudentClass && editStudentClass !== "none" && (() => {
              const selectedClassData = getClassById(editStudentClass);
              return selectedClassData?.subgroups && selectedClassData.subgroups.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="editStudentSubgroup">Подгруппа</Label>
                  <Select value={editStudentSubgroup} onValueChange={setEditStudentSubgroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите подгруппу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без подгруппы</SelectItem>
                      {selectedClassData.subgroups.map(subgroup => (
                        <SelectItem key={subgroup.id} value={subgroup.id}>
                          {subgroup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null;
            })()}
            <Button onClick={saveEditStudent} className="w-full bg-purple-600 hover:bg-purple-700">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования класса */}
      <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
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
                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
                placeholder="Например: 1А"
              />
            </div>

            <div>
              <Label>Цвет</Label>
              <div className="flex gap-2 flex-wrap">
                {classColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditClassColor(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      editClassColor === color ? "border-gray-800 scale-110" : "border-gray-300"
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
                  {editClassSubgroups.map(sg => (
                    <div key={sg.id} className="flex items-center gap-2">
                      <Input
                        value={sg.name}
                        onChange={(e) => updateEditSubgroupName(sg.id, e.target.value)}
                        placeholder="Название подгруппы"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEditSubgroup(sg.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={addEditSubgroup}
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
              <div className="border rounded-lg p-4" style={{ backgroundColor: editClassColor + "22" }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: editClassColor }} />
                  <div className="font-medium" style={{ color: editClassColor }}>
                    {editClassName || "Название класса"}
                  </div>
                  {editingClass.archived && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      Завершен
                    </span>
                  )}
                  {editClassSubgroups.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({editClassSubgroups.length} {editClassSubgroups.length === 1 ? 'подгруппа' : editClassSubgroups.length < 5 ? 'подгруппы' : 'подгрупп'})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
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
                <Button 
                  variant="outline" 
                  onClick={restoreClass}
                  className="border-green-300 text-green-600 hover:bg-green-50 hover:border-green-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Восстановить класс
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditClassOpen(false)}>
                Отмена
              </Button>
              <Button onClick={saveEditClass} className="bg-purple-600 hover:bg-purple-700">
                {editingClass ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}