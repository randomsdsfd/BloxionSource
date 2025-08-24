import { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "@/lib/withSession";
import { tokenDB } from "./tokens";

export async function checkBan(req: NextApiRequest, res: NextApiResponse) {
  const userid = req.session.userid;
  if (!userid) return false;

  // check tokenDB for isBanned
  const user = Object.values(tokenDB).find((u) => u.userid === userid);
  if (user?.isBanned) {
    req.session.destroy?.();
    res.status(403).json({ success: false, error: "banned" });
    return true;
  }

  return false;
}
