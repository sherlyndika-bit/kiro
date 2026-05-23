import React from 'react'

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Active Chats', value: '12', change: '+3', icon: 'chat', color: 'text-secondary' },
    { label: 'AI Handled Today', value: '147', change: '+18%', icon: 'smart_toy', color: 'text-emerald-600' },
    { label: 'Human Takeovers', value: '8', change: '-12%', icon: 'support_agent', color: 'text-orange-600' },
    { label: 'Avg Confidence', value: '91.2%', change: '+2.4%', icon: 'verified', color: 'text-emerald-600' },
  ]

  const recentActivity = [
    { time: '2m ago', icon: 'chat', text: 'New WhatsApp message from Bpk. Budi', tag: 'WA' },
    { time: '5m ago', icon: 'smart_toy', text: 'AI auto-responded to @interior_lover', tag: 'IG' },
    { time: '12m ago', icon: 'support_agent', text: 'Human takeover for Ibu Siti', tag: 'WA' },
    { time: '25m ago', icon: 'check_circle', text: 'Conversation resolved with Bpk. Ahmad', tag: 'WA' },
  ]

  const projects = [
    { name: 'Apartemen Bpk. Budi', type: 'Studio 45m²', stage: 'Estimasi', progress: 20 },
    { name: 'Rumah Ibu Siti', type: 'Rumah 2 Lantai', stage: 'Proposal', progress: 60 },
    { name: 'Kantor PT. Maju', type: 'Office 120m²', stage: 'Pengerjaan', progress: 80 },
  ]

  return (
    <div className="p-gutter space-y-md max-w-container-max">
      {/* Header */}
      <div>
        <h1 className="font-display-lg text-display-lg font-bold text-on-background">Dashboard</h1>
        <p className="text-body-md text-on-surface-variant">
          Overview of your AI Operator performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-md">
              <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              <span
                className={`text-label-caps font-bold ${
                  stat.change.startsWith('+')
                    ? 'text-emerald-600'
                    : stat.change.startsWith('-')
                    ? 'text-error'
                    : 'text-outline'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="font-display-lg text-[28px] font-bold text-on-background">
              {stat.value}
            </div>
            <div className="text-body-md text-on-surface-variant">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Recent Activity */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">Recent Activity</h3>
          <div className="space-y-sm">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex items-start gap-sm py-sm border-b border-outline-variant last:border-0">
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    {act.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-background">{act.text}</p>
                  <span className="text-label-caps text-outline">{act.time}</span>
                </div>
                <span className="px-2 py-0.5 bg-surface-container rounded text-label-caps text-on-surface-variant">
                  {act.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
          <h3 className="font-headline-sm text-headline-sm font-bold mb-md">Active Projects</h3>
          <div className="space-y-md">
            {projects.map((p, i) => (
              <div key={i} className="border-b border-outline-variant last:border-0 pb-md last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-on-background">{p.name}</p>
                    <p className="text-label-caps text-outline">{p.type}</p>
                  </div>
                  <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-caps font-bold">
                    {p.stage}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${p.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
