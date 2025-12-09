import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { getPrizes, savePrizes, type Prize } from "../utils/storage";
import { Plus, Pencil, Trash2, Gift, Package, Archive } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function ManagePrizes() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cost: "",
    description: "",
    emoji: "🎁",
    quantity: "",
    hasQuantity: false,
  });

  useEffect(() => {
    setPrizes(getPrizes());
  }, []);

  const openDialog = (prize?: Prize) => {
    if (prize) {
      setEditingPrize(prize);
      setFormData({
        name: prize.name,
        cost: prize.cost.toString(),
        description: prize.description,
        emoji: prize.emoji,
        quantity: prize.quantity !== undefined ? prize.quantity.toString() : "",
        hasQuantity: prize.quantity !== undefined,
      });
    } else {
      setEditingPrize(null);
      setFormData({ 
        name: "", 
        cost: "", 
        description: "", 
        emoji: "🎁",
        quantity: "",
        hasQuantity: false,
      });
    }
    setIsDialogOpen(true);
  };

  const savePrize = () => {
    if (!formData.name.trim() || !formData.cost || !formData.description.trim()) {
      toast.error("Заполните все поля!");
      return;
    }

    const cost = parseInt(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      toast.error("Введите корректную стоимость!");
      return;
    }

    let quantity: number | undefined = undefined;
    if (formData.hasQuantity) {
      const parsedQuantity = parseInt(formData.quantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        toast.error("Введите корректное количество!");
        return;
      }
      quantity = parsedQuantity;
    }

    let updatedPrizes: Prize[];

    if (editingPrize) {
      updatedPrizes = prizes.map((p) =>
        p.id === editingPrize.id
          ? { 
              ...p, 
              name: formData.name.trim(),
              cost,
              description: formData.description.trim(),
              emoji: formData.emoji,
              quantity,
              archived: quantity !== undefined && quantity === 0
            }
          : p
      );
      toast.success("Приз обновлен!");
    } else {
      const newPrize: Prize = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        cost,
        description: formData.description.trim(),
        emoji: formData.emoji,
        quantity,
        archived: false,
      };
      updatedPrizes = [...prizes, newPrize];
      toast.success("Приз добавлен!");
    }

    setPrizes(updatedPrizes);
    savePrizes(updatedPrizes);
    setIsDialogOpen(false);
  };

  const deletePrize = (prizeId: string) => {
    if (!confirm("Удалить этот приз?")) return;
    
    const updatedPrizes = prizes.filter((p) => p.id !== prizeId);
    setPrizes(updatedPrizes);
    savePrizes(updatedPrizes);
    toast.success("Приз удален!");
  };

  const restorePrize = (prizeId: string) => {
    const updatedPrizes = prizes.map(p => 
      p.id === prizeId 
        ? { ...p, archived: false, quantity: p.quantity !== undefined ? Math.max(1, p.quantity) : undefined }
        : p
    );
    setPrizes(updatedPrizes);
    savePrizes(updatedPrizes);
    toast.success("Приз восстановлен!");
  };

  const displayedPrizes = useMemo(
    () => prizes.filter(p => showArchived ? p.archived : !p.archived),
    [prizes, showArchived]
  );

  const commonEmojis = ["🎁", "🎨", "🍬", "🔖", "✏️", "📓", "🎮", "🧸", "🏆", "⭐", "🎪", "🎭"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-purple-700">Управление призами</h1>
          <p className="text-gray-600">Добавляйте и редактируйте призы для магазина</p>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-5 h-5 mr-2" />
                Добавить приз
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPrize ? "Редактировать приз" : "Добавить новый приз"}</DialogTitle>
                <DialogDescription>
                  {editingPrize ? "Измените информацию о призе" : "Введите информацию о новом призе"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="emoji">Эмодзи</Label>
                  <div className="flex gap-2 flex-wrap">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, emoji })}
                        className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                          formData.emoji === emoji
                            ? "border-purple-500 bg-purple-100"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Название приза</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Наклейка"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Стоимость (StarCoins)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="10"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Описание приза"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasQuantity"
                      checked={formData.hasQuantity}
                      onChange={(e) => setFormData({ ...formData, hasQuantity: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="hasQuantity" className="cursor-pointer">
                      Ограниченное количество
                    </Label>
                  </div>
                  {formData.hasQuantity && (
                    <div className="pl-6">
                      <Label htmlFor="quantity">Количество</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="Введите количество"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        При количестве = 0 приз автоматически переместится в архив
                      </p>
                    </div>
                  )}
                </div>
                <Button onClick={savePrize} className="w-full bg-purple-600 hover:bg-purple-700">
                  {editingPrize ? "Сохранить изменения" : "Добавить приз"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {displayedPrizes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-500">
              {showArchived ? "Нет архивных призов" : "Нет призов. Добавьте первый приз!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPrizes.map((prize) => (
            <Card 
              key={prize.id} 
              className={`border-2 transition-shadow ${
                prize.archived 
                  ? "border-gray-300 bg-gray-50 opacity-75" 
                  : "border-purple-200 hover:shadow-lg"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{prize.emoji}</span>
                    <div>
                      <CardTitle className="text-purple-700">{prize.name}</CardTitle>
                      {prize.archived && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          Архив
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!prize.archived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(prize)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {prize.archived ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restorePrize(prize.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePrize(prize.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{prize.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-yellow-100 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                    <span className="text-yellow-600">⭐</span>
                    <span className="text-purple-700">{prize.cost} StarCoins</span>
                  </div>
                  {prize.quantity !== undefined && (
                    <div className={`rounded-lg px-3 py-2 inline-flex items-center gap-2 ${
                      prize.quantity === 0 
                        ? "bg-red-100 text-red-700"
                        : prize.quantity <= 3
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      <Package className="w-4 h-4" />
                      <span>{prize.quantity} шт.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}