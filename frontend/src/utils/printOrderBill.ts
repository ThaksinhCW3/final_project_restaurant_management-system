import { kip } from "../config/constants";
import type { MenuItem, SessionItem } from "../types";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sessionTypeLabel = (value: unknown): string => {
  const text = String(value ?? "");
  if (text === "dine-in") return "ທານທີ່ຮ້ານ";
  if (text === "takeaway") return "ກັບບ້ານ";
  return text || "-";
};

export const printOrderBill = (session: SessionItem, menu: MenuItem[]) => {
  const rows = session.items
    .map((item) => {
      const menuItem = menu.find((entry) => entry.id === item.id);
      if (!menuItem) return null;
      const lineTotal = menuItem.price * item.qty;

      return {
        name: menuItem.name,
        qty: item.qty,
        price: menuItem.price,
        total: lineTotal,
      };
    })
    .filter(Boolean) as Array<{ name: string; qty: number; price: number; total: number }>;

  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const printedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>ບິນອໍເດີ ${escapeHtml(session.id)}</title>
        <style>
          @page { size: 80mm auto; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111;
            font-family: Arial, "Noto Sans Lao", sans-serif;
            font-size: 12px;
            line-height: 1.4;
          }
          .bill { width: 100%; }
          .center { text-align: center; }
          .brand { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
          .muted { color: #666; }
          .meta { margin: 12px 0; border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 8px 0; }
          .row { display: flex; justify-content: space-between; gap: 10px; margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; border-bottom: 1px solid #111; padding: 5px 0; font-size: 11px; }
          td { padding: 6px 0; border-bottom: 1px dashed #ddd; vertical-align: top; }
          .num { text-align: right; white-space: nowrap; }
          .total { margin-top: 12px; border-top: 2px solid #111; padding-top: 8px; font-size: 16px; font-weight: 800; }
          .footer { margin-top: 16px; text-align: center; color: #666; font-size: 11px; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="bill">
          <div class="center">
            <div class="brand">ໂອເລຟູດ</div>
            <div class="muted">ບິນອໍເດີ</div>
          </div>
          <div class="meta">
            <div class="row"><span>ບິນ</span><strong>${escapeHtml(session.id)}</strong></div>
            <div class="row"><span>ປະເພດ</span><span>${escapeHtml(sessionTypeLabel(session.payMethod || session.sessionType || "dine-in"))}</span></div>
            <div class="row"><span>ໝາຍເຫດ</span><span>${escapeHtml(session.note || "-")}</span></div>
            <div class="row"><span>ເປີດເມື່ອ</span><span>${escapeHtml(session.createdAt || "-")}</span></div>
            <div class="row"><span>ພິມເມື່ອ</span><span>${escapeHtml(printedAt)}</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ລາຍການ</th>
                <th class="num">ຈຳນວນ</th>
                <th class="num">ລວມ</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(row.name)}</strong>
                    <div class="muted">${escapeHtml(kip(row.price))}</div>
                  </td>
                  <td class="num">${escapeHtml(row.qty)}</td>
                  <td class="num">${escapeHtml(kip(row.total))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="row total"><span>ລວມ</span><span>${escapeHtml(kip(total))}</span></div>
          <div class="footer">ຂອບໃຈ</div>
        </div>
        <script>
          window.addEventListener("load", () => {
            window.print();
            window.setTimeout(() => window.close(), 300);
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
