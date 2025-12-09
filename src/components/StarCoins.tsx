import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Sparkles, Printer, Trash2, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

const coinDesigns = [
  { value: 1, color: "from-gray-400 to-gray-500", borderColor: "border-gray-600", solidColor: "#9ca3af" },
  { value: 2, color: "from-orange-400 to-orange-600", borderColor: "border-orange-700", solidColor: "#fb923c" },
  { value: 5, color: "from-blue-400 to-blue-600", borderColor: "border-blue-700", solidColor: "#60a5fa" },
  { value: 10, color: "from-green-400 to-green-600", borderColor: "border-green-700", solidColor: "#4ade80" },
  { value: 20, color: "from-purple-400 to-purple-600", borderColor: "border-purple-700", solidColor: "#a78bfa" },
  { value: 50, color: "from-yellow-400 to-yellow-600", borderColor: "border-yellow-700", solidColor: "#facc15" },
];

interface PrintRecord {
  id: string;
  denomination: number;
  batchNumber: number;
  quantity: number;
  startNumber: number;
  endNumber: number;
  date: string;
}

interface DenominationConfig {
  selected: boolean;
  quantity: number;
}

const PRINT_HISTORY_KEY = "starcoin_print_history";

export function StarCoins() {
  const [batchNumber, setBatchNumber] = useState(1);
  const [denominationConfigs, setDenominationConfigs] = useState<Record<number, DenominationConfig>>(() => {
    const configs: Record<number, DenominationConfig> = {};
    coinDesigns.forEach(coin => {
      configs[coin.value] = { selected: false, quantity: 6 };
    });
    return configs;
  });
  const [printHistory, setPrintHistory] = useState<PrintRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem(PRINT_HISTORY_KEY);
    if (history) {
      setPrintHistory(JSON.parse(history));
    }
  }, []);

  const savePrintHistory = (history: PrintRecord[]) => {
    localStorage.setItem(PRINT_HISTORY_KEY, JSON.stringify(history));
    setPrintHistory(history);
  };

  const toggleDenomination = (value: number) => {
    setDenominationConfigs(prev => ({
      ...prev,
      [value]: {
        ...prev[value],
        selected: !prev[value].selected
      }
    }));
  };

  const updateQuantity = (value: number, quantity: number) => {
    setDenominationConfigs(prev => ({
      ...prev,
      [value]: {
        ...prev[value],
        quantity: Math.max(1, Math.min(50, quantity))
      }
    }));
  };

  const selectAll = () => {
    setDenominationConfigs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[parseInt(key)].selected = true;
      });
      return updated;
    });
  };

  const deselectAll = () => {
    setDenominationConfigs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[parseInt(key)].selected = false;
      });
      return updated;
    });
  };

  const handlePrint = () => {
    const selectedDenoms = Object.entries(denominationConfigs)
      .filter(([_, config]) => config.selected)
      .map(([denom, _]) => parseInt(denom));

    if (selectedDenoms.length === 0) {
      toast.error("Выберите хотя бы один номинал!");
      return;
    }

    const newRecords: PrintRecord[] = selectedDenoms.map(denom => {
      const config = denominationConfigs[denom];
      const startNumber = (batchNumber - 1) * config.quantity + 1;
      const endNumber = batchNumber * config.quantity;
      
      return {
        id: Date.now().toString() + denom,
        denomination: denom,
        batchNumber,
        quantity: config.quantity,
        startNumber,
        endNumber,
        date: new Date().toISOString(),
      };
    });

    const updatedHistory = [...printHistory, ...newRecords];
    savePrintHistory(updatedHistory);

    window.print();
    toast.success("История печати сохранена!");
  };

  const deletePrintRecord = (recordId: string) => {
    const updatedHistory = printHistory.filter(r => r.id !== recordId);
    savePrintHistory(updatedHistory);
    toast.success("Запись удалена!");
  };

  const clearHistory = () => {
    savePrintHistory([]);
    toast.success("История очищена!");
  };

  const getNextBatchNumber = (denomination?: number) => {
    const relevantRecords = denomination 
      ? printHistory.filter(r => r.denomination === denomination)
      : printHistory;
    
    if (relevantRecords.length === 0) return 1;
    
    const maxBatch = Math.max(...relevantRecords.map(r => r.batchNumber));
    return maxBatch + 1;
  };

  const selectedCount = Object.values(denominationConfigs).filter(c => c.selected).length;
  const denominationsForPrint = coinDesigns.filter(c => denominationConfigs[c.value].selected);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-purple-700">StarCoin</h1>
        </div>
        <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700" disabled={selectedCount === 0}>
          <Printer className="w-5 h-5 mr-2" />
          Печать ({selectedCount})
        </Button>
      </div>

      <Card className="border-2 border-purple-200 bg-purple-50 no-print">
        <CardContent className="py-6">
          <h3 className="text-purple-700 mb-4">Настройки печати</h3>
          
          {/* Номер партии */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Номер партии</Label>
                <div className="flex gap-2">
                  <Input
                    id="batchNumber"
                    type="number"
                    min="1"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(parseInt(e.target.value) || 1)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const nextBatch = getNextBatchNumber();
                      setBatchNumber(nextBatch);
                    }}
                  >
                    Авто
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Общий номер партии для всех выбранных номиналов
                </p>
              </div>
            </div>
          </div>

          {/* Выбор номиналов */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Выберите номиналы для печати</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Все
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Сбросить
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coinDesigns.map((coin) => {
                const config = denominationConfigs[coin.value];
                const isSelected = config.selected;
                const nextBatch = getNextBatchNumber(coin.value);
                const startNum = (batchNumber - 1) * config.quantity + 1;
                const endNum = batchNumber * config.quantity;
                
                return (
                  <div
                    key={coin.value}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-purple-600 shadow-lg"
                        : "border-gray-300"
                    }`}
                    style={{
                      backgroundColor: isSelected ? coin.solidColor + "20" : "white"
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <button
                      onClick={() => toggleDenomination(coin.value)}
                      className="w-full mb-3"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-16 h-16 bg-gradient-to-br ${coin.color} rounded-full border-2 ${coin.borderColor} flex items-center justify-center`}
                        >
                          <span className="text-white" style={{ fontSize: '20px', fontWeight: 'bold' }}>{coin.value}</span>
                        </div>
                        <span className="text-gray-700">{coin.value} StarCoins</span>
                      </div>
                    </button>

                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${coin.value}`} className="text-xs">Количество</Label>
                      <Input
                        id={`quantity-${coin.value}`}
                        type="number"
                        min="1"
                        max="50"
                        value={config.quantity}
                        onChange={(e) => updateQuantity(coin.value, parseInt(e.target.value) || 1)}
                        className="text-sm"
                      />
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>№{startNum}-{endNum}</div>
                        <div className="text-gray-400">След. партия: {nextBatch}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• Рекомендуется печатать на плотной бумаге</li>
              <li>• Можно заламинировать для долговечности</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* История печати */}
      <Card className="border-2 border-blue-200 no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-blue-700">История печати</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-500"
              >
                {showHistory ? "Скрыть" : "Показать"}
              </Button>
            </div>
            {printHistory.length > 0 && showHistory && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearHistory}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Очистить
              </Button>
            )}
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
          {printHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">История печати пуста</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {printHistory.slice().reverse().map((record) => {
                const coin = coinDesigns.find(c => c.value === record.denomination);
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="px-3 py-1 rounded text-white"
                        style={{
                          backgroundColor: coin?.solidColor
                        }}
                      >
                        {record.denomination} SC
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-700">
                          Партия {record.batchNumber} • {record.quantity} шт
                        </div>
                        <div className="text-gray-500">
                          №{record.startNumber}-{record.endNumber} • {new Date(record.date).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePrintRecord(record.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          </CardContent>
        )}
      </Card>

      {/* Купюры для печати */}
      <div className="print:block">
        {denominationsForPrint.map((coin) => {
          const config = denominationConfigs[coin.value];
          return (
            <div key={coin.value} className="mb-8">
              <h3 className="text-gray-700 mb-4 no-print">Номинал: {coin.value} StarCoins</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3">
                {[...Array(config.quantity)].map((_, index) => {
                  const serialNumber = (batchNumber - 1) * config.quantity + index + 1;
                  return (
                    <div
                      key={index}
                      className="relative aspect-[2/1] break-inside-avoid"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      {/* Купюра */}
                      <div className={`w-full h-full bg-gradient-to-br ${coin.color} rounded-lg border-4 ${coin.borderColor} shadow-lg print:shadow-none overflow-hidden`}>
                        {/* Декоративный фон */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-0 left-0 w-full h-full">
                            {[...Array(20)].map((_, i) => (
                              <Sparkles
                                key={i}
                                className="absolute text-white fill-white"
                                style={{
                                  top: `${(i * 25) % 100}%`,
                                  left: `${(i * 37) % 100}%`,
                                  width: '16px',
                                  height: '16px',
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Основной контент */}
                        <div className="relative h-full flex items-center justify-between p-4">
                          {/* Левая часть */}
                          <div className="flex flex-col items-center gap-2">
                            <Sparkles className="w-12 h-12 text-white fill-white" />
                            <div className="bg-white/90 rounded-full px-4 py-2">
                              <span className="text-gray-800" style={{ fontSize: '24px', fontWeight: 'bold' }}>{coin.value}</span>
                            </div>
                          </div>

                          {/* Центральная часть */}
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="text-white text-center" style={{ fontSize: '28px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                              StarCoin
                            </div>
                            <div className="mt-2 flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Sparkles key={i} className="w-4 h-4 text-white fill-white" />
                              ))}
                            </div>
                          </div>

                          {/* Правая часть */}
                          <div className="flex flex-col items-center gap-2">
                            <Sparkles className="w-12 h-12 text-white fill-white" />
                            <div className="bg-white/90 rounded-full px-4 py-2">
                              <span className="text-gray-800" style={{ fontSize: '24px', fontWeight: 'bold' }}>{coin.value}</span>
                            </div>
                          </div>
                        </div>

                        {/* Угловые украшения */}
                        <div className="absolute top-2 left-2">
                          <Sparkles className="w-6 h-6 text-white/60 fill-white/60" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Sparkles className="w-6 h-6 text-white/60 fill-white/60" />
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Sparkles className="w-6 h-6 text-white/60 fill-white/60" />
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <Sparkles className="w-6 h-6 text-white/60 fill-white/60" />
                        </div>

                        {/* Серийный номер */}
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <span className="text-white/70" style={{ fontSize: '8px' }}>
                            SC-{coin.value}-{String(serialNumber).padStart(3, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            zoom: 0.6;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
}
