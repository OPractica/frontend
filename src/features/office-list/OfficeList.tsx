import { useMemo, useState } from "react";
import { Button, Card, Empty, Input, Space, Tag, Typography, theme as antdTheme } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { OFFICES, type Floor, type Office } from "../../entities/office/offices";
import { useLanguage } from "../../shared/i18n/language";
import { floorName } from "../../shared/i18n/format";

type Props = {
  onSelect: (office: Office, floor: Floor) => void;
};

export default function OfficeList({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const { token } = antdTheme.useToken();
  const { t } = useLanguage();

  const offices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OFFICES;
    return OFFICES.filter((o) => `${o.name} ${o.floors.map((f) => floorName(t, f)).join(" ")}`.toLowerCase().includes(q));
  }, [query, t]);

  return (
    <div style={{ padding: 16, maxWidth: 960, margin: "0 auto" }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {t.offices.title}
      </Typography.Title>

      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder={t.offices.search}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ maxWidth: 360, marginBottom: 16 }}
      />

      {offices.length === 0 ? (
        <Empty description={t.offices.none} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {offices.map((office) => (
            <Card key={office.id} title={office.name} extra={<Tag>{t.offices.floorCount(office.floors.length)}</Tag>}>
              <Space wrap>
                {office.floors.map((floor) => (
                  <Button key={floor.id} onClick={() => onSelect(office, floor)}>
                    {floorName(t, floor)}
                    {!floor.available && <span style={{ color: token.colorTextTertiary }}> · {t.offices.unavailable}</span>}
                  </Button>
                ))}
              </Space>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}