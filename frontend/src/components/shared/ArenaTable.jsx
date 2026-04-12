import React from "react";

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
            {columns.map((col, idx) => (
              <th key={idx} style={col.style || {}}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "1.5rem" }}>
                {loadingMessage}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "1.5rem" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ArenaTable;
