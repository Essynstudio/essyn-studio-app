import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppleToaster } from "./components/ui/apple-kit";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <AppleToaster />
    </>
  );
}
