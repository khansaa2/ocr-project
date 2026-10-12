"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import InvoiceList from "./InvoiceList"
import InvoiceTable from "./InvoiceTable"
import InvoiceUpload from "./InvoiceUpload"
import Statistics from "./Statistics"

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleInvoiceSaved = () => {
    setRefreshTrigger(prev => prev + 1)
    setActiveSection("invoices")
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="fade-in">
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h1
                      className="fw-bold mb-1"
                      style={{
                        background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Tableau de bord
                    </h1>
                    
                  </div>
                  <div className="pulse-animation">
                    <span style={{ fontSize: "2rem" }}>📊</span>
                  </div>
                </div>
              </div>
            </div>

            
            <InvoiceTable refreshTrigger={refreshTrigger} />
          </div>
        )
      case "upload":
        return <InvoiceUpload onInvoiceSaved={handleInvoiceSaved} />
      case "invoices":
        return <InvoiceTable refreshTrigger={refreshTrigger} />
      case "statistics":
        return <Statistics refreshTrigger={refreshTrigger} />
      case "settings":
        return (
          <div className="fade-in">
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">⚙️ Paramètres</h3>
              </div>
              <div className="card-body">
                <div className="text-center py-5">
                  <div style={{ fontSize: "4rem" }} className="mb-3 pulse-animation">
                    🚧
                  </div>
                  <h4>hihih</h4>
                  <p className="text-muted">not ready</p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <InvoiceTable refreshTrigger={refreshTrigger} />
    }
  }

  return (
    <div className="d-flex">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={onLogout} />
      <div className="main-content flex-grow-1">
        <div className="container-fluid">{renderContent()}</div>
      </div>
    </div>
  )
}
