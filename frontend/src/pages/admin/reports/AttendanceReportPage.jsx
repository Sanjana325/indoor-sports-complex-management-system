import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

export default function AttendanceReportPage() {
  const { loading, data, activeRange, controls } = useAnalytics("attendance");



  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Attendance Analytics" 
        subtitle={`Audit Period: ${activeRange.start} to ${activeRange.end} (${activeRange.label})`}
        onExportPDF={() => window.print()}
      />

      <AnalyticFilters controls={controls} hasTargetClassFilter={true} metadata={data.metadata} />

      <div style={{ marginBottom: '24px' }}>
        <KPIStatsGrid kpis={data.kpis} loading={loading} />
        
        <div style={{ marginBottom: '24px' }}>
          <AnalyticChart 
            title="Attendance Rate By Class (%)" 
            type="bar" 
            data={data.charts.attendancePerClass} 
            loading={loading} 
            dataKey="value"
          />
        </div>

        <AnalyticTable 
          headers={["ID", "Class", "Student", "Date", "Status"]}
          rows={data.reports}
          loading={loading}
          rowRenderer={(row) => (
            <tr key={row.id}>
              <td><span className="table-id">{row.id}</span></td>
              <td>{row.className}</td>
              <td>{row.student}</td>
              <td>{row.date}</td>
              <td>
                <span className={`status-pill ${row.status === "PRESENT" ? "success" : "danger"}`}>
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
