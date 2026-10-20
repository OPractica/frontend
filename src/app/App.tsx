import { ConfigProvider } from "antd";

export default function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#ff7900" } }}>
      <h1>Voice Office Booking</h1>
    </ConfigProvider>
  );
}