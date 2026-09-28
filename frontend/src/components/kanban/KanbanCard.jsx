import { Calendar, CheckSquare, Paperclip } from "lucide-react";
import { getInitials } from "../../utils/getInitials";

export function KanbanCard({ card, onCardClick, onDragStart, isDragging }) {
  const completedChecklistCount = (card.checklist || []).filter((i) => i.isCompleted).length;
  const totalChecklistCount = (card.checklist || []).length;
  const attachmentsCount = (card.attachments || []).length;

  const formattedDueDate = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <div
      className={`kanban-card ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onClick={() => onCardClick?.(card)}
    >
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="kanban-card-labels">
          {card.labels.map((label, index) => (
            <span
              key={label._id || index}
              className="kanban-label-pill"
              style={{ backgroundColor: label.color || "#3b82f6" }}
            >
              {label.text}
            </span>
          ))}
        </div>
      )}

      {/* Card Title */}
      <h4 className="kanban-card-title">{card.title}</h4>

      {/* Meta Footer */}
      <div className="kanban-card-meta">
        <div className="kanban-card-badges">
          {card.priority && card.priority !== "medium" && (
            <span className={`kanban-priority-badge kanban-priority--${card.priority}`}>
              {card.priority}
            </span>
          )}

          {formattedDueDate && (
            <span className="kanban-card-badge" title={`Due: ${formattedDueDate}`}>
              <Calendar size={12} />
              <span>{formattedDueDate}</span>
            </span>
          )}

          {totalChecklistCount > 0 && (
            <span
              className="kanban-card-badge"
              style={{
                color: completedChecklistCount === totalChecklistCount ? "#16a34a" : "#64748b",
              }}
              title="Checklist progress"
            >
              <CheckSquare size={12} />
              <span>
                {completedChecklistCount}/{totalChecklistCount}
              </span>
            </span>
          )}

          {attachmentsCount > 0 && (
            <span className="kanban-card-badge" title="Attachments">
              <Paperclip size={12} />
              <span>{attachmentsCount}</span>
            </span>
          )}
        </div>

        {/* Assignees */}
        {card.assignees && card.assignees.length > 0 && (
          <div className="kanban-card-assignees">
            {card.assignees.slice(0, 3).map((user) => {
              const u = typeof user === "object" ? user : {};
              const name = u.name || "Member";
              return u.avathar ? (
                <img
                  key={u._id || name}
                  src={u.avathar}
                  alt={name}
                  className="kanban-card-assignee-avatar"
                  title={name}
                />
              ) : (
                <span
                  key={u._id || name}
                  className="kanban-card-assignee-avatar"
                  style={{
                    background: "#e2e8f0",
                    color: "#334155",
                    fontSize: "9px",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={name}
                >
                  {getInitials(name)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default KanbanCard;
