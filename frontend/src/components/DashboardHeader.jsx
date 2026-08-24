import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Plus } from "lucide-react";
import "./style/dashboardHeader.css";

export default function DashboardHeader({ onSelectOrganization }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Current route path ignoring search queries or hash
  const currentPath = location.pathname;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleOrganizationClick = () => {
    setIsDropdownOpen(false);
    if (onSelectOrganization) {
      onSelectOrganization();
    }
  };

  return (
    <div className="dashboard-header-wrapper">
      <header className="dashboard-header">
        {/* Left Side: Route Path */}
        <div className="dashboard-header-left">
          <span className="dashboard-header-route" title={currentPath}>
            {currentPath}
          </span>
        </div>

        {/* Right Side: Actions */}
        <div className="dashboard-header-right" ref={dropdownRef}>
          <button
            type="button"
            className="dashboard-header-icon-btn"
            onClick={() => navigate("/organizations")}
            title="Organizations"
            aria-label="View Organizations"
          >
            <Building2 size={15} />
          </button>

          <button
            type="button"
            className={`dashboard-header-create-btn ${isDropdownOpen ? "is-open" : ""}`}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label="Create new item"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <Plus size={15} />
            <ChevronDown size={12} />
          </button>

          {isDropdownOpen && (
            <div className="dashboard-header-dropdown" role="menu">
              <button
                type="button"
                className="dashboard-header-dropdown-item"
                role="menuitem"
                onClick={handleOrganizationClick}
              >
                <span className="dashboard-header-dropdown-item-icon">
                  <Building2 size={15} />
                </span>
                <span>Organization</span>
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
