import { useMutation, useQueryClient } from "@tanstack/react-query";
import { del } from "../services/api/api";

/**
 * Reusable hook for removing / leaving an organization membership.
 *
 * @param {string} organizationId  - The org whose member list should be refreshed on success.
 * @param {object} [options]       - Optional callbacks: onSuccess(data), onError(err)
 */
export function useRemoveMember(organizationId, { onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * @param {string} memberId  - The _id of the User (not the Member document) to remove.
     */
    mutationFn: (memberId) =>
      del(`/organizations/members/${organizationId}/${memberId}`),

    onSuccess: (data) => {
      // Refresh the members list so the removed card disappears immediately
      queryClient.invalidateQueries({
        queryKey: ["organization-members", organizationId],
      });
      onSuccess?.(data);
    },

    onError: (err) => {
      onError?.(err);
    },
  });
}
