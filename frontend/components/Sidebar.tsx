"use client"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout: () => void
}

export default function Sidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "upload", label: "Upload Facture", icon: "📤" },
    { id: "invoices", label: "Mes Factures", icon: "📄" },
    { id: "statistics", label: "Statistiques", icon: "📈" },
    { id: "settings", label: "Paramètres", icon: "⚙️" },
  ]

  return (
    <div className="sidebar">
      <div className="p-3">
        <h4 className="text-white mb-4">Invoice App</h4>
        <nav className="nav flex-column">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link text-start ${activeSection === item.id ? "active" : ""}`}
              onClick={() => onSectionChange(item.id)}
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <button className="btn btn-outline-light w-100" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </div>
  )
}
