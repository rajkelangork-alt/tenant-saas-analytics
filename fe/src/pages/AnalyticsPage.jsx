import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  Globe, 
  Filter, 
  Search, 
  Download,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

// Multi-window data profiles
const TIMEFRAME_PROFILES = {
  '1h': {
    kpis: { deliveryRate: '99.8%', avgLatency: '14ms', p95: '24ms', eventsProcessed: '1,001', health: 'Optimal' },
    breakdown: [
      { name: 'API Requests', count: 432, fill: '#1F2937' },
      { name: 'Page Ingress', count: 289, fill: '#4B5563' },
      { name: 'WS Sync', count: 184, fill: '#9CA3AF' },
      { name: 'User Actions', count: 96, fill: '#D1D5DB' },
    ],
    trend: [
      { time: '13:00', latency: 14 },
      { time: '13:10', latency: 19 },
      { time: '13:20', latency: 14 },
      { time: '13:30', latency: 26 },
      { time: '13:40', latency: 18 },
      { time: '13:50', latency: 21 },
      { time: '14:00', latency: 16 },
    ],
  },
  '24h': {
    kpis: { deliveryRate: '99.9%', avgLatency: '18ms', p95: '32ms', eventsProcessed: '24,810', health: 'Healthy' },
    breakdown: [
      { name: 'API Requests', count: 10420, fill: '#1F2937' },
      { name: 'Page Ingress', count: 6890, fill: '#4B5563' },
      { name: 'WS Sync', count: 4420, fill: '#9CA3AF' },
      { name: 'User Actions', count: 2310, fill: '#D1D5DB' },
    ],
    trend: [
      { time: '00:00', latency: 12 },
      { time: '04:00', latency: 14 },
      { time: '08:00', latency: 28 },
      { time: '12:00', latency: 31 },
      { time: '16:00', latency: 22 },
      { time: '20:00', latency: 18 },
      { time: 'Now', latency: 16 },
    ],
  },
  '7d': {
    kpis: { deliveryRate: '99.6%', avgLatency: '22ms', p95: '41ms', eventsProcessed: '172,400', health: 'Healthy' },
    breakdown: [
      { name: 'API Requests', count: 74200, fill: '#1F2937' },
      { name: 'Page Ingress', count: 48900, fill: '#4B5563' },
      { name: 'WS Sync', count: 31200, fill: '#9CA3AF' },
      { name: 'User Actions', count: 16400, fill: '#D1D5DB' },
    ],
    trend: [
      { time: 'Mon', latency: 19 },
      { time: 'Tue', latency: 24 },
      { time: 'Wed', latency: 33 },
      { time: 'Thu', latency: 21 },
      { time: 'Fri', latency: 29 },
      { time: 'Sat', latency: 15 },
      { time: 'Sun', latency: 14 },
    ],
  },
  '30d': {
    kpis: { deliveryRate: '99.4%', avgLatency: '24ms', p95: '48ms', eventsProcessed: '748,920', health: 'SLA Met' },
    breakdown: [
      { name: 'API Requests', count: 320000, fill: '#1F2937' },
      { name: 'Page Ingress', count: 210000, fill: '#4B5563' },
      { name: 'WS Sync', count: 135000, fill: '#9CA3AF' },
      { name: 'User Actions', count: 71000, fill: '#D1D5DB' },
    ],
    trend: [
      { time: 'Week 1', latency: 21 },
      { time: 'Week 2', latency: 26 },
      { time: 'Week 3', latency: 24 },
      { time: 'Week 4', latency: 22 },
    ],
  },
};

const MOCK_EVENTS = [
  { id: 'evt_101', event_name: 'api.request', endpoint: '/api/v1/auth/login', status: 200, latency_ms: 14, timestamp: '13:42:05' },
  { id: 'evt_102', event_name: 'dashboard.view', endpoint: '/overview', status: 200, latency_ms: 22, timestamp: '13:42:21' },
  { id: 'evt_103', event_name: 'user.created', endpoint: '/api/v1/users', status: 201, latency_ms: 45, timestamp: '13:43:02' },
  { id: 'evt_104', event_name: 'api.request', endpoint: '/api/v1/analytics/overview', status: 200, latency_ms: 18, timestamp: '13:44:11' },
  { id: 'evt_105', event_name: 'telemetry.sync', endpoint: '/ws/stream', status: 101, latency_ms: 8, timestamp: '13:44:50' },
  { id: 'evt_106', event_name: 'export.csv', endpoint: '/analytics/export', status: 200, latency_ms: 31, timestamp: '13:45:19' },
  { id: 'evt_107', event_name: 'api.request', endpoint: '/api/v1/users', status: 200, latency_ms: 19, timestamp: '13:46:04' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const currentProfile = useMemo(() => TIMEFRAME_PROFILES[timeRange], [timeRange]);

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((evt) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        evt.event_name.toLowerCase().includes(query) ||
        evt.endpoint.toLowerCase().includes(query);
      const matchesType = selectedType === 'ALL' || evt.event_name.toLowerCase().includes(selectedType.toLowerCase());
      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedType]);

  const exportFiltered = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      ['ID,Event,Endpoint,Status,Latency(ms),Timestamp']
        .concat(filteredEvents.map((e) => `${e.id},${e.event_name},${e.endpoint},${e.status},${e.latency_ms},${e.timestamp}`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `events_deepdive_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Analytics Deep Dive</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Query explorer, latency metrics, and tenant event distributions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Working Time Range Selector */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
            {['1h', '24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={exportFiltered}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium text-gray-500">Event Delivery Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">
              {currentProfile.kpis.deliveryRate}
            </span>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              {currentProfile.kpis.health}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium text-gray-500">Avg Ingress Latency</span>
            <Cpu className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">
              {currentProfile.kpis.avgLatency}
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              p95: {currentProfile.kpis.p95}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium text-gray-500">Processed Events ({timeRange})</span>
            <Globe className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">
              {currentProfile.kpis.eventsProcessed}
            </span>
            <span className="text-[11px] text-stone-500 font-mono">Tenant 1-A</span>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dynamic Bar Chart */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Event Volume by Type</h2>
              <p className="text-xs text-gray-400 mt-0.5">Distribution over active timeframe ({timeRange})</p>
            </div>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentProfile.breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderRadius: '6px', color: '#fff', fontSize: '12px', border: 'none' }}
                  cursor={{ fill: '#F9FAFB' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {currentProfile.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Line Chart */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Ingress Latency (ms)</h2>
              <p className="text-xs text-gray-400 mt-0.5">Overhead timeline across {timeRange}</p>
            </div>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentProfile.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderRadius: '6px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Line type="monotone" dataKey="latency" stroke="#1F2937" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Query Explorer / Event Log Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search event type or endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50/60 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-stone-50/60 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="ALL">All Categories</option>
              <option value="api">API Requests</option>
              <option value="dashboard">Dashboard Views</option>
              <option value="user">User Events</option>
              <option value="telemetry">Telemetry Sync</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-medium text-gray-500 uppercase tracking-wider font-sans">
              <th className="py-3 px-4">Event</th>
              <th className="py-3 px-4">Route / Endpoint</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 font-sans text-xs">
                  No telemetry logs matching criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 font-mono">{evt.event_name}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                    {evt.endpoint}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        evt.status < 300
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-[11px]">
                    {evt.latency_ms}ms
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400 text-[11px]">
                    {evt.timestamp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}