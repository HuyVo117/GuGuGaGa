import db from "../configs/firestore.js";

const notificationsRef = db.collection("notifications");

export const notificationService = {
  async getNotificationsByUser(userId) {
    const snap = await notificationsRef.where("userId", "==", userId).get();
    const notifications = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });
    // Sort in-memory desc by createdAt
    notifications.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt?._seconds ?? 0) * 1000;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt?._seconds ?? 0) * 1000;
      return timeB - timeA;
    });
    return notifications;
  },

  async createNotification(userId, title, message, orderId = null) {
    const now = new Date();
    const docRef = await notificationsRef.add({
      userId,
      title,
      message,
      orderId,
      isRead: false,
      createdAt: now,
    });
    return {
      id: docRef.id,
      userId,
      title,
      message,
      orderId,
      isRead: false,
      createdAt: now,
    };
  },

  async markAsRead(id) {
    const docRef = notificationsRef.doc(id);
    await docRef.update({ isRead: true });
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  },

  async markAllAsRead(userId) {
    const snap = await notificationsRef
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();
    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
    return { success: true };
  },
};
