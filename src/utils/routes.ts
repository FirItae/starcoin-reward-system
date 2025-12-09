import { createBrowserRouter } from "react-router";
import { Layout } from "../components/Layout";
import { Students } from "../components/Students";
import { Schedule } from "../components/Schedule";
import { StarCoins } from "../components/StarCoins";
import { PrizesShop } from "../components/PrizesShop";
import { ManagePrizes } from "../components/ManagePrizes";
import { DataManagement } from "../components/DataManagement";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Students },
      { path: "schedule", Component: Schedule },
      { path: "starcoins", Component: StarCoins },
      { path: "shop", Component: PrizesShop },
      { path: "manage-prizes", Component: ManagePrizes },
      { path: "data", Component: DataManagement },
    ],
  },
]);
