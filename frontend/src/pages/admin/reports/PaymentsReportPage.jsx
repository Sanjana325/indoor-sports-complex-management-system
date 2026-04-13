import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid, InsightPanel } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

export default function PaymentsReportPage() {
  const { loading, data, activeRange, controls } = useAnalytics("payments");

  const insights = [
    `Total Revenue for this period: LKR ${data.kpis.totalRevenue?.toLocaleString()}.`,
    `Successfully processed ${data.kpis.verifiedPayments || 0} verified transactions.`
  ];

  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Financial Analytics" 
        subtitle={`Audit Period: ${activeRange.label}`}
        onExportCSV={() => console.log("CSV Export")}
        onExportPDF={() => window.print()}
      />

      <AnalyticFilters controls={controls} />

      <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '20px', alignItems: 'start' }}>
        <div>
          <KPIStatsGrid kpis={data.kpis} loading={loading} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <AnalyticChart 
              title="Revenue Growth" 
              type="line" 
              data={data.charts.revenueOverTime} 
              loading={loading} 
              dataKey="total"
            />
            <AnalyticChart 
              title="Payment Source Distribution" 
              type="pie" 
              data={data.charts.paymentMethodSplit} 
              loading={loading} 
            />
          </div>

          <AnalyticTable 
            headers={["ID", "Name", "Amount", "Date", "Status"]}
            rows={data.reports}
            loading={loading}
            rowRenderer={(row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td style={{ fontWeight: 700 }}>LKR {row.amount.toLocaleString()}</td>
                <td>{row.date}</td>
                <td>
                  <span className={`status-pill ${row.status === "VERIFIED" || row.status === "COMPLETED" ? "success" : "danger"}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            )}
          />
        </div>

        <div className="no-print">
          <InsightPanel insights={insights} loading={loading} />
          
          <div className="arena-card no-print" style={{ background: 'var(--bg-main)', border: '1px dashed var(--primary-light)' }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>💰 Financial Tip</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
               Verify payments regularly to maintain an accurate cash-flow audit. "Verified" status indicates funds have been cleared.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
