'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
  Target,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import LeadForm from '@/components/crm/LeadForm';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  leadScore: number;
  createdAt: string;
  industry?: string;
  description?: string;
}

interface NextBestAction {
  action: string;
  priority: number;
  reason: string;
}

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Mới', color: '#3b82f6', bg: '#dbeafe' },
  contacted: { label: 'Đã liên hệ', color: '#10b981', bg: '#d1fae5' },
  qualified: { label: 'Tiềm năng', color: '#f59e0b', bg: '#fef3c7' },
  won: { label: 'Thành công', color: '#8b5cf6', bg: '#ede9fe' },
  lost: { label: 'Thất bại', color: '#ef4444', bg: '#fee2e2' },
};

function NBACard({ action, priority, reason }: { action: string; priority: number; reason: string }) {
  const { t } = useTranslation();
  const actionIcons: Record<string, React.ReactNode> = {
    call: <Phone className="w-5 h-5" />,
    email: <Mail className="w-5 h-5" />,
    meeting: <Target className="w-5 h-5" />,
    proposal: <TrendingUp className="w-5 h-5" />,
    follow_up: <Clock className="w-5 h-5" />,
  };
  const actionLabels: Record<string, string> = {
    call: t('crm.actions.call', 'Gọi điện'),
    email: t('crm.actions.email', 'Gửi email'),
    meeting: t('crm.actions.meeting', 'Hẹn gặp'),
    proposal: t('crm.actions.proposal', 'Đề xuất'),
    follow_up: t('crm.actions.follow_up', 'Theo dõi'),
  };

  const colorClass = priority >= 70 ? 'bg-green-50 border-green-200'
    : priority >= 40 ? 'bg-yellow-50 border-yellow-200'
    : 'bg-red-50 border-red-200';

  return (
    <div className={`border rounded-lg p-4 ${colorClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{actionIcons[action] || <Target className="w-5 h-5" />}</span>
          <span className="font-semibold text-gray-900">{actionLabels[action] || action}</span>
        </div>
        <span className={`text-sm font-bold px-2 py-1 rounded ${
          priority >= 70 ? 'text-green-700 bg-green-100'
          : priority >= 40 ? 'text-yellow-700 bg-yellow-100'
          : 'text-red-700 bg-red-100'
        }`}>
          {priority}%
        </span>
      </div>
      <p className="text-sm text-gray-600">{reason}</p>
    </div>
  );
}

export default function CRMPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [nba, setNba] = useState<NextBestAction | null>(null);
  const [nbaLoading, setNbaLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [stats, setStats] = useState({ total: 0, byStatus: [] as { status: string; count: number }[], winRate: 0 });

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await apiClient.get<{ items: Lead[] }>(`/crm/leads?${params}`);
      setLeads(res.items || res.data?.items || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get<{ total: number; byStatus: { status: string; count: number }[]; winRate: number }>('/crm/leads/stats');
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchNBA = async (leadId: string) => {
    try {
      setNbaLoading(true);
      const res = await apiClient.get<NextBestAction>(`/crm/next-best-action/lead/${leadId}`);
      setNba(res.data || res);
    } catch (err) {
      console.error('Failed to fetch NBA:', err);
    } finally {
      setNbaLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); fetchStats(); }, [fetchLeads]);

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setNba(null);
    fetchNBA(lead.id);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm(t('crm.confirmDelete', 'Bạn có chắc muốn xóa lead này?'))) return;
    try {
      await apiClient.delete(`/crm/leads/${leadId}`);
      fetchLeads();
      fetchStats();
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const handleFormSuccess = () => {
    fetchLeads();
    fetchStats();
    setShowForm(false);
    setEditingLead(null);
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-500">{t('common.loading', 'Đang tải...')}</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('crm.title', 'CRM')}</h1>
          <p className="text-sm text-gray-500">{t('crm.subtitle', 'Quản lý khách hàng tiềm năng')}</p>
        </div>
        <button
          onClick={() => { setEditingLead(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('crm.addLead', 'Thêm Lead')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">{t('crm.totalLeads', 'Tổng Lead')}</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-100">
          <div className="text-sm text-blue-600 mb-1">{t('crm.statuses.new', 'Mới')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.byStatus.find(s => s.status === 'new')?.count || 0}
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-100">
          <div className="text-sm text-green-600 mb-1">{t('crm.statuses.qualified', 'Tiềm năng')}</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.byStatus.find(s => s.status === 'qualified')?.count || 0}
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-6 shadow-sm border border-purple-100">
          <div className="text-sm text-purple-600 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-purple-600">{stats.winRate}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('crm.searchLeads', 'Tìm kiếm lead...')}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('common.all', 'Tất cả')}</option>
          <option value="new">{t('crm.statuses.new', 'Mới')}</option>
          <option value="contacted">{t('crm.statuses.contacted', 'Đã liên hệ')}</option>
          <option value="qualified">{t('crm.statuses.qualified', 'Tiềm năng')}</option>
          <option value="won">{t('crm.statuses.won', 'Thành công')}</option>
          <option value="lost">{t('crm.statuses.lost', 'Thất bại')}</option>
        </select>
        <button
          onClick={() => { fetchLeads(); fetchStats(); }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('crm.company', 'Công ty')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('crm.source', 'Nguồn')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('crm.status', 'Trạng thái')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('crm.leadScore', 'Điểm')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t('common.noData', 'Chưa có dữ liệu')}
                  </td>
                </tr>
              ) : leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => handleLeadSelect(lead)}
                  className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedLead?.id === lead.id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</div>
                    <div className="text-sm text-gray-500">{lead.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.company || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {t(`crm.sources.${lead.source}`, lead.source)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      STATUS_COLORS[lead.status]
                        ? `text-[${STATUS_COLORS[lead.status].color}] bg-[${STATUS_COLORS[lead.status].bg}]`
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {STATUS_COLORS[lead.status]?.label || lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getLeadScoreColor(lead.leadScore)}`}>
                      {lead.leadScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditLead(lead)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NBA Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('crm.nextBestAction', 'Hành động tiếp theo')}
            </h3>
            {selectedLead && (
              <button
                onClick={() => fetchNBA(selectedLead.id)}
                className="p-1.5 hover:bg-gray-100 rounded"
                disabled={nbaLoading}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${nbaLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {selectedLead ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {selectedLead.firstName} {selectedLead.lastName}
              </p>
              {nba ? (
                <NBACard action={nba.action} priority={nba.priority} reason={nba.reason} />
              ) : (
                <p className="text-gray-400 text-center py-8">
                  {nbaLoading ? t('common.loading', 'Đang phân tích...') : t('crm.noNBA', 'Không có gợi ý')}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-8">
              {t('crm.selectLead', 'Chọn lead để xem gợi ý')}
            </p>
          )}
        </div>
      </div>

      {/* Lead Form Modal */}
      {showForm && (
        <LeadForm
          lead={editingLead || undefined}
          onSuccess={handleFormSuccess}
          onClose={() => { setShowForm(false); setEditingLead(null); }}
        />
      )}
    </div>
  );
}