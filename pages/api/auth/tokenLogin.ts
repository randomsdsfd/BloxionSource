import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "@/lib/withSession";
import * as noblox from "noblox.js";
import { tokenDB } from "@/utils/tokens";
import { getUsername, getDisplayName, getThumbnail } from "@/utils/userinfoEngine";

export default withSessionRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: "Token required" });

  const entry = tokenDB[token];
  if (!entry) return res.status(401).json({ success: false, error: "Invalid token" });

  if (entry.isBanned) {
    req.session.destroy?.();
    return res.status(403).json({ success: false, error: "banned" });
  }

  req.session.userid = entry.userid;
  await req.session.save();

  const user = {
    userId: entry.userid,
    username: entry.username,
    displayname: await getDisplayName(entry.userid),
    thumbnail: await getThumbnail(entry.userid),
    isOwner: entry.isOwner || false,
  };

  const workspaces = await Promise.all(
    entry.workspaces.map(async (groupId) => {
      try {
        const [logo, group] = await Promise.all([noblox.getLogo(groupId), noblox.getGroup(groupId)]);
        return { groupId, groupThumbnail: logo, groupName: group.name };
      } catch {
        return null;
      }
    })
  );

  res.status(200).json({ success: true, user, workspaces: workspaces.filter(Boolean) });
});
