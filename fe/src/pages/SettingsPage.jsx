import React, { useState } from 'react';
import { 
  Building2, 
  Key, 
  ShieldAlert, 
  Copy, 
  Check, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Save,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Tenant workspace state
  const [workspaceName, setWorkspaceName] = useState('Production Analytics Corp');
  const [retentionDays, setRetentionDays] = useState('30');
  const [webhookUrl, setWebhookUrl] = useState('https://api.tenant1.com/webhooks/ingress');
  const [apiKey, setApiKey] = useState('sk_live_tenant1_9f4b1e82a9c34d0b8f67e');

  const tenantId = user?.tenant_id || '24e0061d-9664-4538-b397-3dbf11354ea3';

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRegenerateKey = () => {
    if (window.confirm('Revoke current API key? Integrations using it will immediately fail.')) {
      const randomHex = Array.from({ length: 24 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setApiKey(`sk_live_tenant1_${randomHex}`);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Workspace Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure tenant isolation parameters, telemetry retention, and API credentials
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            Saved successfully
          </div>
        )}
      </div>

      {/* Tenant Identity Box */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Tenant Identity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="block text-gray-500 mb-1">Unique Tenant UUID</span>
            <div className="flex items-center gap-2 bg-stone-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-800">
              <span className="truncate">{tenantId}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(tenantId, 'id')}
                className="ml-auto text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                title="Copy UUID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <span className="block text-gray-500 mb-1">Active Tier</span>
            <div className="flex items-center justify-between bg-stone-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Scale / Enterprise</span>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">DEDICATED</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Provisioned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Programmatic Ingestion API Key */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Ingress Secret Key</h2>
          </div>
          <button
            onClick={handleRegenerateKey}
            className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Roll Key
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Authenticate SDK clients and background worker telemetry pipelines directly.
        </p>

        <div className="flex items-center gap-2 bg-stone-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs text-gray-800">
          <span className="truncate">
            {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
              title={showApiKey ? 'Hide' : 'Show'}
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(apiKey, 'key')}
              className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
              title="Copy Key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* General Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Server className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Ingress & Storage Rules</h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Workspace Display Name
          </label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Data Retention Horizon
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="7">7 Days (Standard)</option>
              <option value="30">30 Days (Operational)</option>
              <option value="90">90 Days (Extended)</option>
              <option value="365">365 Days (Compliance)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Telemetry Forwarding Webhook (Optional)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-gray-200 rounded-lg text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Workspace Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}