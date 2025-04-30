import "./App.css";
import "@deskpro/deskpro-ui/dist/deskpro-custom-icons.css";
import "@deskpro/deskpro-ui/dist/deskpro-ui.css";
import "flatpickr/dist/themes/light.css";
import "simplebar/dist/simplebar.min.css";
import "tippy.js/dist/tippy.css";
import { DeskproAppProvider } from "@deskpro/app-sdk";
import ReleaseAndNewsFeedPage from "./pages/release-and-news-feed";

function App() {
  return (
      <DeskproAppProvider>
        <ReleaseAndNewsFeedPage />
      </DeskproAppProvider>
  );
}

export default App;
