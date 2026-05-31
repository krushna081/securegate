import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Notification from '../models/Notification';
import Visitor from '../models/Visitor';
import Flat from '../models/Flat';
import { notifyResidentBatch } from '../services/pushService';

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user!._id },
      { isRead: true },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { userId: req.user!._id, isRead: false },
      { isRead: true },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user!._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get count' });
  }
};

export const catchUpMissedVisitors = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents can catch up' });
    }

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const pendingVisitors = await Visitor.find({
      residentId: req.user!._id,
      status: 'pending',
      createdAt: { $gte: twoDaysAgo },
    })
      .populate('flatId', 'flatNumber blockName')
      .sort({ createdAt: -1 });

    if (pendingVisitors.length > 0) {
      const visitorData = pendingVisitors.map((v) => ({
        visitorId: v._id.toString(),
        visitorName: v.visitorName,
        flatNumber: (v.flatId as any)?.flatNumber || '',
        createdAt: v.createdAt.toISOString(),
      }));

      try {
        await notifyResidentBatch(req.user!._id.toString(), visitorData);
      } catch {}

      for (const v of pendingVisitors) {
        try {
          await Notification.create({
            userId: req.user!._id,
            title: `Visitor: ${v.visitorName}`,
            body: `${v.visitorName} was at the gate — pending your approval`,
            data: { type: 'visitor-approval', visitorId: v._id.toString() },
          });
        } catch {}
      }
    }

    res.json({
      missed: pendingVisitors.length,
      visitors: pendingVisitors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to catch up' });
  }
};

export const getPendingVisitorsCatchup = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents' });
    }

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const visitors = await Visitor.find({
      residentId: req.user!._id,
      status: 'pending',
      createdAt: { $gte: twoDaysAgo },
    })
      .populate('flatId', 'flatNumber blockName')
      .populate('guardId', 'fullName')
      .sort({ createdAt: -1 });

    res.json({ visitors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending visitors' });
  }
};
