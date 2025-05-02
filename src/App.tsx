import "./App.css";
import "@deskpro/deskpro-ui/dist/deskpro-custom-icons.css";
import "@deskpro/deskpro-ui/dist/deskpro-ui.css";
import "flatpickr/dist/themes/light.css";
import "simplebar/dist/simplebar.min.css";
import "tippy.js/dist/tippy.css";
import { DeskproAppProvider, LoadingSpinner } from "@deskpro/app-sdk";
import ReleaseAndNewsFeedView from "./components/ReleaseAndNewsFeedView";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function App() {
  return (
    <DeskproAppProvider>
      <HashRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <ErrorBoundary fallback={<>An unexpected error occurred</>}>
            <Routes>
              <Route index element={<ReleaseAndNewsFeedView />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </HashRouter>
    </DeskproAppProvider>
  );
}

export default App;
