import React from "react";

// reusable data grid component designed for consistent layout across all dashboard lists
const ArenaTable = ({ 
  columns = [], 
  data = [], 
  loading = false, 
  emptyMessage = "No records found.",
  loadingMessage = "Fetching data...",
  renderRow
}) => {
  return (
    <div className="arena-table-container">
      <table className="arena-table">
        <thead>
          <tr>
            {/* dynamically renders table headers based on the column definition array */}
            {columns.map((col, idx) => (
              <th key={idx} style={col.style || {}}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* conditional rendering flow for loading, empty, or data-rich states */}
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "1.5rem" }}>
                {loadingMessage}
              </td>
            </tr>
          ) : data.length === 0 ? (
            /* feedback when the dataset is empty or filters returned nothing */
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "1.5rem" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            /* executes the parent-provided row renderer for every data item */
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ArenaTable;
