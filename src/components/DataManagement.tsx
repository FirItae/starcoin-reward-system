import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Database, 
  AlertCircle,
  CheckCircle2,
  FileJson
} from "lucide-react";
import { 
  exportToFile, 
  importFromFile, 
  restoreFromBackup, 
  getBackupInfo,
  clearAllData,
  getStorageStats,
  exportAllData
} from "../utils/storage";
import { toast } from "sonner@2.0.3";
import { Alert, AlertDescription } from "./ui/alert";

export function DataManagement() {
  const [backupInfo, setBackupInfo] = useState<{ exists: boolean; date: string | null }>({ exists: false, date: null });
  const [storageStats, setStorageStats] = useState<{ totalSize: number; itemsCount: number; available: boolean }>({
    totalSize: 0,
    itemsCount: 0,
    available: true,
  });
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    updateBackupInfo();
    updateStorageStats();
  }, []);

  const updateBackupInfo = () => {
    setBackupInfo(getBackupInfo());
  };

  const updateStorageStats = () => {
    setStorageStats(getStorageStats());
  };

  const handleExport = () => {
    try {
      exportToFile();
      toast.success("Данные успешно экспортированы!");
      updateStorageStats();
    } catch (error) {
      toast.error("Ошибка при экспорте данных");
      console.error(error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Выберите JSON файл");
      return;
    }

    setIsImporting(true);
    try {
      const success = await importFromFile(file);
      if (success) {
        toast.success("Данные успешно импортированы!");
        updateBackupInfo();
        updateStorageStats();
        // Перезагружаем страницу для обновления данных
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Ошибка при импорте данных");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка при импорте данных");
      console.error(error);
    } finally {
      setIsImporting(false);
      // Сбрасываем input
      event.target.value = "";
    }
  };

  const handleRestore = () => {
    if (!backupInfo.exists) {
      toast.error("Бэкап не найден");
      return;
    }

    if (!confirm("Восстановить данные из автоматического бэкапа? Текущие данные будут заменены.")) {
      return;
    }

    try {
      const success = restoreFromBackup();
      if (success) {
        toast.success("Данные успешно восстановлены из бэкапа!");
        updateBackupInfo();
        updateStorageStats();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Ошибка при восстановлении данных");
      }
    } catch (error) {
      toast.error("Ошибка при восстановлении данных");
      console.error(error);
    }
  };

  const handleClear = () => {
    if (!confirm("⚠️ ВНИМАНИЕ! Вы уверены, что хотите удалить ВСЕ данные?\n\nЭто действие нельзя отменить!")) {
      return;
    }

    if (!confirm("Это удалит всех студентов, классы, призы и расписание. Продолжить?")) {
      return;
    }

    try {
      const success = clearAllData();
      if (success) {
        toast.success("Все данные удалены");
        updateBackupInfo();
        updateStorageStats();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Ошибка при удалении данных");
      }
    } catch (error) {
      toast.error("Ошибка при удалении данных");
      console.error(error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-purple-700 text-3xl font-bold mb-2">Управление данными</h1>
        <p className="text-gray-600">Экспорт, импорт и резервное копирование данных</p>
      </div>

      {!storageStats.available && (
        <Alert className="border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            localStorage недоступен. Данные не могут быть сохранены.
          </AlertDescription>
        </Alert>
      )}

      {/* Статистика хранилища */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Статистика хранилища
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Размер данных</p>
              <p className="text-2xl font-bold text-purple-700">{formatFileSize(storageStats.totalSize)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Количество элементов</p>
              <p className="text-2xl font-bold text-purple-700">{storageStats.itemsCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Статус</p>
              <div className="flex items-center gap-2 mt-1">
                {storageStats.available ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">Доступно</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600 font-medium">Недоступно</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Экспорт данных */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Экспорт данных
          </CardTitle>
          <CardDescription>
            Сохраните все данные в JSON файл для резервного копирования
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Экспортирует всех студентов, классы, призы и расписание в один файл.
          </p>
          <Button onClick={handleExport} className="bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4 mr-2" />
            Экспортировать данные
          </Button>
        </CardContent>
      </Card>

      {/* Импорт данных */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Импорт данных
          </CardTitle>
          <CardDescription>
            Загрузите данные из ранее экспортированного JSON файла
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Импорт заменит все текущие данные. Рекомендуется сначала экспортировать текущие данные.
            </AlertDescription>
          </Alert>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="import-file-input"
            />
            <Button
              onClick={() => document.getElementById("import-file-input")?.click()}
              disabled={isImporting}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Импорт..." : "Выбрать файл для импорта"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Автоматический бэкап */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Автоматический бэкап
          </CardTitle>
          <CardDescription>
            Восстановление из автоматически созданного бэкапа
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backupInfo.exists ? (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Бэкап найден</span>
                </div>
                <p className="text-sm text-green-700">
                  Дата создания: {formatDate(backupInfo.date)}
                </p>
              </div>
              <Button
                onClick={handleRestore}
                variant="outline"
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Восстановить из бэкапа
              </Button>
            </>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Автоматический бэкап еще не создан. Он будет создан автоматически при первом сохранении данных.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Опасная зона */}
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            Опасная зона
          </CardTitle>
          <CardDescription>
            Необратимые действия с данными
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Эти действия нельзя отменить. Убедитесь, что у вас есть резервная копия данных.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleClear}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить все данные
          </Button>
        </CardContent>
      </Card>

      {/* Информация о формате */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            О формате данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Экспортированные данные сохраняются в формате JSON и содержат:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Версию формата данных</li>
              <li>Дату экспорта</li>
              <li>Всех студентов с их уроками и историей покупок</li>
              <li>Все классы и подгруппы</li>
              <li>Все призы</li>
              <li>Все планы уроков</li>
            </ul>
            <p className="mt-4">
              Вы можете открыть экспортированный файл в любом текстовом редакторе для просмотра.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

