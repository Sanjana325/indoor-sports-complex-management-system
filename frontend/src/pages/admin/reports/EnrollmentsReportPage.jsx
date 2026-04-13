import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid, InsightPanel } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

export default function EnrollmentsReportPage() {
  const { loading, data, activeRange, controls } = useAnalytics("enrollments");

  const insights = [
    `Most popular class: "${data.kpis.mostPopularClass || 'N/A'}"`,
    `Total student registration growth: ${data.reports?.length || 0} this period.`
  ];

  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Enrollment Analytics" 
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
                <td>{row.id}</td>
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

        <div className="no-print">
          <InsightPanel insights={insights} loading={loading} />
          
          <div className="arena-card no-print" style={{ background: 'var(--bg-main)', border: '1px dashed var(--primary-light)' }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>🎓 Enrollment Tip</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
               Tracking enrollment growth helps predict revenue and coach staffing requirements for the next academic quarter.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
