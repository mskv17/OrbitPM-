import { useState, useRef } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import KanbanCard from "./KanbanCard";

export function KanbanColumn({
  list,
  cards = [],
  onCardClick,
  onAddCard,
  onRenameList,
  onDeleteList,
  onCardDrop,
  draggingCardId,
  onCardDragStart,
  canEdit = true,
}) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(list.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const menuRef = useRef(null);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(list._id, newCardTitle.trim());
    setNewCardTitle("");
    setIsAddingCard(false);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (!editingTitle.trim() || editingTitle.trim() === list.name) {
      setIsEditingTitle(false);
      return;
    }
    onRenameList(list._id, editingTitle.trim());
    setIsEditingTitle(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only if leaving the column boundary
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData("text/plain") || draggingCardId;
    if (cardId) {
      onCardDrop(cardId, list._id);
    }
  };

  return (
    <div
      className={`kanban-column ${isDragOver ? "is-drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title-group">
          {isEditingTitle ? (
            <form onSubmit={handleRenameSubmit} style={{ display: "flex", gap: "4px", width: "100%" }}>
              <input
                type="text"
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #2563eb",
                  fontSize: "0.88rem",
                  fontWeight: "600",
                }}
              />
            </form>
          ) : (
            <>
              <h3 className="kanban-column-title">{list.name}</h3>
              <span className="kanban-column-count">{cards.length}</span>
            </>
          )}
        </div>

        {canEdit && (
          <div className="kanban-column-actions" style={{ position: "relative" }} ref={menuRef}>
            <button
              type="button"
              className="member-tile-menu-btn"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="List options"
            >
              <MoreHorizontal size={15} />
            </button>

            {isMenuOpen && (
              <div className="member-tile-dropdown" style={{ right: 0, top: "28px" }}>
                <button
                  type="button"
                  className="member-dropdown-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditingTitle(true);
                  }}
                >
                  <Pencil size={13} />
                  <span>Rename List</span>
                </button>
                <button
                  type="button"
                  className="member-dropdown-item member-dropdown-item--danger"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDeleteList(list._id);
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete List</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards List */}
      <div className="kanban-card-list">
        {cards.map((card) => (
          <KanbanCard
            key={card._id}
            card={card}
            isDragging={draggingCardId === card._id}
            onCardClick={onCardClick}
            onDragStart={onCardDragStart}
          />
        ))}

        {cards.length === 0 && !isAddingCard && (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "0.8rem",
              fontStyle: "italic",
            }}
          >
            No cards in this list
          </div>
        )}
      </div>

      {/* Quick Add Card */}
      {canEdit && (
        <>
          {isAddingCard ? (
            <form onSubmit={handleAddSubmit} className="kanban-add-card-form">
              <textarea
                autoFocus
                rows={2}
                placeholder="What needs to be done?"
                className="kanban-add-card-textarea"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddSubmit(e);
                  }
                }}
              />
              <div className="kanban-add-card-actions">
                <button
                  type="submit"
                  className="org-btn org-btn--primary"
                  style={{ padding: "5px 12px", fontSize: "0.8rem" }}
                  disabled={!newCardTitle.trim()}
                >
                  Add Card
                </button>
                <button
                  type="button"
                  className="org-btn org-btn--secondary"
                  style={{ padding: "5px 8px" }}
                  onClick={() => {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="kanban-add-card-btn"
              onClick={() => setIsAddingCard(true)}
            >
              <Plus size={15} />
              <span>Add a card</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default KanbanColumn;
