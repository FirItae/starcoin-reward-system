import { Outlet, Link, useLocation } from "react-router";
import { Star, Coins, Gift, Settings, CalendarDays } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <nav className="bg-white shadow-md border-b-4 border-purple-400 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              <span className="text-purple-600">StarCoin</span>
            </div>
            <div className="flex gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/") && location.pathname === "/"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Star className="w-5 h-5" />
                <span>Журнал</span>
              </Link>
              <Link
                to="/schedule"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/schedule")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <CalendarDays className="w-5 h-5" />
                <span>Расписание</span>
              </Link>
              <Link
                to="/starcoins"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/starcoins")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Coins className="w-5 h-5" />
                <span>StarCoins</span>
              </Link>
              <Link
                to="/shop"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/shop")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Gift className="w-5 h-5" />
                <span>Магазин призов</span>
              </Link>
              <Link
                to="/manage-prizes"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive("/manage-prizes")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Управление призами</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
