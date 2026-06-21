import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { ApplicationsPage } from "./ui/ApplicationsPage";
import { DashboardPage } from "./ui/DashboardPage";
import { DuplicatesPage } from "./ui/DuplicatesPage";
import { RecruiterFormPage } from "./ui/RecruiterFormPage";
import { RecruitersPage } from "./ui/RecruitersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "applications",
        element: <ApplicationsPage />
      },
      {
        path: "duplicates",
        element: <DuplicatesPage />
      },
      {
        path: "recruiters",
        element: <RecruitersPage />
      },
      {
        path: "recruiters/new",
        element: <RecruiterFormPage />
      },
      {
        path: "recruiters/:id/edit",
        element: <RecruiterFormPage />
      }
    ]
  }
]);
