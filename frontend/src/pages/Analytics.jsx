import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Layout from '../components/Layout';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = ['#3b6ea5', '#f2a93b', '#2e8b77', '#c4462b', '#8a94a6', '#6b4fa0', '#d97757', '#4f8ac9'];

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then((res) => setData(res.data));
  }, []);

  const exportFile = async (type) => {
    const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `complaints-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!data) {
    return (
      <Layout>
        <p className="text-slate">Loading analytics...</p>
      </Layout>
    );
  }

  const categoryChart = {
    labels: data.categoryStats.map((c) => c._id),
    datasets: [
      {
        label: 'Complaints',
        data: data.categoryStats.map((c) => c.count),
        backgroundColor: CHART_COLORS,
      },
    ],
  };

  const priorityChart = {
    labels: data.priorityStats.map((p) => p._id),
    datasets: [
      {
        data: data.priorityStats.map((p) => p.count),
        backgroundColor: ['#8a94a6', '#3b6ea5', '#f2a93b', '#c4462b'],
      },
    ],
  };

  const trendChart = {
    labels: data.monthlyTrend.map((t) => `${MONTH_NAMES[t._id.month - 1]} ${t._id.year}`),
    datasets: [
      {
        label: 'Complaints filed',
        data: data.monthlyTrend.map((t) => t.count),
        borderColor: '#3b6ea5',
        backgroundColor: 'rgba(59, 110, 165, 0.15)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <Layout>
      <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
        <div>
          <h1>Analytics</h1>
          <p className="text-slate">Trends and performance across all complaints.</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-outline btn-sm" onClick={() => exportFile('pdf')}>
            Export PDF
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => exportFile('excel')}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-16" style={{ marginBottom: 24 }}>
        {[
          ['Total', data.totals.total],
          ['Submitted', data.totals.submitted],
          ['In Progress', data.totals.inProgress],
          ['Resolved', data.totals.resolved],
        ].map(([label, val]) => (
          <div className="card" key={label} style={{ padding: '18px 20px' }}>
            <div className="text-sm text-slate" style={{ marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-16" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Complaints by Category</h3>
          <Bar data={categoryChart} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Complaints by Priority</h3>
          <Doughnut data={priorityChart} />
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Monthly Trend</h3>
        <Line data={trendChart} />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Department Performance</h3>
        {data.deptPerformance.length === 0 ? (
          <p className="text-slate text-sm">No department assignments yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '8px 0' }}>Department</th>
                <th>Total</th>
                <th>Resolved</th>
                <th>Resolution Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.deptPerformance.map((d) => (
                <tr key={d._id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '8px 0' }}>{d._id}</td>
                  <td>{d.total}</td>
                  <td>{d.resolved}</td>
                  <td>{Math.round((d.resolved / d.total) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
