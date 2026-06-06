import db from "../configs/firestore.js";

const reviewsRef = db.collection("reviews");
const ordersRef = db.collection("orders");
const productsRef = db.collection("products");
const combosRef = db.collection("combos");
const driversRef = db.collection("drivers");
const usersRef = db.collection("users");

export const reviewService = {
  createReview: async (userId, orderId, reviewData) => {
    // 1. Get Order details
    const orderDoc = await ordersRef.doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error("Đơn hàng không tồn tại.");
    }
    const orderData = orderDoc.data();

    // 2. Validate Order ownership and state
    if (orderData.userId !== userId) {
      throw new Error("Bạn không có quyền đánh giá đơn hàng này.");
    }
    if (orderData.status !== "DELIVERED" && orderData.status !== "COMPLETED") {
      throw new Error("Đơn hàng chưa hoàn thành, không thể đánh giá.");
    }
    if (orderData.isReviewed === true) {
      throw new Error("Đơn hàng này đã được đánh giá.");
    }

    // 3. Get User Name
    const userDoc = await usersRef.doc(userId).get();
    const userName = userDoc.exists ? (userDoc.data().name || "Người dùng") : "Người dùng";

    // 4. Construct Review document
    const reviewDoc = {
      userId,
      userName,
      orderId,
      createdAt: new Date(),
      productRatings: [],
    };

    // Driver rating
    if (orderData.driverId) {
      reviewDoc.driverRating = {
        driverId: orderData.driverId,
        rating: Number(reviewData.driverRating || 5),
        comment: reviewData.driverComment || "",
      };
    }

    // Product/Combo ratings
    if (Array.isArray(reviewData.productRatings)) {
      reviewDoc.productRatings = reviewData.productRatings.map((pr) => ({
        productId: pr.productId || null,
        comboId: pr.comboId || null,
        rating: Number(pr.rating || 5),
        comment: pr.comment || "",
      }));
    }

    // 5. Save Review
    const newReview = await reviewsRef.add(reviewDoc);

    // 6. Recalculate Averages and update items
    const allReviewsSnap = await reviewsRef.get();
    const allReviews = allReviewsSnap.docs.map(d => d.data());

    // Update Driver Average Rating
    if (orderData.driverId) {
      const driverReviews = allReviews.filter(
        r => r.driverRating && r.driverRating.driverId === orderData.driverId
      );
      const count = driverReviews.length;
      const sum = driverReviews.reduce((acc, curr) => acc + curr.driverRating.rating, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;

      await driversRef.doc(orderData.driverId).update({
        rating: avg,
        reviewCount: count,
      });
    }

    // Update Product & Combo Average Ratings
    if (Array.isArray(reviewData.productRatings)) {
      for (const pr of reviewData.productRatings) {
        if (pr.productId) {
          const prodReviews = [];
          allReviews.forEach(r => {
            const match = r.productRatings?.find(item => item.productId === pr.productId);
            if (match) prodReviews.push(match.rating);
          });
          const count = prodReviews.length;
          const sum = prodReviews.reduce((acc, curr) => acc + curr, 0);
          const avg = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;

          await productsRef.doc(pr.productId).update({
            rating: avg,
            reviewCount: count,
          });
        } else if (pr.comboId) {
          const comboReviews = [];
          allReviews.forEach(r => {
            const match = r.productRatings?.find(item => item.comboId === pr.comboId);
            if (match) comboReviews.push(match.rating);
          });
          const count = comboReviews.length;
          const sum = comboReviews.reduce((acc, curr) => acc + curr, 0);
          const avg = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;

          await combosRef.doc(pr.comboId).update({
            rating: avg,
            reviewCount: count,
          });
        }
      }
    }

    // 7. Update Order status
    await ordersRef.doc(orderId).update({
      isReviewed: true,
      updatedAt: new Date(),
    });

    return { id: newReview.id, ...reviewDoc };
  },

  getProductReviews: async (productId) => {
    const snap = await reviewsRef.get();
    const reviews = [];
    snap.forEach((doc) => {
      const data = doc.data();
      const match = data.productRatings?.find((pr) => pr.productId === productId);
      if (match) {
        reviews.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          rating: match.rating,
          comment: match.comment,
          createdAt: data.createdAt,
        });
      }
    });
    // Sort by newest reviews
    reviews.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
    return reviews;
  },

  getDriverReviews: async (driverId) => {
    const snap = await reviewsRef.get();
    const reviews = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.driverRating && data.driverRating.driverId === driverId) {
        reviews.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          rating: data.driverRating.rating,
          comment: data.driverRating.comment,
          createdAt: data.createdAt,
        });
      }
    });
    reviews.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
    return reviews;
  },
};
