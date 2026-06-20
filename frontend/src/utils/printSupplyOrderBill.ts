import { kip } from "../config/constants";
import type { SupplyOrderDetailItem, SupplyOrderItem } from "../types";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "-";

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const printSupplyOrderBill = (
  order: SupplyOrderItem,
  details: SupplyOrderDetailItem[],
) => {
  const total = details.reduce((sum, detail) => sum + detail.quantity * detail.unitPrice, 0);
  const printedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const printWindow = window.open("", "_blank", "width=520,height=760");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>ໃບສັ່ງຊື້ ${escapeHtml(order.id)}</title>
        <style>
          @page { size: A5 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111;
            font-family: Arial, "Noto Sans Lao", sans-serif;
            font-size: 12px;
            line-height: 1.45;
          }
          .brand { font-size: 20px; font-weight: 800; }
          .sub { color: #666; }
          .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #111; padding-bottom: 10px; }
          .badge { border: 1px solid #111; padding: 5px 9px; border-radius: 999px; text-transform: uppercase; font-size: 11px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; margin: 14px 0; }
          .meta div { display: flex; justify-content: space-between; gap: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; background: #f4f0f0; padding: 7px 6px; font-size: 11px; }
          td { padding: 7px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
          .num { text-align: right; white-space: nowrap; }
          .total { display: flex; justify-content: space-between; margin-top: 14px; border-top: 2px solid #111; padding-top: 9px; font-size: 17px; font-weight: 800; }
          .footer { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; color: #666; }
          .sign { border-top: 1px solid #aaa; padding-top: 6px; text-align: center; margin-top: 34px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ໂອເລຟູດ</div>
            <div class="sub">ໃບສັ່ງຊື້ວັດຖຸດິບ</div>
          </div>
          <div class="badge">${escapeHtml(order.status)}</div>
        </div>
        <div class="meta">
          <div><span>ໃບສັ່ງ</span><strong>#${escapeHtml(order.id)}</strong></div>
          <div><span>ວັນທີ</span><span>${escapeHtml(formatDateTime(order.orderDate))}</span></div>
          <div><span>ຜູ້ສະໜອງ</span><strong>${escapeHtml(order.supplierName)}</strong></div>
          <div><span>ພະນັກງານ</span><span>${escapeHtml(order.staffName)}</span></div>
          <div><span>ພິມເມື່ອ</span><span>${escapeHtml(printedAt)}</span></div>
          <div><span>ແຖວ</span><span>${escapeHtml(details.length)}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ວັດຖຸດິບ</th>
              <th class="num">ຈຳນວນ</th>
              <th class="num">ລາຄາຕໍ່ຫົວໜ່ວຍ</th>
              <th class="num">ລວມ</th>
            </tr>
          </thead>
          <tbody>
            ${details.map((detail) => `
              <tr>
                <td>${escapeHtml(detail.ingredientName)}</td>
                <td class="num">${escapeHtml(detail.quantity)}</td>
                <td class="num">${escapeHtml(kip(detail.unitPrice))}</td>
                <td class="num">${escapeHtml(kip(detail.quantity * detail.unitPrice))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="total"><span>ລວມ</span><span>${escapeHtml(kip(total || order.totalAmount))}</span></div>
        <div class="footer">
          <div class="sign">ຜູ້ຮັບ</div>
          <div class="sign">ຜູ້ອະນຸມັດ</div>
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
