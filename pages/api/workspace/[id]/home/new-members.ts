import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/utils/database';
import { withSessionRoute } from '@/lib/withSession';

export default withSessionRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
	const workspaceGroupId = parseInt(req.query.id as string, 10);
	if (!workspaceGroupId) return res.status(400).json({ success: false, error: 'Invalid workspace id' });

	const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
	const windowDays = isNaN(days) || days <= 0 || days > 30 ? 7 : days;

	const userid = req.session.userid ? Number(req.session.userid) : null;
	if (userid) {
		try {
		await prisma.workspaceMember.upsert({
			where: { workspaceGroupId_userId: { workspaceGroupId, userId: userid } },
			create: { workspaceGroupId, userId: userid, joinDate: new Date() },
			update: {},
		});
		} catch (e) {
		// ignore constraint errors
		}
	}

	const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

	const recent = await prisma.workspaceMember.findMany({
		where: { workspaceGroupId, joinDate: { gte: cutoff } },
		include: { user: { select: { userid: true, username: true, picture: true } } },
		orderBy: { joinDate: 'desc' }
	});

	res.json({
		success: true,
		members: recent.map(r => ({
		userid: r.user.userid.toString(),
		username: r.user.username || r.user.userid.toString(),
		picture: r.user.picture,
		joinDate: r.joinDate,
		}))
	});
});
