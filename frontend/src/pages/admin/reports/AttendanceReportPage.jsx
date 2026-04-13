import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid, InsightPanel } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

export default function AttendanceReportPage() {
  const { loading, data, activeRange, controls } = useAnalytics("attendance");

  const insights = [
    `Average attendance rate: ${data.kpis.averageAttendanceRate || '0%'}.`,
    ...(data.charts.attendancePerClass?.length 
      ? [`${[...data.charts.attendancePerClass].sort((a,b) => b.value - a.value)[0].name} has the highest engagement.`] 
      : [])
  ];

  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Attendance Analytics" 
        subtitle={`Audit Period: ${activeRange.label}`}
        onExportCSV={() => console.log("CSV Export")}
        onExportPDF={() => window.print()}
      />

      <AnalyticFilters controls={controls} />

      <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '20px', alignItems: 'start' }}>
        <div>
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
                <td>{row.id}</td>
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

        <div className="no-print">
          <InsightPanel insights={insights} loading={loading} />
          
          <div className="arena-card no-print" style={{ background: 'var(--bg-main)', border: '1px dashed var(--primary-light)' }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>👥 Attendance Tip</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
               High attendance rates correlate with student retention. Review classes with lower engagement to improve curriculum.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
