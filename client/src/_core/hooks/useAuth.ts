import { trpc } from "@/lib/trpc";

export function useAuth() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    logout: () => logoutMutation.mutate(),
  };
}
