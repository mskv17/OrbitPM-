import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  Mail,
  MoreVertical,
  Pencil,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
import { getInitials } from "../../utils/getInitials";
import RoleBadge from "../ui/RoleBadge";

/**
 * Derives what remove/leave actions the current actor can take on a target member.
 *
 * Permission matrix (mirrors the backend controller):
 *  owner  → can remove anyone except themselves
 *  admin  → can remove editor/viewer only; can leave themselves
 *  editor → can only leave themselves
 *  viewer → can only leave themselves
 *
 * @param {string} actorRole     - role of the logged-in user in this org
 * @param {string} actorUserId   - _id of the logged-in user
 * @param {string} targetUserId  - user._id of the member tile being rendered
 * @param {string} targetRole    - role of the member tile being rendered
 * @returns {{ canRemove: boolean, canLeave: boolean, label: string, icon: 'remove'|'leave'|null }}
 */
function resolveRemoveAction(actorRole, actorUserId, targetUserId, targetRole) {
  const isSelf = String(actorUserId) === String(targetUserId);

  if (actorRole === "owner") {
    if (isSelf) return { show: false }; // owner cannot self-remove
    return { show: true, isSelf: false, label: "Remove", icon: "remove" };
  }

  if (actorRole === "admin") {
    if (isSelf) return { show: true, isSelf: true, label: "Leave", icon: "leave" };
    // admin can only touch editor / viewer
    if (targetRole === "editor" || targetRole === "viewer") {
      return { show: true, isSelf: false, label: "Remove", icon: "remove" };
    }
    return { show: false };
  }

  // editor / viewer
  if (isSelf) return { show: true, isSelf: true, label: "Leave", icon: "leave" };
  return { show: false };
}

/**
 * @param {object}   member         - Member document (populated user field)
 * @param {string}   actorRole      - Role of the currently logged-in user in this org
 * @param {string}   actorUserId    - _id of the currently logged-in user
 * @param {function} onAction       - (actionType: string, member: object) => void
 */
export function MemberTile({ member, actorRole, actorUserId, onAction }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const user = typeof member?.user === "object" ? member.user : {};
  const name = user.name || "Organization Member";
  const email = user.email || "";
  const avatar = user.avathar || "";
  const role = member.role || "viewer";
  const title = member.title || "Member";
  const targetUserId = user._id || member.user;

  const removeAction = resolveRemoveAction(actorRole, actorUserId, targetUserId, role);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Determine whether there are any items to show in the menu at all
  const hasMenuItems = actorRole === "owner" || (actorRole === "admin" && role !== "owner") || removeAction.show;

  return (
    <div className="member-tile">
      {/* Left: Avatar */}
      <div className="member-tile-avatar-wrapper">
        {avatar ? (
          <img src={avatar} alt={name} className="member-tile-avatar-img" />
        ) : (
          <div className="member-tile-avatar-initials">{getInitials(name)}</div>
        )}
      </div>

      {/* Center: Info */}
      <div className="member-tile-info">
        <div className="member-tile-header">
          <h4 className="member-tile-name">{name}</h4>
          <RoleBadge role={role} />
          {member.isSuspended && (
            <span
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                fontSize: "11px",
                fontWeight: "600",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              Suspended
            </span>
          )}
          {title && <span className="member-tile-title-tag">{title}</span>}
        </div>
        {email && (
          <div className="member-tile-email">
            <Mail size={13} />
            <span>{email}</span>
          </div>
        )}
      </div>

      {/* Right: 3-dot Action Menu (only shown when actor has at least one action) */}
      {hasMenuItems && (
        <div className="member-tile-actions-container" ref={menuRef}>
          <button
            type="button"
            className={`member-tile-menu-btn ${isMenuOpen ? "is-open" : ""}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="Member actions"
            aria-label="Member options"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div className="member-tile-dropdown" role="menu">
              {/* Change Role — owner only */}
              {actorRole === "owner" && !removeAction.isSelf && (
                <button
                  type="button"
                  className="member-dropdown-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onAction?.("change-role", member);
                  }}
                >
                  <Pencil size={14} />
                  <span>Change Role</span>
                </button>
              )}

              {/* Suspend / Unsuspend — owner & admin (on lower-role members only) */}
              {(actorRole === "owner" ||
                (actorRole === "admin" &&
                  (role === "editor" || role === "viewer"))) &&
                !removeAction.isSelf && (
                  <button
                    type="button"
                    className="member-dropdown-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onAction?.("toggle-suspend", member);
                    }}
                  >
                    {member.isSuspended ? (
                      <>
                        <UserCheck size={14} />
                        <span>Unsuspend</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={14} />
                        <span>Suspend</span>
                      </>
                    )}
                  </button>
                )}

              {/* Remove / Leave — role-aware */}
              {removeAction.show && (
                <button
                  type="button"
                  className="member-dropdown-item member-dropdown-item--danger"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onAction?.(removeAction.isSelf ? "leave" : "remove", member);
                  }}
                >
                  {removeAction.icon === "leave" ? (
                    <LogOut size={14} />
                  ) : (
                    <UserX size={14} />
                  )}
                  <span>{removeAction.label}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MemberTile;
