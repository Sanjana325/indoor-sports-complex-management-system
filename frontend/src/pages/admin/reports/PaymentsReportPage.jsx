import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

// comprehensive financial dashboard for auditing revenue and payment health
export default function PaymentsReportPage() {
  // aggregates all system transactions into actionable financial data
  const { loading, data, activeRange, controls } = useAnalytics("payments");

  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Financial Analytics" 
        subtitle={`Audit Period: ${activeRange.start} to ${activeRange.end} (${activeRange.label})`}
        onExportPDF={() => window.print()}
      />

      {/* filtering options to switch between booking fees and class memberships */}
      <AnalyticFilters controls={controls} hasCategoryFilter={true} hasStatusFilter={true} />

      <div style={{ marginBottom: '24px' }}>
        {/* key financial indicators like total revenue and pending balance */}
        <KPIStatsGrid kpis={data.kpis} loading={loading} />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 0.8fr)', gap: '20px', marginBottom: '24px' }}>
          {/* visual trends showing revenue growth and collection predictability */}
          <AnalyticChart 
            title="Revenue Growth" 
            type="line" 
            data={data.charts.revenueOverTime} 
            loading={loading} 
            dataKey="total"
          />
          <AnalyticChart 
            title="Revenue Breakdown" 
            type="pie" 
            data={data.charts.revenuePredictability} 
            loading={loading} 
          />
          <AnalyticChart 
            title="Payment Source" 
            type="donut" 
            data={data.charts.paymentMethodSplit} 
            loading={loading} 
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          {/* identifying the most profitable courts and arenas */}
          <AnalyticChart 
            title="Revenue By Court" 
            type="bar" 
            data={data.charts.revenueByCourt} 
            loading={loading} 
            dataKey="value"
          />
        </div>
      </div>

      {/* granular table showing every transaction record with verification status */}
      <AnalyticTable 
        headers={["PAYMENT ID", "PAYER DETAILS", "CATEGORY", "AMOUNT", "DATE & TIME", "VERIFIED", "METHOD", "STATUS"]}
        rows={data.reports}
        loading={loading}
        rowRenderer={(row) => (
          <tr key={row.id}>
            <td><span className="table-id">{row.id}</span></td>
            <td>
              <div style={{ fontWeight: 600 }}>{row.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.phone}</div>
            </td>
            <td>{row.category}</td>
            <td style={{ fontWeight: 700 }}>LKR {row.amount.toLocaleString()}</td>
            <td>
              <div style={{ fontWeight: 600 }}>{row.date}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.time}</div>
            </td>
            <td>{row.verified}</td>
            <td>{row.method}</td>
            <td>
              {/* status indicator for quickly checking which payments require action */}
              <span className={`status-pill ${
                row.status === "VERIFIED" ? "success" : 
                row.status === "REJECTED" ? "danger" : "warning"
              }`}>
                {row.status}
              </span>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
