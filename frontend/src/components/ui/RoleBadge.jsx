import { Crown, Eye, Pencil, Shield } from "lucide-react";

export function RoleBadge({ role }) {
  switch (role) {
    case "owner":
      return (
        <span className="member-role-badge member-role-badge--owner">
          <Crown size={12} />
          <span>Owner</span>
        </span>
      );
    case "admin":
      return (
        <span className="member-role-badge member-role-badge--admin">
          <Shield size={12} />
          <span>Admin</span>
        </span>
      );
    case "editor":
      return (
        <span className="member-role-badge member-role-badge--editor">
          <Pencil size={12} />
          <span>Editor</span>
        </span>
      );
    case "viewer":
    default:
      return (
        <span className="member-role-badge member-role-badge--viewer">
          <Eye size={12} />
          <span>Viewer</span>
        </span>
      );
  }
}

export default RoleBadge;
