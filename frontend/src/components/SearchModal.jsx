import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckSquare,
  FolderGit2,
  Mail,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { get } from "../services/api/api";
import { getInitials } from "../utils/getInitials";
import Modal from "./ui/Modal";

export function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const { data, isLoading } = useQuery({
    queryKey: ["omni-search", searchTerm],
    queryFn: () => get(`/search/omni?q=${encodeURIComponent(searchTerm.trim())}`),
    enabled: Boolean(isOpen && searchTerm.trim().length >= 2),
    staleTime: 1000 * 30,
  });

  const results = data?.data || { projects: [], cards: [], members: [] };
  const hasResults =
    results.projects.length > 0 || results.cards.length > 0 || results.members.length > 0;

  const handleSelectProject = (projectId) => {
    onClose();
    navigate(`/project/${projectId}`);
  };

  const handleSelectCard = (card) => {
    onClose();
    const pid = typeof card.project === "object" ? card.project._id : card.project;
    navigate(`/project/${pid}`);
  };

  const handleSelectMember = (member) => {
    onClose();
    const org = typeof member.organization === "object" ? member.organization : {};
    if (org.slug) {
      navigate(`/organization/${org.slug}`);
    } else {
      navigate("/organizations");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search OrbitPM">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, or team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 42px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              fontSize: "0.95rem",
              outline: "none",
              background: "#f8fafc",
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {isLoading && (
            <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "0.88rem" }}>
              Searching across projects and tasks...
            </div>
          )}

          {!isLoading && searchTerm.trim().length >= 2 && !hasResults && (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8" }}>
              No matches found for "{searchTerm}".
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                Projects ({results.projects.length})
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.projects.map((proj) => (
                  <div
                    key={proj._id}
                    onClick={() => handleSelectProject(proj._id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <FolderGit2 size={16} color="#2563eb" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#0f172a" }}>
                        {proj.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        /{proj.slug}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards / Tasks */}
          {results.cards.length > 0 && (
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                Tasks ({results.cards.length})
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.cards.map((card) => (
                  <div
                    key={card._id}
                    onClick={() => handleSelectCard(card)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    <CheckSquare size={16} color="#9333ea" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#0f172a" }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        in {typeof card.project === "object" ? card.project.name : "Project"}
                      </div>
                    </div>
                    {card.priority && (
                      <span
                        className={`kanban-priority-badge kanban-priority--${card.priority}`}
                        style={{ fontSize: "0.68rem" }}
                      >
                        {card.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {results.members.length > 0 && (
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                Team Members ({results.members.length})
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {results.members.map((member) => {
                  const u = typeof member.user === "object" ? member.user : {};
                  return (
                    <div
                      key={member._id}
                      onClick={() => handleSelectMember(member)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      {u.avathar ? (
                        <img
                          src={u.avathar}
                          alt=""
                          style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "#e2e8f0",
                            fontSize: "10px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getInitials(u.name || "Member")}
                        </span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#0f172a" }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {searchTerm.trim().length < 2 && (
            <div style={{ padding: "20px 10px", textAlign: "center", color: "#94a3b8", fontSize: "0.84rem" }}>
              Type at least 2 characters to search across projects, cards, and team members.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default SearchModal;
