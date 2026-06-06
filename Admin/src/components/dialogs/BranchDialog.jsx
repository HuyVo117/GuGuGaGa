import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { configService } from "../../services/configService";
import toast from "react-hot-toast";

const defaultCenter = {
  lat: 10.762622,
  lng: 106.660172,
};

export default function BranchDialog({ open, onClose, branch, onSave }) {
  const [openCageApiKey, setOpenCageApiKey] = useState("");
  const [markerPosition, setMarkerPosition] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: defaultCenter.lng,
    latitude: defaultCenter.lat,
    zoom: 13,
  });

  // Form data
  const getInitialData = useCallback(() => {
    if (branch) {
      return {
        name: branch.name || "",
        phone: branch.phone || "",
        address: branch.address || "",
        latitude: branch.latitude || null,
        longitude: branch.longitude || null,
      };
    }
    return {
      name: "",
      phone: "",
      address: "",
      latitude: null,
      longitude: null,
    };
  }, [branch]);

  const [formData, setFormData] = useState(getInitialData);

  // Effect: reset formData & map when modal open
  useEffect(() => {
    if (!open) return;

    const initialData = getInitialData();
    let pos = null;
    let view = {
      longitude: defaultCenter.lng,
      latitude: defaultCenter.lat,
      zoom: 13,
    };

    if (branch && branch.latitude && branch.longitude) {
      pos = { lat: branch.latitude, lng: branch.longitude };
      view = {
        longitude: branch.longitude,
        latitude: branch.latitude,
        zoom: 15,
      };
    }

    // Update state in one tick to avoid cascading renders
    const id = setTimeout(() => {
      setFormData(initialData);
      setMarkerPosition(pos);
      setViewState(view);
    }, 0);

    return () => clearTimeout(id);
  }, [open, branch, getInitialData]);

  // Fetch OpenCage API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await configService.getMapConfig();
        if (res.success) setOpenCageApiKey(res.data.openCageApiKey);
      } catch (err) {
        console.error("Failed to fetch Map Config", err);
      }
    };
    fetchApiKey();
  }, []);

  // Handle map click
  const handleMapClick = async (e) => {
    const { lng, lat } = e.lngLat;
    setMarkerPosition({ lat, lng });
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    // Reverse geocoding
    if (!openCageApiKey) return;

    try {
      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${openCageApiKey}&language=vi`
      );
      const data = await res.json();
      if (data.results?.length > 0) {
        const address = data.results[0].formatted;
        setFormData((prev) => ({ ...prev, address }));
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      toast.error("Không thể lấy địa chỉ từ tọa độ");
    }
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Vui lòng điền tên chi nhánh!");
      return;
    }
    onSave({ ...formData, id: branch?.id });
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-gray-900">
              {branch ? "Chỉnh sửa chi nhánh" : "Thêm chi nhánh mới"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chi nhánh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Chi nhánh Quận 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0281234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập địa chỉ hoặc chọn trên bản đồ..."
              />
            </div>

            {/* Mapbox Map */}
            <div className="w-full h-[300px] rounded-lg overflow-hidden border border-gray-300 relative">
              <Map
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_PUBLIC}
                onClick={handleMapClick}
              >
                {markerPosition && (
                  <Marker
                    longitude={markerPosition.lng}
                    latitude={markerPosition.lat}
                    anchor="bottom"
                  >
                    <div className="text-red-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-8 h-8"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </Marker>
                )}
              </Map>
            </div>
            <div className="text-xs text-gray-500">
              * Nhấn vào bản đồ để chọn vị trí và tự động điền địa chỉ.
            </div>

            <div className="flex gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {branch ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
