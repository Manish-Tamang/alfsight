import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import { FeedsPage } from "@/pages/feeds";
import { InstagramPage } from "@/pages/instagram";
import { SettingsPage } from "@/pages/settings";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<FeedsPage />} />
          <Route path="/instagram" element={<InstagramPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
