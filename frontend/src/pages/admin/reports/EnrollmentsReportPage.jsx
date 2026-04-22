import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

// report page for monitoring student registration and class popularity trends
export default function EnrollmentsReportPage() {
  // processes enrollment statistics via the common analytics engine
  const { loading, data, activeRange, controls } = useAnalytics("enrollments");

  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Enrollment Analytics" 
        subtitle={`Audit Period: ${activeRange.start} to ${activeRange.end} (${activeRange.label})`}
        onExportPDF={() => window.print()}
      />

      {/* filter panel to isolate data by specific dates or class titles */}
      <AnalyticFilters controls={controls} hasTargetClassFilter={true} metadata={data.metadata} />

      <div style={{ marginBottom: '24px' }}>
        {/* business metrics like total students and net growth rate */}
        <KPIStatsGrid kpis={data.kpis} loading={loading} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* charts showing new students joining daily and total class occupancy */}
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

        {/* ledger of all individual enrollment events matching the filters */}
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
