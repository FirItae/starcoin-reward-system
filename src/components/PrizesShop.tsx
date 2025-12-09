import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { getPrizes, savePrizes, getStudents, saveStudents, type Prize, type Student, type PurchaseHistory } from "../utils/storage";
import { ShoppingCart, Star, History, Undo2, Archive, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner@2.0.3";

export function PrizesShop() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setPrizes(getPrizes());
    setStudents(getStudents());
  }, []);

  // Функция подсчета заработанных звездочек
  const calculateTotalStars = (student: Student) => {
    const validLessons = student.lessons.filter(l => l.attended && l.stars >= 0);
    return validLessons.reduce((acc, l) => acc + l.stars, 0);
  };

  // Текущий баланс ученика (заработанные - потраченные)
  const getStudentBalance = (student: Student) => {
    const earned = calculateTotalStars(student);
    const spent = student.spentStars || 0;
    return earned - spent;
  };

  const buyPrize = (prize: Prize) => {
    if (!selectedStudent) {
      toast.error("Выберите ученика!");
      return;
    }

    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;

    const balance = getStudentBalance(student);
    
    if (balance < prize.cost) {
      toast.error(`Недостаточно звездочек! Нужно ${prize.cost}, у ученика ${balance}`);
      return;
    }

    // Проверяем количество
    if (prize.quantity !== undefined && prize.quantity <= 0) {
      toast.error("Этот приз закончился!");
      return;
    }

    // Создаем запись в истории покупок
    const purchase: PurchaseHistory = {
      id: `${Date.now()}-${Math.random()}`,
      prizeId: prize.id,
      prizeName: prize.name,
      cost: prize.cost,
      date: new Date().toISOString(),
      refunded: false
    };

    // Обновляем ученика
    const updatedStudents = students.map((s) =>
      s.id === selectedStudent 
        ? { 
            ...s, 
            spentStars: (s.spentStars || 0) + prize.cost,
            purchaseHistory: [...(s.purchaseHistory || []), purchase]
          } 
        : s
    );

    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    // Уменьшаем количество приза
    if (prize.quantity !== undefined) {
      const newQuantity = prize.quantity - 1;
      const updatedPrizes = prizes.map(p => 
        p.id === prize.id 
          ? { ...p, quantity: newQuantity, archived: newQuantity === 0 }
          : p
      );
      setPrizes(updatedPrizes);
      savePrizes(updatedPrizes);

      if (newQuantity === 0) {
        toast.success(`${student.name} купил(а) последний ${prize.name}! Осталось ${balance - prize.cost} звездочек. Приз перемещен в архив.`);
      } else {
        toast.success(`${student.name} купил(а) ${prize.name}! Осталось ${balance - prize.cost} звездочек. Призов осталось: ${newQuantity}`);
      }
    } else {
      toast.success(`${student.name} купил(а) ${prize.name}! Осталось ${balance - prize.cost} звездочек`);
    }
  };

  const refundPurchase = (purchase: PurchaseHistory) => {
    if (!currentStudent) return;

    if (purchase.refunded) {
      toast.error("Эта покупка уже возвращена!");
      return;
    }

    if (!confirm(`Вернуть покупку "${purchase.prizeName}" за ${purchase.cost} звездочек?`)) {
      return;
    }

    // Обновляем ученика
    const updatedStudents = students.map((s) =>
      s.id === currentStudent.id 
        ? { 
            ...s, 
            spentStars: (s.spentStars || 0) - purchase.cost,
            purchaseHistory: (s.purchaseHistory || []).map(p => 
              p.id === purchase.id ? { ...p, refunded: true } : p
            )
          } 
        : s
    );

    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    // Возвращаем количество приза
    const prize = prizes.find(p => p.id === purchase.prizeId);
    if (prize && prize.quantity !== undefined) {
      const updatedPrizes = prizes.map(p => 
        p.id === purchase.prizeId 
          ? { ...p, quantity: p.quantity! + 1, archived: false }
          : p
      );
      setPrizes(updatedPrizes);
      savePrizes(updatedPrizes);
    }

    toast.success(`Возврат выполнен! Возвращено ${purchase.cost} звездочек`);
  };

  const currentStudent = useMemo(
    () => students.find((s) => s.id === selectedStudent),
    [students, selectedStudent]
  );

  const currentBalance = useMemo(
    () => currentStudent ? getStudentBalance(currentStudent) : 0,
    [currentStudent]
  );

  const displayedPrizes = useMemo(
    () => prizes.filter(p => showArchived ? p.archived : !p.archived),
    [prizes, showArchived]
  );

  const purchaseHistory = useMemo(
    () => currentStudent?.purchaseHistory?.slice().reverse() || [],
    [currentStudent]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-purple-700">Магазин призов</h1>
          <p className="text-gray-600">Обменяйте StarCoins на призы</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowArchived(!showArchived)}
            variant={showArchived ? "default" : "outline"}
            className={showArchived ? "bg-gray-600 hover:bg-gray-700" : ""}
          >
            <Archive className="w-4 h-4 mr-2" />
            {showArchived ? "Архив" : "Активные"}
          </Button>
        </div>
      </div>

      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-gray-700 mb-2 block">Выберите ученика:</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ученика" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentStudent && (
              <>
                <div className="flex items-center gap-2 bg-white rounded-lg px-6 py-3 border-2 border-purple-200">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Баланс:</p>
                    <p className="text-2xl font-bold text-purple-700">{currentBalance}</p>
                    <p className="text-xs text-gray-500">
                      Заработано: {calculateTotalStars(currentStudent)} | Потрачено: {currentStudent.spentStars || 0}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowHistory(true)}
                  variant="outline"
                  className="border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  <History className="w-4 h-4 mr-2" />
                  История покупок
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {displayedPrizes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-500">
              {showArchived ? "Нет архивных призов" : "Нет активных призов. Добавьте призы в разделе управления!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPrizes.map((prize) => {
            const canAfford = currentStudent && currentBalance >= prize.cost;
            const outOfStock = prize.quantity !== undefined && prize.quantity <= 0;
            const isAvailable = !outOfStock && !prize.archived;
            
            return (
              <Card
                key={prize.id}
                className={`border-2 transition-all ${
                  prize.archived
                    ? "border-gray-300 bg-gray-50 opacity-60"
                    : canAfford && isAvailable
                    ? "border-green-300 hover:shadow-lg"
                    : "border-gray-200 opacity-75"
                }`}
              >
                <CardHeader>
                  <div className="text-center">
                    <div className="relative">
                      <div className="text-6xl mb-3">{prize.emoji}</div>
                      {prize.quantity !== undefined && (
                        <div className={`absolute top-0 right-0 px-2 py-1 rounded-full text-xs font-medium ${
                          prize.quantity === 0 
                            ? "bg-red-100 text-red-700"
                            : prize.quantity <= 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          <Package className="w-3 h-3 inline mr-1" />
                          {prize.quantity}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-purple-700">{prize.name}</CardTitle>
                    {prize.archived && (
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        Архив
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center text-sm">{prize.description}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 w-full bg-yellow-100 rounded-lg py-2 px-3">
                    <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                    <span className="font-medium text-purple-700">{prize.cost} StarCoins</span>
                  </div>
                  {!prize.archived && (
                    <Button
                      onClick={() => buyPrize(prize)}
                      disabled={!canAfford || !selectedStudent || outOfStock}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {!selectedStudent 
                        ? "Выберите ученика" 
                        : outOfStock
                        ? "Нет в наличии"
                        : canAfford 
                        ? "Купить" 
                        : "Недостаточно звездочек"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Диалог истории покупок */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>История покупок</DialogTitle>
            <DialogDescription>
              {currentStudent?.name} - История всех покупок и возвратов
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {purchaseHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Пока нет покупок</p>
              </div>
            ) : (
              purchaseHistory.map((purchase) => (
                <Card 
                  key={purchase.id} 
                  className={`border-2 ${
                    purchase.refunded 
                      ? "border-orange-200 bg-orange-50" 
                      : "border-purple-200"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{purchase.prizeName}</p>
                          {purchase.refunded && (
                            <span className="px-2 py-0.5 bg-orange-200 text-orange-700 text-xs rounded">
                              Возврат
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                            <span>{purchase.cost} StarCoins</span>
                          </div>
                          <span>•</span>
                          <span>{new Date(purchase.date).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      {!purchase.refunded && (
                        <Button
                          onClick={() => refundPurchase(purchase)}
                          variant="outline"
                          size="sm"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        >
                          <Undo2 className="w-4 h-4 mr-1" />
                          Вернуть
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHistory(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
