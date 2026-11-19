import { Button, Tag } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { checkInOpensAt, checkInState } from "../../entities/booking/checkIn";
import { useLanguage } from "../../shared/i18n/language";
import { dayMonth } from "../../shared/i18n/format";

type Props = {
  /** Începutul rezervării, în ora biroului. */
  start: Dayjs;
  /** Ora de acum, în ora biroului; pagina o actualizează periodic, ca butonul să-și schimbe singur starea. */
  now: Dayjs;
  checkedIn: boolean;
  busy: boolean;
  onCheckIn: () => void;
};

/** Butonul de check-in din „Rezervările mele”: gri înainte de fereastră, activ în fereastră, verde după confirmare. */
export default function CheckInButton({ start, now, checkedIn, busy, onCheckIn }: Props) {
  const { t } = useLanguage();
  const state = checkInState(start, now, checkedIn);

  if (state === "checked") {
    return (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        {t.checkIn.confirmed}
      </Tag>
    );
  }

  if (state === "open") {
    return (
      <Button size="small" type="primary" loading={busy} onClick={onCheckIn}>
        {t.checkIn.button}
      </Button>
    );
  }

  if (state === "expired") {
    return (
      <Button size="small" disabled>
        {t.checkIn.expired}
      </Button>
    );
  }

  // Încă nu se poate: azi arată doar ora, în altă zi și data
  const opens = checkInOpensAt(start);
  const time = opens.format("HH:mm");
  const sameDay = opens.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");
  return (
    <Button size="small" disabled>
      {sameDay ? t.checkIn.availableAt(time) : t.checkIn.availableOn(dayMonth(opens), time)}
    </Button>
  );
}