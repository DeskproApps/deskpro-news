import "./App.css";
import "@deskpro/deskpro-ui/dist/deskpro-custom-icons.css";
import "@deskpro/deskpro-ui/dist/deskpro-ui.css";
import "simplebar/dist/simplebar.min.css";
import { DeskproAppProvider, LoadingSpinner } from "@deskpro/app-sdk";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Suspense } from "react";
import GlobalTargetPage from "./pages/global";
import ModalAppPage from "./pages/modal";

function App() {
  return (
    <DeskproAppProvider>
      <HashRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <ErrorBoundary fallback={<>An unexpected error occurred</>}>
            <Routes>
              <Route path='/global' element={<GlobalTargetPage />} />
              <Route path='/modal' element={<ModalAppPage />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </HashRouter>
    </DeskproAppProvider>
  );
}

export default App;
