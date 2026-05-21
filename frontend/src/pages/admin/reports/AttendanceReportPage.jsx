import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

// deep-dive report page specifically for tracking student attendance patterns
export default function AttendanceReportPage() {
  // uses a custom hook to fetch and manage complex analytical data
  const { loading, data, activeRange, controls } = useAnalytics("attendance");

  return (
    <div className="admin-content-inner">
      {/* top navigation and export controls for the report */}
      <AnalyticHeader 
        title="Attendance Analytics" 
        subtitle={`Audit Period: ${activeRange.start} to ${activeRange.end} (${activeRange.label})`}
        onExportPDF={() => window.print()}
      />

      {/* sidebar filters to drill down into specific dates or class groups */}
      <AnalyticFilters controls={controls} hasTargetClassFilter={true} metadata={data.metadata} />

      <div style={{ marginBottom: '24px' }}>
        {/* summary cards for high-level metrics like average attendance rate */}
        <KPIStatsGrid kpis={data.kpis} loading={loading} />
        
        <div style={{ marginBottom: '24px' }}>
          {/* visual bar chart comparing attendance across different sports/classes */}
          <AnalyticChart 
            title="Attendance Rate By Class (%)" 
            type="bar" 
            data={data.charts.attendancePerClass} 
            loading={loading} 
            dataKey="value"
          />
        </div>

        {/* raw data table for detailed row-by-row auditing of records */}
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
