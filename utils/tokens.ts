export const tokenDB: Record<
  string,
  { userid: number; username: string; isOwner?: boolean; workspaces: number[]; isBanned?: boolean }
> = {
  "token-alice": { userid: 1, username: "alice", isOwner: true, workspaces: [1234567, 7654321], isBanned: false },
  "token-bob": { userid: 2, username: "bob", workspaces: [5555555], isBanned: true }, // banned
};
