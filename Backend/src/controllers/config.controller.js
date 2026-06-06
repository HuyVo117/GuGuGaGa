import { config } from "../configs/env.js";
import { ApiResponse } from "../configs/apiResponse.js";

export const configController = {
  getMapConfig(req, res) {
    return ApiResponse.success(
      res,
      { openCageApiKey: config.openCageApiKey },
      "Get Map Config successfully"
    );
  },
};
