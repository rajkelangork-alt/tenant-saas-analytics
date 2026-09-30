import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Activity, 
  Zap, 
  Download, 
  RefreshCw, 
  Radio, 
  ArrowUpRight 
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const USERS_STORAGE_KEY = 'saas_tenant1_users';

const INITIAL_SERIES = [
  { time: '12:00', events: 2 },
  { time: '12:10', events: 5 },
  { time: '12:20', events: 3 },
  { time: '12:30', events: 8 },
  { time: '12:40', events: 6 },
  { time: '12:50', events: 11 },
  { time: '13:00', events: 9 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [userCount, setUserCount] = useState(4);
  const [totalEvents, setTotalEvents] = useState(38);
  const [seriesData, setSeriesData] = useState(INITIAL_SERIES);
  const [liveEvents, setLiveEvents] = useState([
    { id: 'evt_1', name: 'api.request', endpoint: '/api/v1/auth/login', status: 200, latency: 14, time: 'Just now' },
    { id: 'evt_2', name: 'dashboard.view', endpoint: '/overview', status: 200, latency: 19, time: '1 min ago' },
    { id: 'evt_3', name: 'user.created', endpoint: '/api/v1/users', status: 201, latency: 42, time: '3 mins ago' },
  ]);
  const [isLive, setIsLive] = useState(true);

  // Read actual member count from Team roster
  useEffect(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setUserCount(parsed.length);
        }
      }
    } catch {
      setUserCount(4);
    }
  }, []);

  // Connect to live WebSocket stream
  useEffect(() => {
    const tenantId = user?.tenant_id || '24e0061d-9664-4538-b397-3dbf11354ea3';
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${tenantId}`);

    socket.onopen = () => setIsLive(true);
    socket.onclose = () => setIsLive(false);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventName = data.event_name || 'telemetry.event';
        const payload = data.payload || {};

        setTotalEvents((prev) => prev + 1);

        const newEntry = {
          id: `evt_${Date.now()}`,
          name: eventName,
          endpoint: payload.endpoint || '/api/v1/stream',
          status: payload.status_code || 200,
          latency: payload.latency_ms || Math.floor(Math.random() * 20) + 10,
          time: new Date().toLocaleTimeString(),
        };

        setLiveEvents((prev) => [newEntry, ...prev.slice(0, 9)]);

        setSeriesData((prev) => {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last.time === now) {
            last.events += 1;
            return [...copy];
          }
          return [...copy.slice(1), { time: now, events: 1 }];
        });
      } catch {
        // Fallback for non-JSON frame
      }
    };

    return () => socket.close();
  }, [user]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = ['Event ID,Event Name,Endpoint,Status,Latency (ms),Time'];
    const rows = liveEvents.map(
      (e) => `${e.id},${e.name},${e.endpoint},${e.status},${e.latency},${e.time}`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tenant_telemetry_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Analytics Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Tenant-scoped operational telemetry</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg">
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-pulse text-emerald-600' : 'text-gray-400'}`} />
            Live Stream
          </span>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="p-5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium text-gray-500">Total Users</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">{userCount}</span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center">
              +{(userCount * 3)}% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="p-5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium text-gray-500">Active Sessions</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">1</span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center">
              +5% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Total Events */}
        <div className="p-5 bg-white border border-gray-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium text-gray-500">Total Events</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">{totalEvents}</span>
            <span className="text-[11px] font-mono text-gray-400">Realtime</span>
          </div>
        </div>
      </div>

      {/* Event Stream Chart */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Event Stream Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Rolling ingress events processed by background worker</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={seriesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F2937" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1F2937" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', borderRadius: '6px', color: '#fff', fontSize: '12px', border: 'none' }}
              />
              <Area type="monotone" dataKey="events" stroke="#1F2937" strokeWidth={2} fillOpacity={1} fill="url(#eventGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Ingress Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Live Tenant Telemetry Ingress</h3>
          <span className="text-xs text-gray-400 font-mono">Auto-scrolling buffer</span>
        </div>

        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-medium text-gray-500 uppercase tracking-wider font-sans">
              <th className="py-2.5 px-4">Event</th>
              <th className="py-2.5 px-4">Endpoint</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Latency</th>
              <th className="py-2.5 px-4 text-right">Ingress Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {liveEvents.map((evt) => (
              <tr key={evt.id} className="hover:bg-gray-50/50 transition">
                <td className="py-2.5 px-4 font-semibold text-gray-900">{evt.name}</td>
                <td className="py-2.5 px-4 text-gray-500 text-[11px]">{evt.endpoint}</td>
                <td className="py-2.5 px-4">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    evt.status < 300 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {evt.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-500">{evt.latency}ms</td>
                <td className="py-2.5 px-4 text-right text-gray-400">{evt.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}