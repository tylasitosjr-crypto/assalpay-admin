import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import App from "./App.jsx";
import { ApiLoadingProvider } from "./context/ApiLoadingContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import GlobalApiLoader from "./components/common/GlobalApiLoader.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ApiLoadingProvider>
        <AuthProvider>
          <App />
          <GlobalApiLoader />
          <ToastContainer
            position="top-right"
            autoClose={3200}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            style={{ zIndex: 10050 }}
          />
        </AuthProvider>
      </ApiLoadingProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
