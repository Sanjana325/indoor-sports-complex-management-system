import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

export default function EnrollmentsReportPage() {
  const { loading, data, activeRange, controls } = useAnalytics("enrollments");



  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Enrollment Analytics" 
        subtitle={`Audit Period: ${activeRange.start} to ${activeRange.end} (${activeRange.label})`}
        onExportPDF={() => window.print()}
      />

      <AnalyticFilters controls={controls} hasTargetClassFilter={true} metadata={data.metadata} />

      <div style={{ marginBottom: '24px' }}>
        <KPIStatsGrid kpis={data.kpis} loading={loading} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <AnalyticChart 
            title="Daily Enrollment Growth" 
            type="line" 
            data={data.charts.dailyEnrollments} 
            loading={loading} 
            dataKey="count"
          />
          <AnalyticChart 
            title="Enrollments By Class" 
            type="bar" 
            data={data.charts.enrollmentsPerClass} 
            loading={loading} 
            dataKey="value"
          />
        </div>

        <AnalyticTable 
          headers={["ID", "Player", "Class", "Enrolled Date", "Status"]}
          rows={data.reports}
          loading={loading}
          rowRenderer={(row) => (
            <tr key={row.id}>
              <td><span className="table-id">{row.id}</span></td>
              <td>{row.player}</td>
              <td>{row.className}</td>
              <td>{row.dateEnrolled}</td>
              <td>
                <span className={`status-pill ${row.status === "ENROLLED" ? "success" : "danger"}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
