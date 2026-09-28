import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { del, get, patch, post } from "../services/api/api";
import Spinner from "../components/Spinner";
import FormMessage from "../components/ui/FormMessage";
import KanbanColumn from "../components/kanban/KanbanColumn";
import CardDetailsModal from "../components/kanban/CardDetailsModal";
import ProjectActivityDrawer from "../components/kanban/ProjectActivityDrawer";
import { getSocket, joinBoard, leaveBoard } from "../services/socket";
import "../components/kanban/css/kanban.css";

export function ProjectBoardPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [draggingCardId, setDraggingCardId] = useState(null);

  // 1. Fetch Project Details
  const { data: projectData, isLoading: isProjectLoading, isError: isProjectError, error: projectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => get(`/projects/${projectId}`),
    enabled: Boolean(projectId),
  });
  const project = projectData?.data;

  // 2. Fetch Boards for Project
  const { data: boardsData, isLoading: isBoardsLoading } = useQuery({
    queryKey: ["project-boards", projectId],
    queryFn: () => get(`/boards?projectId=${projectId}`),
    enabled: Boolean(projectId),
  });
  const boards = boardsData?.data || [];

  // Active board is either selected or the first one
  const activeBoardId = selectedBoardId || boards[0]?._id;
  const activeBoard = boards.find((b) => b._id === activeBoardId) || boards[0];

  // 3. Fetch Lists for Active Board
  const { data: listsData, isLoading: isListsLoading } = useQuery({
    queryKey: ["board-lists", activeBoardId],
    queryFn: () => get(`/lists?boardId=${activeBoardId}`),
    enabled: Boolean(activeBoardId),
  });
  const lists = useMemo(() => listsData?.data || [], [listsData]);

  // 4. Fetch Cards for Active Board
  const { data: cardsData, isLoading: isCardsLoading } = useQuery({
    queryKey: ["board-cards", activeBoardId],
    queryFn: () => get(`/cards?boardId=${activeBoardId}&isArchived=false`),
    enabled: Boolean(activeBoardId),
  });
  const cards = useMemo(() => cardsData?.data || [], [cardsData]);

  // 5. Fetch Organization Members (for assignees)
  const orgId = typeof project?.organization === "object" ? project?.organization?._id : project?.organization;
  const { data: membersData } = useQuery({
    queryKey: ["organization-members", orgId],
    queryFn: () => get(`/organizations/members/${orgId}`),
    enabled: Boolean(orgId),
  });
  const orgMembers = membersData?.data || [];

  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?._id || null;
    } catch {
      return null;
    }
  })();

  // Real-time synchronization via Socket.io across all active members
  useEffect(() => {
    if (!activeBoardId) return;

    const socket = getSocket();
    joinBoard(activeBoardId);

    const handleCardMoved = ({ cardId, targetListId, newPosition, actorId }) => {
      // If action came from another member, update local cache immediately
      if (String(actorId) !== String(currentUserId)) {
        queryClient.setQueryData(["board-cards", activeBoardId], (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((c) =>
              c._id === cardId
                ? { ...c, list: targetListId, position: newPosition ?? c.position }
                : c
            ),
          };
        });
        queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
      }
    };

    const handleCardCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
    };

    const handleCardUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
    };

    const handleCardDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
    };

    const handleListsChanged = () => {
      queryClient.invalidateQueries({ queryKey: ["board-lists", activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
    };

    socket.on("card:moved", handleCardMoved);
    socket.on("card:created", handleCardCreated);
    socket.on("card:updated", handleCardUpdated);
    socket.on("card:deleted", handleCardDeleted);
    socket.on("list:created", handleListsChanged);
    socket.on("list:updated", handleListsChanged);
    socket.on("list:deleted", handleListsChanged);
    socket.on("list:reordered", handleListsChanged);

    return () => {
      leaveBoard(activeBoardId);
      socket.off("card:moved", handleCardMoved);
      socket.off("card:created", handleCardCreated);
      socket.off("card:updated", handleCardUpdated);
      socket.off("card:deleted", handleCardDeleted);
      socket.off("list:created", handleListsChanged);
      socket.off("list:updated", handleListsChanged);
      socket.off("list:deleted", handleListsChanged);
      socket.off("list:reordered", handleListsChanged);
    };
  }, [activeBoardId, currentUserId, queryClient]);

  // Mutations
  const createListMutation = useMutation({
    mutationFn: (name) => post("/lists", { name, boardId: activeBoardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-lists", activeBoardId] });
      setNewListTitle("");
      setIsAddingList(false);
    },
  });

  const renameListMutation = useMutation({
    mutationFn: ({ listId, name }) => patch(`/lists/${listId}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-lists", activeBoardId] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (listId) => del(`/lists/${listId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-lists", activeBoardId] });
      queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: ({ listId, title }) => post("/cards", { listId, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: ({ cardId, targetListId }) =>
      patch(`/cards/${cardId}/move`, { targetListId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
    },
  });

  // Drag and drop handlers
  const handleCardDragStart = (e, card) => {
    e.dataTransfer.setData("text/plain", card._id);
    setDraggingCardId(card._id);
  };

  const handleCardDrop = (cardId, targetListId) => {
    setDraggingCardId(null);
    const targetCard = cards.find((c) => c._id === cardId);
    if (!targetCard) return;

    const currentListId =
      typeof targetCard.list === "object" ? targetCard.list?._id : targetCard.list;
    if (String(currentListId) === String(targetListId)) return;

    // Optimistic update
    queryClient.setQueryData(["board-cards", activeBoardId], (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((c) => (c._id === cardId ? { ...c, list: targetListId } : c)),
      };
    });

    moveCardMutation.mutate({ cardId, targetListId });
  };

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        (card.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === "all" ? true : card.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [cards, searchQuery, priorityFilter]);

  // Group cards by listId
  const cardsByList = useMemo(() => {
    const map = {};
    lists.forEach((l) => (map[l._id] = []));
    filteredCards.forEach((card) => {
      const lid = typeof card.list === "object" ? card.list._id : card.list;
      if (map[lid]) {
        map[lid].push(card);
      }
    });
    return map;
  }, [lists, filteredCards]);

  if (isProjectLoading || isBoardsLoading) {
    return <Spinner label="Loading project board..." fullScreen />;
  }

  if (isProjectError || !project) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <Link to="/dashboard" className="kanban-back-btn" style={{ marginBottom: "16px" }}>
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </Link>
        <FormMessage type="error" text={projectError?.message || "Project not found or inaccessible."} />
      </div>
    );
  }

  const orgSlug = typeof project.organization === "object" ? project.organization.slug : null;

  return (
    <div className="kanban-page">
      {/* Board Header */}
      <header className="kanban-header">
        <div className="kanban-header-left">
          <Link
            to={orgSlug ? `/organization/${orgSlug}` : "/dashboard"}
            className="kanban-back-btn"
          >
            <ArrowLeft size={14} />
            <span>{orgSlug ? "Back to Org" : "Dashboard"}</span>
          </Link>

          <div className="kanban-project-info">
            <h1 className="kanban-project-title">{project.name}</h1>
            <span
              className={`project-card-status-badge project-status--${project.status || "active"}`}
            >
              {project.status}
            </span>
          </div>

          {/* Board Selector / Display */}
          {boards.length > 1 ? (
            <select
              className="kanban-board-select"
              value={activeBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
            >
              {boards.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : activeBoard?.name ? (
            <span className="kanban-column-count" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
              {activeBoard.name}
            </span>
          ) : null}
        </div>

        <div className="kanban-header-right">
          {/* Search Cards */}
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              type="text"
              className="kanban-search-input"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Priority Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748b" />
            <select
              className="kanban-board-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Activity Drawer Toggle */}
          <button
            type="button"
            className="org-btn org-btn--secondary"
            style={{ fontSize: "0.82rem", padding: "6px 12px", gap: "6px" }}
            onClick={() => setIsActivityOpen(true)}
          >
            <Activity size={14} />
            <span>Activity</span>
          </button>
        </div>
      </header>

      {/* Kanban Board Area */}
      <div className="kanban-board-container">
        {isListsLoading || isCardsLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
            <Spinner label="Loading Kanban columns..." fullScreen={false} />
          </div>
        ) : (
          <>
            {lists.map((list) => (
              <KanbanColumn
                key={list._id}
                list={list}
                cards={cardsByList[list._id] || []}
                draggingCardId={draggingCardId}
                onCardClick={(c) => setSelectedCardId(c._id)}
                onCardDragStart={handleCardDragStart}
                onCardDrop={handleCardDrop}
                onAddCard={(listId, title) => createCardMutation.mutate({ listId, title })}
                onRenameList={(listId, name) => renameListMutation.mutate({ listId, name })}
                onDeleteList={(listId) => {
                  if (window.confirm(`Delete list "${list.name}" and all its cards?`)) {
                    deleteListMutation.mutate(listId);
                  }
                }}
              />
            ))}

            {/* Add New List Column */}
            <div className="kanban-add-list-column">
              {isAddingList ? (
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="List name (e.g. In Review)..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newListTitle.trim()) {
                        createListMutation.mutate(newListTitle.trim());
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #2563eb",
                      fontSize: "0.88rem",
                      fontWeight: "600",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="org-btn org-btn--primary"
                      disabled={!newListTitle.trim()}
                      onClick={() => createListMutation.mutate(newListTitle.trim())}
                      style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                    >
                      Add List
                    </button>
                    <button
                      type="button"
                      className="org-btn org-btn--secondary"
                      onClick={() => {
                        setIsAddingList(false);
                        setNewListTitle("");
                      }}
                      style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="kanban-add-list-btn"
                  onClick={() => setIsAddingList(true)}
                >
                  <Plus size={16} />
                  <span>Add another list</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Card Details Modal */}
      {selectedCardId && (
        <CardDetailsModal
          isOpen={Boolean(selectedCardId)}
          onClose={() => setSelectedCardId(null)}
          cardId={selectedCardId}
          organizationId={orgId}
          orgMembers={orgMembers}
          onCardUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["board-cards", activeBoardId] });
          }}
        />
      )}

      {/* Activity Log Drawer */}
      <ProjectActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}

export default ProjectBoardPage;
