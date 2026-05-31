import https from 'https';
import User from '../models/User';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
}

export const sendPushNotification = async (message: PushMessage) => {
  try {
    const body = JSON.stringify(message);
    const url = new URL(EXPO_PUSH_URL);
    await new Promise<void>((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve());
        },
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
};

export const notifyResidentAboutVisitor = async (
  residentId: string,
  visitorName: string,
  visitorId: string,
  flatNumber: string,
  photoUrl?: string,
): Promise<void> => {
  try {
    const resident = await User.findById(residentId);
    if (!resident || !resident.pushToken) return;

    const notificationBody = photoUrl
      ? `${visitorName} is here for Flat ${flatNumber} — tap to see photo`
      : `${visitorName} is here for Flat ${flatNumber}`;

    await sendPushNotification({
      to: resident.pushToken,
      title: '🚪 New Visitor at Gate',
      body: notificationBody,
      data: {
        type: 'visitor-approval',
        visitorId,
        visitorName,
        flatNumber,
        photoUrl,
      },
      categoryId: 'visitor-approval',
      sound: 'default',
      priority: 'high',
    });
  } catch (error) {
    console.error('notifyResidentAboutVisitor error:', error);
  }
};

export const notifyResidentBatch = async (
  residentId: string,
  visitors: Array<{ visitorId: string; visitorName: string; flatNumber: string; createdAt: string }>,
) => {
  try {
    const resident = await User.findById(residentId);
    if (!resident || !resident.pushToken) return;

    const count = visitors.length;
    if (count === 0) return;

    await sendPushNotification({
      to: resident.pushToken,
      title: `📋 ${count} pending visitor${count > 1 ? 's' : ''} from last 2 days`,
      body: `Tap to review and approve/reject`,
      data: {
        type: 'visitor-catchup',
        visitors: visitors.map((v) => ({
          visitorId: v.visitorId,
          visitorName: v.visitorName,
          flatNumber: v.flatNumber,
          createdAt: v.createdAt,
        })),
      },
      categoryId: 'visitor-catchup',
      priority: 'high',
    });
  } catch (error) {
    console.error('notifyResidentBatch error:', error);
  }
};
