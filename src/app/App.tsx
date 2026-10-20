import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { ConfigProvider } from "antd";
import { BookingPage } from "../pages/BookingPage";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 1 });

export default function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#ff7900" } }}>
      <BookingPage />
    </ConfigProvider>
  );
}