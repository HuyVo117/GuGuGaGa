import axios from "axios";

const publicApi = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export const configService = {
  getMapConfig: async () => {
    const response = await publicApi.get("/config/map-config");
    console.log(response.data);
    return response.data;
  },
};
