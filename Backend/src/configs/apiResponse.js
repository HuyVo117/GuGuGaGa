const convertTimestamps = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (obj.toDate && typeof obj.toDate === "function") {
    return obj.toDate().toISOString();
  }

  if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
    return new Date(obj._seconds * 1000).toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }

  const newObj = {};
  for (const key in obj) {
    newObj[key] = convertTimestamps(obj[key]);
  }
  return newObj;
};

export class ApiResponse {
	static success(res, data = null, message = "Success", status = 200) {
		return res.status(status).json({
			success: true,
			message,
			data: convertTimestamps(data),
		});
	}

	static error(res, error, status = 400) {
		return res.status(status).json({
			success: false,
			message: error?.message || "Request failed",
		});
	}
}
