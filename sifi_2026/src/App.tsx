import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ScholarFormPage from "@/pages/ScholarFormPage";
import ScholarListPage from "@/pages/ScholarListPage";
import UserFormPage from "@/pages/UserFormPage";
import UserListPage from "@/pages/UserListPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/scholars" element={<ScholarListPage />} />
          <Route path="/admin/scholars/new" element={<ScholarFormPage />} />
          <Route
            path="/admin/scholars/:id/edit"
            element={<ScholarFormPage />}
          />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin/users" element={<UserListPage />} />
          <Route path="/admin/users/new" element={<UserFormPage />} />
          <Route path="/admin/users/:id/edit" element={<UserFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
