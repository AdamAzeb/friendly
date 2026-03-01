"use client";

import { useEffect, useRef } from "react";
import type { MapUser, StudyStatus } from "../types";
import { isValidImageUrl } from "../lib/avatarColor";

export const STATUS_CONFIG: Record<StudyStatus, { color: string; glow: string; label: string }> = {
  locked_in:  { color: "#EF4444", glow: "rgba(239,68,68,0.6)",   label: "Locked in"           },
  come_study: { color: "#10B981", glow: "rgba(16,185,129,0.6)",  label: "Come study with me!" },
  free:       { color: "#3B82F6", glow: "rgba(59,130,246,0.6)",  label: "Free time"           },
  eating:     { color: "#F59E0B", glow: "rgba(245,158,11,0.6)",  label: "Going to eat"        },
  invisible:  { color: "#4B5563", glow: "rgba(75,85,99,0.4)",    label: "Invisible"           },
};

interface Props {
  users: MapUser[];
  currentUserId?: string;
}

export default function MapClient({ users, currentUserId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);
  const markersRef   = useRef<unknown[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then(L => {
      if (mapRef.current) return;
      const map = L.map(containerRef.current!, {
        center: [57.1300, -2.1390],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© <a href='https://openstreetmap.org'>OpenStreetMap</a> © <a href='https://carto.com'>CARTO</a>",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove(): void }).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      const t = setTimeout(() => updateMarkers(), 500);
      return () => clearTimeout(t);
    }
    updateMarkers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, currentUserId]);

  function updateMarkers() {
    if (!mapRef.current) return;
    import("leaflet").then(L => {
      const map = mapRef.current as { addLayer(l: unknown): void };
      (markersRef.current as Array<{ remove(): void }>).forEach(m => m.remove());
      markersRef.current = [];

      users.forEach(u => {
        if (u.status === "invisible" && u.uid !== currentUserId) return;
        const cfg     = STATUS_CONFIG[u.status];
        const isMe    = u.uid === currentUserId;
        const initial = u.name.charAt(0).toUpperCase();
        const hasImg  = isValidImageUrl(u.avatarUrl);

        // Inner avatar: photo or initial letter
        const avatarInner = hasImg
          ? `<div style="position:absolute;inset:0;border-radius:50%;background:url('${u.avatarUrl}') center/cover no-repeat;"></div>`
          : `<span style="color:${isMe ? "white" : cfg.color};font-size:17px;font-weight:800;font-family:system-ui,sans-serif;line-height:1;position:relative;z-index:1;">${initial}</span>`;

        const icon = L.divIcon({
          className: "",
          iconAnchor: [22, 22],
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="position:relative;width:44px;height:44px;">

                ${isMe ? `<div style="position:absolute;inset:-5px;border-radius:50%;border:2px solid ${cfg.color};opacity:0.35;pointer-events:none;"></div>` : ""}

                <div style="
                  width:44px;height:44px;border-radius:50%;overflow:hidden;
                  background:${hasImg ? "rgba(13,13,15,0.5)" : "rgba(13,13,15,0.92)"};
                  border:${isMe ? "3px" : "2px"} solid ${cfg.color};
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 0 ${isMe ? "20px" : "12px"} ${cfg.glow},0 2px 8px rgba(0,0,0,0.6);
                  box-sizing:border-box;position:relative;
                ">${avatarInner}</div>

                <div style="
                  position:absolute;bottom:1px;right:1px;
                  width:13px;height:13px;border-radius:50%;
                  background:${cfg.color};
                  border:2.5px solid #0D0D0F;
                  box-shadow:0 0 6px ${cfg.glow};
                "></div>
              </div>

              <div style="
                margin-top:5px;
                background:rgba(13,13,15,0.92);
                border:1px solid ${isMe ? cfg.color + "60" : "rgba(255,255,255,0.09)"};
                border-radius:7px;padding:2px 8px;
                font-size:10px;font-weight:600;
                color:${u.isPlaceholder ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.9)"};
                white-space:nowrap;font-family:system-ui,sans-serif;
              ">${u.name}${isMe ? " · you" : ""}</div>
            </div>
          `,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marker = (L.marker([u.lat, u.lng], { icon }) as any)
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:155px;padding:4px 2px">
              <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px">
                <div style="
                  width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;
                  ${hasImg
                    ? `background:url('${u.avatarUrl}') center/cover no-repeat;`
                    : `background:rgba(13,13,15,0.9);display:flex;align-items:center;justify-content:center;`
                  }
                  border:2px solid ${cfg.color};
                  box-shadow:0 0 8px ${cfg.glow};
                ">
                  ${!hasImg ? `<span style="color:${cfg.color};font-size:15px;font-weight:800">${initial}</span>` : ""}
                </div>
                <div>
                  <strong style="color:#fff;font-size:13px;display:block">${u.name}</strong>
                  ${u.isPlaceholder ? "<span style='color:rgba(255,255,255,0.3);font-size:10px'>demo</span>" : ""}
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(255,255,255,0.04);border-radius:8px">
                <span style="width:8px;height:8px;border-radius:50%;background:${cfg.color};flex-shrink:0;box-shadow:0 0 4px ${cfg.glow};display:inline-block"></span>
                <span style="font-size:11px;color:rgba(255,255,255,0.7)">${cfg.label}</span>
              </div>
            </div>
          `);

        markersRef.current.push(marker);
      });
    });
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden" }}
    />
  );
}
