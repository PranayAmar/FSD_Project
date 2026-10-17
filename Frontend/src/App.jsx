import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import AuthSuccess from "./pages/AuthSucc.jsx";
import Video from "./pages/video.jsx";
import Home from "./pages/Home.jsx";
import Histroy from "./pages/History.jsx";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        theme="dark"
        closeButton
        duration={3500}
        visibleToasts={3}
      />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/:url" element={<Video />} />
          <Route path="/home" element={<Home />} />
          <Route path="/his" element={<Histroy />} />
          {/* <Route path="material-ui/getting-started/templates/sign-in/" element = {<el/>} />
           */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
