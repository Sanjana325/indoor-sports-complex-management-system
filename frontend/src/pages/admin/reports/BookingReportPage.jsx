import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

export default function BookingReportPage() {
  const { loading, data, activeRange, controls } = useAnalytics("bookings");



  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Booking Analytics" 
        subtitle={`Audit Period: ${activeRange.start} to ${activeRange.end} (${activeRange.label})`}
        onExportPDF={() => window.print()}
      />

      <AnalyticFilters controls={controls} hasMethodFilter={true} />

      <div style={{ marginBottom: '24px' }}>
        <KPIStatsGrid kpis={data.kpis} loading={loading} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          <AnalyticChart 
            title="Daily Booking Trend" 
            type="line" 
            data={data.charts.bookingsPerDay} 
            loading={loading} 
            dataKey="count"
          />
          <AnalyticChart 
            title="Bookings By Sport" 
            type="bar" 
            data={data.charts.bookingsBySport} 
            loading={loading} 
            dataKey="value"
          />
        </div>
      </div>

      <AnalyticTable 
        headers={["ID", "PLAYER & DETAILS", "ARENA & SPORT", "SESSION", "CREATED", "PAYMENT ID", "METHOD", "STATUS"]}
        rows={data.reports}
        loading={loading}
        rowRenderer={(row) => (
          <tr key={row.id}>
            <td><span className="table-id">{row.id}</span></td>
            <td>
              <div style={{ fontWeight: 600 }}>{row.player}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.playerPhone}</div>
            </td>
            <td>
              <div style={{ fontWeight: 600 }}>{row.court}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.sport}</div>
            </td>
            <td>
              <div style={{ fontWeight: 600 }}>{row.date}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.time}</div>
            </td>
            <td>{row.created}</td>
            <td>
              {row.paymentId !== "-" ? (
                <span className="table-id" style={{ opacity: 0.8, fontSize: '0.75rem' }}>{row.paymentId}</span>
              ) : "-"}
            </td>
            <td>{row.method}</td>
            <td>
              <span className={`status-pill ${
                row.status === "CONFIRMED" ? "success" : 
                row.status === "CANCELLED" ? "danger" : 
                row.status === "PENDING_PAYMENT" ? "warning" : "info"
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
